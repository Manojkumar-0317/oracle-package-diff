"use client";

import dynamic from "next/dynamic";

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false }
);

export function DiffPane({
  title,
  original,
  modified,
}: {
  title: string;
  original: string | null;
  modified: string | null;
}) {
  const identical = (original ?? "") === (modified ?? "");

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden dark:border-zinc-800">
      <div className="flex items-center justify-between bg-zinc-100 px-3 py-2 text-sm font-medium dark:bg-zinc-900">
        <span>{title}</span>
        {identical ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">No differences</span>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400">Changed</span>
        )}
      </div>
      <div style={{ height: 400 }}>
        <MonacoDiffEditor
          original={original ?? ""}
          modified={modified ?? ""}
          language="sql"
          theme="vs-dark"
          options={{
            renderSideBySide: true,
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
