import type { User } from "@/types/post";

const mockUsers: User[] = [
  { id: "15", name: "Alex Rivera", handle: "@alexr", avatar: null },
  { id: "16", name: "Jordan Lee", handle: "@jordanl", avatar: null },
  { id: "17", name: "Sam Chen", handle: "@samc", avatar: null },
  { id: "18", name: "Taylor Kim", handle: "@taylork", avatar: null },
];

export function getMockUserById(id: string): User | null {
  return mockUsers.find((u) => u.id === id) ?? null;
}
