import "server-only";
import { NextResponse } from "next/server";
import { parseOracleConnectionString } from "@/lib/connection-string";
import { fetchPackageSource } from "@/lib/oracle";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      connectionString?: string;
      owner?: string;
      packageName?: string;
    };
    if (!body.connectionString || !body.packageName) {
      return NextResponse.json(
        { error: "connectionString and packageName are required." },
        { status: 400 }
      );
    }

    const parsed = parseOracleConnectionString(body.connectionString);
    const source = await fetchPackageSource(parsed, body.packageName, body.owner);

    return NextResponse.json({ source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
