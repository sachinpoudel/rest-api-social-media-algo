import express from "express";
import { loginValidation, logouValidation, resetPasswordValidation, sendVerificationMailValidation, signupValidation, updateUserValidation, userIdValidation, verifyUserMailValidation } from "../middlewares/validation/authValidation/user-validation";
import { deleteAccountController, forgotPasswordController, getProfileController, loginController, logoutController, refreshTokenController, resetPasswordController, signUpController, updateAccountController, verifyEmailController } from "../controllers/auth.controller";
import {uploadImg} from '../middlewares/uploads/multer'
import { isLogin } from "../middlewares/auth/check-is-auth";
const router = express.Router()     

router.post('/signup', signupValidation, signUpController);
router.post('/login',loginValidation, loginController)
router.post('/logout', logouValidation, logoutController)
router.post('/refresh-token', refreshTokenController)
router.delete('/delete-acc/:id',isLogin, userIdValidation, deleteAccountController)
router.get('/profile', isLogin, getProfileController)
router.get('/verify-email/:userId/:token', verifyUserMailValidation, verifyEmailController
);
router.patch('/update/:userId', updateUserValidation, uploadImg.single('profileImage') ,updateAccountController);
router.post('/forgot-password', sendVerificationMailValidation, forgotPasswordController)
router.post('/reset-password/:userId/:token', resetPasswordValidation, resetPasswordController)


export default router;


///Express route handlers expect the first argument to be a standard Request object. If you use a custom type (like IAuthRequest), TypeScript will complain unless you tell Express about your extension.