"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

const nav = [
  { href: "/app/feed", label: "Home", icon: "home" },
  { href: "/app/spaces", label: "Spaces", icon: "grid" },
  { href: "/app/news", label: "News", icon: "newspaper" },
  { href: "/app/create", label: "Create", icon: "add" },
  { href: "/app/inbox", label: "Messages", icon: "mail" },
  { href: "/app/profile", label: "Profile", icon: "person" },
];

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  grid: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  newspaper: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v18.75c0 .621-.504 1.125-1.125 1.125h-3.375m0-3H21M10.5 21H5.625c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125h4.875M10.5 3v18" />
    </svg>
  ),
  add: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  mail: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  person: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isFirebaseEnabled } = useAuth();

  useEffect(() => {
    if (!loading && isFirebaseEnabled && !user) {
      router.replace("/app/sign-in");
    }
  }, [loading, user, isFirebaseEnabled, router]);

  if (loading || (isFirebaseEnabled && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="flex h-[4.25rem] items-center border-b border-[var(--card-border)] px-5">
          <Link href="/app/feed" className="smooth-nav-link flex items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--card)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] font-bold text-white shadow-sm">S</span>
            <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">Strivon</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`smooth-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-[var(--accent-muted)] text-[var(--accent)] dark:text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
                }`}
              >
                {icons[item.icon]}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--card-border)] p-3">
          <Link
            href="/"
            className="smooth-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>
      <main className="min-h-screen flex-1 pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-[var(--card-border)] bg-[var(--card)]/90 px-6 backdrop-blur-md">
          <h1 className="text-base font-semibold text-[var(--foreground)]">
            {nav.find((n) => n.href === pathname)?.label ?? "Strivon"}
          </h1>
          <Link
            href="/app/profile"
            className="smooth-nav-link flex items-center gap-2 rounded-full p-1.5 ring-2 ring-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:bg-[var(--accent-subtle)]"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--card-border)]" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white ring-2 ring-[var(--card-border)]">
                {user?.displayName?.[0] ?? user?.email?.[0] ?? "?"}
              </span>
            )}
          </Link>
        </header>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
