/**
 * Logging that cannot leak a credential.
 *
 * mysql2 puts the SQL — and sometimes the parameters — into error messages,
 * which is exactly how a device token or a session id ends up in journalctl.
 * Everything this project logs goes through here first.
 */

/** Any long opaque run of characters is treated as a secret. */
const SECRET = /[A-Za-z0-9_-]{24,}/g;

export const redact = (value) => String(value).replace(SECRET, "«oculto»");

export function createLog(scope) {
  const tag = `[${scope}]`;
  return {
    info: (message) => console.log(tag, redact(message)),
    warn: (message) => console.warn(tag, redact(message)),
    /** Takes a message, never an Error object: stacks carry query text. */
    error: (message) => console.error(tag, redact(message))
  };
}
