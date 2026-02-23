import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "./firebase";

export type WaitlistEntry = {
  email: string;
  name?: string | null;
  createdAt: ReturnType<typeof serverTimestamp>;
};

const COLLECTION = "waitlist";

/** Add an email (and optional name) to the waitlist. Requires Firebase configured. */
export async function addToWaitlist(email: string, name?: string | null): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Waitlist is not available. Please try again later.");
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Please enter your email.");
  const nameTrimmed = name?.trim() || null;
  await addDoc(collection(db, COLLECTION), {
    email: trimmed,
    ...(nameTrimmed ? { name: nameTrimmed } : {}),
    createdAt: serverTimestamp(),
  } as WaitlistEntry);
}
