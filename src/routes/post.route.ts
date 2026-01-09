import express from "express";
import { Post } from "../models/Post-model";
import { uploadImg } from "../middlewares/uploads/multer";
import { isLogin } from "../middlewares/auth/check-is-auth";
import {
  addCommentValidation,
  addPostValidation,
  deleteCommentValidation,
  updateCommentValidation,
  updatePostValidation,
  validatedPostIdValidation
} from "../middlewares/validation/postValidation/postValidation";
import { postPaginationMiddleware } from "../middlewares/sort-pagination/postFeatures";
import { timelinePostPaginationMiddleware } from "../middlewares/sort-pagination/timelinePostFeatures";
import { cacheByKey } from "../middlewares/cache/cache";
import { invalidateKeys } from "../middlewares/cache/invalidate";
import { cache } from "../utils/cache";
import { Request } from "express";
import { IUser } from "../interfaces/User";
import {
  createPostController,
  getAllPostController,
  getPostController,
  getTimeLinePostsController,
  updatePostController,
  deleteUserPostController,
  likePostController,
  addCommentInPostController,
  updateCommentInPostController,
  getCommentInPostController,
  deleteUserCommentInPostController
} from "../controllers/post.controller";

const router = express.Router();

// Post CRUD
router.post(
  "/create",
  
  isLogin, addPostValidation,
  
  uploadImg.single("photo"),
  invalidateKeys(() => cache.key.postList()),
  createPostController
);

router.get(
  "/post",
  validatedPostIdValidation,
  isLogin,
  cacheByKey((req) => cache.key.postById(req.query.postId as string)),
  getPostController
);

router.get(
  "/posts",
  postPaginationMiddleware(Post),
  cacheByKey(() => cache.key.postList(), cache.TTL.short),
  getAllPostController
);

router.get(
  "/timeline-posts",
  isLogin,
  timelinePostPaginationMiddleware(Post),
  cacheByKey((req: Request & { user?: IUser }) => cache.key.postTimeline(String(req.user?._id)), cache.TTL.short),
  getTimeLinePostsController
);

router.put(
  "/update-post/:postId",
  isLogin,
  uploadImg.single("postImg"),
  updatePostValidation,
  invalidateKeys(
    (req) => cache.key.postById(req.params.postId!),
    () => cache.key.postList()
  ),
  updatePostController
);

router.delete(
  "/delete-post/:postId",
  isLogin,
  invalidateKeys(() => cache.key.postList()),
  deleteUserPostController
);

router.put(
  "/like-post/:postId",
  isLogin,
  invalidateKeys(
    (req) => cache.key.postById(req.params.postId!),
    () => cache.key.postList()
  ),
  likePostController
);

// Comment routes
router.put(
  "/add-comment/:postId",
  addCommentValidation,
  isLogin,
  invalidateKeys(
    (req) => cache.key.postById(req.params.postId!),
    () => cache.key.postList()
  ),
  addCommentInPostController
);

router.put(
  "/update-comment/:postId/:commentId",
  updateCommentValidation,
  isLogin,
  invalidateKeys(
    (req) => cache.key.postById(req.params.postId!),
    (req) => cache.key.commentById(req.params.postId!, req.params.commentId!)
  ),
  updateCommentInPostController
);

router.get(
  "/get-comment/:postId/:commentId",
  validatedPostIdValidation,
  isLogin,
  cacheByKey((req) => cache.key.commentById(req.params.postId!, req.params.commentId!)),
  getCommentInPostController
);

router.delete(
  "/delete-comment/:postId/:commentId",
  deleteCommentValidation,
  isLogin,
  invalidateKeys(
    (req) => cache.key.postById(req.params.postId!),
    (req) => cache.key.commentById(req.params.postId!, req.params.commentId!)
  ),
  deleteUserCommentInPostController
);

export default router;