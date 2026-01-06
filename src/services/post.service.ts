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
import { IUser } from "../interfaces/User";
import { IPost, LikeT } from "../interfaces/Post";
import { CommentI } from "../interfaces/CustomTypes";
import { Comment } from "../models/Comment-model";
import User from "../models/user-model";
import { Types } from "mongoose";

export const createPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const { title, description, category, photoUrl } =
      req.body as IPostDocument;

    if (!req.file) {
      throw new UnprocessableEntity("Post image is required");
    }

    try {
      var cloudinaryResult;
      let localPath: string | undefined;

      // const fileName = req.originalUrl.split('/').includes("users") ? 'users' : req.originalUrl.split('/').includes("posts") ? 'posts' : 'others';

      if (req.file?.filename) {
        localPath = `${Env.PWD}/public/uploads/posts/${req.file?.filename}`;
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
        author: req.user?._id || "",
      });

      const createdPost = await Post.create(postData);

      if (!createdPost) {
        throw new UnprocessableEntity("Failed to create post");
      }

      const data = {
        post: {
          ...createdPost._doc,
          author: {
            _id: req.user?._id,
            firtName: req.user?.firstName,
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
    } catch (error) {
      if (req.file && req.file.filename) {
        const localPath = `${Env.PWD}/public/uploads/posts/${req.file.filename}`;
        await deleteFile(localPath);
      }
      throw error;
    }
  }
);

export const getPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const post = await Post.findById(req.params.postId)
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

    res.status(200).json({
      message: "Post fetched successfully",
      success: true,
      data: {
        post: post,
      },
    });
  }
);

export const getAllPostsService = asyncHandler(
  async (_req: Request, res: TPaginationResponse, next: NextFunction) => {
   if (res?.paginatedResults) {
    const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = res.paginatedResults;
    const responseObject: any = {
      totalDocs: totalDocs || 0,
      totalPages: totalPages || 0,
      lastPage: lastPage || 0,
      count: results?.length || 0,
      currentPage: currentPage || 0
    };

    if (next) {
      responseObject.nextPage = next;
    }
    if (previous) {
      responseObject.prevPage = previous;
    }

    responseObject.posts = (results as Array<{ _doc: IPost }>).map((postDoc) => {
      return {
        ...postDoc._doc,
        }
      }
    ); 
      res.status(200).json({
        message: "Posts fetched successfully",
        success: true,
        data: responseObject,
      });
    
  };
}
)

export const getTimelinePostsService = asyncHandler(
  async(
    req:AuthenticatedRequestBody<IUser>,
    res:Response,
    next:NextFunction
  ) => {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate('following friends').exec()

const friendsIds = user?.friends.map((friend) => friend._id) as unknown as Object[];
const followingIds = user?.following.map((follow) => follow._id) as unknown as Object[];

const userIds = [userId, ...friendsIds, ...followingIds].filter((id): id is Types.ObjectId => !!id);

const posts = await Post.find({ author: { $in: userIds } })
.populate("author", "firstName lastName email")
.populate("likes.user", "firstName lastName profileUrl bio")
.populate("disLikes", "firstName lastName profileUrl bio")
.populate("shares", "firstName lastName profileUrl bio")
.populate("comments.user", "firstName lastName profileUrl bio")
.populate("views", "firstName lastName profileUrl bio")
.sort({ createdAt: -1 }) // sort by newest first
.exec();

if(!posts || posts.length === 0){
  throw new BadRequest("No posts found for timeline");
}

const data = {
  posts: posts.map((post) => post.toObject())
}
res.status(200).json({
  message: "Timeline posts fetched successfully",
  success: true,
  data,
});

  }
);


export const updatePostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const { title, description, category, photoUrl } =
      req.body as IPostDocument;

    // find the post to be updated by its id

    const post = await Post.findById(req.params.postId)
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

    // allow only the author of the post to update it

    if (!req.user?._id.equals(post.author._id) && req.user?.role !== "admin") {
      throw new UnprocessableEntity(
        "You are not authorized to update this post"
      );
    }
    // now update the post fields  and cloudinary image if new image is provided

    if (post.cloudinary_id && req.file?.filename) {
      // this will delete the old image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinary_id);
    }

    let cloudinaryResult: any = null;

    if (req.file?.filename) {
      const localPath = `${Env.PWD}/public/uploads/posts/${req.file?.filename}`;

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
      req.file?.filename && cloudinaryResult
        ? cloudinaryResult.secure_url
        : photoUrl || post.photoUrl;
    post.cloudinary_id =
      req.file?.filename && cloudinaryResult
        ? cloudinaryResult.public_id
        : post.cloudinary_id;

    const updatedPost = await post.save({});

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

export const deleteUserPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    // find which post and of whom post to be deleted

    const postId = req.params.postId;

    // 1. Find the post first
    const post = await Post.findById(postId);
    if (!post) {
      throw new BadRequest("Post not found");
    }
    if (
      post.author.toString() !== req.user?._id.toString() &&
      req.user?.role !== "admin"
    ) {
      throw new UnprocessableEntity(
        "You are not authorized to delete this post"
      );
    }
    // now delete the post

    const droppedPost = await Post.findByIdAndDelete(postId);

    if (!droppedPost) {
      throw new BadRequest("Failed to delete the post");
    }

    if (post.cloudinary_id) {
      await cloudinary.uploader.destroy(post.cloudinary_id);
    }

    res.status(200).json({
      message: "Post deleted successfully",
      success: true,
    });
  }
);




export const likePostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    // find the post to be liked by its id

    const post = await Post.findById(req.params.postId);

    if (!post) {
      throw new BadRequest("Post not found");
    }
    // check if the user has already liked the post

    const isAlreadyLiked = post.likes.some((like: LikeT) => {
      // here it is important to use 'some' method to return boolean and it return true as soon as one match is found
      return like.user.toString() === req.user?._id.toString(); // like.user is objid that is accessed through likes schema and req.user?._id is also objid so both are converted to string for comparison
    });
    if (!isAlreadyLiked) {
      await post.updateOne({
        $push: {
          likes: { user: req.user?._id }, // pushing the user id of the liker into the likes array of the post
        },
      });
    } else {
      await post.updateOne({
        $pull: {
          likes: {
            user: req.user?._id, // removing the user id from likes array if already liked
          },
        },
      });
    }
    const updatedPost = await Post.findById(req.params.postId)
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

    res.status(200).json({
      message: isAlreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      success: true,
      data,
    });
  }
);



export const addCommentInPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<CommentI>,
    res: Response,
    next: NextFunction
  ) => {
    const { comment } = req.body as CommentI;
    const postId = req.params.postId;
    const userId = req.user?._id || '695baba4bedffa33b4fb3e83'; 

    // find the post to which comment is to be added

    // const newComment = {
    //   user: req.user?._id,
    //   comment,
    // };

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

    if (!userId) {
      throw new UnprocessableEntity("User ID is required to add a comment");
    }
    if (!postId) {
      throw new UnprocessableEntity("Post ID is required to add a comment");
    }
    const newComment = await Comment.create({
      comments: comment,
      user: userId,
      post: postId,
    });

    // ...existing code...
    post.comments.push(newComment._id as unknown as CommentI); // this will push the comment object id into the comments array of the post
    // ...existing code...
    await post.save();
    await newComment.populate("user", "firstName lastName profileUrl bio");
    const data = {
      comment: { ...newComment.toObject() },
    };
    res.status(200).json({
      message: "Comment added successfully",
      success: true,
      data,
    });
  }
);

export const updateCommentInPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<CommentI>,
    res: Response,
    next: NextFunction
  ) => {
    const { comment:newCommentText } = req.body as CommentI;
    const { postId, commentId } = req.params;
    const userId = req.user?._id;

    if (!postId || !commentId) {
      throw new UnprocessableEntity("Post ID and Comment ID are required");
    }
if(!userId){
  throw new UnprocessableEntity("User ID is required to update a comment");
}


const post = await Post.findById(postId);
    if (!post) {
      throw new BadRequest("Post not found");
    }



    // 1. Find the comment and verify ownership in one query
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        user: userId,    // Ensure user is the author of the comment
        post: postId,    // Ensure comment belongs to this post
      },
      {$set: {

        comments: newCommentText,
      }
      },
      { new: true }
    );
    if (!updatedComment) {
      throw new UnprocessableEntity(
        "Comment not found or you are not authorized to update it."
      );
    }

    const data = {
      post: {
        ...updatedComment,
      },
    };
    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data,
    });
  }
);

export const getCommentInPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    // here we have to find a particular comment in a post

    // get a postId and commentId from req.params

    const { postId, commentId } = req.params;


    if (!postId || !commentId) {
      throw new UnprocessableEntity("Post ID and Comment ID are required");
    }
    // find the post by postId

    // const post = await Post.findById(postId)
    //   .select("-cloudinary_id")
    //   .populate("comments.user", "firstName lastName profileUrl bio")
    //   .populate("author", "firstName lastName email")
    //   .populate("likes.user", "firstName lastName profileUrl bio")
    //   .populate("dislikes", "firstName lastName profileUrl bio")
    //   .populate("shares", "firstName lastName profileUrl bio")
    //   .populate("views", "firstName lastName profileUrl bio");

    // if (!post) {
    //   throw new BadRequest("Post not found");
    // }

    // // check if the comment exists in the post

    // const isCommentExits = post.comments.find((comment) =>
    //   comment._id.equals(commentId)
    // );

    // if (!isCommentExits) {
    //   throw new BadRequest("Comment not found in this post");
    // }
    // post.comments = post.comments.filter(
    //   (item) =>
    //     item.user?._id.toString() === req.user?._id.toString() &&
    //     commentId !== undefined &&
    //     item?._id.toString() === commentId.toString()
    // );

const comment = await Comment.findOne({
  _id: commentId,
  post: postId,
}).populate("user", "firstName lastName profileUrl bio");

if(!comment){
  throw new BadRequest("Comment not found in this post");
}

    // const { comments } = post._doc;

    const data = {
      comment: {
        comment
      },
    };
    res.status(200).json({
      success: true,
      message: "Comment fetched successfully",
      data,
    });
  }
);

export const deleteUserCommentInPostService = asyncHandler(
  async(req: AuthenticatedRequestBody<IPostDocument>, res: Response, next: NextFunction) => {
    const {postId, commentId} = req.params;
    const userId = req.user?._id;


if(!postId || !commentId){
  throw new UnprocessableEntity("Post ID and Comment ID are required");
}
if(!userId){
  throw new UnprocessableEntity("User ID is required to delete a comment");
}
const deletedComment = await Comment.findOneAndDelete({
  _id: commentId,
  user: userId,    // Ensure user is the author of the comment
  post: postId,    // Ensure comment belongs to this post
})

    if (!deletedComment) { 
      throw new UnprocessableEntity(
        "Comment not found or you are not authorized to delete it."
      );
    }
        await Post.findByIdAndUpdate(postId, {
      $pull: { comments: deletedComment._id }
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  }
)