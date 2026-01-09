import Redis from "ioredis";
import { Redis as Upstash } from "@upstash/redis";

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL;

export const redis = upstashUrl && upstashToken
  ? new Upstash({ url: upstashUrl, token: upstashToken })
  : redisUrl
    ? new Redis(redisUrl, {
        lazyConnect: true,
        ...(redisUrl.startsWith("rediss://") && { tls: {} })
      })
    : null;

export const redisEnabled = Boolean(redis);