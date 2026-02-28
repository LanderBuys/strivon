import { NextResponse } from "next/server";

export const dynamic = "force-static";

export interface WaitlistEntryResponse {
  id: string;
  email: string;
  name?: string | null;
  country?: string | null;
  createdAt: string;
}

/** Static export: returns empty list. Use a Node server (no output: "export") for real admin API. */
export async function GET() {
  return NextResponse.json({ entries: [] as WaitlistEntryResponse[] });
}
