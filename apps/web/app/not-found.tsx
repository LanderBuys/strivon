import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <PageWithBackground>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-6 py-16 sm:px-8">
        <div className="max-w-md text-center">
          <p className="text-6xl font-bold text-[var(--muted)]/50 sm:text-7xl">404</p>
          <h1 className="mt-4 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
            Page not found
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            This page doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="smooth-btn mt-8 inline-block rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          >
            Go home
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
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} Strivon. All rights reserved.
        </p>
      </footer>
    </PageWithBackground>
  );
}
