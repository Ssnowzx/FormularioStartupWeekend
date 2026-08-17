/**
 * As telas deste módulo.
 *
 * Cada arquivo é servido por rota nomeada, não por express.static sobre uma
 * pasta comum. É o que impede o console de despacho de acabar acessível por
 * adivinhação de nome de arquivo a partir de outro produto.
 *
 * `/anjo/:token` saiu em 16/08/2026 junto com a rede de Anjos.
 */

import path from "node:path";
import { ROLES } from "../../core/auth.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);

export function registrarPaginas({ app, roleOf, MODO_DEMO }) {
  const pagina = (arquivo) => (_req, res) =>
    res.set("Cache-Control", "no-store").sendFile(path.join(HERE, "web", arquivo));

  app.get("/central", pagina("console.html"));
  app.get("/cadastro", pagina("enroll.html"));

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
    // Mesmo em modo demo, o simulador só abre para a operadora: é ferramenta
    // de teste do produto, não uma porta aberta.
    if (roleOf(req) !== ROLES.OPERATOR) return res.redirect("/central");
    pagina("simulator.html")(req, res);
  });
}
