/**
 * API do aparelho — o que o app Android chama.
 *
 * Os caminhos /api/v1/* são contrato publicado: existem APKs instalados
 * compilados contra eles. Mudar um caminho aqui quebra um celular que já está
 * no bolso de alguém, e esse celular não se atualiza sozinho.
 */

import crypto from "node:crypto";
import { JANELA_CANCELAMENTO_MS, sha256, texto, numero, normalizarConvite } from "./internals.js";
import { resumoDoAlerta, anotar } from "./serialize.js";

/* ================================================================== *
 *  Rotas do aparelho                                                  *
 * ================================================================== */

export function registrarRotasDoAparelho(ctx) {
  const { app, estado, fluxo, exigirBanco, exigirAparelho, excedeu, marca, registros, disparos } = ctx;

  app.post("/api/v1/device/register", exigirBanco, async (req, res) => {
    // O código de convite é curto e digitado por humano: precisa de limite.
    if (excedeu(registros, marca(req), 10)) {
      return res.status(429).json({ ok: false, erro: "Muitas tentativas. Espere alguns minutos." });
    }
    const codigo = normalizarConvite(req.body?.invite_code);
    if (codigo.length !== 8) return res.status(400).json({ ok: false, erro: "Código inválido." });

    const linhas = await estado.consultar(
      `SELECT i.id, i.protected_user_id, u.display_name
         FROM invite_code i JOIN protected_user u ON u.id = i.protected_user_id
        WHERE i.code_hash = ? AND i.used_at IS NULL AND i.expires_at > NOW()
              AND u.status = 'active'`, [sha256(codigo)]);
    if (!linhas || !linhas.length) return res.status(401).json({ ok: false, erro: "Código inválido ou já usado." });

    const convite = linhas[0];
    const token = crypto.randomBytes(32).toString("base64url");
    const inserido = await estado.consultar(
      "INSERT INTO device (protected_user_id, token_hash, label) VALUES (?,?,?)",
      [convite.protected_user_id, sha256(token), texto(req.body?.label, 40)]);
    if (!inserido) return res.status(503).json({ ok: false, erro: "Não foi possível vincular agora." });

    estado.gravar("UPDATE invite_code SET used_at = NOW(), used_by_device_id = ? WHERE id = ?",
      [inserido.insertId, convite.id]);
    // Única vez que o token existe fora do aparelho.
    res.status(201).json({
      ok: true,
      device_token: token,
      cancel_window_s: JANELA_CANCELAMENTO_MS / 1000,
      user: { display_name: convite.display_name }
    });
  });

  app.post("/api/v1/alerts", exigirBanco, exigirAparelho, async (req, res) => {
    if (excedeu(disparos, `d${req.aparelho.id}`, 30)) {
      return res.status(429).json({ ok: false, erro: "Muitos acionamentos." });
    }
    // A palavra dita duas vezes não abre duas ocorrências.
    const jaAberto = estado.abertos().find((a) => a.deviceId === req.aparelho.id);
    if (jaAberto) return res.json({ ok: true, ...resumoDoAlerta(jaAberto), reused: true });

    const alerta = await abrirAlerta(estado, fluxo, req);
    res.status(201).json({ ok: true, ...resumoDoAlerta(alerta), server_time: new Date().toISOString() });
  });

  app.post("/api/v1/alerts/:publicId/locations", exigirBanco, exigirAparelho, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    if (a.deviceId !== req.aparelho.id) return res.status(403).json({ ok: false, erro: "Ocorrência de outro aparelho." });

    const pontos = Array.isArray(req.body?.points) ? req.body.points.slice(0, 50) : [];
    let aceitos = 0;
    for (const p of pontos) if (registrarPosicao(estado, fluxo, a, p)) aceitos++;
    res.status(202).json({ ok: true, accepted: aceitos });
  });

  app.post("/api/v1/alerts/:publicId/cancel", exigirBanco, exigirAparelho, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    if (a.deviceId !== req.aparelho.id) return res.status(403).json({ ok: false, erro: "Ocorrência de outro aparelho." });
    // Depois que a central assume, só a central fecha.
    if (a.status !== "open" || Date.now() > a.cancelUntil.getTime()) {
      return res.status(409).json({ ok: false, erro: "Fora da janela de cancelamento." });
    }
    mudarStatus(estado, fluxo, a, "cancelled", "device", { note: texto(req.body?.reason, 60) || "false_alarm" });
    res.json({ ok: true, status: a.status });
  });

  app.get("/api/v1/alerts/:publicId", exigirBanco, exigirAparelho, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a || a.deviceId !== req.aparelho.id) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    res.json({ ok: true, ...resumoDoAlerta(a) });
  });
}

/** Cria a ocorrência em memória, avisa a central, e só então persiste. */
async function abrirAlerta(estado, fluxo, req) {
  const agora = new Date();
  const alerta = {
    publicId: crypto.randomBytes(16).toString("hex"),
    dbId: null,
    usuariaId: req.aparelho.usuariaId,
    deviceId: req.aparelho.id,
    clientAlertId: texto(req.body?.client_alert_id, 36),
    status: "open",
    triggerKind: ["voice", "manual", "test"].includes(req.body?.trigger) ? req.body.trigger : "voice",
    openedAt: agora,
    cancelUntil: new Date(agora.getTime() + JANELA_CANCELAMENTO_MS),
    batteryPct: numero(req.body?.battery_pct, 0, 100),
    usuaria: req.aparelho.usuaria,
    locations: [], events: [], guardians: []
  };
  estado.alertas.set(alerta.publicId, alerta);
  anotar(estado, fluxo, alerta, "created", "device");
  await carregarAnjos(estado, alerta);
  fluxo.emitir("alert.created", resumoDoAlerta(alerta));

  const inserido = await estado.consultar(
    `INSERT INTO alert (public_id, protected_user_id, device_id, client_alert_id,
                        trigger_kind, opened_at, cancel_window_ends_at, battery_pct)
     VALUES (?,?,?,?,?,?,?,?)`,
    [alerta.publicId, alerta.usuariaId, alerta.deviceId, alerta.clientAlertId,
     alerta.triggerKind, agora, alerta.cancelUntil, alerta.batteryPct]);
  if (inserido) {
    alerta.dbId = inserido.insertId;
    estado.gravar("INSERT INTO alert_event (alert_id, kind, actor) VALUES (?,'created','device')", [alerta.dbId]);
  }

  // O alerta abre mesmo sem GPS: a central chega nela pelo telefone.
  if (req.body?.location) registrarPosicao(estado, fluxo, alerta, req.body.location);
  return alerta;
}

async function carregarAnjos(estado, alerta) {
  const linhas = await estado.consultar(
    `SELECT g.id, g.name, g.phone_e164, g.relationship, l.priority
       FROM guardian_link l JOIN guardian g ON g.id = l.guardian_id
      WHERE l.protected_user_id = ? AND l.revoked_at IS NULL
      ORDER BY l.priority ASC, g.id ASC`, [alerta.usuariaId]);
  alerta.guardians = (linhas || []).map((g) => ({
    id: g.id, name: g.name, phone: g.phone_e164, relationship: g.relationship,
    priority: g.priority, notifiedAt: null, openedAt: null, onTheWayAt: null
  }));
}

export function registrarPosicao(estado, fluxo, a, p) {
  const lat = numero(p?.lat, -90, 90);
  const lng = numero(p?.lng, -180, 180);
  if (lat === null || lng === null) return false;
  const ponto = {
    lat, lng,
    accuracy_m: numero(p?.accuracy_m, 0, 65535),
    source: ["gps", "network", "manual"].includes(p?.source) ? p.source : "gps",
    recorded_at: texto(p?.recorded_at, 40),
    received_at: new Date().toISOString()
  };
  a.locations.push(ponto);
  if (a.locations.length > 400) a.locations.shift();
  if (a.dbId) {
    estado.gravar(
      `INSERT INTO alert_location (alert_id, lat, lng, accuracy_m, source, recorded_at)
       VALUES (?,?,?,?,?,?)`,
      [a.dbId, lat, lng, ponto.accuracy_m, ponto.source, ponto.recorded_at ? new Date(ponto.recorded_at) : null]);
  }
  fluxo.emitir("alert.location", { alert_id: a.publicId, location: ponto });
  return true;
}

export function mudarStatus(estado, fluxo, a, status, actor, { actorRef = null, note = null } = {}) {
  a.status = status;
  const campo = status === "cancelled" ? "cancelled_at"
    : status === "in_progress" ? "acknowledged_at"
    : status === "resolved" ? "closed_at" : null;
  if (a.dbId) {
    estado.gravar(
      `UPDATE alert SET status = ?${campo ? `, ${campo} = NOW()` : ""}${note ? ", outcome_note = ?" : ""} WHERE id = ?`,
      note ? [status, note, a.dbId] : [status, a.dbId]);
  }
  anotar(estado, fluxo, a, status === "cancelled" ? "cancelled" : "status_changed", actor, { actorRef, note });
  const evento = status === "cancelled" ? "alert.cancelled" : "alert.status";
  fluxo.emitir(evento, resumoDoAlerta(a));
}
