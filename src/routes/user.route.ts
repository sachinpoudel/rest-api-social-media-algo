import express from "express";
import { isLogin } from "../middlewares/auth/check-is-auth";
import {
  getUsersController,
  getUserController,
  followUserController,
  unFollowUserController,
  addFriendController,
  unFriendController,
  blockUserController,
  unblockUserController,
} from "../controllers/user.controller";
import { cacheByKey } from "../middlewares/cache/cache";
import { invalidateKeys } from "../middlewares/cache/invalidate";
import { cache } from "../utils/cache";
import { Request } from "express";
import { IUser } from "../interfaces/User";

const router = express.Router();

router.get("/", cacheByKey(() => cache.key.userList(), cache.TTL.short), getUsersController);
router.get("/:userId", cacheByKey((req) => cache.key.userById(req.params.userId!)), getUserController);

router.post(
  "/:userId/follow",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  followUserController
);

router.post(
  "/:userId/unfollow",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unFollowUserController
);

router.post(
  "/:userId/add-friend",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  addFriendController
);

router.post(
  "/:userId/unfriend",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unFriendController
);

router.post(
  "/:userId/block",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  blockUserController
);

router.post(
  "/:userId/unblock",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unblockUserController
);

export default router;