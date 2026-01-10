import { Request, Response, NextFunction } from "express";
import {
  addCommentInPostService,
  createPostService,
  deleteUserCommentInPostService,
  deleteUserPostService,
  //   getAllPostsService,
  getCommentInPostService,
  getPostService,
  //   getTimelinePostsService,
  likePostService,
  updateCommentInPostService,
  updatePostService,
} from "../services/post.service";
import { asyncHandler } from "../middlewares/auth/async-handler";
import {
  AuthenticatedRequestBody,
  TPaginationResponse,
} from "../interfaces/CustomTypes";
import { IPost } from "../interfaces/Post";
import {
  ForbiddenError,
  UnAuthorized,
  UnprocessableEntity,
} from "../middlewares/error/app-error";
import { HTTPSTATUS } from "../configs/http-config";

export const createPostController = asyncHandler(
  async (req: AuthenticatedRequestBody<IPost>, res: Response) => {
    const { title, description, category, photoUrl } = req.body;

    const fileId = req.file?.filename;
    const authorId = req.user?._id?.toString();

    if (!authorId) {
      throw new UnAuthorized("User not authorized to create post");
    }
    if (!fileId) {
      throw new ForbiddenError("File not uploaded");
    }

    const { createdPost } = await createPostService({
      title,
      description,
      category,
      photoUrl,
      fileId,
      authorId,
    });

    const data = {
      post: {
        ...createdPost._doc,
        author: {
          _id: authorId,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
          email: req.user?.email,
        },
      },
    };

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data,
    });
  }
);

export const likePostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { postId } = req.params;
    const userId = req.user?._id.toString();

    if (!userId || !postId) {
      throw new UnAuthorized("User not authorized to like post");
    }

    const { isAlreadyLiked, data } = await likePostService({ postId, userId });

    res.status(200).json({
      message: isAlreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      success: true,
      data,
    });
  }
);

export const getPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { postId } = req.params;

    if (!postId) {
      throw new ForbiddenError("Post ID is required");
    }

    const { post } = await getPostService({ postId });
    res.status(200).json({
      message: "Post fetched successfully",
      success: true,
      data: {
        post: post,
      },
    });
  }
);

export const getAllPostController = asyncHandler(
  async (req: Request, res: TPaginationResponse, next: NextFunction) => {
    if (!res.paginatedResults) {
      throw new ForbiddenError("Pagination middleware not executed");
    }

    const {
      results,
      currentPage,
      totalDocs,
      totalPages,
      next: nextPage,
      previous: prevPage,
    } = res.paginatedResults;

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: {
        totalDocs,
        totalPages,
        currentPage: currentPage.page,
        count: results?.length || 0,
        ...(nextPage && { nextPage: nextPage.page }),
        ...(prevPage && { prevPage: prevPage.page }),
        posts: results,
      },
    });
  }
);

export const getTimeLinePostsController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: TPaginationResponse,
    next: NextFunction
  ) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new UnAuthorized("User not authorized to view timeline posts");
    }

    if (!res.paginatedResults) {
      throw new ForbiddenError("Pagination middleware not executed");
    }

    const {
      results,
      currentPage,
      totalDocs,
      totalPages,
      next: nextPage,
      previous: prevPage,
    } = res.paginatedResults;

    res.status(200).json({
      success: true,
      message: "Timeline posts fetched successfully",
      data: {
        totalDocs,
        totalPages,
        currentPage: currentPage.page,
        count: results?.length || 0,
        ...(nextPage && { nextPage: nextPage.page }),
        ...(prevPage && { prevPage: prevPage.page }),
        posts: results,
      },
    });
  }
);

export const updatePostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { title, description, category, photoUrl } = req.body as IPost;
    const postId = req.params.postId;
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;
    const fileId = req.file?.filename;

    if (!postId) {
      throw new ForbiddenError("Post ID is required");
    }

    if (!userId) {
      throw new UnAuthorized("User not authorized to update post");
    }

    const { updatedPost } = await updatePostService({
      title,
      description,
      category,
      photoUrl,
      postId,
      fileId,
      requestingUserId: userId,
      requestingUserRole: userRole,
    });

    const data = {
      post: {
        ...updatedPost._doc,
        author: {
          _id: req.user?._id,
          firstName: req.user?.firstName,
          lastName: req.user?.lastName,
        },
      },
    };

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data,
    });
  }
);

export const deleteUserPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const postId = req.params.postId;
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;

    if (!postId) {
      throw new ForbiddenError("Post ID is required");
    }

    if (!userId) {
      throw new UnAuthorized("User not authorized to delete post");
    }

    await deleteUserPostService(postId, userId, userRole);

    res.status(HTTPSTATUS.OK).json({
      message: "Post deleted successfully",
      success: true,
    });
  }
);

export const addCommentInPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { comments } = req.body as unknown as { comments: string };
    const postId = req.params.postId;
    const userId = req.user?._id?.toString();

    if (!postId) {
      throw new ForbiddenError("Post ID is required");
    }

    if (!userId) {
      throw new UnAuthorized("User not authorized to add comment");
    }

    if (!comments) {
      throw new UnprocessableEntity("Comment is required");
    }

    const data = await addCommentInPostService({postId, userId, comments});
    res.status(HTTPSTATUS.OK).json({
      message: "Comment added successfully",
      success: true,
      data,
    });
  }
);

export const deleteUserCommentInPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { postId, commentId } = req.params;
    const userId = req.user?._id?.toString();

    if (!postId || !commentId) {
      throw new UnprocessableEntity("Post ID and Comment ID are required");
    }

    if (!userId) {
      throw new UnAuthorized("User not authorized to delete comment");
    }

    await deleteUserCommentInPostService(postId, commentId, userId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment deleted successfully",
    });
  }
);

export const updateCommentInPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { newCommentText } = req.body as unknown as { newCommentText: string };
    const { postId, commentId } = req.params;
    const userId = req.user?._id?.toString();

    if (!postId || !commentId) {
      throw new UnprocessableEntity("Post ID and Comment ID are required");
    }

    if (!userId) {
      throw new UnAuthorized("User not authorized to update comment");
    }

    if (!newCommentText) {
      throw new UnprocessableEntity("Comment text is required");
    }

    const data = await updateCommentInPostService({
      postId,
      commentId,
      userId,
      newCommentText,
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment updated successfully",
      data,
    });
  }
);

export const getCommentInPostController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPost>,
    res: Response,
    next: NextFunction
  ) => {
    const { postId, commentId } = req.params;

    if (!postId || !commentId) {
      throw new UnprocessableEntity("Post ID and Comment ID are required");
    }

    const data = await getCommentInPostService(postId, commentId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment fetched successfully",
      data,
    });
  }
);
