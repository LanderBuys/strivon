import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-zinc-300 dark:text-zinc-600">404</p>
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This page doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
