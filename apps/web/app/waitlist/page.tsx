"use client";

import Link from "next/link";
import { useState } from "react";
import { PageWithBackground } from "@/components/PageWithBackground";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setEmail("");
      setName("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <PageWithBackground>
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-950/85">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <Link
              href="/"
              className="smooth-nav-link flex items-center rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500 hover:opacity-90"
            >
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                Strivon
              </span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/about"
                className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Pricing
              </Link>
              <Link
                href="/waitlist"
                className="smooth-btn ml-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Join the waitlist
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col justify-center px-6 py-16 sm:px-8">
          <div className="animate-fade-in-up rounded-2xl border border-zinc-200 bg-white/95 p-8 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95 sm:p-10">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Join the waitlist
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              We&apos;re not live yet. Leave your email and we&apos;ll notify you when Strivon launches.
            </p>

            {status === "success" ? (
              <div
                className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/50"
                role="status"
                aria-live="polite"
              >
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  You&apos;re on the list.
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  We&apos;ll email you when Strivon is ready.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 text-sm font-medium text-emerald-700 underline underline-offset-2 hover:no-underline dark:text-emerald-300"
                >
                  Add another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition-[border-color,box-shadow] duration-200 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label htmlFor="waitlist-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Name <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
                  </label>
                  <input
                    id="waitlist-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === "loading"}
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition-[border-color,box-shadow] duration-200 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                {message && (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="smooth-btn w-full rounded-full bg-zinc-900 px-6 py-3.5 text-base font-semibold text-white hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {status === "loading" ? "Joining…" : "Join waitlist"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ← Back to home
              </Link>
            </p>
          </div>
        </main>

        <footer className="border-t border-zinc-200/80 px-6 py-8 dark:border-zinc-700/80">
          <div className="mx-auto flex max-w-6xl justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100">
              Home
            </Link>
            <Link href="/pricing" className="transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100">
              Pricing
            </Link>
            <Link href="/privacy" className="transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100">
              Terms
            </Link>
          </div>
        </footer>
    </PageWithBackground>
  );
}
