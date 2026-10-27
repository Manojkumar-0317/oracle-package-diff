"use client";

import { useMemo } from "react";
import type { PackageSource } from "@/lib/types";
import { buildSqlDiffDocument, buildUnifiedPatch, downloadTextFile } from "@/lib/export";
import { generateSyncScript } from "@/lib/sync-script";
import { DiffPane } from "./diff-pane";

export function DiffResultsView({
  a,
  b,
  labelA,
  labelB,
}: {
  a: PackageSource;
  b: PackageSource;
  labelA: string;
  labelB: string;
}) {
  const identical = useMemo(
    () => a.specSource === b.specSource && a.bodySource === b.bodySource,
    [a, b]
  );

  function handleDownloadPatch() {
    const patch = buildUnifiedPatch(a, b, labelA, labelB);
    downloadTextFile(`${a.name}.patch`, patch);
  }

  function handleDownloadSqlDiff() {
    const doc = buildSqlDiffDocument(a, b, labelA, labelB);
    downloadTextFile(`${a.name}_diff.sql`, doc);
  }

  function handleGenerateSyncScript() {
    const script = generateSyncScript(b, { source: labelA, target: labelB });
    downloadTextFile(`${a.name}_sync.sql`, script);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{a.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPatch}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Download patch (.patch)
          </button>
          <button
            onClick={handleDownloadSqlDiff}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Download diff (.sql)
          </button>
          <button
            onClick={handleGenerateSyncScript}
            disabled={identical}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Generate sync script (A → B)
          </button>
        </div>
      </div>

      {a.bodySource !== null || b.bodySource !== null ? (
        <>
          <DiffPane title="Package Spec" original={a.specSource} modified={b.specSource} />
          <DiffPane title="Package Body" original={a.bodySource} modified={b.bodySource} />
        </>
      ) : (
        <DiffPane title="File Contents" original={a.specSource} modified={b.specSource} />
      )}
    </div>
  );
}
