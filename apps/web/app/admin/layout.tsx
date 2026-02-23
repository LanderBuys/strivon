"use client";

import "./admin.css";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { isAdmin } from "@/lib/admin";
import { AdminMockProvider } from "./MockContext";
import { MockToggle } from "./MockContext";

interface Props {
  children: React.ReactNode;
}

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/fake-accounts", label: "Fake accounts" },
] as const;

export default function AdminLayout(props: Props) {
  const { children } = props;
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "denied" | "ok" | "timeout">("loading");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) meta.setAttribute("content", "noindex, nofollow");
    else {
      const el = document.createElement("meta");
      el.name = "robots";
      el.content = "noindex, nofollow";
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setStatus("ok");
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;

    const checkAdmin = async (user: { email: string | null; getIdToken?: (forceRefresh?: boolean) => Promise<string> }) => {
      const email = user?.email ?? undefined;
      if (!email) {
        router.replace("/admin/login");
        return;
      }
      const tryCheck = async (): Promise<boolean> => {
        const ok = await isAdmin(email);
        if (cancelled) return false;
        return ok;
      };
      try {
        let ok = await tryCheck();
        if (cancelled) return;
        if (!ok) {
          setStatus("denied");
          return;
        }
        if (user.getIdToken) {
          try {
            await user.getIdToken(true);
          } catch {
            // ignore refresh error
          }
        }
        ok = await tryCheck();
        if (cancelled) return;
        if (!ok) {
          setStatus("denied");
          return;
        }
        setStatus("ok");
        setAdminEmail(email);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        const code = (err as { code?: string })?.code;
        const isAuthError =
          code === "permission-denied" ||
          code === "unauthenticated" ||
          code === "auth/network-request-failed" ||
          msg.includes("permission-denied") ||
          msg.includes("PERMISSION_DENIED") ||
          msg.includes("unauthenticated") ||
          msg.includes("Missing or insufficient permissions");
        if (isAuthError) {
          try {
            await signOut(auth);
          } catch {
            // ignore
          }
          router.replace("/admin/login?expired=1");
          return;
        }
        setStatus("denied");
      }
    };

    const user = auth.currentUser;
    if (user) {
      checkAdmin(user);
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (cancelled) return;
      if (!firebaseUser) {
        router.replace("/admin/login");
        return;
      }
      checkAdmin(firebaseUser);
    });

    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      setStatus((s) => (s === "loading" ? "timeout" : s));
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, [pathname, router]);

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setSigningOut(true);
    try {
      await signOut(auth);
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#a78bfa] animate-spin" />
          <p className="text-sm text-slate-400">Checking access…</p>
        </div>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0c0d0f]">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-sm p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-amber-200">Taking too long</h1>
          <p className="mt-2 text-sm text-slate-400">Sign-in or connection may have stalled. Try again from the login page.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admin/login" className="rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 px-4 py-2.5 text-sm font-medium hover:bg-violet-500/30 transition-colors">
              Sign in again
            </Link>
            <Link href="/" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    const handleDeniedSignOut = async () => {
      const auth = getFirebaseAuth();
      if (auth) {
        setSigningOut(true);
        try {
          await signOut(auth);
          router.replace("/admin/login");
          router.refresh();
        } finally {
          setSigningOut(false);
        }
      } else {
        router.replace("/admin/login");
      }
    };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0c0d0f]">
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 backdrop-blur-sm p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-red-200">Access denied</h1>
          <p className="mt-2 text-sm text-slate-400">
            This account is not an admin. Sign out and sign in with an admin account, or get your email added to Firestore (config/admins).
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDeniedSignOut}
              disabled={signingOut}
              className="rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500/30 disabled:opacity-50 transition-colors"
            >
              {signingOut ? "Signing out…" : "Sign out and go to login"}
            </button>
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminMockProvider>
      <div className="admin-shell min-h-screen text-slate-200 flex">
        {/* Sidebar — desktop */}
        <aside className="admin-sidebar hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 lg:z-20">
          <div className="flex h-14 items-center gap-2 px-4 border-b border-white/5">
            <span className="text-sm font-semibold text-violet-400">Strivon</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Admin</span>
          </div>
          <nav className="flex-1 space-y-0.5 p-3">
            {NAV.map(({ href, label }) => {
              const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="admin-nav-link block"
                  data-active={isActive ? "true" : "false"}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/5 p-3 space-y-2">
            <MockToggle />
            {adminEmail && (
              <p className="text-[10px] text-slate-500 truncate px-2" title={adminEmail}>
                {adminEmail}
              </p>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="admin-btn-ghost w-full px-3 py-2 text-left text-sm"
            >
              {signingOut ? "…" : "Sign out"}
            </button>
            <Link href="/" className="admin-btn-ghost block w-full px-3 py-2 text-center text-sm">
              Back to site
            </Link>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`admin-sidebar fixed inset-y-0 left-0 z-40 w-56 flex flex-col lg:hidden transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/5">
            <span className="text-sm font-semibold text-violet-400">Strivon Admin</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 p-3 overflow-auto">
            {NAV.map(({ href, label }) => {
              const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className="admin-nav-link block"
                  data-active={isActive ? "true" : "false"}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/5 p-3 space-y-2">
            <MockToggle />
            {adminEmail && <p className="text-[10px] text-slate-500 truncate px-2">{adminEmail}</p>}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="admin-btn-ghost w-full px-3 py-2 text-left text-sm"
            >
              {signingOut ? "…" : "Sign out"}
            </button>
            <Link href="/" className="admin-btn-ghost block w-full px-3 py-2 text-center text-sm" onClick={() => setSidebarOpen(false)}>
              Back to site
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:pl-56 min-w-0">
          <header className="admin-header sticky top-0 z-10 flex h-14 items-center gap-4 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0" />
            <div className="hidden lg:flex items-center gap-3">
              {adminEmail && (
                <span className="text-xs text-slate-500 truncate max-w-[180px]" title={adminEmail}>
                  {adminEmail}
                </span>
              )}
              <MockToggle />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="admin-btn-ghost px-3 py-1.5 text-xs"
              >
                {signingOut ? "…" : "Sign out"}
              </button>
              <Link href="/" className="admin-btn-ghost px-3 py-1.5 text-xs">
                Site
              </Link>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminMockProvider>
  );
}
