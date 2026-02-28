import type { Metadata } from "next";
import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Strivon privacy policy.",
};

export default function PrivacyPage() {
  return (
    <PageWithBackground>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-20">
        <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-[var(--foreground)]">Privacy Policy</h1>
        <p className="mt-4 text-[var(--muted)]">
          Full privacy policy will be published before launch. We use waitlist emails only to notify you at launch. We do not sell your data.
        </p>
        <Link href="/" className="smooth-nav-link mt-8 inline-block text-sm font-medium text-[var(--accent)] underline underline-offset-2 hover:no-underline">← Back to home</Link>
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
