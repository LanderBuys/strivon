import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20 sm:px-8">
        <div className="flex flex-col items-center gap-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Strivon
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            A social platform for entrepreneurs, builders, and creators. Share your journey,
            join spaces, and connect with like-minded people.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get the app
            </Link>
            <Link
              href="/"
              className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Learn more
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
