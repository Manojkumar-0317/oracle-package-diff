import type { PackageSource } from "./types";

function baseName(fileName: string): string {
  const withoutPath = fileName.split(/[/\\]/).pop() ?? fileName;
  const dot = withoutPath.lastIndexOf(".");
  return dot > 0 ? withoutPath.slice(0, dot) : withoutPath;
}

/**
 * Parses an uploaded SQL file for comparison. Any SQL file is accepted as-is
 * (not just CREATE OR REPLACE PACKAGE sources) — the whole file content is
 * used as the diffable "spec" side, with no body side.
 */
export function parsePackageFile(originalSql: string, fileName: string): PackageSource {
  return {
    name: baseName(fileName),
    specSource: originalSql.trim(),
    bodySource: null,
  };
}
