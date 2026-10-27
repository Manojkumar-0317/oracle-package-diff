"use client";

import { useState } from "react";
import { SourcePanel } from "./components/source-panel";
import { DiffResultsView } from "./components/diff-results-view";
import type { PackageSource } from "@/lib/types";

export default function Home() {
  const [sourceA, setSourceA] = useState<PackageSource | null>(null);
  const [sourceB, setSourceB] = useState<PackageSource | null>(null);
  const [labelA, setLabelA] = useState("Source A");
  const [labelB, setLabelB] = useState("Source B");

  const bothResolved = sourceA && sourceB;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Oracle Package Diff</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Compare an Oracle PL/SQL package between a live connection and/or an uploaded SQL file.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SourcePanel
          label="Source A"
          onResolved={(source, label) => {
            setSourceA(source);
            setLabelA(label);
          }}
        />
        <SourcePanel
          label="Source B"
          onResolved={(source, label) => {
            setSourceB(source);
            setLabelB(label);
          }}
        />
      </div>

      {bothResolved && sourceA.name !== sourceB.name && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Note: these are different package names ({sourceA.name} vs {sourceB.name}) — comparing
          anyway.
        </p>
      )}

      {bothResolved && (
        <DiffResultsView a={sourceA} b={sourceB} labelA={labelA} labelB={labelB} />
      )}
    </div>
  );
}
