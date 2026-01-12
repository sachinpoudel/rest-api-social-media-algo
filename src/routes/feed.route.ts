// src/routes/feed.route.ts
import { Router } from "express";
import { getPersonalizedFeedController } from "../controllers/feed.controller";
import {  isLogin } from "../middlewares/auth/check-is-auth";
import { cacheByKey } from "../middlewares/cache/cache";
import { cache } from "../utils/cache";

const router = Router();

router.get(
  "/personalized",
isLogin,
  cacheByKey((req: any) => `feed:${req.user?._id}:${req.query.page || 1}`, cache.TTL.short),
  getPersonalizedFeedController
);

export default router;