import mongoose, { mongo } from "mongoose";
import { Schema } from "mongoose";

export enum NotificationType {
    COMMENT = "comment",
    LIKE = "like",
    FOLLOW = "follow",
    FRIEND_REQUEST = "friend_request",
    POST = "post",
}


export interface INotification extends mongoose.Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: NotificationType;
    post?: mongoose.Types.ObjectId;
    comment?: mongoose.Types.ObjectId;
    message: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;

}


const NotificationSchema = new mongoose.Schema<INotification> ({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
     type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true, // For filtering unread notifications
    },
  },
  { timestamps: true }
)
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);