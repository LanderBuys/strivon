"use client";

export default function NewsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)] sm:mb-3 sm:text-xl">News</h2>
      <p className="mb-4 text-sm text-[var(--muted)] sm:mb-6">Curated for builders in your network.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow)] sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v18.75c0 .621-.504 1.125-1.125 1.125h-3.375m0-3H21M10.5 21H5.625c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125h4.875M10.5 3v18" />
          </svg>
        </div>
        <h3 className="mb-2 text-base font-semibold text-[var(--foreground)]">Coming soon</h3>
        <p className="text-[var(--muted)]">
          Articles and updates from the network. We&apos;re building this for you.
        </p>
      </div>
    </div>
  );
}
