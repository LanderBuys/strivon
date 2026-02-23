/**
 * Copies Firebase env vars from apps/mobile/.env (EXPO_PUBLIC_FIREBASE_*)
 * to apps/web/.env.local (NEXT_PUBLIC_FIREBASE_*) so the web app can connect.
 *
 * Run from repo root:  node scripts/copy-firebase-env-to-web.js
 */

const fs = require("fs");
const path = require("path");

const mobileEnvPath = path.join(__dirname, "..", "apps", "mobile", ".env");
const webEnvPath = path.join(__dirname, "..", "apps", "web", ".env.local");

const keys = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

if (!fs.existsSync(mobileEnvPath)) {
  console.error("apps/mobile/.env not found. Create apps/web/.env.local yourself and set:");
  keys.forEach((k) => console.error("  " + k.replace("EXPO_PUBLIC_", "NEXT_PUBLIC_") + "=<value>"));
  console.error("Get values from Firebase Console → Project settings → Your apps.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(mobileEnvPath, "utf8"));
const lines = [
  "# Firebase (copied from mobile .env for web admin dashboard)",
  ...keys.map((k) => {
    const nextKey = k.replace("EXPO_PUBLIC_", "NEXT_PUBLIC_");
    const v = env[k] || "";
    return nextKey + "=" + (v.includes(" ") ? '"' + v + '"' : v);
  }),
  "",
];

fs.writeFileSync(webEnvPath, lines.join("\n"), "utf8");
console.log("Wrote " + webEnvPath + " with Firebase vars from apps/mobile/.env");
console.log("Restart the web dev server (npm run dev in apps/web) if it is running.");
