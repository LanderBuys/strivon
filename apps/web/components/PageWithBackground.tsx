import type { ReactNode } from "react";

/** Full-bleed background. For sharp quality use a high-res image: see public/BACKGROUND_IMAGE.md */
export function PageWithBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen font-sans">
      <img
        src="/strivonbackgroundimagedesktop.jpeg"
        alt=""
        className="hero-bg-image absolute inset-0 h-full w-full select-none pointer-events-none object-cover object-top"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/60" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}
