import Link from "next/link";
import { PageWithBackground } from "@/components/PageWithBackground";
import { ScrollReveal } from "@/components/ScrollReveal";

const featureIcons = {
  feed: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  posts: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  spaces: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  stories: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.302 8.302 0 0115.362 5.214zm-3.997 3.42a2.25 2.25 0 00-3.086 2.415L12 15.75l4.72-4.72a2.25 2.25 0 00-3.086-2.415l-1.634 1.634a.75.75 0 01-1.06 0l-1.634-1.634z" />
    </svg>
  ),
  inbox: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  news: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

export default function Home() {
  return (
    <PageWithBackground>
      {/* Header */}
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

        {/* Hero — strivonbackgroundimage shows through page background */}
        <main className="mx-auto flex min-h-[72vh] max-w-6xl flex-col items-center justify-end px-6 pb-24 pt-16 sm:px-8 sm:pb-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="animate-fade-in-up animation-delay-100 rounded-full border border-zinc-300 bg-white/90 px-4 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-300">
              For entrepreneurs &amp; creators
            </span>
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl md:text-6xl animation-delay-200">
              Share your journey.
              <br />
              <span className="text-zinc-600 dark:text-zinc-400">Connect with builders.</span>
            </h1>
            <p className="animate-fade-in-up max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 animation-delay-300">
              A place to connect with like-minded people and consume helpful content—not endless noise.
            </p>
            <div className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row sm:gap-6 animation-delay-400">
              <Link
                href="/waitlist"
                className="smooth-btn w-full rounded-full bg-zinc-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:scale-[1.02] hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
              >
                Join the waitlist
              </Link>
              <Link
                href="/about"
                className="smooth-nav-link text-sm font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Learn more →
              </Link>
            </div>
            <p className="animate-fade-in-up text-xs text-zinc-500 dark:text-zinc-500 animation-delay-500">
              We&apos;re not live yet—join the waitlist to get notified at launch.
            </p>
          </div>
        </main>

        {/* Content sections — animate on scroll */}
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24">
          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Why it matters
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Why networking is important
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Building something—a product, an audience, a career—is easier when you’re connected to people who get it.
                Networking isn’t just contacts; it’s feedback, collaborators, customers, and friends who keep you going.
                Strivon exists so you can find those people and stay in each other’s corner instead of scrolling alone.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Purpose &amp; vision
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Connect people. Consume what helps.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                The purpose of Strivon is to connect people and to help you step back from social media that wastes your time.
                We want you to spend less time doom-scrolling and more time consuming information that actually helps—build logs,
                real questions, honest wins and losses, and conversations with people on the same path.
              </p>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Our vision is simple: a platform where you can meet like-minded people and consume only helpful content.
                No algorithm slop, no brainrot—just signal from builders and creators who share what they’re learning and doing.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                The platform
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                What is Strivon?
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Strivon is a social app for people who build. You get a personalized feed (For You, Following, Spaces),
                post types built for builders—Build Logs, Questions, Wins &amp; Losses, Collaborations—threaded conversations,
                Spaces with text and voice channels, Stories, DMs and group chats, curated News, and an analytics dashboard.
                Free to start; Pro and Premium unlock scheduling, post boosts, advanced analytics, and more.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                In the app
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                What you get
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
                The same features you’ll use every day in the Strivon app.
              </p>
              <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: "feed", title: "Feed", desc: "For You, Following, and Spaces tabs. Sort by newest or engagement. Content filters and pull-to-refresh.", icon: featureIcons.feed },
                  { key: "posts", title: "Posts & threads", desc: "Post as Build Log, Question, Win/Loss, Collab, or Content. Threaded replies, polls, media. Boost posts with Pro.", icon: featureIcons.posts },
                  { key: "spaces", title: "Spaces", desc: "Join or create communities with text and voice channels, announcements, events, and pinned resources.", icon: featureIcons.spaces },
                  { key: "stories", title: "Stories", desc: "24h stories for everyone. Pro: 48h and unlimited per day. Premium: 7-day stories.", icon: featureIcons.stories },
                  { key: "inbox", title: "Messages", desc: "DMs and group chats. Pro: up to 50 in a group. Premium: up to 500. Share posts and news into threads.", icon: featureIcons.inbox },
                  { key: "news", title: "News & analytics", desc: "Curated news feed. Pro/Premium: full analytics dashboard—reach, engagement, growth over time.", icon: featureIcons.news },
                ].map(({ key, title, desc, icon }) => (
                  <li
                    key={key}
                    className="smooth-card group rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-transform duration-200 ease-out group-hover:scale-105 group-hover:bg-zinc-200 group-hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-100">
                      {icon}
                    </span>
                    <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {desc}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <section className="mb-20 sm:mb-28">
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Community
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Who it’s for
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Strivon is for anyone building in public. Share your journey, get feedback, find collaborators,
                and connect with people who understand what you’re building.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Entrepreneurs", "Indie hackers", "Founders", "Creators", "Builders"].map((label) => (
                  <span
                    key={label}
                    className="smooth-nav-link rounded-full bg-zinc-200/80 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300/80 dark:bg-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-600/80"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-zinc-600 dark:text-zinc-400">
                <Link href="/pricing" className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-200 dark:hover:decoration-zinc-400">
                  See Free, Pro, and Premium pricing →
                </Link>
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <section className="rounded-2xl border border-zinc-200 bg-white/95 px-8 py-12 text-center shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95 sm:px-14 sm:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Ready to join?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
              We&apos;re not live yet. Join the waitlist and we&apos;ll notify you when Strivon launches.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/waitlist"
                className="smooth-btn inline-flex justify-center rounded-full bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:scale-[1.02] hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Join the waitlist
              </Link>
            </div>
            </section>
          </ScrollReveal>
        </div>

        <footer className="border-t border-zinc-200/80 px-6 py-12 dark:border-zinc-700/80 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">Strivon</span>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/about" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">
                About
              </Link>
              <Link href="/pricing" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">
                Pricing
              </Link>
              <Link href="/waitlist" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">
                Join the waitlist
              </Link>
              <Link href="/privacy" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">
                Privacy
              </Link>
              <Link href="/terms" className="smooth-nav-link hover:text-zinc-900 dark:hover:text-zinc-100">
                Terms
              </Link>
            </nav>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()} Strivon. All rights reserved.
          </p>
        </footer>
    </PageWithBackground>
  );
}
