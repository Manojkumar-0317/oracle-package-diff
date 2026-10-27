import "server-only";
import oracledb from "oracledb";
import type { PackageSource, PackageSummary, ParsedOracleConnection } from "./types";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const EXECUTE_TIMEOUT_MS = 15000;

const ORA_ERROR_MESSAGES: Record<string, string> = {
  "ORA-01017": "Invalid username or password.",
  "ORA-12541": "Could not reach the database — no listener at that host/port.",
  "ORA-12170": "Connection timed out — check host/port and network/VPN access.",
  "ORA-12514":
    "Service name or SID not recognized by the listener — check the connect descriptor.",
  "ORA-12154": "Could not resolve the connect descriptor.",
};

function friendlyOracleError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const code = /ORA-\d{5}/.exec(message)?.[0];
  if (code && ORA_ERROR_MESSAGES[code]) {
    return new Error(ORA_ERROR_MESSAGES[code]);
  }
  return new Error(message);
}

async function withConnection<T>(
  conn: ParsedOracleConnection,
  fn: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await oracledb.getConnection({
      user: conn.user,
      password: conn.password,
      connectString: conn.connectString,
    });
    connection.callTimeout = EXECUTE_TIMEOUT_MS;
    return await fn(connection);
  } catch (err) {
    throw friendlyOracleError(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {
        // ignore close errors
      }
    }
  }
}

export async function listPackages(
  conn: ParsedOracleConnection,
  owner?: string
): Promise<PackageSummary[]> {
  return withConnection(conn, async (connection) => {
    const sql = owner
      ? `SELECT DISTINCT TYPE, NAME FROM ALL_SOURCE WHERE OWNER = :owner AND TYPE IN ('PACKAGE', 'PACKAGE BODY') ORDER BY NAME`
      : `SELECT DISTINCT TYPE, NAME FROM USER_SOURCE WHERE TYPE IN ('PACKAGE', 'PACKAGE BODY') ORDER BY NAME`;
    const binds = owner ? { owner: owner.toUpperCase() } : {};

    const result = await connection.execute<{ TYPE: string; NAME: string }>(sql, binds);

    const byName = new Map<string, PackageSummary>();
    for (const row of result.rows ?? []) {
      const existing = byName.get(row.NAME) ?? {
        name: row.NAME,
        hasSpec: false,
        hasBody: false,
      };
      if (row.TYPE === "PACKAGE") existing.hasSpec = true;
      if (row.TYPE === "PACKAGE BODY") existing.hasBody = true;
      byName.set(row.NAME, existing);
    }

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function fetchPackageSource(
  conn: ParsedOracleConnection,
  name: string,
  owner?: string
): Promise<PackageSource> {
  return withConnection(conn, async (connection) => {
    const sql = owner
      ? `SELECT TYPE, LINE, TEXT FROM ALL_SOURCE WHERE OWNER = :owner AND NAME = :name AND TYPE IN ('PACKAGE', 'PACKAGE BODY') ORDER BY TYPE, LINE`
      : `SELECT TYPE, LINE, TEXT FROM USER_SOURCE WHERE NAME = :name AND TYPE IN ('PACKAGE', 'PACKAGE BODY') ORDER BY TYPE, LINE`;
    const binds = owner
      ? { owner: owner.toUpperCase(), name: name.toUpperCase() }
      : { name: name.toUpperCase() };

    const result = await connection.execute<{ TYPE: string; LINE: number; TEXT: string }>(
      sql,
      binds
    );

    const specLines: string[] = [];
    const bodyLines: string[] = [];
    for (const row of result.rows ?? []) {
      const target = row.TYPE === "PACKAGE BODY" ? bodyLines : specLines;
      target.push(row.TEXT.endsWith("\n") ? row.TEXT : row.TEXT + "\n");
    }

    return {
      name: name.toUpperCase(),
      specSource: specLines.length > 0 ? specLines.join("").trimEnd() : null,
      bodySource: bodyLines.length > 0 ? bodyLines.join("").trimEnd() : null,
    };
  });
}
