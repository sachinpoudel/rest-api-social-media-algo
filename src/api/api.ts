import express from "express";
import authRoutes from "../routes/auth.route"
import postRoutes from "../routes/post.route"
import userRoutes from "../routes/user.route"
import adminRoutes from "../routes/admin.route"
import feedRoutes from "../routes/feed.route";
import notificationRoutes from "../routes/notification.route";


const router = express.Router();


router.use('/auth', authRoutes)
router.use('/posts', postRoutes)
router.use('/users', userRoutes)
router.use('/admins', adminRoutes)
router.use("/feed", feedRoutes);
router.use("/notifications", notificationRoutes);

export default router;