import { Request, Response, NextFunction } from "express";
import { cache } from "../../utils/cache";

export const cacheByKey = (buildKey: (req: Request) => string, ttl = cache.TTL.medium) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    const k = buildKey(req);
    const hit = await cache.get<any>(k);
    if (hit) return res.status(200).json({ success: true, data: hit });

    const send = res.json.bind(res);
    res.json =  (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
         cache.set(k, body?.data ?? body, ttl);
      }
      return send(body);
    };
    next();
  };
};