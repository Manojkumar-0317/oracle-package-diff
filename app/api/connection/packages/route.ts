import "server-only";
import { NextResponse } from "next/server";
import { parseOracleConnectionString } from "@/lib/connection-string";
import { listPackages } from "@/lib/oracle";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { connectionString?: string; owner?: string };
    if (!body.connectionString) {
      return NextResponse.json({ error: "connectionString is required." }, { status: 400 });
    }

    const parsed = parseOracleConnectionString(body.connectionString);
    const packages = await listPackages(parsed, body.owner);

    return NextResponse.json({ packages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
