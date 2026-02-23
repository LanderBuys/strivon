import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function About() {
  return (
    <PageWithBackground>
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-950/85">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <Link href="/" className="smooth-nav-link flex items-center rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-500">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">Strivon</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/about" className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800">About</Link>
              <Link href="/pricing" className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">Pricing</Link>
              <Link href="/waitlist" className="smooth-btn rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">Join the waitlist</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-20">
          <ScrollReveal>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">About Strivon</h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Strivon is a social platform for entrepreneurs, builders, and creators. We’re here to connect people and to help you step back from social media that wastes your time—so you can consume helpful information and meet like-minded people instead.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2 className="mt-10 text-xl font-bold text-zinc-900 dark:text-zinc-50">Why networking matters</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Building something is easier when you’re connected to people who get it. Networking means feedback, collaborators, customers, and friends who keep you going. Strivon exists so you can find those people and stay in each other’s corner instead of scrolling alone.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2 className="mt-10 text-xl font-bold text-zinc-900 dark:text-zinc-50">Purpose &amp; vision</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Our purpose is to connect people and to help you stop using social media for mindless consumption and start consuming what actually helps—build logs, real questions, honest wins and losses, and conversations with people on the same path.
            </p>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Our vision: a platform where you can meet like-minded people and consume only helpful content. No algorithm slop, no brainrot—just signal from builders and creators who share what they’re learning and doing.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <p className="mt-10 text-zinc-600 dark:text-zinc-400">
              For exact limits and pricing, see <Link href="/pricing" className="font-medium text-zinc-900 underline underline-offset-2 transition-colors duration-200 hover:decoration-zinc-600 dark:text-zinc-100 dark:hover:decoration-zinc-400">Pricing</Link>. We&apos;re not live yet—<Link href="/waitlist" className="font-medium text-zinc-900 underline underline-offset-2 transition-colors duration-200 hover:decoration-zinc-600 dark:text-zinc-100 dark:hover:decoration-zinc-400">join the waitlist</Link> to get notified at launch.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link href="/" className="smooth-btn inline-flex rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:scale-[1.02] hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">Home</Link>
              <Link href="/pricing" className="smooth-btn inline-flex rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 hover:scale-[1.02] hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">Pricing</Link>
            </div>
          </ScrollReveal>
        </main>

        <footer className="border-t border-zinc-200/80 px-6 py-12 dark:border-zinc-700/80">
          <div className="mx-auto flex max-w-6xl justify-center gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Home</Link>
            <Link href="/pricing" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Pricing</Link>
            <Link href="/waitlist" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Join the waitlist</Link>
            <Link href="/privacy" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Privacy</Link>
            <Link href="/terms" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">Terms</Link>
          </div>
        </footer>
    </PageWithBackground>
  );
}
