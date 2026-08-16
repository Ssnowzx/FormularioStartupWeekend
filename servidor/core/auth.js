/**
 * Who is logged in, and to which of the two products.
 *
 * The researcher reading field answers and the operator dispatching help to a
 * woman's address are different people with different exposure. They used to
 * share one password; they no longer do. A researcher session cannot reach a
 * victim's location, and an operator session cannot read the survey.
 *
 * Sessions live in memory on purpose: restarting the process signs everyone
 * out, and nothing about who was logged in survives on disk.
 */

import crypto from "node:crypto";

const SESSION_MS = 8 * 60 * 60 * 1000;
const SWEEP_MS = 10 * 60 * 1000;
const COOKIE = "session";
const MIN_PASSWORD = 12;

export const ROLES = { RESEARCHER: "researcher", OPERATOR: "operator" };

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

/** Constant-time comparison, length-checked first. */
function same(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Reads one role's credentials, falling back to the old shared ADMIN_* pair so
 * an existing deployment keeps working through the transition.
 */
function accountFor(role, envPrefix, log) {
  const user = process.env[`${envPrefix}_USER`];
  const password = process.env[`${envPrefix}_PASSWORD`];
  if (password) return { role, user: user || role, password };

  const legacyUser = process.env.ADMIN_USER;
  const legacyPassword = process.env.ADMIN_PASSWORD;
  if (legacyPassword) {
    log.warn(`${envPrefix}_PASSWORD ausente; usando ADMIN_PASSWORD para ${role}. ` +
             "Defina credenciais separadas: os dois papéis veem dados muito diferentes.");
    return { role, user: legacyUser || "admin", password: legacyPassword };
  }
  return null;
}

export function createAuth({ production, log }) {
  const accounts = [
    accountFor(ROLES.RESEARCHER, "RESEARCHER", log),
    accountFor(ROLES.OPERATOR, "OPERATOR", log)
  ].filter(Boolean);

  if (!accounts.length) {
    log.error("Nenhuma credencial definida. Preencha RESEARCHER_PASSWORD e OPERATOR_PASSWORD. Encerrando.");
    process.exit(1);
  }
  const weak = accounts.find((a) => a.password.length < MIN_PASSWORD);
  if (weak) {
    log.error(`A senha de ${weak.role} tem menos de ${MIN_PASSWORD} caracteres. Encerrando.`);
    process.exit(1);
  }

  const sessions = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) if (session.expires < now) sessions.delete(id);
  }, SWEEP_MS).unref?.();

  /** The role behind this request, or null. */
  function roleOf(req) {
    const id = readCookie(req, COOKIE);
    if (!id) return null;
    const session = sessions.get(id);
    if (!session || session.expires < Date.now()) {
      sessions.delete(id);
      return null;
    }
    return session.role;
  }

  /**
   * 401 when nobody is logged in, 403 when the wrong product is asking.
   * The distinction matters: the browser should offer a login for one and
   * never for the other.
   */
  function requireRole(...allowed) {
    return (req, res, next) => {
      const role = roleOf(req);
      if (!role) return res.status(401).json({ ok: false, erro: "Sessão expirada. Entre de novo." });
      if (!allowed.includes(role)) return res.status(403).json({ ok: false, erro: "Sem permissão para esta área." });
      req.role = role;
      next();
    };
  }

  function mount(app, limits) {
    app.post("/api/auth/login", (req, res) => {
      if (limits.exceeded("login", req, 8)) {
        return res.status(429).json({ ok: false, erro: "Muitas tentativas. Espere alguns minutos." });
      }
      const { usuario = "", senha = "" } = req.body || {};
      // Every candidate is checked so a wrong username and a wrong password
      // cost the same time.
      const matched = accounts.filter((a) => same(usuario, a.user) && same(senha, a.password));
      if (!matched.length) return res.status(401).json({ ok: false, erro: "Usuário ou senha incorretos." });

      const id = crypto.randomBytes(32).toString("hex");
      sessions.set(id, { role: matched[0].role, expires: Date.now() + SESSION_MS });
      res.set("Set-Cookie",
        `${COOKIE}=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}` +
        (production ? "; Secure" : ""));
      res.json({ ok: true, role: matched[0].role });
    });

    app.post("/api/auth/logout", (req, res) => {
      const id = readCookie(req, COOKIE);
      if (id) sessions.delete(id);
      res.set("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
      res.json({ ok: true });
    });

    app.get("/api/auth/session", (req, res) => {
      const role = roleOf(req);
      res.json({ ok: Boolean(role), role });
    });
  }

  return { mount, requireRole, roleOf };
}
