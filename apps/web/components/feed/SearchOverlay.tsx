"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { Post } from "@/types/post";

const RECENT_KEY = "strivon_search_recent";
const MAX_RECENT = 8;
const TRENDING = ["React Native", "AI Development", "Startup Tips", "Web Design", "Productivity", "Open Source"];
const SUGGESTED = [
  { q: "React Native", cat: "Development" },
  { q: "UI Design", cat: "Design" },
  { q: "Startup Stories", cat: "Entrepreneurship" },
];

interface SearchOverlayProps {
  visible: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  allPosts: Post[];
  onSelectPost?: (postId: string) => void;
}

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecent(query: string) {
  if (!query.trim()) return;
  const prev = getRecent().filter((s) => s.toLowerCase() !== query.trim().toLowerCase());
  const next = [query.trim(), ...prev].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

export function SearchOverlay({
  visible,
  query,
  onQueryChange,
  onClose,
  allPosts,
  onSelectPost,
}: SearchOverlayProps) {
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, [visible]);

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [visible, onClose]);

  const trimmed = query.trim().toLowerCase();
  const matchingPosts = useMemo(() => {
    if (!trimmed) return [];
    const words = trimmed.split(/\s+/).filter(Boolean);
    return allPosts.filter((p) => {
      const content = [p.content, p.title, p.author?.name, p.author?.handle].filter(Boolean).join(" ").toLowerCase();
      return words.some((w) => content.includes(w));
    });
  }, [allPosts, trimmed]);

  const handleSelect = (postId: string) => {
    addRecent(query.trim());
    onSelectPost?.(postId);
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" aria-hidden onClick={onClose} />
      <div
        className="fixed inset-x-0 top-0 z-50 mx-auto max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-b-2xl border-b border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-lg)] animate-slide-in-top"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] p-3">
          <span className="text-[var(--muted)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search posts, people, topics..."
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder-[var(--muted)] outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="smooth-btn rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        </div>

        <div className="max-h-[calc(90vh-60px)] overflow-y-auto p-4">
          {trimmed ? (
            matchingPosts.length > 0 ? (
              <ul className="space-y-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Posts ({matchingPosts.length})</p>
                {matchingPosts.slice(0, 20).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/app/thread?id=${encodeURIComponent(p.id)}`}
                      onClick={() => handleSelect(p.id)}
                      className="smooth-btn flex gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[var(--accent-subtle)]"
                    >
                      <span className="line-clamp-2 flex-1 text-[15px] text-[var(--foreground)]">
                        {(p.content || p.title || "").slice(0, 120)}
                        {((p.content || p.title)?.length ?? 0) > 120 ? "…" : ""}
                      </span>
                      <span className="shrink-0 text-sm text-[var(--muted)]">{p.author?.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-[var(--muted)]">No posts match this search.</p>
            )
          ) : (
            <div className="space-y-6">
              {recent.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Recent</p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          onQueryChange(r);
                          inputRef.current?.focus();
                        }}
                        className="smooth-btn rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map(({ q, cat }) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        onQueryChange(q);
                        addRecent(q);
                        inputRef.current?.focus();
                      }}
                      className="smooth-btn rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2.5 text-left transition-colors hover:bg-[var(--accent-subtle)]"
                    >
                      <span className="block text-sm font-medium text-[var(--foreground)]">{q}</span>
                      <span className="block text-xs text-[var(--muted)]">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Trending</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        onQueryChange(t);
                        addRecent(t);
                        inputRef.current?.focus();
                      }}
                      className="smooth-btn rounded-full bg-[var(--accent-subtle)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)]"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
