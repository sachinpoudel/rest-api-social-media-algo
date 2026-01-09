import mongoose, { Types } from "mongoose";
import { IPostDocument } from "../models/Post-model";
import { IComment } from "../models/Comment-model";

export interface IShare {
  user: mongoose.Types.ObjectId;
}

export interface LikeT {
  user: mongoose.Types.ObjectId;
}

export interface DisLikeT {
  user: mongoose.Types.ObjectId;
}

export interface ShareT {
  user: mongoose.Types.ObjectId;
}

export interface ViewsT {
  user: mongoose.Types.ObjectId;
}

export interface AddCommentT {
  postId: Types.ObjectId;
}

export interface UpdateCommentT extends AddCommentT {
  commentId: Types.ObjectId;
}

export interface IPost extends mongoose.Document {
  title: string;
  description: string;
  photoUrl: string;
  author: mongoose.Types.ObjectId;
  comments: Array<Types.ObjectId | IComment>;
  likes: LikeT[];
  disLikes: DisLikeT[];
  views: ViewsT[];
  shares: ShareT[];
  category: string;
  cloudinary_id?: string;
  timestamps?: boolean;
  _id: mongoose.Types.ObjectId;
}

export interface CreatePostInput {
  title: string;
  description: string;
  photoUrl: string;
  category: string;
  fileId?: string;
  authorId: string;
}

export interface GetPostInput {
  postId: string;
}
export interface LikePostInput {
  postId: string;
  userId: string;
}

export interface LikePostResult {
  isAlreadyLiked: boolean;
  data: {
    post: IPostDocument;
  };
}

export interface GetAllPostsInput {
  page?: number;
  limit?: number;
  sortBy?: "newest" | "oldest" | "popular";
}

export interface GetAllPostsResult {
  posts: Partial<IPost>[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
  nextPage?: number | undefined;
  prevPage?: number | undefined;
}

export interface GetTimelinePostInput {
  userId: string;
}

export interface GetTimelinePostResult {
  data: {
    posts: Partial<IPost>[];
  };
}

export interface UpdatePostInput {
  title: string;
  description: string;
  category: string;
  photoUrl: string;
  postId: string;
  fileId?: string | undefined;
  requestingUserId: string;
  requestingUserRole: string | undefined;
}
export interface UpdateCommentInPostInput {
  postId: string;
  commentId: string;
  userId: string;
  newCommentText: string
}

export interface AddCommentInPostInput {
  postId: string;
  userId: string;
  comments: string
}
