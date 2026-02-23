import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Strivon isn't live yet. Join the waitlist and we'll notify you when we launch.",
};

export default function WaitlistLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
