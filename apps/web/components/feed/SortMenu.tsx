"use client";

import { useEffect } from "react";

export type SortOption = "newest" | "popular" | "trending";
export type ContentFilterType = "all" | "media" | "text" | "links";
export type LocationScope = "local" | "my_country" | "global";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "popular", label: "Popular" },
  { key: "trending", label: "Trending" },
];

const FILTER_OPTIONS: { key: ContentFilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "media", label: "Media" },
  { key: "text", label: "Text" },
  { key: "links", label: "Links" },
];

const LOCATION_OPTIONS: { key: LocationScope; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "my_country", label: "My country" },
  { key: "local", label: "Local" },
];

interface SortMenuProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilter: ContentFilterType;
  onFilterChange: (filter: ContentFilterType) => void;
  locationScope: LocationScope;
  onLocationScopeChange: (scope: LocationScope) => void;
  visible: boolean;
  onClose: () => void;
}

export function SortMenu({
  activeSort,
  onSortChange,
  activeFilter,
  onFilterChange,
  locationScope,
  onLocationScopeChange,
  visible,
  onClose,
}: SortMenuProps) {
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)]"
        role="dialog"
        aria-modal="true"
        aria-label="Sort and filter feed"
      >
        <p className="mb-2 border-b border-[var(--card-border)] pb-2 text-base font-bold text-[var(--foreground)]">
          Filter by
        </p>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              onFilterChange(opt.key);
            }}
            className="smooth-btn flex w-full items-center gap-3 rounded-lg py-3 px-2 text-left text-[var(--foreground)] hover:bg-[var(--accent-subtle)] data-[active]:bg-[var(--accent-muted)] data-[active]:font-semibold data-[active]:text-[var(--accent)]"
            data-active={activeFilter === opt.key}
          >
            {opt.label}
            {activeFilter === opt.key && (
              <svg className="ml-auto h-5 w-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}

        <div className="my-2 border-t border-[var(--card-border)]" />
        <p className="mb-2 text-base font-bold text-[var(--foreground)]">Show</p>
        {LOCATION_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              onLocationScopeChange(opt.key);
              onClose();
            }}
            className="smooth-btn flex w-full items-center gap-3 rounded-lg py-3 px-2 text-left text-[var(--foreground)] hover:bg-[var(--accent-subtle)] data-[active]:bg-[var(--accent-muted)] data-[active]:font-semibold data-[active]:text-[var(--accent)]"
            data-active={locationScope === opt.key}
          >
            {opt.label}
            {locationScope === opt.key && (
              <svg className="ml-auto h-5 w-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}

        <div className="my-2 border-t border-[var(--card-border)]" />
        <p className="mb-2 text-base font-bold text-[var(--foreground)]">Sort by</p>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              onSortChange(opt.key);
              onClose();
            }}
            className="smooth-btn flex w-full items-center gap-3 rounded-lg py-3 px-2 text-left text-[var(--foreground)] hover:bg-[var(--accent-subtle)] data-[active]:bg-[var(--accent-muted)] data-[active]:font-semibold data-[active]:text-[var(--accent)]"
            data-active={activeSort === opt.key}
          >
            {opt.label}
            {activeSort === opt.key && (
              <svg className="ml-auto h-5 w-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
