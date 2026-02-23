import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning when running from monorepo root
  turbopack: { root: path.resolve(__dirname) },
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
