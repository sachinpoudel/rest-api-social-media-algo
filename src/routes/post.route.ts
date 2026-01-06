import express from "express";
import { addCommentInPostController, createPostController, deleteUserCommentInPostController, deleteUserPostController, getAllPostController, getCommentInPostController, getPostController, getTimeLinePostsController, likePostController, updateCommentInPostController, updatePostController } from "../controllers/post.controller";
import { uploadImg } from "../middlewares/uploads/multer";
import { isLogin } from "../middlewares/auth/check-is-auth";
import { addCommentValidation, deleteCommentValidation, updateCommentValidation, updatePostValidation, validatedPostIdValidation } from "../middlewares/validation/postValidation/postValidation";
import { userIdValidation } from "../middlewares/validation/authValidation/user-validation";
import { postPaginationMiddleware } from "../middlewares/sort-pagination/postFeatures";


const router = express.Router();


router.post('/create',isLogin,uploadImg.single('photo') , createPostController)
router.put('/comment/:postId',addCommentInPostController )
router.get('/get-post', validatedPostIdValidation, isLogin, getPostController)
router.get('/get-all-posts', postPaginationMiddleware(),getAllPostController)
router.get('/timeline-posts',userIdValidation, isLogin, getTimeLinePostsController)
router.put('/update-post/:postId', uploadImg.single('postImg'),updatePostValidation, isLogin, updatePostController)
router.delete('/delete-post', isLogin, deleteUserPostController)
router.put('/like-post', isLogin, likePostController)


router.put('/add-comment/:postId',addCommentValidation, isLogin, addCommentInPostController )
router.put('/update-comment/:postId/:commentId', updateCommentValidation, isLogin, updateCommentInPostController)
router.get('/get-comment/:postId/:commentId', validatedPostIdValidation, isLogin, getCommentInPostController)
router.delete('/delete-comment/:postId/:commentId', deleteCommentValidation, isLogin, deleteUserCommentInPostController)


export default router