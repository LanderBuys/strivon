"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon?: "mail" | "inbox" | "search";
  title: string;
  message: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

const iconPaths: Record<string, string> = {
  mail: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  inbox: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.423l.256.512a2.25 2.25 0 002.013 1.423h3.218a2.25 2.25 0 002.013-1.423l.256-.512a2.25 2.25 0 012.013-1.423h3.86m-19.5 0V2.25a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 2.25v11.25m-19.5 0h3.869a2.25 2.25 0 012.012 1.423l.256.512a2.25 2.25 0 002.013 1.423h3.218a2.25 2.25 0 002.013-1.423l.256-.512a2.25 2.25 0 012.013-1.423H21.75M2.25 13.5V21a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 21V13.5m-19.5 0h19.5",
  search: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
};

export function EmptyState({
  icon = "mail",
  title,
  message,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const path = iconPaths[icon] ?? iconPaths.mail;

  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
        <svg
          className="h-8 w-8 text-[var(--accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-1.5 max-w-[300px] text-sm leading-relaxed text-[var(--muted)]">
        {message}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {primaryAction && (
          <Link
            href={primaryAction.href}
            className="smooth-btn inline-flex items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            {primaryAction.label}
          </Link>
        )}
        {secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="smooth-btn inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}
