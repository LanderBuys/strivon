import { NextResponse } from "next/server";

export const dynamic = "force-static";

/** Static export: returns 503. Use a Node server (no output: "export") for real waitlist signup. */
export async function POST() {
  return NextResponse.json(
    { error: "Waitlist is not available. Please try again later." },
    { status: 503 }
  );
}
