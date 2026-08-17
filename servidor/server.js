/**
 * Mulheres em Risco — bootstrap.
 *
 * Este arquivo não tem lógica de negócio. Ele monta três produtos sobre um
 * núcleo comum e sobe o processo:
 *
 *   site     landing page comercial, pública, sem banco e sem sessão
 *   survey   formulários de campo e o dashboard da pesquisa
 *   alert    o sistema do produto: aparelho e central
 *
 * Os módulos não se conhecem. Cada um recebe o núcleo, é dono do próprio
 * prefixo de URL, do próprio schema e do próprio usuário de banco. Para
 * desligar um deles, comente uma linha aqui embaixo — os outros dois seguem
 * no ar.
 *
 * A ordem importa: o site fica por último a reclamar a raiz, e os módulos com
 * rota curinga precisam vir antes de qualquer estático.
 */

import { createApp } from "./core/app.js";
import { createAuth } from "./core/auth.js";
import { createLimits } from "./core/limits.js";
import { createLog } from "./core/log.js";

import * as site from "./modules/site/index.js";
import * as survey from "./modules/survey/index.js";
import * as alert from "./modules/alert/index.js";

const PORT = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === "production";
const log = createLog("servidor");

const app = createApp();
const limits = createLimits();
const auth = createAuth({ production, log });

auth.mount(app, limits);

const core = {
  requireRole: auth.requireRole,
  roleOf: auth.roleOf,
  limits,
  production
};

survey.mount(app, core);
alert.mount(app, core);
site.mount(app, core);

app.use((_req, res) => res.status(404).sendFile(new URL("./modules/site/web/404.html", import.meta.url).pathname));

const server = app.listen(PORT, () => log.info(`no ar na porta ${PORT}`));

// EADDRINUSE às quatro da manhã merece uma frase, não um stack trace.
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    log.error(`a porta ${PORT} já está em uso. Pare o outro processo ou mude PORT no .env.`);
    process.exit(1);
  }
  throw e;
});
