import express from "express";
import authRoutes from "../routes/auth.route"
import postRoutes from "../routes/post.route"


const router = express.Router();


router.use('/auth', authRoutes)
router.use('/posts', postRoutes)

export default router;