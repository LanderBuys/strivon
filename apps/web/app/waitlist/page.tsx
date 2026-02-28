"use client";

import Link from "next/link";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { PageWithBackground } from "@/components/PageWithBackground";
import { SiteHeader } from "@/components/SiteHeader";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const LAUNCH_AT = 500;
/** Display count starts here. Increment by 1 on each submit; update this number manually when you sync with real count. */
const DISPLAY_COUNT_START = 105;

async function submitWaitlist(email: string, country?: string) {
  const db = getFirestoreDb();
  if (!db) throw new Error("Waitlist is not available. Please try again later.");
  await addDoc(collection(db, "waitlist"), {
    email,
    ...(country && country.trim() ? { country: country.trim().slice(0, 200) } : {}),
    createdAt: serverTimestamp(),
    source: "website",
  });
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(DISPLAY_COUNT_START);
  const [launchAt] = useState(LAUNCH_AT);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setMessage("Please enter your email.");
      setStatus("error");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setMessage("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await submitWaitlist(trimmed, country.trim() || undefined);
      setCount((c) => c + 1);
      setStatus("success");
      setEmail("");
      setCountry("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const toGo = Math.max(0, launchAt - count);
  const pct = launchAt > 0 ? Math.min(100, count / launchAt) * 100 : 0;
  const isOpen = count >= launchAt;

  return (
    <PageWithBackground>
      <SiteHeader />

      <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex w-full max-w-md flex-col items-center">
        {/* One clear number */}
        <div className="w-full text-center">
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {isOpen ? "We're open" : "Signups"}
            </p>
            <p className="mt-3 tabular-nums leading-none text-[var(--foreground)]" style={{ fontSize: "clamp(3.5rem, 16vw, 7rem)", fontWeight: 700 }}>
              <span className="bg-gradient-to-r from-[var(--accent)] to-blue-600 bg-clip-text text-transparent">
                {count.toLocaleString()}
              </span>
              <span className="font-normal text-[var(--muted)]">/{launchAt}</span>
            </p>
            {!isOpen && (
              <p className="mt-3 text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">{toGo.toLocaleString()}</span> to go until we open
              </p>
            )}
          </>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-full" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={launchAt} aria-label={`${count} of ${launchAt} signups`}>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--accent-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
              style={{ width: `${pct > 0 ? Math.max(pct, 2) : 0}%` }}
            />
          </div>
        </div>

        {/* One line */}
        <p className="mt-6 text-center text-[var(--muted)]">
          We'll email you once when we open. Nothing else.
        </p>

        {/* Single card: form or success */}
        <div className="mt-10 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/95 p-6 shadow-[var(--shadow-lg)] sm:p-8">
          {status === "success" ? (
            <div className="animate-scale-in text-center" role="status" aria-live="polite">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">You're in.</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                We'll email you when we hit {launchAt} and open.
              </p>
              <p className="mt-5 text-lg font-semibold tabular-nums text-[var(--foreground)]">
                You're one of {count.toLocaleString()}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="w-email" className="sr-only">Email</label>
                <input
                  id="w-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  placeholder="Email"
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="w-country" className="sr-only">Country (optional)</label>
                <input
                  id="w-country"
                  type="text"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={status === "loading"}
                  placeholder="Country (optional)"
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60"
                />
              </div>
              {message && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="smooth-btn w-full rounded-full bg-[var(--accent)] py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? "Joining…" : "Join"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          At {launchAt} signups we open the app. One email.
        </p>
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Available on iOS, Android, and the web at launch.
        </p>
        <p className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Home</Link>
          <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">About</Link>
          <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">Pricing</Link>
        </p>
        </div>
      </main>
      <footer className="border-t border-[var(--card-border)]/80 px-6 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link href="/" className="font-semibold text-[var(--foreground)]">Strivon</Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/about" className="smooth-nav-link hover:text-[var(--accent)]">About</Link>
            <Link href="/pricing" className="smooth-nav-link hover:text-[var(--accent)]">Pricing</Link>
            <Link href="/waitlist" className="smooth-nav-link hover:text-[var(--accent)]">Waitlist</Link>
            <Link href="/privacy" className="smooth-nav-link hover:text-[var(--accent)]">Privacy</Link>
            <Link href="/terms" className="smooth-nav-link hover:text-[var(--accent)]">Terms</Link>
            <Link href="/contact" className="smooth-nav-link hover:text-[var(--accent)]">Contact</Link>
          </nav>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} Strivon. All rights reserved.
        </p>
      </footer>
    </PageWithBackground>
  );
}
