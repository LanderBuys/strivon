const fs = require("fs");
const path = require("path");

const webNodeModules = path.resolve(__dirname, "..", "node_modules");
const rootNodeModules = path.resolve(__dirname, "..", "..", "..", "node_modules");

const packages = ["picocolors", "source-map-js", "nanoid", "firebase", "firebase-admin", "idb"];

// Copy individual packages
for (const pkg of packages) {
  const target = path.join(webNodeModules, pkg);
  const source = path.join(rootNodeModules, pkg);
  if (!fs.existsSync(source)) continue;
  try {
    if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
  } catch (_) {}
}

// Copy entire @firebase scope (firebase SDK internal deps)
const firebaseScopeSource = path.join(rootNodeModules, "@firebase");
const firebaseScopeTarget = path.join(webNodeModules, "@firebase");
if (fs.existsSync(firebaseScopeSource)) {
  try {
    if (fs.existsSync(firebaseScopeTarget)) fs.rmSync(firebaseScopeTarget, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(firebaseScopeTarget), { recursive: true });
    fs.cpSync(firebaseScopeSource, firebaseScopeTarget, { recursive: true });
  } catch (_) {}
}

// Copy entire @grpc scope (Firestore Node build deps - required for SSR bundle resolution)
const grpcScopeSource = path.join(rootNodeModules, "@grpc");
const grpcScopeTarget = path.join(webNodeModules, "@grpc");
if (fs.existsSync(grpcScopeSource)) {
  try {
    if (fs.existsSync(grpcScopeTarget)) fs.rmSync(grpcScopeTarget, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(grpcScopeTarget), { recursive: true });
    fs.cpSync(grpcScopeSource, grpcScopeTarget, { recursive: true });
  } catch (_) {}
}
