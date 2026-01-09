import { NextFunction, Request, Response } from "express";
import {
  adminAddUserService,
  adminCreatePostService,
  adminDeleteAllPostForGivenUserService,
  adminDeleteCommentInPostService,
  adminDeletePostService,
  adminDeleteUserService,
  adminGetAllPostsService,
  adminGetAllUsersService,
  adminGetPostService,
  adminGetUsersCountService,
  adminGetUserService,
  adminUpdatePostService,
  adminUpdateUserService,
} from "../services/admin.service";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { AuthenticatedRequestBody, TPaginationResponse } from "../interfaces/CustomTypes";
import { IUser } from "../interfaces/User";
import { IPost } from "../interfaces/Post";

// ============= User Management Controllers =============

export const adminAddUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminAddUserService({
      ...req.body,
      file: req.file,
    });

    res.status(201).json({
      message: "User created successfully",
      success: true,
      data,
    });
  }
);

export const adminUpdateUserController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const { userId: _, ...bodyWithoutUserId } = req.body as any;

    const data = await adminUpdateUserService({
      userId,
      requestingUserId: req.user!._id,
      requestingUserRole: req.user?.role,
      ...bodyWithoutUserId,
      file: req.file,
    });

    res.status(200).json({
      message: "User updated successfully",
      success: true,
      data,
    });
  }
);

export const adminDeleteUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    await adminDeleteUserService({ userId });

    res.status(200).json({
      message: "User deleted successfully",
      success: true,
      data: null,
    });
  }
);

export const adminGetUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await adminGetUserService({ userId });

    res.status(200).json({
      message: "User fetched successfully",
      success: true,
      data,
    });
  }
);

export const adminGetAllUsersController = asyncHandler(
  async (req: Request, res: TPaginationResponse, next: NextFunction) => {
    const data = await adminGetAllUsersService(res.paginatedResults);

    res.status(200).json({
      message: "Users fetched successfully",
      success: true,
      data,
    });
  }
);

export const adminGetUsersCountController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await adminGetUsersCountService();

    res.status(200).json({
      message: "Users count fetched successfully",
      success: true,
      data,
    });
  }
);

// ============= Post Management Controllers =============

export const adminGetAllPostsController = asyncHandler(
  async (req: Request, res: TPaginationResponse, next: NextFunction) => {
    const data = await adminGetAllPostsService(res.paginatedResults);

    res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      data,
    });
  }
);

export const adminGetPostController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    if (!postId) throw new Error("Post ID is required");

    const data = await adminGetPostService({ postId });

    res.status(200).json({
      message: "Post fetched successfully",
      success: true,
      data,
    });
  }
);

export const adminCreatePostController = asyncHandler(
  async (req: AuthenticatedRequestBody<IPost>, res: Response, next: NextFunction) => {
    const data = await adminCreatePostService({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      photoUrl: req.body.photoUrl,
      userId: req.user!._id,
      ...(req.file && { file: req.file }),
    });

    res.status(201).json({
      message: "Post created successfully",
      success: true,
      data,
    });
  }
);

export const adminUpdatePostController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const data = await adminUpdatePostService({
      postId,
      ...req.body,
      file: req.file,
    });

    res.status(200).json({
      message: "Post updated successfully",
      success: true,
      data,
    });
  }
);

export const adminDeletePostController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    if (!postId) throw new Error("Post ID is required");

    await adminDeletePostService({ postId });

    res.status(200).json({
      message: "Post deleted successfully",
      success: true,
      data: null,
    });
  }
);

export const adminDeleteAllPostForGivenUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    await adminDeleteAllPostForGivenUserService({ userId });

    res.status(200).json({
      message: "All posts for the given user deleted successfully",
      success: true,
      data: null,
    });
  }
);

export const adminDeleteCommentInPostController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params;
    if (!commentId || !postId) throw new Error("Comment ID and Post ID are required");

    await adminDeleteCommentInPostService({ commentId, postId });

    res.status(200).json({
      message: "Comment deleted successfully",
      success: true,
      data: null,
    });
  }
);