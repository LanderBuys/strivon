import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <PageWithBackground>
      <SiteHeader />

      <main className="mx-auto flex min-h-[78vh] max-w-6xl flex-col items-center justify-end px-6 pb-28 pt-20 sm:px-8 sm:pb-32">
        <div className="flex flex-col items-center gap-10 text-center">
          <span className="animate-fade-in-up animation-delay-100 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-sm">
            For entrepreneurs &amp; creators
          </span>
          <h1 className="animate-fade-in-up max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white animation-delay-200 sm:text-5xl md:text-6xl lg:text-7xl">
            Share your journey.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-[var(--accent)] to-blue-400 bg-clip-text text-transparent">
              Connect with builders.
            </span>
          </h1>
          <p className="animate-fade-in-up max-w-xl text-lg leading-relaxed text-slate-300 animation-delay-300 sm:text-xl">
            A place to connect with like-minded people and consume helpful content—not endless noise.
          </p>
          <div className="animate-fade-in-up flex justify-center animation-delay-400">
            <Link
              href="/waitlist"
              className="smooth-btn group inline-flex items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-glow)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_12px_32px_rgba(14,165,233,0.25)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-slate-900/50 active:scale-[0.98] sm:min-w-[240px]"
            >
              Join the waitlist
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="animate-fade-in-up text-sm text-slate-400 animation-delay-500">
            We&apos;re not live yet—join the waitlist to get notified at launch.
          </p>
        </div>
      </main>

      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
        <ScrollReveal>
          <section className="mb-24 sm:mb-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Why it matters</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Why networking is important
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
              Building something—a product, an audience, a career—is easier when you're connected to people who get it.
              Networking isn't just contacts; it's feedback, collaborators, customers, and friends who keep you going.
              Strivon exists so you can find those people and stay in each other's corner instead of scrolling alone.
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-24 sm:mb-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Purpose &amp; vision</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Connect people. Consume what helps.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
              The purpose of Strivon is to connect people and to help you step back from social media that wastes your time.
              We want you to spend less time doom-scrolling and more time consuming information that actually helps—build logs,
              real questions, honest wins and losses, and conversations with people on the same path.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
              Our vision is simple: a platform where you can meet like-minded people and consume only helpful content.
              No algorithm slop, no brainrot—just signal from builders and creators who share what they're learning and doing.
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-24 sm:mb-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">The platform</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              What is Strivon?
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
              Strivon is a social app for people who build. You get a personalized feed (For You, Following, Spaces),
              post types built for builders—Build Logs, Questions, Wins &amp; Losses, Collaborations—threaded conversations,
              Spaces with text and voice channels, Stories, DMs and group chats, curated News, and an analytics dashboard.
              Free to start; Pro and Premium unlock scheduling, post boosts, advanced analytics, and more.
            </p>
            <p className="mt-4 max-w-3xl text-sm text-slate-400">
              At launch, Strivon will be available on iOS, Android, and the web.
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="mb-24 sm:mb-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Community</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Who it's for
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
              Strivon is for anyone building in public. Share your journey, get feedback, find collaborators,
              and connect with people who understand what you're building.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Entrepreneurs", "Indie hackers", "Founders", "Creators", "Builders"].map((label) => (
                <span
                  key={label}
                  className="smooth-nav-link rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-sm hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-white"
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-8 text-slate-400">
              <Link href="/pricing" className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-4 hover:decoration-[var(--accent)]">
                See Free, Pro, and Premium pricing →
              </Link>
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal variant="scale">
          <section className="rounded-2xl border border-white/15 bg-white/5 px-8 py-14 text-center backdrop-blur-sm sm:px-14 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to join?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-300">
              We're not live yet. Join the waitlist and we'll notify you when Strivon launches.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/waitlist"
                className="smooth-btn group inline-flex items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-glow)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_12px_32px_rgba(14,165,233,0.25)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-slate-900/50 active:scale-[0.98]"
              >
                Join the waitlist
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>

      <footer className="border-t border-white/10 px-6 py-14 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-xs font-bold text-white">S</span>
            Strivon
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
            <Link href="/about" className="smooth-nav-link hover:text-white">About</Link>
            <Link href="/pricing" className="smooth-nav-link hover:text-white">Pricing</Link>
            <Link href="/waitlist" className="smooth-nav-link hover:text-white">Waitlist</Link>
            <Link href="/privacy" className="smooth-nav-link hover:text-white">Privacy</Link>
            <Link href="/terms" className="smooth-nav-link hover:text-white">Terms</Link>
            <Link href="/contact" className="smooth-nav-link hover:text-white">Contact</Link>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Strivon. All rights reserved.
        </p>
      </footer>
    </PageWithBackground>
  );
}
