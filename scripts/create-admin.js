/**
 * One-time script to create an admin account:
 * 1. Creates a Firebase Auth user with the given email/password
 * 2. Adds that email to Firestore config/admins so the web dashboard grants access
 *
 * Usage:
 *   1. In Firebase Console: Project settings → Service accounts → Generate new private key.
 *      Save the JSON file somewhere (e.g. ./service-account.json) and do NOT commit it.
 *   2. Set env vars and run:
 *      set GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
 *      set ADMIN_EMAIL=your@email.com
 *      set ADMIN_PASSWORD=your-secure-password
 *      node scripts/create-admin.js
 *
 *   On macOS/Linux use export instead of set.
 */

const admin = require("firebase-admin");
const path = require("path");

const projectId = process.env.FIREBASE_PROJECT_ID || "strivon-e9ca5";
const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!email || !password) {
  console.error("Usage: set ADMIN_EMAIL and ADMIN_PASSWORD (or pass as args), then run node scripts/create-admin.js");
  process.exit(1);
}

// Prefer env; otherwise look for service-account.json in repo root
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const keyPath = path.join(__dirname, "..", "service-account.json");
  try {
    require("fs").accessSync(keyPath);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  } catch {
    console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path, or put service-account.json in the project root.");
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    try {
      await auth.getUserByEmail(normalizedEmail);
      console.log("User already exists for", normalizedEmail);
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        await auth.createUser({ email: normalizedEmail, password, emailVerified: true });
        console.log("Created Auth user:", normalizedEmail);
      } else throw e;
    }

    const adminsRef = db.collection("config").doc("admins");
    const adminsSnap = await adminsRef.get();
    const existing = adminsSnap.exists && adminsSnap.data().emails
      ? adminsSnap.data().emails
      : [];
    if (Array.isArray(existing) && existing.includes(normalizedEmail)) {
      console.log("Email already in config/admins.");
    } else {
      const emails = Array.isArray(existing) ? [...existing, normalizedEmail] : [normalizedEmail];
      await adminsRef.set({ emails }, { merge: true });
      console.log("Added to config/admins. You can sign in at /admin/login with:", normalizedEmail);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
