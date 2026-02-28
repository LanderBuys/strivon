"use client";

import { useState } from "react";

export function ContactContent({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: open mailto in new tab so user can copy from there
      window.open(`mailto:${email}`, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <a
        href={`mailto:${email}`}
        target="_blank"
        rel="noopener noreferrer"
        className="smooth-btn inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Send email
      </a>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-[var(--muted)]">{email}</span>
        <button
          type="button"
          onClick={copyEmail}
          className="smooth-nav-link rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
