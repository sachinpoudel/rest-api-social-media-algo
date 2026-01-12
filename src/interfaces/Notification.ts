import { Types } from "mongoose";
import { NotificationType } from "../models/Notification-model";
import mongoose from "mongoose";

export interface CreateNotificationInput {
  recipientId: Types.ObjectId | string;
  senderId: Types.ObjectId | string;
  type: NotificationType;
  postId?: string | undefined;  // here undefined works as optional
  commentId?: string | undefined;
  message: string
}

export interface GetNotificationsInput {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
