/**
 * Landing page comercial.
 *
 * A identidade institucional do produto: é aqui que ele se apresenta a uma
 * Secretaria de Segurança, à imprensa e a um júri. Nada a ver com a interface
 * neutra que roda no celular da usuária — `docs/identidade-visual.md` chama
 * isso de regra das duas identidades, e ela vale literalmente: uma página
 * bonita com mulheres ilustradas convence um comprador público; a mesma
 * estética no ícone do celular dela pode ser motivo de agressão.
 *
 * Este módulo não recebe pool de banco nem middleware de sessão. Não vaza
 * porque não tem o que vazar.
 */

import express from "express";
import path from "node:path";
import { createLog } from "../../core/log.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const log = createLog("site");

export function mount(app) {
  app.get("/", (_req, res) =>
    res.sendFile(path.join(HERE, "web", "index.html")));

  app.use("/site", express.static(path.join(HERE, "web"), {
    maxAge: "1h",
    // Sem index automático: a raiz é servida por rota nomeada acima, e nada
    // mais nesta pasta deve ser alcançável por adivinhação de nome.
    index: false
  }));

  log.info("no ar em /");
}
