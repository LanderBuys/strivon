import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestoreDb } from '@/lib/firebase';
import {
  addReportFirestore,
  getPendingReportsFirestore,
  dismissReportFirestore,
  removeReportedContentFirestore,
  getRemovedPostIdsFirestore,
} from '@/lib/firestore/reports';

const REPORT_QUEUE_KEY = '@strivon_report_queue';
const REMOVED_POST_IDS_KEY = '@strivon_removed_post_ids';

export type ReportTargetType = 'user' | 'post';

export interface ReportItem {
  id: string;
  type: ReportTargetType;
  /** For user reports: reported user id. For post: post author id (for context). */
  targetUserId: string;
  targetUserHandle?: string;
  targetUserName?: string;
  /** For post reports only */
  targetPostId?: string;
  targetPostPreview?: string;
  targetSpaceId?: string;
  reason: string;
  reporterId: string;
  reporterHandle?: string;
  reporterName?: string;
  createdAt: string;
  status: 'pending' | 'dismissed' | 'removed';
}

let inMemoryQueue: ReportItem[] = [];
let inMemoryRemovedIds: Set<string> = new Set();
let queueLoaded = false;
let removedLoaded = false;

async function loadQueue(): Promise<ReportItem[]> {
  if (queueLoaded) return inMemoryQueue;
  try {
    const raw = await AsyncStorage.getItem(REPORT_QUEUE_KEY);
    inMemoryQueue = raw ? JSON.parse(raw) : [];
    queueLoaded = true;
  } catch {
    inMemoryQueue = [];
  }
  return inMemoryQueue;
}

async function saveQueue(): Promise<void> {
  await AsyncStorage.setItem(REPORT_QUEUE_KEY, JSON.stringify(inMemoryQueue));
}

async function loadRemovedIds(): Promise<Set<string>> {
  if (removedLoaded) return inMemoryRemovedIds;
  try {
    const raw = await AsyncStorage.getItem(REMOVED_POST_IDS_KEY);
    inMemoryRemovedIds = new Set(raw ? JSON.parse(raw) : []);
    removedLoaded = true;
  } catch {
    inMemoryRemovedIds = new Set();
  }
  return inMemoryRemovedIds;
}

async function saveRemovedIds(): Promise<void> {
  await AsyncStorage.setItem(REMOVED_POST_IDS_KEY, JSON.stringify([...inMemoryRemovedIds]));
}

/** Add a report (user or post). Call this when a user reports someone or a post. */
export async function addReport(params: {
  type: ReportTargetType;
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
  if (db) return addReportFirestore(params);
  await loadQueue();
  const report: ReportItem = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: params.type,
    targetUserId: params.targetUserId,
    targetUserHandle: params.targetUserHandle,
    targetUserName: params.targetUserName,
    targetPostId: params.targetPostId,
    targetPostPreview: params.targetPostPreview,
    targetSpaceId: params.targetSpaceId,
    reason: params.reason,
    reporterId: params.reporterId,
    reporterHandle: params.reporterHandle,
    reporterName: params.reporterName,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  inMemoryQueue.unshift(report);
  await saveQueue();
  return report;
}

/** Get all reports that are still pending (for review queue). */
export async function getPendingReports(): Promise<ReportItem[]> {
  if (getFirestoreDb()) return getPendingReportsFirestore();
  await loadQueue();
  return inMemoryQueue.filter((r) => r.status === 'pending');
}

/** Dismiss a report (keep content). Removes from pending. */
export async function dismissReport(reportId: string): Promise<void> {
  if (getFirestoreDb()) {
    await dismissReportFirestore(reportId);
    return;
  }
  await loadQueue();
  const r = inMemoryQueue.find((x) => x.id === reportId);
  if (r) {
    r.status = 'dismissed';
    await saveQueue();
  }
}

/** Remove reported content: for posts, hide post everywhere; for users, mark report as resolved (no global ban in app yet). */
export async function removeReportedContent(reportId: string): Promise<void> {
  if (getFirestoreDb()) {
    await removeReportedContentFirestore(reportId);
    return;
  }
  await loadQueue();
  await loadRemovedIds();
  const r = inMemoryQueue.find((x) => x.id === reportId);
  if (!r) return;
  if (r.type === 'post' && r.targetPostId) {
    inMemoryRemovedIds.add(r.targetPostId);
    await saveRemovedIds();
  }
  r.status = 'removed';
  await saveQueue();
}

/** Get set of post IDs that have been removed by moderation. Filter these out when showing feed/space. */
export async function getRemovedPostIds(): Promise<Set<string>> {
  if (getFirestoreDb()) {
    const set = await getRemovedPostIdsFirestore();
    inMemoryRemovedIds = set;
    removedLoaded = true;
    return set;
  }
  await loadRemovedIds();
  return new Set(inMemoryRemovedIds);
}

/** Get removed post IDs synchronously after at least one load (e.g. after app has called getPendingReports or getRemovedPostIds once). */
export function getRemovedPostIdsSync(): Set<string> {
  return new Set(inMemoryRemovedIds);
}

/** Invalidate cache so next getPendingReports/getRemovedPostIds refetches from storage (e.g. after returning to feed). */
export function invalidateReportQueueCache(): void {
  queueLoaded = false;
  removedLoaded = false;
}
