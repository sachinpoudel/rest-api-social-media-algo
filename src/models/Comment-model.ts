import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  comments: string;
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
}

const CommentSchema: Schema<IComment> = new mongoose.Schema({
  comments: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
}, { timestamps: true });

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);