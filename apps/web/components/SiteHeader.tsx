"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const isAbout = pathname === "/about";
  const isPricing = pathname === "/pricing";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const navLinkClass = (active: boolean) =>
    `smooth-nav-link relative rounded-lg px-4 py-2.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-slate-900 ${
      active ? "text-white" : "text-slate-300 hover:text-white"
    }`;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-slate-900 -m-1 p-1"
            aria-label="Strivon — Home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-white text-sm">S</span>
            <span className="text-lg font-semibold tracking-tight text-white">Strivon</span>
          </Link>

          {/* Desktop: nav + CTA */}
          <div className="hidden md:flex shrink-0 items-center gap-4">
            <nav className="flex items-center gap-1" aria-label="Main">
              <Link href="/about" className={navLinkClass(isAbout)}>
                About
                {isAbout && (
                  <span className="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-[var(--accent)]" aria-hidden />
                )}
              </Link>
              <Link href="/pricing" className={navLinkClass(isPricing)}>
                Pricing
                {isPricing && (
                  <span className="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-[var(--accent)]" aria-hidden />
                )}
              </Link>
            </nav>
            <Link
              href="/waitlist"
              onClick={closeMobile}
              className="smooth-btn group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-[var(--accent)]/30 transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-slate-900 active:translate-y-0 sm:px-6 sm:py-3"
            >
              Join waitlist
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Mobile: CTA + hamburger (no overlay — tap outside uses transparent layer) */}
          <div className="flex shrink-0 items-center gap-3 md:hidden">
            <Link
              href="/waitlist"
              onClick={closeMobile}
              className="smooth-btn group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all duration-200 hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--card)] dark:text-white"
            >
              Join waitlist
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--card)]"
              aria-expanded={mobileOpen}
              aria-controls="site-header-mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — transparent tap-to-close only, no gray overlay */}
      <div
        id="site-header-mobile-menu"
        className="fixed inset-0 z-40 md:hidden"
        aria-hidden={!mobileOpen}
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
      >
        {/* Invisible tap area to close menu — no background, no dimming */}
        <div
          className="absolute inset-0"
          onClick={closeMobile}
          aria-hidden
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col px-4 pt-6 pb-4">
            <Link
              href="/"
              onClick={closeMobile}
              className="rounded-lg px-4 py-3 text-left text-lg font-bold text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
            >
              Strivon
            </Link>
            <div className="mt-4 flex flex-col gap-1">
              <Link
                href="/about"
                onClick={closeMobile}
                className={`rounded-lg px-4 py-3 text-left text-[15px] font-medium ${
                  isAbout ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
                }`}
              >
                About
              </Link>
              <Link
                href="/pricing"
                onClick={closeMobile}
                className={`rounded-lg px-4 py-3 text-left text-[15px] font-medium ${
                  isPricing ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
                }`}
              >
                Pricing
              </Link>
            </div>
          </div>
          <div className="mt-auto border-t border-[var(--card-border)] p-4">
            <Link
              href="/waitlist"
              onClick={closeMobile}
              className="smooth-btn group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 dark:text-white"
            >
              Join waitlist
              <svg className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div aria-hidden className="h-16" />
    </>
  );
}
