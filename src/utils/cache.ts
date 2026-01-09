import { redis, redisEnabled } from "../configs/redis-config";

const TTL = { short: 60, medium: 300 };

const key = {
  userById: (id: string) => `user:${id}`,
  userList: () => "users:list",
  postById: (id: string) => `post:${id}`,
  postList: () => "posts:list",
  postTimeline: (userId: string) => `posts:timeline:${userId}`,
  commentById: (postId: string, commentId: string) => `post:${postId}:comment:${commentId}`,
};

async function get<T>(k: string): Promise<T | null> {
  if (!redisEnabled) return null;
  const raw = await redis!.get(k as any);
  return raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) as T : null;
}

async function set(k: string, v: unknown, ttl = TTL.medium) {
  if (!redisEnabled) return;
  await redis!.set(k as any, JSON.stringify(v), { ex: ttl } as any);
}

async function del(...keys: string[]) {
  if (!redisEnabled || !keys.length) return;
  await redis!.del(...keys);
}

export const cache = { get, set, del, TTL, key };