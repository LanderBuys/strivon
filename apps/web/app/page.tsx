import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <PageWithBackground>
      {/* Header */}
        <header className="sticky top-0 z-10 border-b border-[var(--card-border)]/80 bg-[var(--card)]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <Link href="/" className="smooth-nav-link text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2">
              Strivon
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link href="/about" className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--foreground)]">
                About
              </Link>
              <Link href="/pricing" className="smooth-nav-link rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--foreground)]">
                Pricing
              </Link>
              <Link href="/waitlist" className="smooth-btn ml-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-95 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 dark:text-[var(--foreground)]">
                Join the waitlist
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero — strivonbackgroundimage shows through page background */}
        <main className="mx-auto flex min-h-[72vh] max-w-6xl flex-col items-center justify-end px-6 pb-24 pt-16 sm:px-8 sm:pb-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="animate-fade-in-up animation-delay-100 rounded-full border border-[var(--card-border)] bg-[var(--card)]/95 px-4 py-2 text-sm font-medium text-[var(--muted)] shadow-[var(--shadow)]">
              For entrepreneurs &amp; creators
            </span>
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl animation-delay-200">
              Share your journey.
              <br />
              <span className="bg-gradient-to-r from-[var(--accent)] to-blue-600 bg-clip-text text-transparent">Connect with builders.</span>
            </h1>
            <p className="animate-fade-in-up max-w-xl text-lg leading-relaxed text-[var(--muted)] animation-delay-300">
              A place to connect with like-minded people and consume helpful content—not endless noise.
            </p>
            <div className="animate-fade-in-up flex justify-center animation-delay-400">
              <Link
                href="/waitlist"
                className="smooth-btn app-btn-primary w-full rounded-xl px-8 py-4 text-base shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-hover)] sm:w-auto sm:min-w-[200px]"
              >
                Join the waitlist
              </Link>
            </div>
            <p className="animate-fade-in-up text-sm text-[var(--muted)] animation-delay-500">
              We&apos;re not live yet—join the waitlist to get notified at launch.
            </p>
          </div>
        </main>

        {/* Content sections — animate on scroll */}
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24">
          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                Why it matters
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                Why networking is important
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                Building something—a product, an audience, a career—is easier when you’re connected to people who get it.
                Networking isn’t just contacts; it’s feedback, collaborators, customers, and friends who keep you going.
                Strivon exists so you can find those people and stay in each other’s corner instead of scrolling alone.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                Purpose &amp; vision
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                Connect people. Consume what helps.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                The purpose of Strivon is to connect people and to help you step back from social media that wastes your time.
                We want you to spend less time doom-scrolling and more time consuming information that actually helps—build logs,
                real questions, honest wins and losses, and conversations with people on the same path.
              </p>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                Our vision is simple: a platform where you can meet like-minded people and consume only helpful content.
                No algorithm slop, no brainrot—just signal from builders and creators who share what they’re learning and doing.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                The platform
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                What is Strivon?
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                Strivon is a social app for people who build. You get a personalized feed (For You, Following, Spaces),
                post types built for builders—Build Logs, Questions, Wins &amp; Losses, Collaborations—threaded conversations,
                Spaces with text and voice channels, Stories, DMs and group chats, curated News, and an analytics dashboard.
                Free to start; Pro and Premium unlock scheduling, post boosts, advanced analytics, and more.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                Community
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                Who it’s for
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                Strivon is for anyone building in public. Share your journey, get feedback, find collaborators,
                and connect with people who understand what you’re building.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Entrepreneurs", "Indie hackers", "Founders", "Creators", "Builders"].map((label) => (
                  <span
                    key={label}
                    className="smooth-nav-link rounded-full bg-[var(--accent-muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]/20"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-[var(--muted)]">
                <Link href="/pricing" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-2 hover:decoration-[var(--accent)]">
                  See Free, Pro, and Premium pricing →
                </Link>
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/95 px-8 py-12 text-center shadow-[var(--shadow-lg)] sm:px-14 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Ready to join?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              We&apos;re not live yet. Join the waitlist and we&apos;ll notify you when Strivon launches.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/waitlist"
                className="smooth-btn app-btn-primary inline-flex justify-center rounded-xl px-8 py-4 text-base font-semibold shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-hover)]"
              >
                Join the waitlist
              </Link>
            </div>
            </section>
          </ScrollReveal>
        </div>

        <footer className="border-t border-[var(--card-border)]/80 px-6 py-12 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <Link href="/" className="font-semibold text-[var(--foreground)]">
              Strivon
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
              <Link href="/about" className="smooth-nav-link hover:text-[var(--accent)]">About</Link>
              <Link href="/pricing" className="smooth-nav-link hover:text-[var(--accent)]">Pricing</Link>
              <Link href="/waitlist" className="smooth-nav-link hover:text-[var(--accent)]">Waitlist</Link>
              <Link href="/privacy" className="smooth-nav-link hover:text-[var(--accent)]">Privacy</Link>
              <Link href="/terms" className="smooth-nav-link hover:text-[var(--accent)]">Terms</Link>
            </nav>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} Strivon. All rights reserved.
          </p>
        </footer>
    </PageWithBackground>
  );
}
