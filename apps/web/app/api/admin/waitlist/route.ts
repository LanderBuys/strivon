import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase-admin";
import { getAdminFromRequest } from "@/lib/admin-auth";

const COLLECTION = "waitlist";
const MAX_ENTRIES = 500;

export interface WaitlistEntryResponse {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getFirebaseAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "Server not configured for Firestore" },
      { status: 503 }
    );
  }

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(MAX_ENTRIES)
      .get();

    const entries: WaitlistEntryResponse[] = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt;
      const createdAtStr =
        typeof createdAt === "string"
          ? createdAt
          : createdAt?.toDate?.()?.toISOString?.() ?? "";
      return {
        id: d.id,
        email: (data.email as string) ?? "",
        name: (data.name as string | null | undefined) ?? null,
        createdAt: createdAtStr,
      };
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[admin/waitlist] Error reading waitlist:", err);
    return NextResponse.json(
      { error: "Failed to load waitlist" },
      { status: 500 }
    );
  }
}
