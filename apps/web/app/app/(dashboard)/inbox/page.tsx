"use client";

export default function InboxPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)] sm:mb-3 sm:text-xl">Messages</h2>
      <p className="mb-4 text-sm text-[var(--muted)] sm:mb-6">Direct messages from your network.</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow)] sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h3 className="mb-2 text-base font-semibold text-[var(--foreground)]">Coming soon</h3>
        <p className="text-[var(--muted)]">
          Message people you follow or meet in spaces. Your network, in private.
        </p>
      </div>
    </div>
  );
}
