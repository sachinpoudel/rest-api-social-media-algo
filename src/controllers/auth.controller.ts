import type { Request, Response, NextFunction } from "express";
import {
  deleteAccountService,
  forgotPasswordService,
  getProfileService,
  loginUserService,
  logoutService,
  refreshTokenService,
  resetPasswordService,
  signUpService,
  updateAccountService,
  verifyEmailService,
} from "../services/auth.service";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import { IUser } from "../interfaces/User";
import { asyncHandler } from "../middlewares/auth/async-handler";
import * as AuthService from "../services/auth.service";
import { HTTPSTATUS } from "../configs/http-config";
import { Env } from "../configs/env-config";
import { ITokenDocument } from "../models/Token-model";
import { IToken } from "../interfaces/Token";
import { AUTHORIZATION_ROLES } from "../constants/auth";
import { BadRequest, UnAuthorized } from "../middlewares/error/app-error";

export const signUpController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      bio,
      skills,
      gender,
      acceptTerms,
    } = req.body as IUser;

    const { user, accessToken, refreshToken } = await AuthService.signUpService(
      {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        bio,
        skills,
        gender,
        acceptTerms,
      }
    );

    // 3. Send HTTP response
    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token: {
          accessToken,
          refreshToken,
        },
      },
    });
  }
);

export const loginController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password } = req.body as IUser;
    const {
      user,
      accessToken,
      refreshToken,
      needsVerification,
      verifyEmailLink,
    } = await AuthService.loginUserService({ email, password });

    if (needsVerification) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        data: {
          accessToken,
          refreshToken,
          verifyEmailLink,
        },
        message: "Email not verified. Verification email sent again",
      });
    }

    // 4. Set cookies (HTTP concern - belongs in controller)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User logged in successfully",
      data: {
        accessToken,
        refreshToken,
      },
    });
  }
);

export const logoutController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<ITokenDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const { refreshToken } = req.body as ITokenDocument;

    if (!refreshToken) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    await logoutService({ refreshToken });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User logged out successfully",
      data: null,
    });
  }
);

export const refreshTokenController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<ITokenDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const { refreshToken } = req.body as IToken;

    if (!refreshToken) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await refreshTokenService({ refreshToken });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const data = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Token refreshed successfully",
      data,
    });
  }
);

export const deleteAccountController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // if (
    //   req.user?._id.toString() !== userId &&
    //   req.user?.role !== AUTHORIZATION_ROLES.ADMIN
    // ) {
    //   throw new UnAuthorized("You are not authorized to delete this account");
    // }

    const { deletedUserName } = await deleteAccountService({
      userId,
      requestingUserId: userId,
      requestingUserRole: req.user?.role ?? "",
    });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(HTTPSTATUS.OK).json({
      message: `User account deleted successfully: ${deletedUserName}`,
      success: true,
      data: null,
    });
  }
);

export const updateAccountController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      profileUrl,
      acceptTerms,
      phoneNumber,
      bio,
      skills,
    } = req.body as IUser;

 const userId = req.user?._id.toString() 

    if (!userId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { user } = await AuthService.updateAccountService({
      userId,
      firstName,
      lastName,
      dateOfBirth,
      email,
      profileUrl,
      acceptTerms,
      phoneNumber,
      bio,
      skills,
      file: req.file,
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User account updated successfully",
      data: { user },
    });
  }
);

export const getProfileController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new UnAuthorized("User not authenticated");
    }

    const { user } = await getProfileService({
      userId: req.user!._id.toString(),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User profile fetched successfully",
      data: { user },
    });
  }
);

export const verifyEmailController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
   
    const { token,userId } = req.query;

    if (!userId || !token) {
      throw new BadRequest("Invalid verification link");
    }

    const { userName, alreadyVerified } = await verifyEmailService({
      userId,
      token: String(token),
    });

    const message = alreadyVerified
      ? `Email already verified for ${userName}. Please login to continue`
      : `Email verified successfully for ${userName}. You can now login to your account`;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: null,
      message: message,
    });
  }
);

export const forgotPasswordController =asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const { email } = req.body as IUser;

const {emailSent} = await forgotPasswordService({email})
       res.status(HTTPSTATUS.OK).json({
      message: "Password reset link sent to your email",
      success: true,
      data: emailSent,
    });
  }
)

export const resetPasswordController = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId, token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!userId || !token) {
      throw new BadRequest("Invalid password reset link");
    }

    if (!password || !confirmPassword) {
      throw new BadRequest("Password and confirm password are required");
    }

    await resetPasswordService({
      userId,
      token,
      password,
      confirmPassword,
    });

 
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: null,
      message: "Password reset successfully. You can now login with your new password",
    });
  }
);

export const changePasswordController = asyncHandler(
  async(req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const {password,newPassword,confirmNewPassword} = req.body as IUser;

    const userId = req.user?._id.toString();

    if(!userId) {
      throw new UnAuthorized("User not authenticated");
    }

    if(!password || !newPassword || !confirmNewPassword) {
      throw new BadRequest("All password fields are required");
    }


    await AuthService.changePasswordService({
      userId,
      password,
      newPassword,
      confirmNewPassword
    });
  }
)