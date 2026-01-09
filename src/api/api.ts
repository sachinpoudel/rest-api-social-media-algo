import express from "express";
import authRoutes from "../routes/auth.route"
import postRoutes from "../routes/post.route"
import userRoutes from "../routes/user.route"
import adminRoutes from "../routes/admin.route"


const router = express.Router();


router.use('/auth', authRoutes)
router.use('/posts', postRoutes)
router.use('/users', userRoutes)
router.use('/admin', adminRoutes)

export default router;