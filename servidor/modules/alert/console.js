/**
 * API da central — o que a operadora usa.
 *
 * Separada de /api/v1 de propósito: estas rotas autenticam por cookie de
 * sessão, e a família do aparelho autentica por Bearer com CORS aberto. A
 * separação por prefixo é o que torna impossível, por engano, aplicar CORS
 * aberto a uma rota que anda com credencial do navegador.
 */

import {
  VALIDADE_CONVITE_MS, STATUS_VALIDOS, DESPACHOS, DESFECHOS,
  sha256, texto, numero, paraE164, gerarConvite
} from "./internals.js";
import { resumoDoAlerta, detalheDoAlerta, anotar } from "./serialize.js";
import { mudarStatus } from "./device.js";

const HEARTBEAT_MS = 15 * 1000;

/* ================================================================== *
 *  Rotas da central                                                   *
 * ================================================================== */

export function registrarRotasDoPainel(ctx) {
  const { app, estado, fluxo, exigirLogin, exigirBanco } = ctx;

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

    // Encerrar sem dizer como é o que transforma relatório em papel em branco.
    const desfecho = req.body?.outcome;
    if (status === "resolved" && desfecho && !DESFECHOS[desfecho]) {
      return res.status(400).json({ ok: false, erro: "Desfecho inválido." });
    }
    if (status === "resolved" && desfecho) a.outcome = DESFECHOS[desfecho];

    mudarStatus(estado, fluxo, a, status, "operator", {
      note: (status === "resolved" && desfecho ? DESFECHOS[desfecho] : null) || texto(req.body?.note, 255)
    });
    res.json({ ok: true, alert: detalheDoAlerta(a) });
  });

  /* ---------------- despacho ----------------
   * Sem a rede de Anjos, é aqui que a central diz o que fez. Cada clique vira
   * um evento com hora, e é dele que sai o tempo de resposta do relatório. */

  app.post("/api/console/alerts/:publicId/dispatch", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const tipo = req.body?.kind;
    if (!DESPACHOS[tipo]) return res.status(400).json({ ok: false, erro: "Tipo de despacho inválido." });
    if (a.status === "resolved" || a.status === "cancelled") {
      return res.status(409).json({ ok: false, erro: "Esta ocorrência já foi encerrada." });
    }

    const registro = { kind: tipo, label: DESPACHOS[tipo], at: new Date().toISOString() };
    a.dispatches.push(registro);
    anotar(estado, fluxo, a, "dispatched", "operator", { actorRef: tipo, note: DESPACHOS[tipo] });
    // Despachar é assumir. Ninguém manda viatura e deixa a ocorrência "nova".
    if (a.status === "open") mudarStatus(estado, fluxo, a, "in_progress", "operator");
    else fluxo.emitir("alert.status", resumoDoAlerta(a));

    res.status(201).json({ ok: true, dispatch: registro, alert: detalheDoAlerta(a) });
  });

  app.post("/api/console/alerts/:publicId/note", exigirLogin, (req, res) => {
    const a = estado.achar(req.params.publicId);
    if (!a) return res.status(404).json({ ok: false, erro: "Ocorrência não encontrada." });
    const nota = texto(req.body?.note, 255);
    if (!nota) return res.status(400).json({ ok: false, erro: "Escreva alguma coisa." });
    anotar(estado, fluxo, a, "note", "operator", { note: nota });
    fluxo.emitir("alert.status", resumoDoAlerta(a));
    res.status(201).json({ ok: true, alert: detalheDoAlerta(a) });
  });


  app.get("/api/console/users", exigirLogin, exigirBanco, async (_req, res) => {
    const linhas = await estado.consultar(
      `SELECT u.id, u.display_name, u.city, u.status,
              (SELECT COUNT(*) FROM device d WHERE d.protected_user_id = u.id AND d.revoked_at IS NULL) devices,
              (SELECT COUNT(*) FROM alert al WHERE al.protected_user_id = u.id) alerts
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

