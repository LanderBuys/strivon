import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://strivon.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Strivon", template: "%s | Strivon" },
  description: "A social platform for entrepreneurs, builders, and creators. Share your journey, join spaces, and connect with like-minded people.",
  keywords: ["social", "entrepreneurs", "creators", "community", "spaces", "Strivon"],
  authors: [{ name: "Strivon" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Strivon",
    title: "Strivon – Social for builders and creators",
    description: "Share your journey, join spaces, and connect with like-minded people.",
    images: [{ url: "/logoStrivon.png", width: 512, height: 512, alt: "Strivon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Strivon – Social for builders and creators",
    description: "Share your journey, join spaces, and connect with like-minded people.",
    images: ["/logoStrivon.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fafafa" }, { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
