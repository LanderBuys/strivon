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
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { Space, SpaceMember } from '@/types/post';
import { getFirestoreUser } from './users';

const SPACES = 'spaces';
const SPACE_MEMBERS = 'spaceMembers';

function toSpace(id: string, d: Record<string, unknown>, isJoined?: boolean): Space {
  const channels = (d.channels as Array<{ id: string; name: string; description?: string; type?: string }>) || [];
  return {
    id,
    name: (d.name as string) || 'Space',
    description: (d.description as string) || '',
    iconImage: d.iconImage as string | undefined,
    color: (d.color as string) || '#1D9BF0',
    category: d.category as string | undefined,
    memberCount: (d.memberCount as number) ?? 0,
    banner: d.banner as string | undefined,
    channels: channels.map((ch) => ({
      id: ch.id || ch.name,
      name: ch.name,
      description: ch.description,
      type: (ch.type as 'text' | 'voice' | 'announcement') || 'text',
    })),
    rules: d.rules as string[] | undefined,
    guidelines: d.guidelines as string | undefined,
    tags: d.tags as string[] | undefined,
    pinnedResources: d.pinnedResources as Space['pinnedResources'] | undefined,
    createdAt: (d.createdAt as string) || new Date().toISOString(),
    ownerId: d.ownerId as string | undefined,
    isPrivate: !!d.isPrivate,
    requiresApproval: !!d.requiresApproval,
    isJoined,
  };
}

export async function getSpacesFirestore(uid: string): Promise<Space[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, SPACES), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  const spaceIds = snap.docs.map((d) => d.id);
  const joinedSet = new Set<string>();
  if (uid && spaceIds.length > 0) {
    const memberSnap = await getDocs(
      query(collection(db, SPACE_MEMBERS), where('userId', '==', uid))
    );
    memberSnap.docs.forEach((d) => {
      const sid = d.data().spaceId as string;
      if (sid) joinedSet.add(sid);
    });
  }
  return snap.docs.map((d) => toSpace(d.id, d.data() as Record<string, unknown>, joinedSet.has(d.id)));
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

export async function createSpaceFirestore(
  ownerId: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    color?: string;
    channels?: Array<{ name: string; description?: string }>;
    isPrivate?: boolean;
    requiresApproval?: boolean;
    rules?: string[];
    guidelines?: string;
    tags?: string[];
  }
): Promise<Space> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const id = `space-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const channels = data.channels?.length
    ? data.channels.map((ch, i) => ({
        id: `${id}-${i + 1}`,
        name: ch.name,
        description: ch.description,
        type: 'text' as const,
      }))
    : [{ id: `${id}-1`, name: 'general', description: 'General discussions', type: 'text' as const }];
  const spaceData = {
    name: data.name.trim(),
    description: (data.description || '').trim(),
    category: data.category,
    color: data.color || '#1D9BF0',
    ownerId,
    memberCount: 1,
    channels,
    isPrivate: !!data.isPrivate,
    requiresApproval: !!data.requiresApproval,
    rules: data.rules || [],
    guidelines: (data.guidelines || '').trim(),
    tags: data.tags || [],
    createdAt: new Date().toISOString(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, SPACES, id), spaceData);
  batch.set(doc(db, SPACE_MEMBERS, `${id}_${ownerId}`), {
    spaceId: id,
    userId: ownerId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  });
  await batch.commit();
  return toSpace(id, spaceData as Record<string, unknown>, true);
}

export async function joinSpaceFirestore(spaceId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, SPACE_MEMBERS, `${spaceId}_${userId}`);
  const spaceRef = doc(db, SPACES, spaceId);
  const batch = writeBatch(db);
  batch.set(ref, {
    spaceId,
    userId,
    role: 'member',
    joinedAt: new Date().toISOString(),
  });
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

export async function updateSpaceFirestore(
  spaceId: string,
  ownerId: string,
  uid: string | undefined,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    color: string;
    iconImage: string;
    banner: string;
    isPrivate: boolean;
    requiresApproval: boolean;
    rules: string[];
    guidelines: string;
    tags: string[];
    pinnedResources: Space['pinnedResources'];
    channels: Space['channels'];
  }>
): Promise<Space | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = doc(db, SPACES, spaceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const existing = snap.data() as Record<string, unknown>;
  if ((existing.ownerId as string) !== ownerId) return null;
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.category !== undefined) updates.category = data.category;
  if (data.color !== undefined) updates.color = data.color;
  if (data.iconImage !== undefined) updates.iconImage = data.iconImage;
  if (data.banner !== undefined) updates.banner = data.banner;
  if (data.isPrivate !== undefined) updates.isPrivate = data.isPrivate;
  if (data.requiresApproval !== undefined) updates.requiresApproval = data.requiresApproval;
  if (data.rules !== undefined) updates.rules = data.rules;
  if (data.guidelines !== undefined) updates.guidelines = data.guidelines;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.pinnedResources !== undefined) updates.pinnedResources = data.pinnedResources;
  if (data.channels !== undefined) updates.channels = data.channels;
  if (Object.keys(updates).length === 0) {
    let isJoined = false;
    if (uid) {
      const memberSnap = await getDoc(doc(db, SPACE_MEMBERS, `${spaceId}_${uid}`));
      isJoined = memberSnap.exists();
    }
    return toSpace(spaceId, existing, isJoined);
  }
  await setDoc(ref, { ...existing, ...updates }, { merge: true });
  const updatedSnap = await getDoc(ref);
  let isJoined = false;
  if (uid) {
    const memberSnap = await getDoc(doc(db, SPACE_MEMBERS, `${spaceId}_${uid}`));
    isJoined = memberSnap.exists();
  }
  return toSpace(spaceId, updatedSnap.data() as Record<string, unknown>, isJoined);
}

export async function getSpaceMembersFirestore(spaceId: string): Promise<SpaceMember[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, SPACE_MEMBERS),
    where('spaceId', '==', spaceId)
  );
  const snap = await getDocs(q);
  const members: SpaceMember[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const userId = data.userId as string;
    const user = await getFirestoreUser(userId);
    if (user)
      members.push({
        id: d.id,
        user: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          label: user.label,
        },
        role: (data.role as 'owner' | 'admin' | 'moderator' | 'member') || 'member',
        joinedAt: (data.joinedAt as string) || new Date().toISOString(),
      });
  }
  return members;
}
