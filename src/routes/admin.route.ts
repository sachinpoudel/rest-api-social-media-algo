import express from "express";
import { isLogin } from "../middlewares/auth/check-is-auth";
import { isAdmin } from "../middlewares/auth/check-is-admin";
import {
  adminAddUserController,
  adminUpdateUserController,
  adminDeleteUserController,
  adminGetUserController,
  adminGetAllUsersController,
  adminGetUsersCountController,
  adminGetPostController,
  adminGetAllPostsController,
  adminCreatePostController,
  adminUpdatePostController,
  adminDeleteCommentInPostController,
  adminDeleteAllPostForGivenUserController
} from "../controllers/admin.controller";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(isLogin, isAdmin);

// User management
router.get("/users", adminGetAllUsersController);
router.get("/users/count", adminGetUsersCountController);
router.get("/users/:userId", adminGetUserController);
router.post("/users", adminAddUserController);
router.put("/users/:userId", adminUpdateUserController);
router.delete("/users/:userId", adminDeleteUserController);

// Post management
router.get("/posts", adminGetAllPostsController);
router.get("/posts/:postId", adminGetPostController);
router.post("/posts", adminCreatePostController);
router.put("/posts/:postId", adminUpdatePostController);

// Delete all posts for a specific user
router.delete("/users/:userId/posts", adminDeleteAllPostForGivenUserController);

// Delete a comment in a post
router.delete("/posts/:postId/comments/:commentId", adminDeleteCommentInPostController);

export default router;