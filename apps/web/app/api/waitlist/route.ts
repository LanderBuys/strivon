import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminFirestore, serverTimestamp } from "@/lib/firebase-admin";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const COLLECTION = "waitlist";

export async function POST(request: NextRequest) {
  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!rawEmail) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, 200)
      : null;

  const db = getFirebaseAdminFirestore();
  if (!db) {
    return NextResponse.json(
      { error: "Waitlist is not available. Please try again later." },
      { status: 503 }
    );
  }

  try {
    await db.collection(COLLECTION).add({
      email: rawEmail.slice(0, 256),
      ...(name ? { name } : {}),
      createdAt: serverTimestamp(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    console.error("Waitlist signup error:", err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: number }).code : undefined;
    const reason = err && typeof err === "object" && "reason" in err ? (err as { reason: string }).reason : undefined;
    if (code === 7 || reason === "SERVICE_DISABLED") {
      return NextResponse.json(
        { error: "Firestore is not enabled for this project. Enable the Cloud Firestore API in Google Cloud Console, then try again in a few minutes." },
        { status: 503 }
      );
    }
    if (code === 5) {
      return NextResponse.json(
        { error: "Firestore database not found. In Firebase Console → Firestore, create a database (e.g. start in production mode, choose a region), then try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
