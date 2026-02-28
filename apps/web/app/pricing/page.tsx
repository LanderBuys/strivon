import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Strivon pricing: Free, Pro, and Premium. Real limits from the app—spaces, stories, boosts, analytics, and more.",
};

const checkIcon = (
  <svg className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const crossIcon = (
  <svg className="h-5 w-5 flex-shrink-0 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/** Feature row: feature label + what Free / Pro / Premium get. Value can be ReactNode (check/cross) or string. */
const comparisonRows: Array<{ feature: string; free: ReactNode; pro: ReactNode; proPlus: ReactNode }> = [
  { feature: "Feed (For You, Following, Spaces)", free: checkIcon, pro: checkIcon, proPlus: checkIcon },
  { feature: "Post types (Build Log, Question, Win/Loss, Collab, Content)", free: checkIcon, pro: checkIcon, proPlus: checkIcon },
  { feature: "Media per post", free: "5", pro: "10", proPlus: "20" },
  { feature: "Stories per day", free: "1", pro: "Unlimited", proPlus: "Unlimited" },
  { feature: "Story duration", free: "24h fixed", pro: "Choose (24h → forever)", proPlus: "Choose (24h → forever)" },
  { feature: "Drafts", free: "1", pro: "Unlimited", proPlus: "Unlimited" },
  { feature: "Schedule posts", free: crossIcon, pro: checkIcon, proPlus: checkIcon },
  { feature: "Advanced analytics dashboard", free: crossIcon, pro: checkIcon, proPlus: checkIcon },
  { feature: "Post boost credits per month", free: "0 (ad-based sometimes)", pro: "10 (24h each)", proPlus: "25 (48h + priority)" },
  // Premium exclusives
  { feature: "Link in bio", free: crossIcon, pro: checkIcon, proPlus: checkIcon },
  { feature: "Clickable links / URLs in posts", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Multiple links on profile", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Custom CTA button on profile (e.g. Book a call, Visit site)", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Export analytics (CSV, reports)", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Priority support", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Premium badge on profile", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Early access to new features", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  // Advanced profile customization (Premium) — split into detail rows
  { feature: "Profile: video banner", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Profile: custom theme & colors", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Profile: custom sections & layout", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
  { feature: "Profile: pinned highlights", free: crossIcon, pro: crossIcon, proPlus: checkIcon },
];

export default function Pricing() {
  return (
    <PageWithBackground>
      <SiteHeader />

        <main className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pricing</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Free, Pro, and Premium
              </h1>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Same limits as in the Strivon app. Start free; upgrade in-app when you need scheduling, boosts, and advanced analytics.
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
              See what you get and what you don’t. Subscriptions are managed in the app. Cancel anytime.
            </p>
          </ScrollReveal>

          {/* Price strip — make pricing obvious */}
          <ScrollReveal variant="scale">
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <div className="smooth-card rounded-xl border border-zinc-200 bg-white/95 px-6 py-5 text-center shadow-sm hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/95">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Free</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">$0</p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">per month</p>
            </div>
            <div className="smooth-card relative rounded-xl border-2 border-zinc-900 bg-white/95 px-6 py-5 text-center shadow-md hover:-translate-y-1 hover:shadow-lg dark:border-zinc-100 dark:bg-zinc-900/95">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Popular</span>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Pro</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">$9</p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">per month</p>
            </div>
            <div className="smooth-card rounded-xl border border-zinc-200 bg-white/95 px-6 py-5 text-center shadow-sm hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/95">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Premium</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">$19</p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">per month</p>
            </div>
          </div>
          </ScrollReveal>

          <ScrollReveal>
          <div className="mx-auto mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="bg-zinc-50/80 px-4 py-4 text-sm font-semibold text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50 sm:px-6">Feature</th>
                    <th className="bg-zinc-50/80 px-4 py-4 text-sm font-semibold text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50 sm:px-6">Free</th>
                    <th className="bg-zinc-100/80 px-4 py-4 text-sm font-semibold text-zinc-900 dark:bg-zinc-700/80 dark:text-zinc-50 sm:px-6">
                      Pro <span className="ml-1 rounded bg-zinc-900 px-1.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Popular</span>
                    </th>
                    <th className="bg-zinc-50/80 px-4 py-4 text-sm font-semibold text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50 sm:px-6">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-150 ${i % 2 === 1 ? "bg-zinc-50/50 dark:bg-zinc-800/30" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:px-6">{row.feature}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
                        {typeof row.free === "string" ? row.free : <span className="flex items-center gap-2">{row.free}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
                        {typeof row.pro === "string" ? row.pro : <span className="flex items-center gap-2">{row.pro}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
                        {typeof row.proPlus === "string" ? row.proPlus : <span className="flex items-center gap-2">{row.proPlus}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </ScrollReveal>

          <ScrollReveal>
          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-4">
            <Link
              href="/waitlist"
              className="smooth-btn group inline-flex items-center justify-center gap-2.5 rounded-full bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 active:translate-y-0 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Join the waitlist
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          </ScrollReveal>

          <div className="mt-12 text-center">
            <Link href="/" className="smooth-nav-link text-sm font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              ← Back to home
            </Link>
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
          <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-[var(--muted)]">© {new Date().getFullYear()} Strivon. All rights reserved.</p>
        </footer>
    </PageWithBackground>
  );
}
