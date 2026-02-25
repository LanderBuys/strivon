import type { Post } from "@/types/post";
import { getMockUserById } from "./users";

const W = 600;
const H = 400;

export const mockPosts: Post[] = [
  {
    id: "p-1",
    author: getMockUserById("15")!,
    content: "Golden hour hits different 📱 Full screen vibes only.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    likes: 2840,
    saves: 892,
    comments: 156,
    views: 45000,
    isLiked: false,
    isSaved: false,
    media: [{ id: "m1", type: "image", url: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${W}&h=${H}&fit=crop`, width: W, height: H }],
  },
  {
    id: "p-2",
    author: getMockUserById("16")!,
    content: "City lights from above 🌃 Building in public.",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 5200,
    saves: 2100,
    comments: 289,
    views: 78000,
    isLiked: true,
    isSaved: false,
    media: [{ id: "m2", type: "image", url: `https://images.unsplash.com/photo-1514565131-fce0801e5785?w=${W}&h=${H}&fit=crop`, width: W, height: H }],
  },
  {
    id: "p-3",
    author: getMockUserById("17")!,
    content: "Beach sunset — no crop, full screen 📲",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes: 1920,
    saves: 567,
    comments: 72,
    isLiked: false,
    isSaved: true,
    media: [{ id: "m3", type: "image", url: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=${W}&h=${H}&fit=crop`, width: W, height: H }],
  },
  {
    id: "p-4",
    author: getMockUserById("18")!,
    content: "Just shipped v2 of our API. Feedback welcome! #buildinpublic #startup",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 410,
    saves: 110,
    comments: 34,
    isLiked: false,
    isSaved: false,
    hashtags: ["buildinpublic", "startup"],
  },
];
