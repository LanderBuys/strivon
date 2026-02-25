"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isProfileIncomplete } from "@/lib/firestore/users";

const ONBOARDING_KEY = "strivon_onboarding_completed";

function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== "true";
  } catch {
    return true;
  }
}

export default function AppEntryPage() {
  const router = useRouter();
  const { user, loading: authLoading, isFirebaseEnabled } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (authLoading) return;
      if (!mounted) return;
      if (isFirebaseEnabled && !user) {
        const showOnboarding = shouldShowOnboarding();
        if (showOnboarding) router.replace("/app/onboarding");
        else router.replace("/app/sign-in");
        setChecking(false);
        return;
      }
      if (!isFirebaseEnabled) {
        const showOnboarding = shouldShowOnboarding();
        if (showOnboarding) router.replace("/app/onboarding");
        else router.replace("/app/feed");
        setChecking(false);
        return;
      }
      try {
        const showOnboarding = shouldShowOnboarding();
        if (showOnboarding) {
          router.replace("/app/onboarding");
          setChecking(false);
          return;
        }
        if (!user!.emailVerified) {
          router.replace("/app/verify-email");
          setChecking(false);
          return;
        }
        const profileIncomplete = await isProfileIncomplete(user!.uid);
        if (!mounted) return;
        if (profileIncomplete) router.replace("/app/complete-profile");
        else router.replace("/app/feed");
      } catch {
        if (mounted) router.replace("/app/feed");
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, user, authLoading, isFirebaseEnabled]);

  if (!checking) return null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
    </div>
  );
}
