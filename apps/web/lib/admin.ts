"use client";

import { getFirestoreDb, getFirebaseFunctions } from "./firebase";
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit, updateDoc, setDoc, getCountFromServer, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

/** Fake accounts the admin can post as (10 accounts). IDs must match these. */
export const FAKE_ACCOUNTS = [
  { id: "fake-1", name: "Alex Demo", handle: "alex_demo" },
  { id: "fake-2", name: "Sam Tester", handle: "sam_tester" },
  { id: "fake-3", name: "Jordan Beta", handle: "jordan_beta" },
  { id: "fake-4", name: "Riley Preview", handle: "riley_preview" },
  { id: "fake-5", name: "Casey Sample", handle: "casey_sample" },
  { id: "fake-6", name: "Morgan Mock", handle: "morgan_mock" },
  { id: "fake-7", name: "Quinn Staging", handle: "quinn_staging" },
  { id: "fake-8", name: "Skyler Dev", handle: "skyler_dev" },
  { id: "fake-9", name: "Avery Test", handle: "avery_test" },
  { id: "fake-10", name: "Parker Demo", handle: "parker_demo" },
] as const;

export type FakeAccountId = (typeof FAKE_ACCOUNTS)[number]["id"];

export interface ReportItem {
  id: string;
  type: "user" | "post";
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
  createdAt: string;
  status: "pending" | "dismissed" | "removed";
}

const REPORTS = "reports";
const MODERATION = "moderation";
const REMOVED_POSTS = "removedPosts";
const CONFIG = "config";
const ADMINS = "admins";
const MEDIA = "media";
const USERS = "users";
const WAITLIST = "waitlist";

function toReportItem(id: string, d: Record<string, unknown>): ReportItem {
  return {
    id,
    type: (d.type as "user" | "post") || "post",
    targetUserId: (d.targetUserId as string) || "",
    targetUserHandle: d.targetUserHandle as string | undefined,
    targetUserName: d.targetUserName as string | undefined,
    targetPostId: d.targetPostId as string | undefined,
    targetPostPreview: d.targetPostPreview as string | undefined,
    targetSpaceId: d.targetSpaceId as string | undefined,
    reason: (d.reason as string) || "",
    reporterId: (d.reporterId as string) || "",
    reporterHandle: d.reporterHandle as string | undefined,
    reporterName: d.reporterName as string | undefined,
    createdAt: (d.createdAt as string) || "",
    status: (d.status as ReportItem["status"]) || "pending",
  };
}

/** Env-based admin emails (e.g. NEXT_PUBLIC_ADMIN_EMAIL=you@example.com or comma-separated). Use for local dev when config/admins isn't set. */
function getEnvAdminEmails(): string[] {
  if (typeof process === "undefined" || !process.env?.NEXT_PUBLIC_ADMIN_EMAIL) return [];
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAIL.trim();
  if (!raw) return [];
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function getAdminEmails(): Promise<string[]> {
  const fromEnv = getEnvAdminEmails();
  const db = getFirestoreDb();
  if (!db) return fromEnv;
  const ref = doc(db, CONFIG, ADMINS);
  const snap = await getDoc(ref);
  if (!snap.exists()) return fromEnv;
  const data = snap.data();
  const emails = data?.emails;
  const fromFirestore = Array.isArray(emails) ? emails : [];
  const combined = new Set([...fromEnv.map((e) => e.trim().toLowerCase()), ...fromFirestore.map((e) => String(e).trim().toLowerCase())]);
  return Array.from(combined);
}

export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const emails = await getAdminEmails();
  return emails.some((e) => (e && String(e).trim().toLowerCase()) === normalized);
}

export async function getReports(status: "pending" | "dismissed" | "removed" | "all" = "pending"): Promise<ReportItem[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const coll = collection(db, REPORTS);
  const q = status === "all" ? coll : query(coll, where("status", "==", status));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => toReportItem(d.id, d.data() as Record<string, unknown>));
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

function toWaitlistEntry(id: string, d: Record<string, unknown>): WaitlistEntry {
  const createdAt = d.createdAt;
  const createdAtStr =
    typeof createdAt === "string"
      ? createdAt
      : (createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? "";
  return {
    id,
    email: (d.email as string) ?? "",
    name: (d.name as string | null | undefined) ?? null,
    createdAt: createdAtStr,
  };
}

export async function getWaitlistEntries(limitCount = 500): Promise<WaitlistEntry[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const coll = collection(db, WAITLIST);
  const q = query(coll, orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toWaitlistEntry(d.id, d.data() as Record<string, unknown>));
}

export async function getWaitlistCount(): Promise<number> {
  const db = getFirestoreDb();
  if (!db) return 0;
  const coll = collection(db, WAITLIST);
  const snap = await getCountFromServer(coll);
  return snap.data().count;
}

export async function dismissReport(reportId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured");
  const ref = doc(db, REPORTS, reportId);
  await updateDoc(ref, { status: "dismissed" });
}

export async function removeReportedContent(reportId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured");
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  await updateDoc(ref, { status: "removed" });
  if (data?.type === "post" && data?.targetPostId) {
    const removedRef = doc(db, MODERATION, REMOVED_POSTS);
    const removedSnap = await getDoc(removedRef);
    const current = (removedSnap.exists() ? removedSnap.data()?.postIds : []) || [];
    const postIds = Array.isArray(current) ? [...current, data.targetPostId] : [data.targetPostId];
    await setDoc(removedRef, { postIds }, { merge: true });
  }
}

/** Media pending admin review (status === "needs_review") */
export interface ModerationMediaItem {
  id: string;
  ownerUid: string;
  ownerHandle?: string;
  ownerName?: string;
  type: "image" | "video";
  status: string;
  createdAt: string;
  goreScore?: number;
  sexualScore?: number;
  flags?: string[];
  provider?: string;
}

export async function getMediaNeedsReview(): Promise<ModerationMediaItem[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(
    collection(db, MEDIA),
    where("status", "==", "needs_review"),
    limit(100)
  );
  const snap = await getDocs(q);
  const items: ModerationMediaItem[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    let ownerHandle: string | undefined;
    let ownerName: string | undefined;
    const uid = data.ownerUid as string;
    if (uid) {
      try {
        const userSnap = await getDoc(doc(db, USERS, uid));
        if (userSnap.exists()) {
          const u = userSnap.data() as Record<string, unknown>;
          ownerHandle = u.handle as string;
          ownerName = u.name as string;
        }
      } catch {
        // ignore
      }
    }
    const mod = (data.moderation as Record<string, unknown>) || {};
    const createdAt = data.createdAt;
    const createdAtStr =
      typeof createdAt === "string"
        ? createdAt
        : (createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? "";
    items.push({
      id: d.id,
      ownerUid: uid || "",
      ownerHandle,
      ownerName,
      type: (data.type as "image" | "video") || "image",
      status: (data.status as string) || "needs_review",
      createdAt: createdAtStr,
      goreScore: mod.goreScore as number | undefined,
      sexualScore: mod.sexualScore as number | undefined,
      flags: mod.flags as string[] | undefined,
      provider: mod.provider as string | undefined,
    });
  }
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

export async function approveMedia(mediaId: string): Promise<void> {
  const fn = getFirebaseFunctions();
  if (!fn) throw new Error("Functions not configured");
  const call = httpsCallable<{ mediaId: string }, { ok: boolean }>(fn, "approveMedia");
  await call({ mediaId });
}

export async function rejectMedia(mediaId: string): Promise<void> {
  const fn = getFirebaseFunctions();
  if (!fn) throw new Error("Functions not configured");
  const call = httpsCallable<{ mediaId: string }, { ok: boolean }>(fn, "rejectMedia");
  await call({ mediaId });
}

export async function banUser(uid: string): Promise<void> {
  const fn = getFirebaseFunctions();
  if (!fn) throw new Error("Functions not configured");
  const call = httpsCallable<{ uid: string }, { ok: boolean }>(fn, "banUser");
  await call({ uid });
}

const POSTS = "posts";

/** Media item for fake posts. URL must be publicly accessible (e.g. imgur, placekitten, or your CDN). */
export interface FakePostMediaInput {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

/** Create a post as a fake account (admin only). Call from admin UI; rules allow admins to set any authorId. */
export async function createPostAsFakeUser(
  fakeAccountId: FakeAccountId,
  data: { content: string; title?: string; media?: FakePostMediaInput[] }
): Promise<{ id: string }> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore not configured");
  const account = FAKE_ACCOUNTS.find((a) => a.id === fakeAccountId);
  if (!account) throw new Error("Invalid fake account");
  const rawMedia = (data.media || []).filter((m) => m && m.url && m.type);
  const media = rawMedia.map((m, i) => ({
    id: `m-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    type: m.type as "image" | "video",
    url: m.url.trim(),
    ...(m.thumbnail ? { thumbnail: m.thumbnail.trim() } : {}),
  }));
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const postData = {
    id,
    authorId: account.id,
    author: {
      id: account.id,
      name: account.name,
      handle: account.handle,
      avatar: null,
      label: undefined,
      country: undefined,
    },
    content: data.content || "",
    title: data.title || undefined,
    media,
    createdAt: new Date().toISOString(),
    likes: 0,
    saves: 0,
    comments: 0,
    views: 0,
    poll: null,
    contentWarning: null,
    hashtags: [],
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, POSTS, id), postData);
  return { id };
}

export interface FakeAccountPostMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export interface FakeAccountPost {
  id: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  content: string;
  title?: string;
  media?: FakeAccountPostMedia[];
  createdAt: string;
}

/** Fetch recent posts authored by any of the fake accounts. */
export async function getRecentFakePosts(limitCount = 20): Promise<FakeAccountPost[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const fakeIds: string[] = FAKE_ACCOUNTS.map((a) => a.id);
  const postsRef = collection(db, POSTS);
  const snap = await getDocs(
    query(postsRef, orderBy("createdAt", "desc"), limit(limitCount * 2))
  );
  const byFake = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const authorId = (data.authorId as string) || "";
      if (!fakeIds.includes(authorId)) return null;
      const author = (data.author as Record<string, unknown>) || {};
      const rawMedia = (data.media as Array<{ id?: string; type?: string; url?: string; thumbnail?: string }> | undefined) || [];
      const media: FakeAccountPostMedia[] = rawMedia
        .filter((m) => m && m.url)
        .map((m) => ({
          id: (m.id as string) || `m-${d.id}-${rawMedia.indexOf(m)}`,
          type: (m.type === "video" ? "video" : "image") as "image" | "video",
          url: m.url as string,
          thumbnail: m.thumbnail as string | undefined,
        }));
      return {
        id: d.id,
        authorId,
        authorHandle: (author.handle as string) || "?",
        authorName: (author.name as string) || "?",
        content: (data.content as string) || "",
        title: data.title as string | undefined,
        media: media.length > 0 ? media : undefined,
        createdAt: (data.createdAt as string) || "",
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .slice(0, limitCount) as FakeAccountPost[];
  return byFake;
}

export interface DashboardStats {
  reportsPending: number;
  reportsDismissed: number;
  reportsRemoved: number;
  reportsTotal: number;
  usersCount: number;
  postsCount: number;
  spacesCount: number;
}

export interface RecentReport {
  id: string;
  type: "user" | "post";
  reason: string;
  status: string;
  createdAt: string;
}
export interface RecentPost {
  id: string;
  contentPreview: string;
  authorHandle: string;
  createdAt: string;
}
export interface RecentUser {
  id: string;
  handle: string;
  name: string;
  joinDate: string;
}
export interface TopSpace {
  id: string;
  name: string;
  memberCount: number;
}
export interface ReportReasonCount {
  reason: string;
  count: number;
}

export interface ExtendedDashboardData extends DashboardStats {
  storiesCount: number;
  followsCount: number;
  spaceMembersCount: number;
  postLikesCount: number;
  postSavesCount: number;
  removedPostsCount: number;
  recentReports: RecentReport[];
  recentPosts: RecentPost[];
  recentUsers: RecentUser[];
  topSpaces: TopSpace[];
  reportReasons: ReportReasonCount[];
  reportByType: { post: number; user: number };
}

const emptyStats: DashboardStats = {
  reportsPending: 0,
  reportsDismissed: 0,
  reportsRemoved: 0,
  reportsTotal: 0,
  usersCount: 0,
  postsCount: 0,
  spacesCount: 0,
};

export async function getStats(): Promise<DashboardStats> {
  const db = getFirestoreDb();
  if (!db) return emptyStats;
  try {
    const [
      pendingSnap,
      dismissedSnap,
      removedSnap,
      allReportsSnap,
      usersSnap,
      postsSnap,
      spacesSnap,
    ] = await Promise.all([
      getCountFromServer(query(collection(db, REPORTS), where("status", "==", "pending"))),
      getCountFromServer(query(collection(db, REPORTS), where("status", "==", "dismissed"))),
      getCountFromServer(query(collection(db, REPORTS), where("status", "==", "removed"))),
      getCountFromServer(collection(db, REPORTS)),
      getCountFromServer(collection(db, "users")),
      getCountFromServer(collection(db, "posts")),
      getCountFromServer(collection(db, "spaces")),
    ]);
    return {
      reportsPending: pendingSnap.data().count,
      reportsDismissed: dismissedSnap.data().count,
      reportsRemoved: removedSnap.data().count,
      reportsTotal: allReportsSnap.data().count,
      usersCount: usersSnap.data().count,
      postsCount: postsSnap.data().count,
      spacesCount: spacesSnap.data().count,
    };
  } catch {
    return emptyStats;
  }
}

const emptyExtended = (): ExtendedDashboardData => ({
  ...emptyStats,
  storiesCount: 0,
  followsCount: 0,
  spaceMembersCount: 0,
  postLikesCount: 0,
  postSavesCount: 0,
  removedPostsCount: 0,
  recentReports: [],
  recentPosts: [],
  recentUsers: [],
  topSpaces: [],
  reportReasons: [],
  reportByType: { post: 0, user: 0 },
});

export async function getDashboardExtended(): Promise<ExtendedDashboardData> {
  const db = getFirestoreDb();
  if (!db) return emptyExtended();
  try {
    const [
      stats,
      storiesSnap,
      followsSnap,
      spaceMembersSnap,
      postLikesSnap,
      postSavesSnap,
      removedSnap,
      allReports,
      postsSnap,
      usersSnap,
      spacesSnap,
    ] = await Promise.all([
      getStats(),
      getCountFromServer(collection(db, "stories")),
      getCountFromServer(collection(db, "follows")),
      getCountFromServer(collection(db, "spaceMembers")),
      getCountFromServer(collection(db, "postLikes")),
      getCountFromServer(collection(db, "postSaves")),
      getDoc(doc(db, MODERATION, REMOVED_POSTS)),
      getReports("all"),
      getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(5))),
      getDocs(query(collection(db, "users"), limit(30))),
      getDocs(query(collection(db, "spaces"), limit(50))),
    ]);

    const removedPostIds = (removedSnap.exists() && removedSnap.data()?.postIds) || [];
    const removedPostsCount = Array.isArray(removedPostIds) ? removedPostIds.length : 0;

    const recentReports: RecentReport[] = allReports.slice(0, 5).map((r) => ({
      id: r.id,
      type: r.type,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    }));

    const reportByType = { post: 0, user: 0 };
    const reasonMap: Record<string, number> = {};
    allReports.forEach((r) => {
      reportByType[r.type]++;
      reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1;
    });
    const reportReasons: ReportReasonCount[] = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count }));

    const recentPosts: RecentPost[] = postsSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const content = (data.content as string) || (data.title as string) || "";
      const author = (data.author as Record<string, unknown>) || {};
      return {
        id: d.id,
        contentPreview: content.slice(0, 80) + (content.length > 80 ? "…" : ""),
        authorHandle: (author.handle as string) || "?",
        createdAt: (data.createdAt as string) || "",
      };
    });

    const usersList = usersSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        handle: (data.handle as string) || "?",
        name: (data.name as string) || "User",
        joinDate: (data.joinDate as string) || "",
      };
    });
    usersList.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    const recentUsers: RecentUser[] = usersList.slice(0, 10);

    const spacesList = spacesSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: (data.name as string) || "Space",
        memberCount: (data.memberCount as number) ?? 0,
      };
    });
    spacesList.sort((a, b) => b.memberCount - a.memberCount);
    const topSpaces: TopSpace[] = spacesList.slice(0, 10);

    return {
      ...stats,
      storiesCount: storiesSnap.data().count,
      followsCount: followsSnap.data().count,
      spaceMembersCount: spaceMembersSnap.data().count,
      postLikesCount: postLikesSnap.data().count,
      postSavesCount: postSavesSnap.data().count,
      removedPostsCount,
      recentReports,
      recentPosts,
      recentUsers,
      topSpaces,
      reportReasons,
      reportByType,
    };
  } catch {
    return emptyExtended();
  }
}

const MOCK_STORAGE_KEY = "adminMockEnabled";

export function getMockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MOCK_STORAGE_KEY) === "true";
}

export function setMockEnabled(enabled: boolean): void {
  localStorage.setItem(MOCK_STORAGE_KEY, enabled ? "true" : "false");
}

export function getMockStats(): DashboardStats {
  return {
    reportsPending: 3,
    reportsDismissed: 7,
    reportsRemoved: 2,
    reportsTotal: 12,
    usersCount: 124,
    postsCount: 458,
    spacesCount: 18,
  };
}

export function getMockDashboardExtended(): ExtendedDashboardData {
  const now = new Date().toISOString();
  return {
    ...getMockStats(),
    storiesCount: 42,
    followsCount: 1203,
    spaceMembersCount: 890,
    postLikesCount: 3420,
    postSavesCount: 567,
    removedPostsCount: 2,
    recentReports: [
      { id: "mock-1", type: "post", reason: "Spam", status: "pending", createdAt: now },
      { id: "mock-2", type: "user", reason: "Harassment", status: "pending", createdAt: now },
    ],
    recentPosts: [
      { id: "p1", contentPreview: "Just shipped a new feature for the app…", authorHandle: "alex", createdAt: now },
      { id: "p2", contentPreview: "Looking for feedback on our beta…", authorHandle: "sarah", createdAt: now },
    ],
    recentUsers: [
      { id: "u1", handle: "newuser", name: "New User", joinDate: now },
      { id: "u2", handle: "builder", name: "Builder", joinDate: now },
    ],
    topSpaces: [
      { id: "1", name: "React Native", memberCount: 1250 },
      { id: "2", name: "Startups", memberCount: 890 },
    ],
    reportReasons: [
      { reason: "Spam", count: 5 },
      { reason: "Harassment", count: 3 },
      { reason: "Inappropriate content", count: 4 },
    ],
    reportByType: { post: 8, user: 4 },
  };
}

export function getMockReports(status: "pending" | "dismissed" | "removed" | "all"): ReportItem[] {
  const base: ReportItem[] = [
    {
      id: "mock-1",
      type: "post",
      targetUserId: "user-1",
      targetUserHandle: "alex",
      targetUserName: "Alex",
      targetPostId: "post-abc",
      targetPostPreview: "Check out this link for free stuff!!! 🎁🎁🎁 http://spam.example.com",
      reason: "Spam",
      reporterId: "user-2",
      reporterHandle: "sarah",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: "pending",
    },
    {
      id: "mock-2",
      type: "user",
      targetUserId: "user-3",
      targetUserHandle: "mike",
      targetUserName: "Mike",
      reason: "Harassment",
      reporterId: "user-4",
      reporterHandle: "emma",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: "pending",
    },
    {
      id: "mock-3",
      type: "post",
      targetUserId: "user-5",
      targetUserName: "Jordan",
      targetUserHandle: "jordan",
      targetPostId: "post-xyz",
      targetPostPreview: "The actual post content that was reported would appear here so moderators can review it.",
      reason: "Inappropriate content",
      reporterId: "user-1",
      reporterHandle: "alex",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      status: "dismissed",
    },
  ];
  if (status === "all") return base;
  return base.filter((r) => r.status === status);
}
