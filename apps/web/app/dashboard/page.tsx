import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-6 py-24 sm:px-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Use the mobile app
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          The full Strivon experience is on iOS and Android. Download the app to access your feed, spaces, and messages.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/app/strivon"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get on App Store
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_PLAY_STORE_URL || "https://play.google.com/store/apps/details?id=com.strivon.mobile"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Get on Google Play
          </Link>
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
