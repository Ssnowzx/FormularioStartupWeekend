/**
 * O MVP — o sistema do produto.
 *
 * Palavra falada no celular → alerta → central → Anjos → atendimento.
 * Este módulo é dono do aparelho, da central e da página do Anjo.
 *
 * A PALAVRA-CHAVE NUNCA CHEGA AQUI. Não há rota que a receba nem coluna onde
 * guardá-la. O aparelho envia "fui acionado" e mais nada.
 *
 * Não importa nada dos outros módulos. O usuário de banco que usa aqui não tem
 * permissão alguma sobre a tabela da pesquisa, e vice-versa: as duas metades
 * do sistema são cegas uma para a outra.
 */

import crypto from "node:crypto";
import { createPool } from "../../core/db.js";
import { createLog } from "../../core/log.js";
import { ROLES } from "../../core/auth.js";
import { sha256 } from "./internals.js";
import { criarEstado } from "./state.js";
import { criarFluxo } from "./stream.js";
import { registrarRotasDoAparelho } from "./device.js";
import { registrarRotasDoPainel } from "./console.js";
import { registrarRotasDoAnjo } from "./guardian.js";
import { registrarPaginas } from "./pages.js";

const log = createLog("alerta");

export function mount(app, { requireRole, roleOf, production }) {
  const MODO_DEMO = process.env.DEMO_MODE === "1";
  const BASE_PUBLICA = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

  const bda = createPool({
    user: process.env.DB_ALERTS_USER || "mer_alerts",
    password: process.env.DB_ALERTS_PASSWORD,
    log
  });

  const estado = criarEstado(bda);
  const fluxo = criarFluxo();

  /* ---------------- limites próprios ---------------- */

  // Orçamento independente do da pesquisa, de propósito: robô tentando
  // adivinhar código de convite não deve consumir o limite de quem está
  // respondendo o questionário.
  let sal = crypto.randomBytes(16).toString("hex");
  const registros = new Map();
  const disparos = new Map();
  setInterval(() => {
    sal = crypto.randomBytes(16).toString("hex");
    registros.clear();
    disparos.clear();
  }, 60 * 60 * 1000).unref?.();

  const excedeu = (mapa, chave, limite) => {
    const n = (mapa.get(chave) || 0) + 1;
    mapa.set(chave, n);
    return n > limite;
  };
  const marca = (req) => sha256(sal + (req.ip || "")).slice(0, 24);

  /* ---------------- CORS só para a família do aparelho ---------------- */

  // Cliente nativo não aplica CORS; isto existe para o simulador e para
  // testes de outra origem. Nunca com credenciais: o token do aparelho viaja
  // em header, não em cookie — e é por isso que as rotas da central ficam sob
  // outro prefixo, fora do alcance desta regra.
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
    // 256 bits de randomBytes: buscar pelo hash basta. timingSafeEqual só faz
    // diferença em segredo de baixa entropia — senha, código de convite.
    if (token.length < 32) return res.status(401).json({ ok: false, erro: "Aparelho não autenticado." });
    const aparelho = await estado.acharAparelho(sha256(token));
    if (!aparelho) return res.status(401).json({ ok: false, erro: "Aparelho não autenticado." });
    req.aparelho = aparelho;
    next();
  }

  const operadora = requireRole(ROLES.OPERATOR);

  registrarRotasDoAparelho({ app, estado, fluxo, exigirBanco, exigirAparelho, excedeu, marca, registros, disparos });
  registrarRotasDoPainel({ app, estado, fluxo, exigirLogin: operadora, exigirBanco, BASE_PUBLICA });
  registrarRotasDoAnjo({ app, estado, fluxo, exigirBanco });
  registrarPaginas({ app, roleOf, MODO_DEMO });

  app.get("/api/v1/health", async (_req, res) => {
    res.json({
      ok: true,
      db: await estado.bancoOk(),
      abertos: estado.abertos().length,
      time: new Date().toISOString()
    });
  });

  estado.hidratar().catch((e) => log.error(`hidratação falhou: ${e.message}`));

  if (production && MODO_DEMO) {
    log.warn("DEMO_MODE=1 em produção — /simulador e /app estão expostos.");
  }
  log.info(bda ? "no ar" : "sem banco; respondendo 503");
}
