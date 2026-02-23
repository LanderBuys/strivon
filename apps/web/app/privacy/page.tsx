import type { Metadata } from "next";
import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Strivon privacy policy.",
};

export default function PrivacyPage() {
  return (
    <PageWithBackground>
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <Link href="/" className="smooth-nav-link font-semibold text-zinc-900 dark:text-zinc-50">Strivon</Link>
          <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/about" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">About</Link>
            <Link href="/pricing" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Pricing</Link>
            <Link href="/waitlist" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Waitlist</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-20">
        <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Privacy Policy</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Full privacy policy will be published before launch. We use waitlist emails only to notify you at launch. We do not sell your data.
        </p>
        <Link href="/" className="smooth-nav-link mt-8 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Back to home</Link>
      </main>
    </PageWithBackground>
  );
}
