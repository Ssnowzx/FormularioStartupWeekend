/**
 * Mulheres em Risco — servidor da pesquisa de campo.
 *
 * Serve o formulário, grava as respostas no MariaDB e expõe um painel de
 * resultados protegido por senha.
 *
 * Privacidade: nenhuma rota grava IP, user-agent ou cookie. O limite de
 * envios usa um hash do IP com sal que troca a cada hora, mantido só em
 * memória — o suficiente para barrar robô, insuficiente para identificar
 * alguém depois.
 */

import express from "express";
import mysql from "mysql2/promise";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORT || 3000);
const SENHA_PAINEL = process.env.ADMIN_PASSWORD || "";

if (!SENHA_PAINEL) {
  console.error("Defina ADMIN_PASSWORD no .env antes de subir. Encerrando.");
  process.exit(1);
}

const bd = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "mer_app",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mulheres_em_risco",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4_unicode_ci"
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // atrás do nginx
app.use(express.json({ limit: "64kb" }));

/* ---------------- limite de envio, sem guardar IP ---------------- */

let sal = crypto.randomBytes(16).toString("hex");
setInterval(() => { sal = crypto.randomBytes(16).toString("hex"); contagem.clear(); }, 60 * 60 * 1000);
const contagem = new Map();

function excedeu(req) {
  const bruto = req.ip || "";
  const chave = crypto.createHash("sha256").update(sal + bruto).digest("hex").slice(0, 24);
  const n = (contagem.get(chave) || 0) + 1;
  contagem.set(chave, n);
  return n > 12; // 12 envios por hora por origem
}

/* ---------------- validação ---------------- */

const PERFIL = {
  idade:    ["Até 17", "18 a 24", "25 a 39", "40 a 59", "60 ou mais", "Prefiro não dizer"],
  etnia:    ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Prefiro não dizer"],
  civil:    ["Solteira", "Casada ou em união estável", "Separada ou divorciada", "Viúva", "Prefiro não dizer"],
  renda:    ["Sem renda própria", "Até 1 salário mínimo", "1 a 2 salários", "2 a 5 salários", "Mais de 5 salários", "Prefiro não dizer"],
  religiao: ["Católica", "Evangélica", "Espírita", "Umbanda ou Candomblé", "Outra", "Não tenho religião", "Prefiro não dizer"]
};

const PERGUNTAS = ["p1","p2","p3","p4","p5","p6","p7","p8","p10","p11","p12","p13","p14","p15","p16","p17","p18","p19"];

function texto(v, max) {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

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

/* ---------------- rotas ---------------- */

app.post("/api/responder", async (req, res) => {
  try {
    // Campo-armadilha: humano nunca preenche, robô preenche quase sempre.
    if (texto(req.body?.website, 200)) return res.json({ ok: true });

    if (excedeu(req)) {
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

function exigirSenha(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, dados] = cabecalho.split(" ");
  if (tipo === "Basic" && dados) {
    const [, senha = ""] = Buffer.from(dados, "base64").toString("utf8").split(":");
    const a = Buffer.from(senha), b = Buffer.from(SENHA_PAINEL);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Painel"').status(401).send("Acesso restrito.");
}

app.get("/api/resultados", exigirSenha, async (_req, res) => {
  const [[{ total }]] = await bd.query("SELECT COUNT(*) total FROM respostas");
  const perfil = {};
  for (const campo of ["idade", "etnia", "civil", "renda", "religiao", "cidade"]) {
    const [linhas] = await bd.query(
      `SELECT ${campo} valor, COUNT(*) n FROM respostas
        WHERE ${campo} IS NOT NULL GROUP BY ${campo} ORDER BY n DESC`);
    perfil[campo] = linhas;
  }
  const [linhas] = await bd.query(
    "SELECT criado_em, respostas FROM respostas ORDER BY id DESC LIMIT 2000");
  res.json({ total, perfil, respostas: linhas });
});

app.get("/api/exportar.csv", exigirSenha, async (_req, res) => {
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
     .set("Content-Disposition", 'attachment; filename="respostas.csv"')
     .send("﻿" + cabecalho.map(escapar).join(",") + "\n" + corpo);
});

app.get("/painel", exigirSenha, (_req, res) => res.sendFile(path.join(DIR, "publico", "painel.html")));
app.use(express.static(path.join(DIR, "publico"), { extensions: ["html"] }));

app.listen(PORTA, () => console.log(`Pesquisa no ar na porta ${PORTA}`));
