/**
 * Constantes e utilidades internas do módulo de alertas.
 *
 * Nada aqui sai para outros módulos: é vocabulário deste produto. O que for
 * genuinamente comum às três áreas mora em core/ ou shared/.
 */

import crypto from "node:crypto";

export const JANELA_CANCELAMENTO_MS = 15 * 1000;
export const VALIDADE_CONVITE_MS = 24 * 60 * 60 * 1000;
export const MAX_OUVINTES = 20;
export const HEARTBEAT_MS = 15 * 1000;

// Sem 0/O/1/I/L: o código é lido em voz alta e digitado à mão numa delegacia.
export const ALFABETO_CONVITE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const STATUS_VALIDOS = ["open", "in_progress", "resolved", "cancelled"];

/* Quem a central manda. O rótulo aparece na linha do tempo e no relatório —
   é o que responde "o que vocês fizeram" numa prestação de contas. */
export const DESPACHOS = {
  patrol:   "Viatura de pronta resposta",
  police:   "Polícia Militar pelo 190",
  call:     "Ligação para ela",
  presence: "Equipe a caminho"
};

/* Como a ocorrência terminou. Sem isto, "resolvido" não diz nada a quem lê o
   relatório seis meses depois. */
export const DESFECHOS = {
  attended:    "Atendida no local",
  safe:        "Contato feito, ela está segura",
  no_contact:  "Sem contato com ela",
  false_alarm: "Falso alarme",
  duplicate:   "Ocorrência repetida"
};

/* ---------------- utilidades ---------------- */

export const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");

/**
 * Remove qualquer sequência longa que pareça token antes de ir para o log.
 * O mysql2 inclui o SQL e às vezes os parâmetros na mensagem de erro — é por
 * aí que um token vazaria para o journalctl.
 */
export const semSegredo = (v) => String(v).replace(/[A-Za-z0-9_-]{24,}/g, "«token»");

export const texto = (v, max) => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
};

export const numero = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Telefone brasileiro para E.164 sem o "+", que é o formato que o wa.me aceita. */
export function paraE164(bruto) {
  const so = String(bruto ?? "").replace(/\D/g, "");
  if (!so) return null;
  if (so.startsWith("55") && so.length >= 12 && so.length <= 13) return so;
  if (so.length === 10 || so.length === 11) return "55" + so;
  return so.length >= 8 && so.length <= 15 ? so : null;
}

export function gerarConvite() {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (const b of bytes) s += ALFABETO_CONVITE[b % ALFABETO_CONVITE.length];
  return s;
}

export const normalizarConvite = (v) =>
  String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
