import { Ratelimit } from "@upstash/ratelimit";
import { redis, redisEnabled } from "../../configs/redis-config";
import { NextFunction, Request, Response } from "express";
import { IUser } from "../../interfaces/User";
import { AuthenticatedRequestBody } from "../../interfaces/CustomTypes";

if (!redisEnabled) {
  throw new Error("Redis client is not initialized");
}

// const limiter = new Ratelimit({
//     redis: redis ,
//     limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per 1 minute
//     analytics: true,
// });

const strictLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per 1 minute
  analytics: true,
});

const standardLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per 1 minute
  analytics: true,
});
// const getClientIp = (req: AuthenticatedRequestBody<IUser>): string => {
//   const forwarded = req.headers['x-forwarded-for'];
//   if (forwarded) {
//     return (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]).trim();
//   }
//   return (req.headers['x-real-ip'] as string)  || req.ip || 'unknown';
// };


const relaxedLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
  analytics: true,
});

export const CreateRateLimiter = (limiter: Ratelimit) => {
  return async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user?: IUser }).user;
      const identifier = user?._id?.toString() || req.ip as string;

      const { success, limit, remaining, reset } = await limiter.limit(
        identifier
      );
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", reset);

      if (!success) {
        console.warn(
          `[Rate Limit] exceeded for ${
            user ? `user ${user._id}` : `IP ${identifier}`
          }`
        );

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000), // seconds
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const StrictRateLimiter = CreateRateLimiter(strictLimiter);
export const StandardRateLimiter = CreateRateLimiter(standardLimiter);
export const RelaxedRateLimiter = CreateRateLimiter(relaxedLimiter);
