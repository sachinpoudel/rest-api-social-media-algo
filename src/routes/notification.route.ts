// src/routes/notification.route.ts
import { Router } from "express";
import {
  getNotificationsController,
  markAsReadController,
  deleteNotificationController,
} from "../controllers/notification.controller";
import {  isLogin } from "../middlewares/auth/check-is-auth";

const router = Router();

router.get("/", isLogin, getNotificationsController);
router.patch("/mark-read", isLogin, markAsReadController);
router.delete("/:notificationId", isLogin, deleteNotificationController);

export default router;