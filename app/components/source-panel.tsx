"use client";

import { useState } from "react";
import type { PackageSource, PackageSummary } from "@/lib/types";

type Mode = "connection" | "file";

export function SourcePanel({
  label,
  onResolved,
}: {
  label: string;
  onResolved: (source: PackageSource | null, sourceLabel: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("connection");

  const [connectionString, setConnectionString] = useState("");
  const [owner, setOwner] = useState("");
  const [packages, setPackages] = useState<PackageSummary[] | null>(null);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  function resetResolution() {
    setResolvedName(null);
    onResolved(null, label);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setPackages(null);
    setSelectedPackage("");
    setError(null);
    resetResolution();
  }

  async function handleListPackages() {
    setError(null);
    setLoading(true);
    setPackages(null);
    setSelectedPackage("");
    resetResolution();
    try {
      const res = await fetch("/api/connection/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString, owner: owner || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to list packages.");
      setPackages(data.packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPackage(packageName: string) {
    setSelectedPackage(packageName);
    setError(null);
    if (!packageName) {
      resetResolution();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/connection/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString,
          owner: owner || undefined,
          packageName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch package source.");
      setResolvedName(data.source.name);
      onResolved(data.source, label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      resetResolution();
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    resetResolution();
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/file/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse file.");
      setResolvedName(data.source.name);
      onResolved(data.source, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      resetResolution();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <div className="flex gap-1 rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-900">
          <button
            onClick={() => switchMode("connection")}
            className={`rounded-full px-3 py-1 ${
              mode === "connection" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500"
            }`}
          >
            Connection
          </button>
          <button
            onClick={() => switchMode("file")}
            className={`rounded-full px-3 py-1 ${
              mode === "file" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500"
            }`}
          >
            Upload file
          </button>
        </div>
      </div>

      {mode === "connection" ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="User Id=myuser;Data Source=(DESCRIPTION=...);Password=mypass;"
            rows={3}
            className="rounded border border-zinc-300 bg-transparent p-2 font-mono text-xs dark:border-zinc-700"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Schema owner (optional, defaults to connecting user)"
            className="rounded border border-zinc-300 bg-transparent p-2 text-sm dark:border-zinc-700"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Use a read-only database account. This string is used only for this request and is
            never stored.
          </p>
          <button
            onClick={handleListPackages}
            disabled={!connectionString || loading}
            className="self-start rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading && !packages ? "Connecting…" : "List packages"}
          </button>

          {packages && (
            <select
              value={selectedPackage}
              onChange={(e) => handleSelectPackage(e.target.value)}
              className="rounded border border-zinc-300 bg-transparent p-2 text-sm dark:border-zinc-700"
            >
              <option value="">Select a package…</option>
              {packages.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.hasSpec && p.hasBody ? "" : p.hasSpec ? "(spec only)" : "(body only)"}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept=".sql,.pks,.pkb,.txt"
            onChange={handleFileChange}
            className="text-sm"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Upload any SQL file to compare its full contents.
          </p>
        </div>
      )}

      {loading && <p className="text-xs text-zinc-500">Loading…</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {resolvedName && (
        <p className="text-xs text-green-700 dark:text-green-400">
          Resolved package: {resolvedName}
        </p>
      )}
    </div>
  );
}
