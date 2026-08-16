/**
 * A página do Anjo, aberta por link com token.
 *
 * Token desconhecido, expirado ou revogado responde 404 — nunca 401 ou 403.
 * Não se confirma a existência de um token para quem não o tem.
 */

import { sha256 } from "./internals.js";
import { resumoDoAlerta, ultimaPosicao, anotar } from "./serialize.js";

/* ================================================================== *
 *  Rotas do Anjo                                                      *
 * ================================================================== */

export function registrarRotasDoAnjo(ctx) {
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
