/**
 * Estado das ocorrências: memória primeiro, banco em best-effort.
 *
 * O caminho de emergência não pode depender do MariaDB estar de pé. Um alerta
 * nasce em memória, vai para a tela da central e responde ao aparelho antes de
 * qualquer escrita. O custo, dito em voz alta: uma ocorrência criada durante
 * uma queda do banco existe só em RAM até o próximo restart.
 */

import { redact } from "../../core/log.js";

/* ================================================================== *
 *  Estado: memória primeiro, banco em best-effort                    *
 * ================================================================== */

export function criarEstado(bda) {
  const alertas = new Map();      // publicId -> alerta vivo
  let bancoVivo = Boolean(bda);

  async function consultar(sql, params = []) {
    if (!bda) return null;
    try {
      const [linhas] = await bda.execute(sql, params);
      bancoVivo = true;
      return linhas;
    } catch (e) {
      bancoVivo = false;
      console.error("alertas/banco:", redact(e.message));
      return null;
    }
  }

  /** Grava sem bloquear quem chamou. O alerta já foi para a tela antes disto. */
  function gravar(sql, params = []) {
    consultar(sql, params).catch(() => {});
  }

  async function bancoOk() {
    if (!bda) return false;
    return (await consultar("SELECT 1 AS ok")) !== null;
  }

  return {
    alertas, consultar, gravar, bancoOk,
    get bancoVivo() { return bancoVivo; },

    abertos: () => [...alertas.values()].filter((a) => a.status === "open" || a.status === "in_progress"),
    lista: () => [...alertas.values()].sort((a, b) => b.openedAt - a.openedAt),
    achar: (publicId) => alertas.get(publicId) || null,

    async acharAparelho(tokenHash) {
      const linhas = await consultar(
        `SELECT d.id, d.protected_user_id, u.display_name, u.phone_e164, u.city, u.reference_note
           FROM device d JOIN protected_user u ON u.id = d.protected_user_id
          WHERE d.token_hash = ? AND d.revoked_at IS NULL`, [tokenHash]);
      if (!linhas || !linhas.length) return null;
      const l = linhas[0];
      gravar("UPDATE device SET last_seen_at = NOW() WHERE id = ?", [l.id]);
      return {
        id: l.id,
        usuariaId: l.protected_user_id,
        usuaria: { displayName: l.display_name, phone: l.phone_e164, city: l.city, referenceNote: l.reference_note }
      };
    },

    /**
     * Recarrega os alertas recentes depois de um restart.
     *
     * O painel não pode nascer vazio depois de um restart: uma ocorrência
     * ainda aberta precisa reaparecer na fila, com trajeto e linha do tempo.
     */
    async hidratar() {
      const linhas = await consultar(
        `SELECT a.id, a.public_id, a.protected_user_id, a.device_id, a.status, a.trigger_kind,
                a.opened_at, a.cancel_window_ends_at, a.battery_pct,
                u.display_name, u.phone_e164, u.city, u.reference_note
           FROM alert a JOIN protected_user u ON u.id = a.protected_user_id
          ORDER BY a.opened_at DESC LIMIT 50`);
      if (!linhas || !linhas.length) return;

      const porId = new Map();
      for (const l of linhas) {
        const alerta = {
          publicId: l.public_id, dbId: l.id, usuariaId: l.protected_user_id, deviceId: l.device_id,
          status: l.status, triggerKind: l.trigger_kind,
          openedAt: new Date(l.opened_at), cancelUntil: new Date(l.cancel_window_ends_at),
          batteryPct: l.battery_pct,
          usuaria: { displayName: l.display_name, phone: l.phone_e164, city: l.city, referenceNote: l.reference_note },
          acknowledgedAt: l.acknowledged_at?.toISOString() ?? null,
          outcome: l.outcome_note || null,
          locations: [], events: [], dispatches: []
        };
        alertas.set(l.public_id, alerta);
        porId.set(l.id, alerta);
      }
      const ids = [...porId.keys()];
      const marcadores = ids.map(() => "?").join(",");
      await Promise.all([
        preencherPosicoes(porId, ids, marcadores),
        preencherEventos(porId, ids, marcadores)
      ]);
    }
  };


  async function preencherPosicoes(porId, ids, marcadores) {
    const pontos = await consultar(
      `SELECT alert_id, lat, lng, accuracy_m, source, recorded_at, received_at
         FROM alert_location
        WHERE alert_id IN (${marcadores}) AND lat IS NOT NULL
        ORDER BY received_at ASC`, ids);
    for (const p of pontos || []) {
      porId.get(p.alert_id)?.locations.push({
        lat: Number(p.lat), lng: Number(p.lng), accuracy_m: p.accuracy_m,
        source: p.source,
        recorded_at: p.recorded_at?.toISOString() ?? null,
        received_at: p.received_at.toISOString()
      });
    }
  }

  async function preencherEventos(porId, ids, marcadores) {
    const eventos = await consultar(
      `SELECT alert_id, kind, actor, actor_ref, note, created_at
         FROM alert_event
        WHERE alert_id IN (${marcadores}) ORDER BY created_at ASC`, ids);
    for (const e of eventos || []) {
      const alerta = porId.get(e.alert_id);
      if (!alerta) continue;
      const evento = {
        kind: e.kind, actor: e.actor, actor_ref: e.actor_ref, note: e.note,
        created_at: e.created_at.toISOString()
      };
      alerta.events.push(evento);
      // O despacho vive no log de eventos; a lista em memória é só um índice
      // dele, para a tela não ter que filtrar a linha do tempo a cada pintura.
      if (e.kind === "dispatched") {
        alerta.dispatches.push({ kind: e.actor_ref, label: e.note, at: evento.created_at });
      }
    }
  }
}
