"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSpaceById, joinSpace, leaveSpace } from "@/lib/api/spaces";
import type { Space } from "@/types/post";

export default function SpaceDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const s = await getSpaceById(id);
      setSpace(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load space");
      setSpace(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoinLeave = async () => {
    if (!space || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (space.isJoined) {
        await leaveSpace(space.id);
        setSpace((prev) => (prev ? { ...prev, isJoined: false, memberCount: Math.max(0, prev.memberCount - 1) } : null));
      } else {
        await joinSpace(space.id);
        setSpace((prev) => (prev ? { ...prev, isJoined: true, memberCount: prev.memberCount + 1 } : null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
      </div>
    );
  }

  if (!space || error) {
    return (
      <div className="mx-auto max-w-2xl">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}
        <p className="text-[var(--muted)]">Space not found.</p>
        <Link href="/app/spaces" className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">
          Back to spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="app-card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-[var(--accent)] to-teal-600" />
        <div className="relative px-6 pb-6 md:px-8 md:pb-8">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-4xl text-[var(--accent)]">
              👥
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{space.name}</h1>
              <p className="text-[var(--muted)]">{space.memberCount.toLocaleString()} members</p>
            </div>
            <button
              type="button"
              onClick={handleJoinLeave}
              disabled={busy}
              className={`smooth-btn rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                space.isJoined
                  ? "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
                  : "app-btn-primary"
              }`}
            >
              {busy ? "…" : space.isJoined ? "Leave" : "Join"}
            </button>
          </div>
          <p className="mt-4 text-[var(--muted-foreground)]">{space.description}</p>
          <div className="mt-6">
            <h3 className="font-semibold text-[var(--foreground)]">Channels</h3>
            <ul className="mt-2 space-y-2">
              {space.channels.map((ch) => (
                <li key={ch.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)]">
                  # {ch.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
