import { CreateNotificationInput, GetNotificationsInput } from "../interfaces/Notification";
import { BadRequest } from "../middlewares/error/app-error";
import { Notification } from "../models/Notification-model";
import User from "../models/user-model";

export const createNotificationService = async (
  input: CreateNotificationInput
): Promise<void> => {
  const { recipientId, senderId, type, postId, commentId, message } = input;

  if (recipientId === senderId) return; // No need to create notification for self actions

  const recipient = await User.findById(recipientId).select("blocked").lean();

  if (recipient?.blocked?.some((id) => id.toString() === senderId)) {
    return;
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // this returns the date one hour ago from now

  const existingNotification = await Notification.findOne({
    recipient: recipientId,
    sender: senderId,
    type,
   ...(postId && { post: postId }),
    createdAt: { $gte: oneHourAgo },
  });

  if (existingNotification) {
    existingNotification.message = message;
    existingNotification.createdAt = new Date();
    existingNotification.isRead = false;
    await existingNotification.save();
    return;
  }
await new Notification({
    recipient: recipientId,
    sender: senderId,
    type,
    ...(postId && { post: postId }),
    ...(commentId && { comment: commentId }),
    message,
  }).save();
};


// for notificatio to design we need 
// sender receiver
// which post or comment does user interact with
// what message to show
// type of notification like like comment follow
// isRead for marking notification as read or unread



export const getNotificationsService = async(
  input: GetNotificationsInput
) => {
  // to get notification
  // we need userid who trigger the notification
  // pagination optional for better performance
  // filter for unread notification
  // return list of notification
  // populate sender details for better UX

const {userId , page =1 , limit =10, unreadOnly = false} = input;


const query: any = { // this gives base query 
  recipient: userId, // who receive the notification

}
if(unreadOnly) {
  query.isRead = false;
}

const skip = (page -1) * limit;

const [notifications, totalDocs, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "firstName lastName profileUrl")
      .populate("post", "title photoUrl")
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    currentPage: page,
    unreadCount,
  };

}

export const markNotificationsAsReadService = async (
  userId: string,
  notificationIds?: string[]
): Promise<void> => {
  const query: any = { recipient: userId };

  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  await Notification.updateMany(query, { $set: { isRead: true } });
};

export const deleteNotificationService = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!result) {
    throw new BadRequest("Notification not found or unauthorized");
  }
};