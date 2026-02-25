import type { NextConfig } from "next";
import path from "path";

// Force Turbopack root to monorepo root so Next finds next/package.json (workspaces).
const monorepoRoot = path.resolve(__dirname, "../..");
const nextConfig: NextConfig = {
  turbopack: { root: monorepoRoot },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  // Firestore SSR uses Node build which requires @grpc/*; keep these external so they are required from node_modules
  serverExternalPackages: ["firebase", "firebase-admin", "@firebase/firestore", "@grpc/grpc-js", "@grpc/proto-loader"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
