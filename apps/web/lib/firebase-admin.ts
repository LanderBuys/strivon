// eslint-disable-next-line @typescript-eslint/no-require-imports -- runtime require so Next resolves from workspace root
type AdminModule = typeof import("firebase-admin");

let app: ReturnType<AdminModule["app"]> | null = null;

function formatPrivateKey(key: string): string {
  // Env may have literal \n (two chars), real newlines, or \r\n (Windows)
  let out = key.includes("\n") ? key : key.replace(/\\n/g, "\n");
  return out.replace(/\r\n?/g, "\n");
}

function getAdmin(): AdminModule | null {
  try {
    return require("firebase-admin") as AdminModule;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[firebase-admin] require('firebase-admin') failed:", e);
    }
    return null;
  }
}

/**
 * Get Firebase Admin app for server-side use (e.g. API routes).
 * Requires one of:
 * - FIREBASE_SERVICE_ACCOUNT_KEY: full JSON key as string, or
 * - FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (and NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 */
export function getFirebaseAdmin(): ReturnType<AdminModule["app"]> | null {
  const admin = getAdmin();
  if (!admin) return null;
  if (app) return app;
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const key = JSON.parse(serviceAccountKey);
      app = admin.initializeApp({ credential: admin.credential.cert(key), projectId: key.project_id });
      return app;
    } catch (e) {
      console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY parse/init failed:", e);
      return null;
    }
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "development") {
      console.error("[firebase-admin] Missing env. Have: NEXT_PUBLIC_FIREBASE_PROJECT_ID=%s FIREBASE_CLIENT_EMAIL=%s FIREBASE_PRIVATE_KEY=%s", !!projectId, !!clientEmail, !!privateKey ? "(set)" : "(missing)");
    }
    return null;
  }
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
      }),
      projectId,
    });
    return app;
  } catch (e) {
    console.error("[firebase-admin] initializeApp failed:", e);
    return null;
  }
}

export function getFirebaseAdminFirestore(): import("firebase-admin").firestore.Firestore | null {
  const a = getFirebaseAdmin();
  return a ? a.firestore() : null;
}

/** Server timestamp for Firestore writes (use in API routes). */
export function serverTimestamp(): import("firebase-admin").firestore.FieldValue {
  const admin = getAdmin();
  if (!admin) throw new Error("firebase-admin not available");
  return admin.firestore.FieldValue.serverTimestamp();
}
