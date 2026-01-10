import express from "express";
import {
  changePasswordValidation,
  loginValidation,
  logouValidation,
  refreshTokenValidation,
  resetPasswordValidation,
  sendVerificationMailValidation,
  signupValidation,
  updateUserValidation,
  userIdValidation,
  verifyUserMailValidation
} from "../middlewares/validation/authValidation/user-validation";

import { uploadImg } from "../middlewares/uploads/multer";
import { isLogin } from "../middlewares/auth/check-is-auth";
import { cacheByKey } from "../middlewares/cache/cache";
import { invalidateKeys } from "../middlewares/cache/invalidate";
import { cache } from "../utils/cache";
import { Request } from "express";
import { IUser } from "../interfaces/User";
import {
  changePasswordController,
  deleteAccountController,
  forgotPasswordController,
  getProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  resetPasswordController,
  signUpController,
  updateAccountController,
  verifyEmailController,
} from "../controllers/auth.controller";

const router = express.Router();

// Auth routes
router.post("/signup", signupValidation, signUpController);

router.post("/login", isLogin, loginValidation, loginController);

router.post("/logout", logouValidation, logoutController);

router.post('/change-password', changePasswordValidation,isLogin, changePasswordController)

router.post("/refresh-token",isLogin,  refreshTokenValidation, refreshTokenController);

router.get(
  "/profile",
  isLogin,
  cacheByKey((req: Request & { user?: IUser }) => cache.key.userById(String(req.user?._id)), cache.TTL.short),
  getProfileController
);

router.get(
  "/verify-email",
  verifyUserMailValidation,
  verifyEmailController
);

router.patch(
  "/update/",
  updateUserValidation,
  uploadImg.single("profileImage"),
  isLogin,
  invalidateKeys(
    (req) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  updateAccountController
);

router.delete(
  "/delete-acc",
  isLogin,
  userIdValidation,
  invalidateKeys(
    (req) => cache.key.userById(req.params.userId!),
    () => cache.key.userList()
  ),
  deleteAccountController
);

router.post("/forgot-password", sendVerificationMailValidation, forgotPasswordController);

router.post(
  "/reset-password/:userId/:token",
  resetPasswordValidation,
  invalidateKeys((req) => cache.key.userById(req.params.userId!)),
  resetPasswordController
);

export default router;