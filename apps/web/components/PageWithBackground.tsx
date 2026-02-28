import type { ReactNode } from "react";

/** Full-bleed background. Fixed to viewport so grey body never shows when resizing or scrolling. */
export function PageWithBackground({ children }: { children: ReactNode }) {
  return (
    <div className="page-with-bg relative min-h-screen w-full min-w-full overflow-x-hidden font-sans">
      {/* Background image — fixed to viewport so it always covers */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url(/strivonbackgroundimagedesktop.jpeg)" }}
        aria-hidden
      />
      {/* Gradient overlay for readability and depth */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.75) 50%, rgba(15,23,42,0.92) 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 isolate">{children}</div>
    </div>
  );
}
