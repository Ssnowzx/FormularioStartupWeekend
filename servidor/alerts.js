/**
 * Mulheres em Risco — subsistema de alertas.
 *
 * Monta-se sobre o app Express que já existe, com duas linhas no server.js.
 * Não altera nenhuma rota anterior e não toca no pool da pesquisa: se este
 * módulo falhar inteiro, o formulário de campo continua no ar.
 *
 * A PALAVRA-CHAVE NUNCA CHEGA AQUI. Não há rota que a receba, não há coluna
 * onde guardá-la. O aparelho envia "fui acionado" e mais nada.
 *
 * O estado dos alertas abertos vive em memória e o banco é gravado em
 * best-effort. É deliberado: o caminho de emergência não pode depender do
 * MariaDB estar de pé.
 */

import mysql from "mysql2/promise";
import crypto from "node:crypto";
import path from "node:path";

const JANELA_CANCELAMENTO_MS = 15 * 1000;
const VALIDADE_CONVITE_MS = 24 * 60 * 60 * 1000;
const VALIDADE_LINK_ANJO_MS = 12 * 60 * 60 * 1000;
const MAX_OUVINTES = 20;
const HEARTBEAT_MS = 15 * 1000;

// Sem 0/O/1/I/L: o código é lido em voz alta e digitado à mão numa delegacia.
const ALFABETO_CONVITE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const STATUS_VALIDOS = ["open", "in_progress", "resolved", "cancelled"];

/* ---------------- utilidades ---------------- */

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");

/**
 * Remove qualquer sequência longa que pareça token antes de ir para o log.
 * O mysql2 inclui o SQL e às vezes os parâmetros na mensagem de erro — é por
 * aí que um token vazaria para o journalctl.
 */
const semSegredo = (v) => String(v).replace(/[A-Za-z0-9_-]{24,}/g, "«token»");

const texto = (v, max) => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
};

const numero = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Telefone brasileiro para E.164 sem o "+", que é o formato que o wa.me aceita. */
function paraE164(bruto) {
  const so = String(bruto ?? "").replace(/\D/g, "");
  if (!so) return null;
  if (so.startsWith("55") && so.length >= 12 && so.length <= 13) return so;
  if (so.length === 10 || so.length === 11) return "55" + so;
  return so.length >= 8 && so.length <= 15 ? so : null;
}

function gerarConvite() {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (const b of bytes) s += ALFABETO_CONVITE[b % ALFABETO_CONVITE.length];
  return s;
}

const normalizarConvite = (v) =>
  String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* ================================================================== *
 *  Montagem                                                          *
 * ================================================================== */

export function mountAlerts(app, { exigirLogin, autenticado, DIR, EM_PRODUCAO }) {
  const USUARIO = process.env.DB_ALERTS_USER || "mer_alerts";
  const SENHA = process.env.DB_ALERTS_PASSWORD || "";
  const MODO_DEMO = process.env.DEMO_MODE === "1";
  const BASE_PUBLICA = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

  // Pool próprio, com credenciais próprias: este módulo fisicamente não
  // alcança a tabela `respostas`.
  const bda = SENHA
    ? mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        user: USUARIO,
        password: SENHA,
        database: process.env.DB_NAME || "mulheres_em_risco",
        waitForConnections: true,
        connectionLimit: 10,
        charset: "utf8mb4_unicode_ci"
      })
    : null;

  if (!bda) {
    console.warn("Alertas: DB_ALERTS_PASSWORD não definida. As rotas de alerta respondem 503.");
  }

  const estado = criarEstado(bda);
  const fluxo = criarFluxo();

  /* ---------------- limites, sem guardar IP ---------------- */

  let sal = crypto.randomBytes(16).toString("hex");
  const registros = new Map();
  const disparos = new Map();
  setInterval(() => { sal = crypto.randomBytes(16).toString("hex"); registros.clear(); disparos.clear(); }, 60 * 60 * 1000);

  // Duplica de propósito o esquema do server.js: orçamentos independentes
  // significam que robô tentando adivinhar convite não gasta o limite de
  // envio do formulário de pesquisa.
  const excedeu = (mapa, chave, limite) => {
    const n = (mapa.get(chave) || 0) + 1;
    mapa.set(chave, n);
    return n > limite;
  };
  const marca = (req) => sha256(sal + (req.ip || "")).slice(0, 24);

  /* ---------------- CORS só para a família do aparelho ---------------- */

  // Cliente nativo não aplica CORS; isto existe para o simulador e para
  // qualquer teste feito de outra origem. Nunca com credenciais: o token
  // do aparelho viaja em header, não em cookie.
  app.use("/api/v1", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const exigirBanco = (_req, res, next) =>
    bda ? next() : res.status(503).json({ ok: false, erro: "Serviço de alertas indisponível." });

  /* ---------------- autenticação do aparelho ---------------- */

  async function exigirAparelho(req, res, next) {
    const cabecalho = req.get("authorization") || "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : "";
    // 256 bits de randomBytes: buscar pelo hash basta, timingSafeEqual só
    // faz diferença em segredo de baixa entropia (senha, código de convite).
    if (token.length < 32) return res.status(401).json({ ok: false, erro: "Aparelho não autenticado." });
    const aparelho = await estado.acharAparelho(sha256(token));
    if (!aparelho) return res.status(401).json({ ok: false, erro: "Aparelho não autenticado." });
    req.aparelho = aparelho;
    next();
  }

  registrarRotasDoAparelho({ app, estado, fluxo, exigirBanco, exigirAparelho, excedeu, marca, registros, disparos });
  registrarRotasDoPainel({ app, estado, fluxo, exigirLogin, exigirBanco, BASE_PUBLICA });
  registrarRotasDoAnjo({ app, estado, fluxo, exigirBanco });
  registrarPaginas({ app, DIR, MODO_DEMO, autenticado });

  app.get("/api/v1/health", async (_req, res) => {
    res.json({ ok: true, db: await estado.bancoOk(), abertos: estado.abertos().length, time: new Date().toISOString() });
  });

  estado.hidratar().catch((e) => console.error("alertas: hidratação falhou:", semSegredo(e.message)));

  if (EM_PRODUCAO && MODO_DEMO) {
    console.warn("Alertas: DEMO_MODE=1 em produção — /simulador está exposto.");
  }
}

/* ================================================================== *
 *  Estado: memória primeiro, banco em best-effort                    *
 * ================================================================== */

function criarEstado(bda) {
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
      console.error("alertas/banco:", semSegredo(e.message));
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

/* ================================================================== *
 *  Fluxo em tempo real (SSE)                                          *
 * ================================================================== */

function criarFluxo() {
  const ouvintes = new Set();

  return {
    ouvintes,
    conectar(res) {
      if (ouvintes.size >= MAX_OUVINTES) { res.status(503).end(); return null; }
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Sem isto o nginx bufferiza e o alerta chega tarde na tela.
        "X-Accel-Buffering": "no"
      });
      res.write("retry: 3000\n\n");
      const cliente = { res };
      ouvintes.add(cliente);
      return cliente;
    },
    desconectar(cliente) { ouvintes.delete(cliente); },
    emitir(tipo, dados) {
      const bloco = `event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`;
      for (const c of [...ouvintes]) {
        try { c.res.write(bloco); } catch { ouvintes.delete(c); }
      }
    }
  };
}

/* ================================================================== *
 *  Serialização para as telas                                         *
 * ================================================================== */

const ultimaPosicao = (a) => a.locations.length ? a.locations[a.locations.length - 1] : null;

function resumoDoAlerta(a) {
  return {
    alert_id: a.publicId,
    status: a.status,
    trigger: a.triggerKind,
    opened_at: a.openedAt.toISOString(),
    cancel_until: a.cancelUntil.toISOString(),
    battery_pct: a.batteryPct ?? null,
    user: { display_name: a.usuaria.displayName, city: a.usuaria.city },
    last_location: ultimaPosicao(a),
    guardians_on_the_way: a.guardians.filter((g) => g.onTheWayAt).length,
    guardians_notified: a.guardians.filter((g) => g.notifiedAt).length,
    // O número do pitch: quanto tempo levou entre a palavra dita e alguém
    // que se importa dizer "estou indo".
    first_on_the_way_at: a.guardians.map((g) => g.onTheWayAt).filter(Boolean).sort()[0] || null
  };
}

function detalheDoAlerta(a) {
  return {
    ...resumoDoAlerta(a),
    user: {
      display_name: a.usuaria.displayName,
      phone_e164: a.usuaria.phone,
      city: a.usuaria.city,
      reference_note: a.usuaria.referenceNote
    },
    locations: a.locations,
    events: a.events,
    guardians: a.guardians.map((g) => ({
      guardian_id: g.id, name: g.name, phone_e164: g.phone, relationship: g.relationship,
      priority: g.priority, notified_at: g.notifiedAt, opened_at: g.openedAt, on_the_way_at: g.onTheWayAt
    }))
  };
}

function anotar(estado, fluxo, a, kind, actor, { actorRef = null, note = null } = {}) {
  const evento = { kind, actor, actor_ref: actorRef, note, created_at: new Date().toISOString() };
  a.events.push(evento);
  if (a.dbId) {
    estado.gravar(
      "INSERT INTO alert_event (alert_id, kind, actor, actor_ref, note) VALUES (?,?,?,?,?)",
      [a.dbId, kind, actor, actorRef, note]);
  }
  return evento;
}

/* ================================================================== *
 *  Rotas do aparelho                                                  *
 * ================================================================== */

function registrarRotasDoAparelho(ctx) {
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

function registrarPosicao(estado, fluxo, a, p) {
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

function mudarStatus(estado, fluxo, a, status, actor, { actorRef = null, note = null } = {}) {
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

/* ================================================================== *
 *  Rotas da central                                                   *
 * ================================================================== */

function registrarRotasDoPainel(ctx) {
  const { app, estado, fluxo, exigirLogin, exigirBanco, BASE_PUBLICA } = ctx;

  app.get("/api/panel/stream", exigirLogin, (req, res) => {
    const cliente = fluxo.conectar(res);
    if (!cliente) return;
    // Sem este clearInterval, cada aba fechada deixa um timer eterno.
    const bate = setInterval(() => { try { res.write(": ping\n\n"); } catch { fechar(); } }, HEARTBEAT_MS);
    const fechar = () => { clearInterval(bate); fluxo.desconectar(cliente); try { res.end(); } catch { /* já caiu */ } };
    req.on("close", fechar);
    req.on("error", fechar);
  });

  app.get("/api/panel/alerts", exigirLogin, (_req, res) => {
    res.json({ ok: true, db: estado.bancoVivo, alerts: estado.lista().map(resumoDoAlerta) });
  });

  app.get("/api/panel/alerts/:publicId", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    res.json({ ok: true, alert: detalheDoAlerta(a) });
  });

  app.post("/api/panel/alerts/:publicId/status", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const status = req.body?.status;
    if (!STATUS_VALIDOS.includes(status)) return res.status(400).json({ ok: false, erro: "Status inválido." });
    mudarStatus(estado, fluxo, a, status, "operator", { note: texto(req.body?.note, 255) });
    res.json({ ok: true, alert: detalheDoAlerta(a) });
  });

  app.post("/api/panel/alerts/:publicId/guardian-links", exigirLogin, exigirBanco, async (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const pedidos = Array.isArray(req.body?.guardian_ids) ? req.body.guardian_ids : [];
    const alvos = a.guardians.filter((g) => pedidos.includes(g.id));
    if (!alvos.length) return res.status(400).json({ ok: false, erro: "Nenhum Anjo selecionado." });

    const base = BASE_PUBLICA || `${req.protocol}://${req.get("host")}`;
    const links = await Promise.all(alvos.map((g) => criarLinkDeAnjo(estado, fluxo, a, g, base)));
    res.json({ ok: true, links });
  });

  app.get("/api/panel/users", exigirLogin, exigirBanco, async (_req, res) => {
    const linhas = await estado.consultar(
      `SELECT u.id, u.display_name, u.city, u.status,
              (SELECT COUNT(*) FROM device d WHERE d.protected_user_id = u.id AND d.revoked_at IS NULL) devices,
              (SELECT COUNT(*) FROM guardian_link l WHERE l.protected_user_id = u.id AND l.revoked_at IS NULL) guardians
         FROM protected_user u ORDER BY u.id DESC LIMIT 200`);
    res.json({ ok: true, users: linhas || [] });
  });

  app.post("/api/panel/users", exigirLogin, exigirBanco, async (req, res) => {
    const nome = texto(req.body?.display_name, 80);
    if (!nome) return res.status(400).json({ ok: false, erro: "Informe o nome." });

    const criada = await estado.consultar(
      "INSERT INTO protected_user (display_name, phone_e164, city, reference_note) VALUES (?,?,?,?)",
      [nome, paraE164(req.body?.phone_e164), texto(req.body?.city, 80), texto(req.body?.reference_note, 200)]);
    if (!criada) return res.status(503).json({ ok: false, erro: "Não foi possível cadastrar agora." });

    await cadastrarAnjos(estado, criada.insertId, req.body?.guardians);
    const convite = await emitirConvite(estado, criada.insertId);
    res.status(201).json({ ok: true, user_id: criada.insertId, ...convite });
  });

  app.post("/api/panel/users/:id/invite", exigirLogin, exigirBanco, async (req, res) => {
    const id = numero(req.params.id, 1, 4294967295);
    if (!id) return res.status(400).json({ ok: false, erro: "Usuária inválida." });
    const convite = await emitirConvite(estado, id);
    if (!convite) return res.status(503).json({ ok: false, erro: "Não foi possível gerar o código." });
    res.status(201).json({ ok: true, ...convite });
  });
}

async function cadastrarAnjos(estado, usuariaId, lista) {
  const anjos = Array.isArray(lista) ? lista.slice(0, 10) : [];
  let prioridade = 1;
  for (const anjo of anjos) {
    const nome = texto(anjo?.name, 80);
    const fone = paraE164(anjo?.phone_e164);
    if (!nome || !fone) continue;
    const criado = await estado.consultar(
      "INSERT INTO guardian (name, phone_e164, relationship) VALUES (?,?,?)",
      [nome, fone, texto(anjo?.relationship, 40)]);
    if (!criado) continue;
    await estado.consultar(
      "INSERT INTO guardian_link (protected_user_id, guardian_id, priority) VALUES (?,?,?)",
      [usuariaId, criado.insertId, prioridade++]);
  }
}

async function emitirConvite(estado, usuariaId) {
  const codigo = gerarConvite();
  const expira = new Date(Date.now() + VALIDADE_CONVITE_MS);
  const feito = await estado.consultar(
    "INSERT INTO invite_code (protected_user_id, code_hash, expires_at) VALUES (?,?,?)",
    [usuariaId, sha256(codigo), expira]);
  if (!feito) return null;
  // Aparece uma vez, para ser digitado presencialmente. Nunca vai por mensagem.
  return { invite_code: `${codigo.slice(0, 4)}-${codigo.slice(4)}`, expires_at: expira.toISOString() };
}

async function criarLinkDeAnjo(estado, fluxo, a, g, base) {
  const token = crypto.randomBytes(24).toString("base64url");
  const expira = new Date(Date.now() + VALIDADE_LINK_ANJO_MS);
  if (a.dbId) {
    await estado.consultar(
      "INSERT INTO guardian_access (alert_id, guardian_id, token_hash, expires_at) VALUES (?,?,?,?)",
      [a.dbId, g.id, sha256(token), expira]);
  }
  estado.tokensDeAnjo.set(sha256(token), { publicId: a.publicId, guardianId: g.id, expira });
  g.notifiedAt = new Date().toISOString();
  anotar(estado, fluxo, a, "guardian_notified", "operator", { actorRef: String(g.id), note: g.name });
  fluxo.emitir("alert.guardian", resumoDoAlerta(a));

  const url = `${base}/anjo/${token}`;
  const nome = (a.usuaria.displayName || "").split(" ")[0] || "Ela";
  const mensagem =
    `${nome} acionou um alerta de emergência agora. ` +
    `Abra para ver onde ela está e avisar que você está a caminho: ${url}`;
  return {
    guardian_id: g.id, name: g.name, url,
    wa_url: g.phone ? `https://wa.me/${g.phone}?text=${encodeURIComponent(mensagem)}` : null,
    message: mensagem
  };
}

/* ================================================================== *
 *  Rotas do Anjo                                                      *
 * ================================================================== */

function registrarRotasDoAnjo(ctx) {
  const { app, estado, fluxo, exigirBanco } = ctx;

  // Token desconhecido, expirado ou revogado responde 404 — nunca 401/403.
  // Não confirmamos a existência do token para quem não o tem.
  function abrirAcesso(req) {
    const dados = estado.tokensDeAnjo.get(sha256(req.params.token || ""));
    if (!dados || dados.expira < new Date()) return null;
    const a = estado.achar(dados.publicId);
    if (!a) return null;
    const g = a.guardians.find((x) => x.id === dados.guardianId);
    return g ? { a, g } : null;
  }

  app.get("/api/guardian/:token", exigirBanco, (req, res) => {
    const acesso = abrirAcesso(req);
    if (!acesso) return res.status(404).json({ ok: false, erro: "Link inválido ou expirado." });
    const { a, g } = acesso;
    if (!g.openedAt) {
      g.openedAt = new Date().toISOString();
      anotar(estado, fluxo, a, "guardian_opened", "guardian", { actorRef: String(g.id), note: g.name });
      estado.gravar("UPDATE guardian_access SET opened_at = NOW() WHERE token_hash = ? AND opened_at IS NULL",
        [sha256(req.params.token)]);
      fluxo.emitir("alert.guardian", resumoDoAlerta(a));
    }
    res.set("Cache-Control", "no-store").json({
      ok: true,
      alert: { status: a.status, opened_at: a.openedAt.toISOString() },
      // Só o primeiro nome: o Anjo já sabe de quem se trata, e o link pode
      // ser encaminhado por engano.
      user: { first_name: (a.usuaria.displayName || "").split(" ")[0] || null },
      location: ultimaPosicao(a),
      on_the_way: Boolean(g.onTheWayAt)
    });
  });

  app.post("/api/guardian/:token/on-the-way", exigirBanco, (req, res) => {
    const acesso = abrirAcesso(req);
    if (!acesso) return res.status(404).json({ ok: false, erro: "Link inválido ou expirado." });
    const { a, g } = acesso;
    if (a.status === "resolved" || a.status === "cancelled") {
      return res.status(409).json({ ok: false, erro: "Esta ocorrência já foi encerrada." });
    }
    if (!g.onTheWayAt) {
      g.onTheWayAt = new Date().toISOString();
      anotar(estado, fluxo, a, "guardian_on_the_way", "guardian", { actorRef: String(g.id), note: g.name });
      estado.gravar("UPDATE guardian_access SET on_the_way_at = NOW() WHERE token_hash = ?", [sha256(req.params.token)]);
      fluxo.emitir("alert.guardian", resumoDoAlerta(a));
    }
    res.json({ ok: true, on_the_way_at: g.onTheWayAt });
  });
}

/* ================================================================== *
 *  Páginas                                                            *
 * ================================================================== */

function registrarPaginas({ app, DIR, MODO_DEMO, autenticado }) {
  const pagina = (arquivo) => (_req, res) =>
    res.set("Cache-Control", "no-store").sendFile(path.join(DIR, "publico", arquivo));

  app.get("/central", pagina("dispatch.html"));
  app.get("/cadastro", pagina("enroll.html"));
  // O token fica na URL porque não há como evitar num link de WhatsApp.
  // Mitigação: Referrer-Policy no-referrer já é global, a página não carrega
  // nada de terceiros, e o link expira em 12h.
  app.get("/anjo/:token", (_req, res) =>
    res.set("Cache-Control", "no-store").set("X-Robots-Tag", "noindex, nofollow")
       .sendFile(path.join(DIR, "publico", "guardian.html")));

  // Entrega o APK para o celular baixar e instalar, sem precisar de adb.
  // Só existe em modo demo, e o caminho vem do .env — o APK nunca fica no repo.
  app.get("/app", (_req, res) => {
    const apk = process.env.APK_PATH;
    if (!MODO_DEMO || !apk) return res.status(404).end();
    res.set("Content-Type", "application/vnd.android.package-archive")
       .set("Content-Disposition", 'attachment; filename="calculadora.apk"')
       .sendFile(path.resolve(apk));
  });

  app.get("/simulador", (req, res, next) => {
    if (!MODO_DEMO) return next();
    // Mesmo em modo demo, o simulador só abre para quem já entrou no painel:
    // é uma ferramenta de teste, não uma porta aberta.
    if (!autenticado(req)) return res.redirect("/central");
    pagina("simulator.html")(req, res);
  });
}
