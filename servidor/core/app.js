/**
 * The Express instance every module mounts onto.
 *
 * Knows nothing about surveys, alerts or the marketing site. Anything added
 * here applies to all three, which is the test for whether it belongs here.
 */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // The VPS runs this behind nginx; without it req.ip is the proxy for everyone.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "64kb" }));

  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    // Guardian links carry a token in the URL. no-referrer is what keeps that
    // token from travelling to any third party the page happens to link to.
    res.set("Referrer-Policy", "no-referrer");
    res.set("X-Frame-Options", "DENY");
    next();
  });

  // Assets the three interfaces genuinely share: colour tokens and a handful
  // of helpers. Everything else stays inside its own module.
  app.use("/shared", express.static(path.join(ROOT, "shared", "web"), {
    maxAge: "1h",
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff")
  }));

  return app;
}
