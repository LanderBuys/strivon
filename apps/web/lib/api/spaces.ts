import { getFirestoreDb } from "@/lib/firebase";
import { getCurrentUserIdOrFallback } from "./users";
import {
  getSpacesFirestore,
  getSpaceByIdFirestore,
  joinSpaceFirestore,
  leaveSpaceFirestore,
} from "@/lib/firestore/spaces";
import type { Space } from "@/types/post";
import { mockSpaces } from "@/lib/mocks/spaces";

export async function getSpaces(): Promise<Space[]> {
  const db = getFirestoreDb();
  const uid = getCurrentUserIdOrFallback();
  if (db) {
    try {
      const spaces = await getSpacesFirestore(uid);
      if (spaces.length > 0) return spaces;
    } catch {
      // fallback to mocks
    }
  }
  return mockSpaces;
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const db = getFirestoreDb();
  const uid = getCurrentUserIdOrFallback();
  const fromMock = mockSpaces.find((s) => s.id === id) ?? null;
  if (!db) return fromMock;
  try {
    const space = await getSpaceByIdFirestore(id, uid);
    if (space) return space;
  } catch {
    // fallback
  }
  return fromMock;
}

export async function joinSpace(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured. Sign in and try again.");
  await joinSpaceFirestore(id, getCurrentUserIdOrFallback());
}

export async function leaveSpace(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured. Sign in and try again.");
  await leaveSpaceFirestore(id, getCurrentUserIdOrFallback());
}
