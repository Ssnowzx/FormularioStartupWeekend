/**
 * Database pools.
 *
 * Every module gets its own pool with its own credentials. This is not
 * ceremony: the survey user and the alert user have disjoint grants, so a
 * module physically cannot read the other module's tables even if some future
 * bug asks it to. The boundary already exists in the database — this keeps the
 * code from quietly routing around it.
 */

import mysql from "mysql2/promise";

export function createPool({ user, password, log }) {
  if (!password) {
    log?.warn(`sem senha para o usuário ${user}; este módulo vai responder 503`);
    return null;
  }
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user,
    password,
    database: process.env.DB_NAME || "mulheres_em_risco",
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4_unicode_ci"
  });
}
