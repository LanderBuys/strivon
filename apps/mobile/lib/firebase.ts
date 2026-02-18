/**
 * Firebase initialization. Optional: if env vars are not set, auth will be disabled
 * and the app can run without Firebase (e.g. mock/dev mode).
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

export function isFirebaseConfigured(): boolean {
  return !!(
    EXPO_PUBLIC_FIREBASE_API_KEY &&
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    EXPO_PUBLIC_FIREBASE_APP_ID
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/** Current signed-in user id, or null. Use this in API layer instead of mock CURRENT_USER_ID. */
export function getCurrentUserId(): string | null {
  const a = getFirebaseAuth();
  return a?.currentUser?.uid ?? null;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;
  if (getApps().length === 0) {
    app = initializeApp({
      apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined,
      messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? undefined,
      appId: EXPO_PUBLIC_FIREBASE_APP_ID,
    });
  }
  auth = getAuth(app ?? getApps()[0] as any);
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (db) return db;
  const a = getFirebaseApp();
  if (!a) return null;
  db = getFirestore(a);
  return db;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  getFirebaseAuth();
  return app;
}
