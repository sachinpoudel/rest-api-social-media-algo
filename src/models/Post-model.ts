import mongoose from "mongoose";
import { IPost } from "../interfaces/Post";
import { POST_CATEGORIES } from "../constants/post";

export interface IPostDocument extends IPost {
  createdAt: Date;
  updatedAt: Date;
  viewsCount?: number;
  likesCount?: number;
  disLikesCount?: number;
  likesPercentage?: string;
  disLikesPercentage?: string;
  daysAgo: string;
  _doc?: any;
}

 const PostSchema: mongoose.Schema<IPostDocument> = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Post title is required"],
    minlength: [5, "Post title must be at least 5 characters long"],
    maxlength: [100, "Post title must be at most 100 characters long"],
  },
  description: {
    type: String,
    trim: true,
    required: [true, "Post description is required"],
    minlength: [10, "Post description must be at least 10 characters long"],
    maxlength: [5000, "Post description must be at most 5000 characters long"],
  },
  photoUrl: {
    type: String,
    trim: true,
    required: [true, "Post photo URL is required"],
  },
  cloudinary_id: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Post author is required"],
  },
  category: {
    type: String,
    enum: {
      values: [
        POST_CATEGORIES.BUSINESS,
        POST_CATEGORIES.EDUCATION,
        POST_CATEGORIES.ENTERTAINMENT,
        POST_CATEGORIES.FASHION,
        POST_CATEGORIES.FOOD,
        POST_CATEGORIES.HEALTH,
        POST_CATEGORIES.LIFESTYLE,
        POST_CATEGORIES.SPORTS,
        POST_CATEGORIES.TECHNOLOGY,
        POST_CATEGORIES.TRAVEL,
      ],
      message: "{VALUE} is not supported as a category",
    },
    defualt: POST_CATEGORIES.TECHNOLOGY,
    trim: true,
    required: [true, "category is required"],
  },

  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  disLikes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  shares: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required to share the post"],
      },
    },
  ],
  views: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required to view the post"],
      },
    },
  ],
  comments: [
    {
      comment: {
        type: String,
        required: [true, "Comment content is required"],
        trim: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required for the comment"],
      },
    },
  ],
},{timestamps: true});

PostSchema.pre(/^find/, function(next) {
  PostSchema.virtual('viewsCount').get(function(this: IPostDocument){
    return this.views.length;
  })
})







export const Post = mongoose.model<IPostDocument>("Post", PostSchema);
  