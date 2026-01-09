import express from "express";
import { isLogin } from "../middlewares/auth/check-is-auth";
import { 
  getUserService, 
  getUsersService, 
  followUserService, 
  unFollowUserService, 
  addFriendService,
  unFriendService,
  blockUserService,
  unblockUserService
} from "../services/user.service";
import { cacheByKey } from "../middlewares/cache/cache";
import { invalidateKeys } from "../middlewares/cache/invalidate";
import { cache } from "../utils/cache";
import { Request } from "express";
import { IUser } from "../interfaces/User";

const router = express.Router();

router.get("/", cacheByKey(() => cache.key.userList(), cache.TTL.short), getUsersService);
router.get("/:userId", cacheByKey((req) => cache.key.userById(req.params.userId!)), getUserService);

router.post(
  "/:userId/follow",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  followUserService
);

router.post(
  "/:userId/unfollow",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unFollowUserService
);

router.post(
  "/:userId/add-friend",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  addFriendService
);

router.post(
  "/:userId/unfriend",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unFriendService
);

router.post(
  "/:userId/block",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  blockUserService
);

router.post(
  "/:userId/unblock",
  isLogin,
  invalidateKeys(
    (req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)),
    (req: Request) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  unblockUserService
);

export default router;