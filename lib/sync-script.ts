import type { PackageSource } from "./types";

function ensureTerminated(sql: string): string {
  const trimmed = sql.trimEnd();
  return trimmed.endsWith(";") ? trimmed : trimmed + ";";
}

/**
 * Builds a ready-to-run CREATE OR REPLACE sync script that recreates
 * `target`'s package spec/body — Oracle packages are always replaced
 * wholesale, so "syncing" A -> B means emitting B's full source.
 */
export function generateSyncScript(
  target: PackageSource,
  labels: { source: string; target: string }
): string {
  const timestamp = new Date().toISOString();
  const header = [
    `-- Sync script for package ${target.name}`,
    `-- Source: ${labels.source}`,
    `-- Target: ${labels.target}`,
    `-- Generated: ${timestamp}`,
    "",
  ].join("\n");

  const parts: string[] = [header];

  if (target.specSource) {
    parts.push(ensureTerminated(target.specSource), "/", "");
  }
  if (target.bodySource) {
    parts.push(ensureTerminated(target.bodySource), "/", "");
  }

  return parts.join("\n");
}
