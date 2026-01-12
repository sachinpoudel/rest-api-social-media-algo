import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { IPostDocument, Post } from "../models/Post-model";
import {
  BadRequest,
  UnprocessableEntity,
} from "../middlewares/error/app-error";
import { Env } from "../configs/env-config";
import cloudinary from "../middlewares/uploads/cloudinary";
import { deleteFile } from "../utils/file";
import {
  AuthenticatedRequestBody,
  TPaginationResponse,
} from "../interfaces/CustomTypes";
import { IUser, UpdateAccountInput } from "../interfaces/User";
import {
  AddCommentInPostInput,
  CreatePostInput,
  GetAllPostsInput,
  GetAllPostsResult,
  GetPostInput,
  GetTimelinePostInput,
  GetTimelinePostResult,
  IPost,
  LikePostInput,
  LikePostResult,
  LikeT,
  UpdateCommentInPostInput,
  UpdatePostInput,
} from "../interfaces/Post";
import { Comment } from "../models/Comment-model";
import User from "../models/user-model";
import { Types } from "mongoose";
import { createNotificationService } from "./notification.service";
import { NotificationType } from "../models/Notification-model";
import { updateUserInteractionScore } from "./feed.service";

export const createPostService = async (
  input: CreatePostInput
): Promise<{ createdPost: IPostDocument }> => {
  const { title, description, category, photoUrl, fileId, authorId } = input;

  try {
    var cloudinaryResult;
    let localPath: string | undefined;

    // const fileName = req.originalUrl.split('/').includes("users") ? 'users' : req.originalUrl.split('/').includes("posts") ? 'posts' : 'others';

    if (fileId) {
      localPath = `${Env.PWD}/public/uploads/posts/${fileId}`;
    }

    if (!localPath) {
      throw new UnprocessableEntity("Local file path is missing for upload.");
    }

    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
      resource_type: "image",
    });
    await deleteFile(localPath);

    const photolink = cloudinaryResult.secure_url || photoUrl;

    const postData = new Post({
      title,
      description,
      category: category ? category.toLowerCase() : "",
      photoUrl: photolink,
      cloudinary_id: cloudinaryResult.public_id,
      author: authorId || "",
    });

    const createdPost = await Post.create(postData);

    if (!createdPost) {
      throw new UnprocessableEntity("Failed to create post");
    }

    return { createdPost };
  } catch (error) {
    if (fileId) {
      const localPath = `${Env.PWD}/public/uploads/posts/${fileId}`;
      await deleteFile(localPath);
    }
    throw error;
  }
};

export const getPostService = async (
  input: GetPostInput
): Promise<{ post: IPostDocument }> => {
  const { postId } = input;

  const post = await Post.findById(postId)
    .select("-cloudinary_id")
    .populate("author", "firstName lastName email")
    .populate("likes.user", "firstName lastName profileUrl bio") // show who liked the post
    .populate("disLikes", "firstName lastName profileUrl bio")
    .populate("shares", "firstName lastName profileUrl bio")
    .populate("comments.user", "firstName lastName profileUrl bio")
    .populate("views", "firstName lastName profileUrl bio");

  if (!post) {
    throw new BadRequest("Post not found");
  }

  return { post };
};

// export const getAllPostsService = async (
//   input: GetAllPostsInput
// ): Promise<GetAllPostsResult> => {
//   const { page = 1, limit = 10, sortBy = 'newest' } = input;

//   // Validate pagination params
//   if (page < 1 || limit < 1 || limit > 100) {
//     throw new BadRequest("Invalid pagination parameters");
//   }

//   // Determine sort order
//   const sortOrder = sortBy === 'oldest' ? 1 : -1;

//   const skip = (page - 1) * limit;

//   // Get total count
//   const totalDocs = await Post.countDocuments();

//   // Fetch posts with pagination
//   const posts = await Post.find()
//     .select("-cloudinary_id")
//     .populate("author", "firstName lastName email profileUrl")
//     .populate("likes.user", "firstName lastName profileUrl bio")
//     .populate("disLikes.user", "firstName lastName profileUrl bio")
//     .populate("shares.user", "firstName lastName profileUrl bio")
//     .populate("comments", "comment user createdAt")
//     .populate("views.user", "firstName lastName profileUrl bio")
//     .sort({ createdAt: sortOrder })
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   if (!posts || posts.length === 0) {
//     throw new BadRequest("No posts found");
//   }

//   const totalPages = Math.ceil(totalDocs / limit);
//   const nextPage = page < totalPages ? page + 1 : undefined;
//   const prevPage = page > 1 ? page - 1 : undefined;

//   return {
//     posts: posts.map((post) => post),
//     totalDocs,
//     totalPages,
//     currentPage: page,
//     nextPage,
//     prevPage,
//   };
// };

// export const getTimelinePostsService =  async (
//   input: GetTimelinePostInput
//   ): Promise<GetTimelinePostResult> => {
//     const {userId }= input;
//     const user = await User.findById(userId)
//       .populate("following friends")
//       .exec();

//     const friendsIds = user?.friends.map(
//       (friend: any) => friend._id
//     ) as unknown as Object[];
//     const followingIds = user?.following.map(
//       (follow: any) => follow._id
//     ) as unknown as Object[];

//     const userIds = [userId, ...friendsIds, ...followingIds].filter(
//       (id): id is Types.ObjectId => !!id
//     );

//     const posts = await Post.find({ author: { $in: userIds } })
//       .populate("author", "firstName lastName email")
//       .populate("likes.user", "firstName lastName profileUrl bio")
//       .populate("disLikes", "firstName lastName profileUrl bio")
//       .populate("shares", "firstName lastName profileUrl bio")
//       .populate("comments.user", "firstName lastName profileUrl bio")
//       .populate("views", "firstName lastName profileUrl bio")
//       .sort({ createdAt: -1 }) // sort by newest first
//       .exec();

//     if (!posts || posts.length === 0) {
//       throw new BadRequest("No posts found for timeline");
//     }

//     const data = {
//       posts: posts.map((post: any) => post.toObject()),
//     };

//     return {data}

//   }

export const updatePostService = async (input: UpdatePostInput) => {
  const {
    title,
    description,
    category,
    photoUrl,
    postId,
    fileId,
    requestingUserId,
    requestingUserRole,
  } = input;

  // find the post to be updated by its id

  const post = await Post.findById(postId)
    .select("-cloudinary_id")
    .populate("author", "firstName lastName bio profileUrl email")
    .populate("likes.user", "firstName lastName profileUrl bio")
    .populate("dislikes", "firstName lastName profileUrl bio")
    .populate("shares", "firstName lastName profileUrl bio")
    .populate("comments.user", "firstName lastName profileUrl bio")
    .populate("views", "firstName lastName profileUrl bio");

  if (!post) {
    throw new BadRequest("Post not found");
  }

  // now update the post fields  and cloudinary image if new image is provided

  if (post.cloudinary_id && fileId) {
    // this will delete the old image from cloudinary
    await cloudinary.uploader.destroy(post.cloudinary_id);
  }
  if (
    (requestingUserId !== post.author._id.toString() &&
      requestingUserRole !== "admin") ||
    "ADMIN"
  ) {
    throw new UnprocessableEntity("You are not authorized to update this post");
  }

  let cloudinaryResult: any = null;

  if (fileId) {
    const localPath = `${Env.PWD}/public/uploads/posts/${fileId}`;

    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
      resource_type: "image",
    });
    await deleteFile(localPath);
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.category = category ? category.toLowerCase() : post.category;
  post.photoUrl =
    fileId && cloudinaryResult
      ? cloudinaryResult.secure_url
      : photoUrl || post.photoUrl;
  post.cloudinary_id =
    fileId && cloudinaryResult
      ? cloudinaryResult.public_id
      : post.cloudinary_id;

  const updatedPost = await post.save({});

  return { updatedPost };
};

export const deleteUserPostService = async (
  postId: string,
  userId: string,
  userRole?: string
): Promise<void> => {
  // 1. Find the post first
  const post = await Post.findById(postId);
  if (!post) {
    throw new BadRequest("Post not found");
  }
  if (post.author.toString() !== userId.toString() && userRole !== "admin") {
    throw new UnprocessableEntity("You are not authorized to delete this post");
  }
  // now delete the post

  const droppedPost = await Post.findByIdAndDelete(postId);

  if (!droppedPost) {
    throw new BadRequest("Failed to delete the post");
  }

  if (post.cloudinary_id) {
    await cloudinary.uploader.destroy(post.cloudinary_id);
  }
};

export const likePostService = async (
  input: LikePostInput
): Promise<LikePostResult> => {
  // find the post to be liked by its id

  const { postId, userId } = input;

  const post = await Post.findById(postId);

  if (!post) {
    throw new BadRequest("Post not found");
  }
  // check if the user has already liked the post

  const isAlreadyLiked = post.likes.some((like: LikeT) => {
    // here it is important to use 'some' method to return boolean and it return true as soon as one match is found
    return like.user.toString() === userId.toString(); // like.user is objid that is accessed through likes schema and req.user?._id is also objid so both are converted to string for comparison
  });
  if (!isAlreadyLiked) {
    await post.updateOne({
      $push: {
        likes: { user: userId }, // pushing the user id of the liker into the likes array of the post
      },
    });
    const liker = await User.findById(userId).select("firstName lastName ");

    if (post.author._id.toString() !== userId.toString()) {
      await createNotificationService({
        recipientId: post.author._id.toString(),
        senderId: userId,
        type: NotificationType.LIKE,
        postId: postId,
        message: `${liker?.firstName} ${liker?.lastName} liked your post.`,
      });
      await updateUserInteractionScore(
  
        userId,
        post.author._id.toString(),
        "like"
      );
    } // to avoid self notification
  } else {
    await post.updateOne({
      $pull: {
        likes: {
          user: userId, // removing the user id from likes array if already liked
        },
      },
    });
  }

  const updatedPost = await Post.findById(postId)
    .select("-cloudinary_id")
    .populate("author", "firstName lastName email")
    .populate("likes.user", "firstName lastName profileUrl bio")
    .populate("dislikes", "firstName lastName profileUrl bio")
    .populate("shares", "firstName lastName profileUrl bio")
    .populate("comments.user", "firstName lastName profileUrl bio")
    .populate("views", "firstName lastName profileUrl bio");

  if (!updatedPost) {
    throw new BadRequest("Post not found after update");
  }
  // this return the updated post after like/unlike action
  const data = {
    post: { ...updatedPost._doc },
  };
  return { isAlreadyLiked, data };
};

export const addCommentInPostService = async (
  input: AddCommentInPostInput
): Promise<{ comment: any }> => {
  // find the post to which comment is to be added
  const { postId, userId, comments } = input;
  const post = await Post.findById(postId)
    .select("-cloudinary_id")
    .populate("author", "firstName lastName email")
    .populate("likes.user", "firstName lastName profileUrl bio")
    .populate("disLikes", "firstName lastName profileUrl bio")
    .populate("shares", "firstName lastName profileUrl bio")
    .populate("comments.user", "firstName lastName profileUrl bio")
    .populate("views", "firstName lastName profileUrl bio");

  if (!post) {
    throw new BadRequest("Post not found");
  }

  const newComment = await Comment.create({
    comments,
    user: userId,
    post: postId,
  });

  post.comments.push(newComment._id);
  await post.save();
  await newComment.populate("user", "firstName lastName profileUrl bio");

const commenter = await User.findById(userId).select("firstName lastName ");

if(commenter&& post.author._id.toString() !== userId.toString()) {

await createNotificationService({
  recipientId: post.author._id.toString(),
  senderId: userId,
  type: NotificationType.COMMENT,
  postId: postId,
  commentId: newComment._id.toString(),
  message: `${commenter?.firstName} ${commenter?.lastName} commented on your post.`,
})


 await updateUserInteractionScore(userId, post.author._id.toString(), "comment");

}



  return {
    comment: newComment,
  };
};

export const updateCommentInPostService = async (
  input: UpdateCommentInPostInput
): Promise<{ comment: any }> => {
  const { postId, commentId, userId, newCommentText } = input;
  const post = await Post.findById(input);
  if (!post) {
    throw new BadRequest("Post not found");
  }

  // 1. Find the comment and verify ownership in one query
  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      user: userId, // Ensure user is the author of the comment
      post: postId, // Ensure comment belongs to this post
    },
    {
      $set: {
        comments: newCommentText,
      },
    },
    { new: true }
  );
  if (!updatedComment) {
    throw new UnprocessableEntity(
      "Comment not found or you are not authorized to update it."
    );
  }

  return {
    comment: updatedComment.toObject(),
  };
};

export const getCommentInPostService = async (
  postId: string,
  commentId: string
): Promise<{ comment: any }> => {
  // here we have to find a particular comment in a post
  const comment = await Comment.findOne({
    _id: commentId,
    post: postId,
  }).populate("user", "firstName lastName profileUrl bio");

  if (!comment) {
    throw new BadRequest("Comment not found in this post");
  }

  return {
    comment: comment.toObject(),
  };
};

export const deleteUserCommentInPostService = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<void> => {
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    user: userId, // Ensure user is the author of the comment
    post: postId, // Ensure comment belongs to this post
  });

  if (!deletedComment) {
    throw new UnprocessableEntity(
      "Comment not found or you are not authorized to delete it."
    );
  }
  await Post.findByIdAndUpdate(postId, {
    $pull: { comments: deletedComment._id },
  });
};
