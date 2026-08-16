/**
 * Request limits that do not remember who anyone is.
 *
 * The counter key is a hash of the address with a salt that is thrown away
 * every hour, held only in memory. Enough to stop a script, useless for
 * identifying anyone afterwards — which is the whole point in a project about
 * women reporting violence.
 */

import crypto from "node:crypto";

const ROTATION_MS = 60 * 60 * 1000;

export function createLimits() {
  let salt = crypto.randomBytes(16).toString("hex");
  const buckets = new Map();

  // Rotating the salt and clearing the counters are the same act: an old count
  // keyed by an old salt is unreachable anyway.
  setInterval(() => {
    salt = crypto.randomBytes(16).toString("hex");
    buckets.clear();
  }, ROTATION_MS).unref?.();

  const mark = (req) =>
    crypto.createHash("sha256").update(salt + (req.ip || "")).digest("hex").slice(0, 24);

  /** True when this caller has gone past `max` in the current hour. */
  function exceeded(name, req, max) {
    const key = `${name}:${mark(req)}`;
    const count = (buckets.get(key) || 0) + 1;
    buckets.set(key, count);
    return count > max;
  }

  /** Same budget, keyed by something the caller already proved it owns. */
  function exceededFor(name, id, max) {
    const key = `${name}:id:${id}`;
    const count = (buckets.get(key) || 0) + 1;
    buckets.set(key, count);
    return count > max;
  }

  return { exceeded, exceededFor };
}
