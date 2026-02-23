/**
 * Firebase initialization. Optional: if env vars are not set, auth will be disabled
 * and the app can run without Firebase (e.g. mock/dev mode).
 * Auth uses React Native persistence (AsyncStorage) so login survives app restarts.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persist auth across app restarts (React Native). Only use if exported from firebase/auth.
let getReactNativePersistence: ((s: typeof AsyncStorage) => unknown) | undefined;
try {
  const authMod = require('firebase/auth') as { getReactNativePersistence?: (s: typeof AsyncStorage) => unknown };
  getReactNativePersistence = authMod.getReactNativePersistence ?? undefined;
} catch {
  getReactNativePersistence = undefined;
}

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
let storage: FirebaseStorage | null = null;

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
    const appRef = app;
    if (getReactNativePersistence) {
      try {
        auth = initializeAuth(appRef, {
          persistence: getReactNativePersistence(AsyncStorage) as import('firebase/auth').Persistence,
        });
      } catch {
        auth = getAuth(appRef);
      }
    } else {
      auth = getAuth(appRef);
    }
  } else {
    auth = getAuth(app ?? getApps()[0] as any);
  }
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

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isFirebaseConfigured()) return null;
  if (storage) return storage;
  const a = getFirebaseApp();
  if (!a) return null;
  storage = getStorage(a);
  return storage;
}
