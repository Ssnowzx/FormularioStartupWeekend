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
  const tokensDeAnjo = new Map(); // sha256(token) -> { publicId, guardianId }
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
    alertas, tokensDeAnjo, consultar, gravar, bancoOk,
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
     * Não é só para o painel não nascer vazio: os tokens dos Anjos vivem em
     * memória, e sem isto um link já enviado pelo WhatsApp passaria a responder
     * 404 no meio da ocorrência — justamente quando alguém está a caminho.
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
          locations: [], events: [], guardians: []
        };
        alertas.set(l.public_id, alerta);
        porId.set(l.id, alerta);
      }
      const ids = [...porId.keys()];
      const marcadores = ids.map(() => "?").join(",");
      await Promise.all([
        preencherAnjos(porId, ids, marcadores),
        preencherPosicoes(porId, ids, marcadores),
        preencherEventos(porId, ids, marcadores)
      ]);
    }
  };

  async function preencherAnjos(porId, ids, marcadores) {
    // Os vínculos vêm da usuária; os acessos, da ocorrência. Um Anjo cadastrado
    // e nunca acionado aparece na lista sem token, que é o correto.
    const vinculos = await consultar(
      `SELECT a.id alert_id, g.id, g.name, g.phone_e164, g.relationship, l.priority
         FROM alert a
         JOIN guardian_link l ON l.protected_user_id = a.protected_user_id AND l.revoked_at IS NULL
         JOIN guardian g ON g.id = l.guardian_id
        WHERE a.id IN (${marcadores}) ORDER BY l.priority ASC, g.id ASC`, ids);
    for (const v of vinculos || []) {
      porId.get(v.alert_id)?.guardians.push({
        id: v.id, name: v.name, phone: v.phone_e164, relationship: v.relationship,
        priority: v.priority, notifiedAt: null, openedAt: null, onTheWayAt: null
      });
    }

    const acessos = await consultar(
      `SELECT alert_id, guardian_id, token_hash, expires_at, created_at, opened_at, on_the_way_at
         FROM guardian_access
        WHERE alert_id IN (${marcadores}) AND revoked_at IS NULL AND expires_at > NOW()`, ids);
    for (const ac of acessos || []) {
      const alerta = porId.get(ac.alert_id);
      if (!alerta) continue;
      tokensDeAnjo.set(ac.token_hash, {
        publicId: alerta.publicId, guardianId: ac.guardian_id, expira: new Date(ac.expires_at)
      });
      const anjo = alerta.guardians.find((g) => g.id === ac.guardian_id);
      if (!anjo) continue;
      anjo.notifiedAt = ac.created_at?.toISOString() ?? null;
      anjo.openedAt = ac.opened_at?.toISOString() ?? null;
      anjo.onTheWayAt = ac.on_the_way_at?.toISOString() ?? null;
    }
  }

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
      porId.get(e.alert_id)?.events.push({
        kind: e.kind, actor: e.actor, actor_ref: e.actor_ref, note: e.note,
        created_at: e.created_at.toISOString()
      });
    }
  }
}
