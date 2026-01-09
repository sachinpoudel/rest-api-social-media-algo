import { Request, Response, NextFunction } from "express";
import { cache } from "../../utils/cache";

export const invalidateKeys = (...builders: ((req: Request) => string | undefined)[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const keys = builders
      .map((fn) => fn(req))
      .filter((key): key is string => key !== undefined);
    
    if (keys.length > 0) {
      await cache.del(...keys);
    }
    next();
  };
};