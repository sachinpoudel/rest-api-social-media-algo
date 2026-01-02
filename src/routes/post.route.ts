import express from "express";
import { createPostController } from "../controllers/post.controller";
import { uploadImg } from "../middlewares/uploads/multer";


const router = express.Router();


router.post('/create',uploadImg.single('photo') , createPostController)


export default router