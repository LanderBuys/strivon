import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { Space } from "@/types/post";

const SPACES = "spaces";
const SPACE_MEMBERS = "spaceMembers";

function toSpace(id: string, d: Record<string, unknown>, isJoined?: boolean): Space {
  const channels = (d.channels as Array<{ id: string; name: string; description?: string }>) || [];
  return {
    id,
    name: (d.name as string) || "Space",
    description: (d.description as string) || "",
    icon: d.icon as string | undefined,
    color: (d.color as string) || "#0d9488",
    category: d.category as string | undefined,
    memberCount: (d.memberCount as number) ?? 0,
    banner: d.banner as string | undefined,
    channels: channels.map((ch) => ({ id: ch.id || ch.name, name: ch.name })),
    ownerId: d.ownerId as string | undefined,
    isJoined,
  };
}

export async function getSpacesFirestore(uid: string): Promise<Space[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const q = query(collection(db, SPACES), orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    const spaceIds = snap.docs.map((d) => d.id);
    const joinedSet = new Set<string>();
    if (uid && spaceIds.length > 0) {
      const memberSnap = await getDocs(query(collection(db, SPACE_MEMBERS), where("userId", "==", uid)));
      memberSnap.docs.forEach((d) => {
        const sid = d.data().spaceId as string;
        if (sid) joinedSet.add(sid);
      });
    }
    return snap.docs.map((d) => toSpace(d.id, d.data() as Record<string, unknown>, joinedSet.has(d.id)));
  } catch {
    return [];
  }
}

export async function getSpaceByIdFirestore(spaceId: string, uid?: string): Promise<Space | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = doc(db, SPACES, spaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  let isJoined = false;
  if (uid) {
    const memberRef = doc(db, SPACE_MEMBERS, `${spaceId}_${uid}`);
    const memberSnap = await getDoc(memberRef);
    isJoined = memberSnap.exists();
  }
  return toSpace(snap.id, snap.data() as Record<string, unknown>, isJoined);
}

export async function joinSpaceFirestore(spaceId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, SPACE_MEMBERS, `${spaceId}_${userId}`);
  const spaceRef = doc(db, SPACES, spaceId);
  const batch = writeBatch(db);
  batch.set(ref, { spaceId, userId, role: "member", joinedAt: new Date().toISOString() });
  batch.update(spaceRef, { memberCount: increment(1) });
  await batch.commit();
}

export async function leaveSpaceFirestore(spaceId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, SPACE_MEMBERS, `${spaceId}_${userId}`);
  const spaceRef = doc(db, SPACES, spaceId);
  const batch = writeBatch(db);
  batch.delete(ref);
  batch.update(spaceRef, { memberCount: increment(-1) });
  await batch.commit();
}
