"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSpaces } from "@/lib/api/spaces";
import type { Space } from "@/types/post";

function SpaceCard({ space }: { space: Space }) {
  return (
    <Link
      href={`/app/space/${space.id}`}
      className="app-card smooth-card block hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4 p-5 md:p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-2xl text-[var(--accent)]">
          👥
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[var(--foreground)]">{space.name}</h3>
            {space.isTrending && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                Trending
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{space.description}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {space.memberCount.toLocaleString()} members · {space.channels.length} channels
          </p>
          {space.isJoined && (
            <span className="mt-2 inline-block rounded-full bg-[var(--accent-muted)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              Joined
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getSpaces();
      setSpaces(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load spaces");
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Spaces</h2>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}
      {!loading && spaces.length === 0 && !error && (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center text-[var(--muted)] shadow-[var(--shadow)]">
          No spaces yet. Create one from the app.
        </div>
      )}
    </div>
  );
}
