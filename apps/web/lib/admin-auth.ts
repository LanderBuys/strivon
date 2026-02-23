import { NextRequest } from "next/server";
import { getFirebaseAdmin, getFirebaseAdminFirestore } from "./firebase-admin";

const CONFIG_ADMINS = "config/admins";

function getEnvAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();
  if (!raw) return [];
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Verify the request is from an admin: Bearer token must be valid and the user's email
 * must be in config/admins (Firestore) or NEXT_PUBLIC_ADMIN_EMAIL. Returns the admin email or null.
 */
export async function getAdminFromRequest(request: NextRequest): Promise<{ email: string } | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const admin = getFirebaseAdmin();
  if (!admin) return null;
  let decoded: { email?: string };
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
  const email = (decoded.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const fromEnv = getEnvAdminEmails();
  if (fromEnv.includes(email)) return { email };

  const db = getFirebaseAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.doc(CONFIG_ADMINS).get();
    const data = snap.data();
    const emails = (data?.emails as string[] | undefined) ?? [];
    const allowed = emails.some((e) => String(e).trim().toLowerCase() === email);
    return allowed ? { email } : null;
  } catch {
    return null;
  }
}
