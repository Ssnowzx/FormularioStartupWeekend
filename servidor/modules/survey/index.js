/**
 * Formulários + dashboard — a pesquisa de campo.
 *
 * Recebe respostas anônimas de mulheres e agrega para o time. Não conhece
 * alertas, não conhece o site, e o usuário de banco que usa aqui não tem
 * permissão nenhuma sobre as tabelas do produto.
 *
 * Privacidade: nenhuma rota grava IP, user-agent ou identificador junto da
 * resposta. Não existe coluna para isso, e não deve passar a existir. Se
 * alguém propuser "guardar o IP para evitar resposta duplicada", a resposta é
 * não: duplicata custa pouco, vazamento custa muito.
 */

import express from "express";
import path from "node:path";
import { createPool } from "../../core/db.js";
import { createLog } from "../../core/log.js";
import { ROLES } from "../../core/auth.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const log = createLog("pesquisa");

const PROFILE = {
  idade: ["Até 17", "18 a 24", "25 a 39", "40 a 59", "60 ou mais", "Prefiro não dizer"],
  etnia: ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Prefiro não dizer"],
  civil: ["Solteira", "Casada ou em união estável", "Separada ou divorciada", "Viúva", "Prefiro não dizer"],
  renda: ["Sem renda própria", "Até 1 salário mínimo", "1 a 2 salários", "2 a 5 salários", "Mais de 5 salários", "Prefiro não dizer"],
  religiao: ["Católica", "Evangélica", "Espírita", "Umbanda ou Candomblé", "Outra", "Não tenho religião", "Prefiro não dizer"]
};

// p9 não existe: a numeração pulou na redação e ficou assim de propósito,
// para não renumerar respostas já coletadas.
const QUESTIONS = ["p1","p2","p3","p4","p5","p6","p7","p8","p10","p11","p12",
                   "p13","p14","p15","p16","p17","p18","p19"];

const text = (value, max) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
};

function clean(body) {
  const profile = {};
  for (const field of Object.keys(PROFILE)) {
    const value = text(body?.dm?.[field], 64);
    profile[field] = value && PROFILE[field].includes(value) ? value : null;
  }
  profile.cidade = text(body?.dm?.cidade, 80);

  const answers = {};
  for (const id of QUESTIONS) {
    const value = text(body?.r?.[id], 2000);
    if (value) answers[id] = value;
  }
  return { profile, answers };
}

export function mount(app, { requireRole, limits }) {
  const db = createPool({
    user: process.env.DB_SURVEY_USER || process.env.DB_USER || "mer_app",
    password: process.env.DB_SURVEY_PASSWORD || process.env.DB_PASSWORD,
    log
  });

  const requireDb = (_req, res, next) =>
    db ? next() : res.status(503).json({ ok: false, erro: "Pesquisa indisponível." });

  const researcher = requireRole(ROLES.RESEARCHER);

  /* ---------------- respostas ---------------- */

  app.post("/api/survey/answers", requireDb, async (req, res) => {
    try {
      // Campo-armadilha: robô preenche tudo, mulher nenhuma vê este campo.
      // Responde ok para não ensinar o robô que foi detectado.
      if (text(req.body?.website, 200)) return res.json({ ok: true });
      if (limits.exceeded("survey", req, 12)) {
        return res.status(429).json({ ok: false, erro: "Muitos envios. Tente daqui a pouco." });
      }
      const { profile, answers } = clean(req.body);
      if (!Object.keys(answers).length) {
        return res.status(400).json({ ok: false, erro: "Responda ao menos uma pergunta." });
      }
      await db.execute(
        `INSERT INTO respostas (idade, etnia, civil, renda, religiao, cidade, respostas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [profile.idade, profile.etnia, profile.civil, profile.renda, profile.religiao,
         profile.cidade, JSON.stringify(answers)]);
      res.json({ ok: true });
    } catch (e) {
      log.error(`falha ao gravar: ${e.message}`);
      res.status(500).json({ ok: false, erro: "Não conseguimos salvar agora. Tente de novo." });
    }
  });

  /* ---------------- dashboard ---------------- */

  app.get("/api/survey/results", researcher, requireDb, async (_req, res) => {
    try {
      const [[summary]] = await db.query(`
        SELECT COUNT(*) total,
               SUM(DATE(criado_em) = CURDATE()) hoje,
               SUM(criado_em >= NOW() - INTERVAL 1 HOUR) ultima_hora,
               MAX(criado_em) ultima
          FROM respostas`);

      const profile = {};
      // Os nomes de coluna vêm deste array literal, nunca de entrada do usuário.
      for (const field of ["idade", "etnia", "civil", "renda", "religiao", "cidade"]) {
        const [rows] = await db.query(
          `SELECT ${field} valor, COUNT(*) n FROM respostas
            WHERE ${field} IS NOT NULL AND ${field} <> ''
            GROUP BY ${field} ORDER BY n DESC`);
        profile[field] = rows;
      }

      const [porDia] = await db.query(`
        SELECT DATE(criado_em) dia, COUNT(*) n FROM respostas
         GROUP BY DATE(criado_em) ORDER BY dia DESC LIMIT 14`);

      const [rows] = await db.query(
        "SELECT criado_em, respostas FROM respostas ORDER BY id DESC LIMIT 3000");

      res.json({
        total: Number(summary.total) || 0,
        hoje: Number(summary.hoje) || 0,
        ultimaHora: Number(summary.ultima_hora) || 0,
        ultima: summary.ultima,
        perfil: profile,
        porDia,
        respostas: rows
      });
    } catch (e) {
      log.error(`falha ao ler: ${e.message}`);
      res.status(500).json({ ok: false, erro: "Falha ao carregar os dados." });
    }
  });

  app.get("/api/survey/export.csv", researcher, requireDb, async (_req, res) => {
    const [rows] = await db.query(
      "SELECT id, criado_em, idade, etnia, civil, renda, religiao, cidade, respostas FROM respostas ORDER BY id");
    const header = ["id","criado_em","idade","etnia","civil","renda","religiao","cidade", ...QUESTIONS];
    const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((row) => {
      const answers = typeof row.respostas === "string" ? JSON.parse(row.respostas) : row.respostas;
      return [row.id, row.criado_em.toISOString(), row.idade, row.etnia, row.civil,
              row.renda, row.religiao, row.cidade,
              ...QUESTIONS.map((q) => answers[q] ?? "")].map(quote).join(",");
    }).join("\n");
    res.set("Content-Type", "text/csv; charset=utf-8")
       .set("Content-Disposition", `attachment; filename="respostas-${new Date().toISOString().slice(0,10)}.csv"`)
       // BOM para o Excel abrir acentuação corretamente.
       .send("﻿" + header.map(quote).join(",") + "\n" + body);
  });

  /* ---------------- páginas ---------------- */

  const page = (file) => (_req, res) => res.sendFile(path.join(HERE, "web", file));

  app.get("/pesquisa", page("form.html"));
  app.get("/pesquisa/painel", page("dashboard.html"));

  // A landing page assumiu a raiz. Estes caminhos já foram distribuídos em
  // conversa e em papel, então continuam funcionando.
  app.get(["/admin", "/painel"], (_req, res) => res.redirect(301, "/pesquisa/painel"));
  app.get("/questionario", (_req, res) => res.redirect(301, "/pesquisa"));

  app.use("/pesquisa/assets", express.static(path.join(HERE, "web", "assets")));

  log.info(db ? "no ar" : "sem banco; respondendo 503");
}
