import { createTwoFilesPatch } from "diff";
import type { PackageSource } from "./types";

function patchSection(
  label: string,
  packageName: string,
  a: string | null,
  b: string | null,
  fileLabelA: string,
  fileLabelB: string
): string | null {
  const aText = a ?? "";
  const bText = b ?? "";
  if (aText === bText) return null;
  return createTwoFilesPatch(
    `${fileLabelA}/${packageName}.${label}.sql`,
    `${fileLabelB}/${packageName}.${label}.sql`,
    aText,
    bText
  );
}

export function buildUnifiedPatch(
  a: PackageSource,
  b: PackageSource,
  fileLabelA: string,
  fileLabelB: string
): string {
  const sections = [
    patchSection("spec", a.name, a.specSource, b.specSource, fileLabelA, fileLabelB),
    patchSection("body", a.name, a.bodySource, b.bodySource, fileLabelA, fileLabelB),
  ].filter((s): s is string => s !== null);

  return sections.length > 0 ? sections.join("\n") : "No differences found.\n";
}

export function buildSqlDiffDocument(
  a: PackageSource,
  b: PackageSource,
  fileLabelA: string,
  fileLabelB: string
): string {
  const timestamp = new Date().toISOString();
  const header = [
    `-- Diff: ${a.name}`,
    `-- A: ${fileLabelA}`,
    `-- B: ${fileLabelB}`,
    `-- Generated: ${timestamp}`,
    "",
  ].join("\n");

  const patch = buildUnifiedPatch(a, b, fileLabelA, fileLabelB);
  return `${header}\n/*\n${patch}\n*/\n`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
