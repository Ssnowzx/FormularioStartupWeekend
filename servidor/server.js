/**
 * Mulheres em Risco — servidor da pesquisa de campo.
 *
 * Serve o formulário público, grava as respostas no MariaDB e expõe um
 * painel administrativo com login.
 *
 * Privacidade: nenhuma rota grava IP, user-agent ou identificador junto da
 * resposta. O limite de envios e o limite de tentativas de login usam um
 * hash do IP com sal que troca a cada hora, mantido só em memória — o
 * suficiente para barrar robô, insuficiente para identificar alguém depois.
 */

import express from "express";
import mysql from "mysql2/promise";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORT || 3000);
const ADMIN_USUARIO = process.env.ADMIN_USER || "admin";
const ADMIN_SENHA = process.env.ADMIN_PASSWORD || "";
const EM_PRODUCAO = process.env.NODE_ENV === "production";

if (!ADMIN_SENHA || ADMIN_SENHA.length < 12) {
  console.error("Defina ADMIN_PASSWORD no .env com pelo menos 12 caracteres. Encerrando.");
  process.exit(1);
}

const bd = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "mer_app",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mulheres_em_risco",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4_unicode_ci"
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));

app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
  res.set("X-Frame-Options", "DENY");
  next();
});

/* ---------------- contadores em memória, sem guardar IP ---------------- */

let sal = crypto.randomBytes(16).toString("hex");
const envios = new Map();
const tentativas = new Map();

setInterval(() => {
  sal = crypto.randomBytes(16).toString("hex");
  envios.clear();
  tentativas.clear();
}, 60 * 60 * 1000);

function marca(req) {
  return crypto.createHash("sha256").update(sal + (req.ip || "")).digest("hex").slice(0, 24);
}
function excedeu(mapa, req, limite) {
  const k = marca(req);
  const n = (mapa.get(k) || 0) + 1;
  mapa.set(k, n);
  return n > limite;
}

/* ---------------- sessões ---------------- */

const SESSAO_DURACAO = 8 * 60 * 60 * 1000; // 8 horas
const sessoes = new Map();

setInterval(() => {
  const agora = Date.now();
  for (const [id, expira] of sessoes) if (expira < agora) sessoes.delete(id);
}, 10 * 60 * 1000);

function lerCookie(req, nome) {
  const bruto = req.headers.cookie || "";
  for (const parte of bruto.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
  return null;
}

function autenticado(req) {
  const id = lerCookie(req, "sessao");
  if (!id) return false;
  const expira = sessoes.get(id);
  if (!expira || expira < Date.now()) { sessoes.delete(id); return false; }
  return true;
}

function exigirLogin(req, res, next) {
  if (autenticado(req)) return next();
  res.status(401).json({ ok: false, erro: "Sessão expirada. Entre de novo." });
}

function iguais(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

app.post("/api/login", (req, res) => {
  if (excedeu(tentativas, req, 8)) {
    return res.status(429).json({ ok: false, erro: "Muitas tentativas. Espere alguns minutos." });
  }
  const { usuario = "", senha = "" } = req.body || {};
  if (!iguais(usuario, ADMIN_USUARIO) || !iguais(senha, ADMIN_SENHA)) {
    return res.status(401).json({ ok: false, erro: "Usuário ou senha incorretos." });
  }
  const id = crypto.randomBytes(32).toString("hex");
  sessoes.set(id, Date.now() + SESSAO_DURACAO);
  res.set("Set-Cookie",
    `sessao=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSAO_DURACAO / 1000}` +
    (EM_PRODUCAO ? "; Secure" : ""));
  res.json({ ok: true });
});

app.post("/api/sair", (req, res) => {
  const id = lerCookie(req, "sessao");
  if (id) sessoes.delete(id);
  res.set("Set-Cookie", "sessao=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/sessao", (req, res) => res.json({ ok: autenticado(req) }));

/* ---------------- formulário público ---------------- */

const PERFIL = {
  idade:    ["Até 17", "18 a 24", "25 a 39", "40 a 59", "60 ou mais", "Prefiro não dizer"],
  etnia:    ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Prefiro não dizer"],
  civil:    ["Solteira", "Casada ou em união estável", "Separada ou divorciada", "Viúva", "Prefiro não dizer"],
  renda:    ["Sem renda própria", "Até 1 salário mínimo", "1 a 2 salários", "2 a 5 salários", "Mais de 5 salários", "Prefiro não dizer"],
  religiao: ["Católica", "Evangélica", "Espírita", "Umbanda ou Candomblé", "Outra", "Não tenho religião", "Prefiro não dizer"]
};

const PERGUNTAS = ["p1","p2","p3","p4","p5","p6","p7","p8","p10","p11","p12","p13","p14","p15","p16","p17","p18","p19"];

const texto = (v, max) => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
};

function limpar(corpo) {
  const perfil = {};
  for (const campo of Object.keys(PERFIL)) {
    const v = texto(corpo?.dm?.[campo], 64);
    perfil[campo] = v && PERFIL[campo].includes(v) ? v : null;
  }
  perfil.cidade = texto(corpo?.dm?.cidade, 80);

  const respostas = {};
  for (const id of PERGUNTAS) {
    const v = texto(corpo?.r?.[id], 2000);
    if (v) respostas[id] = v;
  }
  return { perfil, respostas };
}

app.post("/api/responder", async (req, res) => {
  try {
    if (texto(req.body?.website, 200)) return res.json({ ok: true }); // campo-armadilha
    if (excedeu(envios, req, 12)) {
      return res.status(429).json({ ok: false, erro: "Muitos envios. Tente daqui a pouco." });
    }
    const { perfil, respostas } = limpar(req.body);
    if (!Object.keys(respostas).length) {
      return res.status(400).json({ ok: false, erro: "Responda ao menos uma pergunta." });
    }
    await bd.execute(
      `INSERT INTO respostas (idade, etnia, civil, renda, religiao, cidade, respostas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [perfil.idade, perfil.etnia, perfil.civil, perfil.renda, perfil.religiao,
       perfil.cidade, JSON.stringify(respostas)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("falha ao gravar:", e.message);
    res.status(500).json({ ok: false, erro: "Não conseguimos salvar agora. Tente de novo." });
  }
});

/* ---------------- dados do painel ---------------- */

app.get("/api/resultados", exigirLogin, async (_req, res) => {
  try {
    const [[resumo]] = await bd.query(`
      SELECT COUNT(*) total,
             SUM(DATE(criado_em) = CURDATE()) hoje,
             SUM(criado_em >= NOW() - INTERVAL 1 HOUR) ultima_hora,
             MAX(criado_em) ultima
        FROM respostas`);

    const perfil = {};
    for (const campo of ["idade", "etnia", "civil", "renda", "religiao", "cidade"]) {
      const [linhas] = await bd.query(
        `SELECT ${campo} valor, COUNT(*) n FROM respostas
          WHERE ${campo} IS NOT NULL AND ${campo} <> ''
          GROUP BY ${campo} ORDER BY n DESC`);
      perfil[campo] = linhas;
    }

    const [porDia] = await bd.query(`
      SELECT DATE(criado_em) dia, COUNT(*) n FROM respostas
       GROUP BY DATE(criado_em) ORDER BY dia DESC LIMIT 14`);

    const [linhas] = await bd.query(
      "SELECT criado_em, respostas FROM respostas ORDER BY id DESC LIMIT 3000");

    res.json({
      total: Number(resumo.total) || 0,
      hoje: Number(resumo.hoje) || 0,
      ultimaHora: Number(resumo.ultima_hora) || 0,
      ultima: resumo.ultima,
      perfil, porDia,
      respostas: linhas
    });
  } catch (e) {
    console.error("falha ao ler:", e.message);
    res.status(500).json({ ok: false, erro: "Falha ao carregar os dados." });
  }
});

app.get("/api/exportar.csv", async (req, res) => {
  if (!autenticado(req)) return res.status(401).send("Entre no painel primeiro.");
  const [linhas] = await bd.query(
    "SELECT id, criado_em, idade, etnia, civil, renda, religiao, cidade, respostas FROM respostas ORDER BY id");
  const cabecalho = ["id","criado_em","idade","etnia","civil","renda","religiao","cidade", ...PERGUNTAS];
  const escapar = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const corpo = linhas.map((l) => {
    const r = typeof l.respostas === "string" ? JSON.parse(l.respostas) : l.respostas;
    return [l.id, l.criado_em.toISOString(), l.idade, l.etnia, l.civil, l.renda, l.religiao, l.cidade,
            ...PERGUNTAS.map((p) => r[p] ?? "")].map(escapar).join(",");
  }).join("\n");
  res.set("Content-Type", "text/csv; charset=utf-8")
     .set("Content-Disposition", `attachment; filename="respostas-${new Date().toISOString().slice(0,10)}.csv"`)
     .send("﻿" + cabecalho.map(escapar).join(",") + "\n" + corpo);
});

/* ---------------- páginas ---------------- */

app.get(["/admin", "/painel"], (_req, res) => res.sendFile(path.join(DIR, "publico", "admin.html")));
app.use(express.static(path.join(DIR, "publico"), { extensions: ["html"], index: "index.html" }));

app.listen(PORTA, () => console.log(`Pesquisa no ar na porta ${PORTA}`));
