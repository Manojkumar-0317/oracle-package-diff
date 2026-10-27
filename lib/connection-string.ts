import type { ParsedOracleConnection } from "./types";

/**
 * Parses an ADO.NET/ODP.NET-style Oracle connection string, e.g.:
 *   User Id=myuser;Data Source=(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)
 *   (HOST=host.company.com)(PORT=1521)))(CONNECT_DATA=(SERVER=DEDICATED)(SID=HZDB3)));Password=mypass;
 *
 * Keys are matched case-insensitively. When a key repeats, the last
 * non-empty occurrence wins (matching ADO.NET semantics). The Data Source
 * value is a full TNS descriptor using parentheses, not semicolons, so a
 * plain split on ';' is safe.
 */
export function parseOracleConnectionString(raw: string): ParsedOracleConnection {
  const values: { user?: string; password?: string; connectString?: string } = {};

  for (const segment of raw.split(";")) {
    const eqIdx = segment.indexOf("=");
    if (eqIdx === -1) continue;

    const key = segment.slice(0, eqIdx).trim().toLowerCase();
    const value = segment.slice(eqIdx + 1).trim();
    if (!value) continue;

    if (key === "user id" || key === "uid") values.user = value;
    else if (key === "password" || key === "pwd") values.password = value;
    else if (key === "data source" || key === "server") values.connectString = value;
  }

  if (!values.user || !values.connectString) {
    throw new Error(
      "Connection string must include a User Id and a Data Source (connect descriptor)."
    );
  }

  return {
    user: values.user,
    password: values.password ?? "",
    connectString: values.connectString,
  };
}
