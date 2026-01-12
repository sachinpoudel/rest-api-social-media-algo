// src/controllers/notification.controller.ts
import { Response } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import {
  getNotificationsService,
  markNotificationsAsReadService,
  deleteNotificationService,
} from "../services/notification.service";
import { BadRequest, UnAuthorized } from "../middlewares/error/app-error";

export const getNotificationsController = asyncHandler(
  async (req: AuthenticatedRequestBody<any>, res: Response) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new UnAuthorized("User not authenticated");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await getNotificationsService({
      userId,
      page,
      limit,
      unreadOnly,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: result,
    });
  }
);

export const markAsReadController = asyncHandler(
  async (req: AuthenticatedRequestBody<any>, res: Response) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new UnAuthorized("User not authenticated");
    }

    const notificationIds = req.body.notificationIds as string[] | undefined;

    await markNotificationsAsReadService(userId, notificationIds);

    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  }
);

export const deleteNotificationController = asyncHandler(
  async (req: AuthenticatedRequestBody<any>, res: Response) => {
    const userId = req.user?._id?.toString();
    const { notificationId } = req.params;

    if (!userId) {
      throw new UnAuthorized("User not authenticated");
    }

    if (!notificationId) {
      throw new BadRequest("Notification ID is required");
    }

    await deleteNotificationService(userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  }
);