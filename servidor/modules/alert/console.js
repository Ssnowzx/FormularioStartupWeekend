/**
 * API da central — o que a operadora usa.
 *
 * Separada de /api/v1 de propósito: estas rotas autenticam por cookie de
 * sessão, e a família do aparelho autentica por Bearer com CORS aberto. A
 * separação por prefixo é o que torna impossível, por engano, aplicar CORS
 * aberto a uma rota que anda com credencial do navegador.
 */

import crypto from "node:crypto";
import {
  VALIDADE_CONVITE_MS, VALIDADE_LINK_ANJO_MS, STATUS_VALIDOS,
  sha256, texto, numero, paraE164, gerarConvite
} from "./internals.js";
import { resumoDoAlerta, detalheDoAlerta, anotar } from "./serialize.js";
import { mudarStatus } from "./device.js";

const HEARTBEAT_MS = 15 * 1000;

/* ================================================================== *
 *  Rotas da central                                                   *
 * ================================================================== */

export function registrarRotasDoPainel(ctx) {
  const { app, estado, fluxo, exigirLogin, exigirBanco, BASE_PUBLICA } = ctx;

  app.get("/api/console/stream", exigirLogin, (req, res) => {
    const cliente = fluxo.conectar(res);
    if (!cliente) return;
    // Sem este clearInterval, cada aba fechada deixa um timer eterno.
    const bate = setInterval(() => { try { res.write(": ping\n\n"); } catch { fechar(); } }, HEARTBEAT_MS);
    const fechar = () => { clearInterval(bate); fluxo.desconectar(cliente); try { res.end(); } catch { /* já caiu */ } };
    req.on("close", fechar);
    req.on("error", fechar);
  });

  app.get("/api/console/alerts", exigirLogin, (_req, res) => {
    res.json({ ok: true, db: estado.bancoVivo, alerts: estado.lista().map(resumoDoAlerta) });
  });

  app.get("/api/console/alerts/:publicId", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    res.json({ ok: true, alert: detalheDoAlerta(a) });
  });

  app.post("/api/console/alerts/:publicId/status", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const status = req.body?.status;
    if (!STATUS_VALIDOS.includes(status)) return res.status(400).json({ ok: false, erro: "Status inválido." });
    mudarStatus(estado, fluxo, a, status, "operator", { note: texto(req.body?.note, 255) });
    res.json({ ok: true, alert: detalheDoAlerta(a) });
  });

  app.post("/api/console/alerts/:publicId/guardian-links", exigirLogin, exigirBanco, async (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const pedidos = Array.isArray(req.body?.guardian_ids) ? req.body.guardian_ids : [];
    const alvos = a.guardians.filter((g) => pedidos.includes(g.id));
    if (!alvos.length) return res.status(400).json({ ok: false, erro: "Nenhum Anjo selecionado." });

    const base = BASE_PUBLICA || `${req.protocol}://${req.get("host")}`;
    const links = await Promise.all(alvos.map((g) => criarLinkDeAnjo(estado, fluxo, a, g, base)));
    res.json({ ok: true, links });
  });

  app.get("/api/console/users", exigirLogin, exigirBanco, async (_req, res) => {
    const linhas = await estado.consultar(
      `SELECT u.id, u.display_name, u.city, u.status,
              (SELECT COUNT(*) FROM device d WHERE d.protected_user_id = u.id AND d.revoked_at IS NULL) devices,
              (SELECT COUNT(*) FROM guardian_link l WHERE l.protected_user_id = u.id AND l.revoked_at IS NULL) guardians
         FROM protected_user u ORDER BY u.id DESC LIMIT 200`);
    res.json({ ok: true, users: linhas || [] });
  });

  app.post("/api/console/users", exigirLogin, exigirBanco, async (req, res) => {
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

  app.post("/api/console/users/:id/invite", exigirLogin, exigirBanco, async (req, res) => {
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
