import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;
  app = getApps().length > 0 ? (getApps()[0] as FirebaseApp) : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (auth) return auth;
  const a = getFirebaseApp();
  if (!a) return null;
  auth = getAuth(a);
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

export function getFirebaseFunctions(): Functions | null {
  if (!isFirebaseConfigured()) return null;
  if (functions) return functions;
  const a = getFirebaseApp();
  if (!a) return null;
  functions = getFunctions(a);
  return functions;
}
