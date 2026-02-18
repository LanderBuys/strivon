import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { ReportItem } from '@/lib/services/reportQueueService';

const REPORTS = 'reports';
const MODERATION = 'moderation';
const REMOVED_POSTS = 'removedPosts';

function toReportItem(id: string, d: Record<string, unknown>): ReportItem {
  return {
    id,
    type: (d.type as 'user' | 'post') || 'post',
    targetUserId: (d.targetUserId as string) || '',
    targetUserHandle: d.targetUserHandle as string | undefined,
    targetUserName: d.targetUserName as string | undefined,
    targetPostId: d.targetPostId as string | undefined,
    targetPostPreview: d.targetPostPreview as string | undefined,
    targetSpaceId: d.targetSpaceId as string | undefined,
    reason: (d.reason as string) || '',
    reporterId: (d.reporterId as string) || '',
    reporterHandle: d.reporterHandle as string | undefined,
    reporterName: d.reporterName as string | undefined,
    createdAt: (d.createdAt as string) || new Date().toISOString(),
    status: (d.status as 'pending' | 'dismissed' | 'removed') || 'pending',
  };
}

export async function addReportFirestore(params: {
  type: 'user' | 'post';
  targetUserId: string;
  targetUserHandle?: string;
  targetUserName?: string;
  targetPostId?: string;
  targetPostPreview?: string;
  targetSpaceId?: string;
  reason: string;
  reporterId: string;
  reporterHandle?: string;
  reporterName?: string;
}): Promise<ReportItem> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ref = doc(db, REPORTS, id);
  const data = {
    ...params,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await setDoc(ref, data);
  return toReportItem(id, data as Record<string, unknown>);
}

export async function getPendingReportsFirestore(): Promise<ReportItem[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, REPORTS),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => toReportItem(d.id, d.data() as Record<string, unknown>));
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export async function dismissReportFirestore(reportId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, REPORTS, reportId);
  await updateDoc(ref, { status: 'dismissed' });
}

export async function removeReportedContentFirestore(reportId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  await updateDoc(ref, { status: 'removed' });
  if (data?.type === 'post' && data?.targetPostId) {
    const removedRef = doc(db, MODERATION, REMOVED_POSTS);
    const removedSnap = await getDoc(removedRef);
    const current = (removedSnap.exists() ? removedSnap.data()?.postIds : []) || [];
    const postIds = Array.isArray(current) ? [...current, data.targetPostId] : [data.targetPostId];
    await setDoc(removedRef, { postIds }, { merge: true });
  }
}

export async function getRemovedPostIdsFirestore(): Promise<Set<string>> {
  const db = getFirestoreDb();
  if (!db) return new Set();
  const ref = doc(db, MODERATION, REMOVED_POSTS);
  const snap = await getDoc(ref);
  if (!snap.exists()) return new Set();
  const postIds = snap.data()?.postIds;
  return new Set(Array.isArray(postIds) ? postIds : []);
}
