import type { Space } from "@/types/post";

export const mockSpaces: Space[] = [
  { id: "space-1", name: "React Native", description: "React Native development community.", memberCount: 1250, channels: [{ id: "s1-1", name: "general" }, { id: "s1-2", name: "showcase" }], isJoined: true, category: "Development", ownerId: "1" },
  { id: "space-2", name: "Startups", description: "Startup discussions and entrepreneurship.", memberCount: 890, channels: [{ id: "s2-1", name: "general" }], isJoined: true, category: "Business", ownerId: "5" },
  { id: "space-3", name: "Design", description: "Design inspiration and UI/UX.", memberCount: 2100, channels: [{ id: "s3-1", name: "general" }, { id: "s3-2", name: "inspiration" }], isJoined: false, category: "Design", ownerId: "2" },
  { id: "space-4", name: "AI & ML", description: "AI and Machine Learning discussions.", memberCount: 1500, channels: [{ id: "s4-1", name: "general" }], isJoined: true, category: "Tech", ownerId: "4" },
  { id: "space-5", name: "Build in Public", description: "Share your journey building in public.", memberCount: 2400, channels: [{ id: "s5-1", name: "general" }, { id: "s5-2", name: "wins" }], isJoined: true, category: "Community", ownerId: "11", isTrending: true },
];
