"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const ONBOARDING_KEY = "strivon_onboarding_completed";

const slides = [
  {
    id: "1",
    title: "Welcome to Strivon",
    description:
      "A modern social platform for entrepreneurs, builders, and creators to share their journey and connect with like-minded individuals.",
    icon: "rocket",
  },
  {
    id: "2",
    title: "Share Your Journey",
    description:
      "Post updates, build logs, questions, wins, and collaborate with others in your community.",
    icon: "document",
  },
  {
    id: "3",
    title: "Join Spaces",
    description:
      "Discover and join communities around topics you care about. Connect with experts and learn from others.",
    icon: "people",
  },
  {
    id: "4",
    title: "Stay Connected",
    description:
      "Message friends, get notifications, and never miss important updates from your network.",
    icon: "chat",
  },
];

const icons: Record<string, React.ReactNode> = {
  rocket: (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  ),
  document: (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  people: (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chat: (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 003.293-.369c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { isFirebaseEnabled } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {}
    if (isFirebaseEnabled) router.replace("/app/sign-in");
    else router.replace("/app/feed");
  }, [router, isFirebaseEnabled]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) setCurrentIndex((i) => i + 1);
    else handleComplete();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const slide = slides[currentIndex];

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900">
      <Image
        src="/strivonbackgroundimagedesktop.jpeg"
        alt=""
        fill
        className="object-cover opacity-60"
        priority
      />
      <div className="relative flex min-h-screen flex-col">
        <header className="flex justify-end p-6">
          {currentIndex < slides.length - 1 ? (
            <button
              type="button"
              onClick={handleComplete}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              Skip
            </button>
          ) : (
            <span className="w-14" />
          )}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="w-full max-w-md text-center">
            {slide.id !== "1" && (
              <div className="mb-8 flex justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-white">
                  {icons[slide.icon]}
                </div>
              </div>
            )}
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">{slide.title}</h1>
            <p className="text-lg leading-relaxed text-zinc-300">{slide.description}</p>
          </div>
        </main>

        <footer className="space-y-6 p-6 pb-10">
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-4">
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 py-3.5 font-semibold text-white hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-semibold text-zinc-900 hover:bg-zinc-100 ${
                currentIndex === 0 ? "" : ""
              }`}
            >
              {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
              {currentIndex < slides.length - 1 && (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
