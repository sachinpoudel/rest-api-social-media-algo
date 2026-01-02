import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { IUser } from "../interfaces/User";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import User, { IUserDocument } from "../models/user-model";
import {
  BadRequest,
  ConflictError,
  NotFound,
  UnAuthorized,
} from "../middlewares/error/app-error";
import { getProfilePicUrl } from "../utils/get-prof-picurl";
import { getRoleFromEmail } from "../utils/get-role-from-email";
import { Env } from "../configs/env-config";
import TokenModel from "../models/Token-model";
import Token from "../models/Token-model";
import { SignOptions } from "jsonwebtoken";
import { sendMail } from "../utils/sendMail";
import {
  sendEmailVerificationTemplate,
  sendResetPasswordEmailTemplate,
} from "../utils/email-template";
import { HTTPSTATUS } from "../configs/http-config";
import { access } from "fs";
import { IToken } from "../interfaces/Token";
import { verifyRefreshToken } from "../middlewares/auth/verify-refresh-token";
import { deleteFile } from "../utils/file";
import cloudinary from "../middlewares/uploads/cloudinary";
import { AUTHORIZATION_ROLES } from "../constants/auth";
import { success } from "zod";
import { validateHeaderValue } from "http";
import { error } from "console";

export const signUpService = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      bio,
      skills,
      profileUrl,

      acceptTerms,
      confirmationCode,
      gender,
    } = req.body as IUser;

    const isUserExits = await User.findOne({
      email: new RegExp(`^${email}$`, "i"),
    });

    if (isUserExits) {
      throw new ConflictError("User with this email already exists");
    }
    // Generate profile picture URL
    const finalUserProfilePice = getProfilePicUrl(
      firstName,
      lastName,
      gender,
      profileUrl
    );

    //GET ROLE FROM EMAIL THAT USER ENTERED

    const role = getRoleFromEmail(email); // we have to set admin email in env file to assign admin role

    const finalAcceptTerms =
      acceptTerms ||
      !!(
        Env.ADMIN_EMAILS &&
        (JSON.parse(Env.ADMIN_EMAILS) as string[])?.includes(`${email}`)
      );

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      bio,
      skills: skills || [],
      // isVerified: true,
      // status: "pending",
      role,
      profileUrl: finalUserProfilePice,
      acceptTerms: finalAcceptTerms,
      confirmationCode,
    });

    const user = await newUser.save();

    let token = new Token({ userId: newUser._id }); // we have to create new token document for every new user
    const payload = { userId: newUser._id.toString() };

    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
    const accessTokenExpiresIn = Env.ACCESS_TOKEN_EXPIRES_IN;

    const accessTokenOptions: SignOptions = {
      expiresIn: accessTokenExpiresIn,
      issuer: Env.JWT_ISSUER,
      audience: newUser._id.toString(),
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
      issuer: Env.JWT_ISSUER,
      audience: newUser._id.toString(),
    };

    // generating la

    const [accessToken, refreshToken] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, accessTokenOptions),
      token.generateToken(
        payload,
        Env.REFRESH_TOKEN_KEY as string,
        refreshTokenOptions
      ),
    ]);

    token.accessToken = accessToken;
    token.refreshToken = refreshToken;

    await token.save();

    const verifyEmailLink = `${Env.WEBSITE_URL}/verify-email?id=${newUser._id}&token=${token.refreshToken}`;

    const resp = await sendMail({
      to: newUser.email,
      ...sendEmailVerificationTemplate(verifyEmailLink, newUser.firstName),
    });
    console.log("Email verification sent to ", newUser.email);

    // if (error) {
    //   console.log("Error sending email verification:", error);
    // }
    // if(!resp) {
    //   console.log("Email sending failed");
    // }
    const datas = {
      user,
      token: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      },
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: datas,
    });
  }
);
export const loginService = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as IUser;

    const user = await User.findOne({ email: email }).select("+password");
    if (Env.NODE_ENV === "development") {
      console.log("User found during login:", user);
    }

    if (!user) {
      throw new UnAuthorized(
        "Invalid credentials.. Email not found or registered"
      );
    }

    const isPassValid = await user.comparepassword(password);

    if (!isPassValid) {
      throw new UnAuthorized("Invalid credentials password didint matched");
    }
    var token = await Token.findOne({ userId: user._id });

// user._id is the unique identifier for the user in the users collection.
//userId is a field in the Token collection that stores the reference to the //user's _id.


    if (!token) {
      token = new Token({ userId: user._id });
      token = await token.save();
    }

    const payload = { userId: user._id.toString() };
    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;

    const [acessTokenGenerated, refreshTokenGenerated] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, {
        expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
      token.generateToken(payload, Env.REFRESH_TOKEN_KEY as string, {
        expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
    ]);

    token.accessToken = acessTokenGenerated;
    token.refreshToken = refreshTokenGenerated;

    await token.save();

    if (!user.isVerified || user.status !== "active") {
      const verifyEmailLink = `${Env.WEBSITE_URL}/verify-email?id=${user._id}&token=${token.refreshToken}`;

      const data = await sendMail({
        to: user.email,
        ...sendEmailVerificationTemplate(verifyEmailLink, user.firstName),
      });
      const respData = {
        accesstoken: token.accessToken,
        refreshtoken: token.refreshToken,
        verifyEmailLink,
      };
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: true,
        respData,
        message: "Email not verified. Verification email sent again",
      });
    }
    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });
    const data = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      authToken: token.accessToken,
    };

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data,
      message: "User logged in successfully",
    });
  }
);

// Todo: is verified problem

export const logoutService = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body as IToken;

    if (!refreshToken) {
      throw new BadRequest("Refresh token is required");
    }

    const token = await Token.findOne({ refreshToken });

    if (!token) {
      throw new BadRequest("Invalid token or expired");
    }
    const userId = verifyRefreshToken(refreshToken);

    await Token.deleteOne({
      refreshToken,
    });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(HTTPSTATUS.OK).json({
      data: null,
      success: true,
      message: "User logged out successfully",
    });
  }
);
// get the token
// verify
//generate both
// save token in db
//set cookie
// return data

export const refreshTokenService = asyncHandler(
  ///refresh-token keeps users logged in by issuing new access tokens using a valid refresh token.
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body as IToken;

    if (!refreshToken) {
      throw new BadRequest("Refresh token is required");
    }

    const token = await Token.findOne({ refreshToken });

    if (!token) {
      throw new BadRequest("Invalid token or expired");
    }
    const verifyToken = await verifyRefreshToken(refreshToken); // yesma chai jun jwt secret refresh token ko ho tyo halnu parcha ra verify hunx just like we do jwt verify
// we cant pass entire token document to verify function, we have to pass only the refresh token string stored in the documentz as a payload or value to be verified



    if (Env.NODE_ENV === "development") {
      console.log("Verified token payload:", verifyToken);
    }

    if (!verifyToken) {
      throw new UnAuthorized("Invalid refresh token");
    }

    const userId = (verifyToken as any)?.userId ?? verifyToken;
    const payload = { userId: String(userId) };
    const audience = String(userId); 

    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
    const refreshTokenSecretKey = Env.REFRESH_TOKEN_KEY as string;

    if (Env.NODE_ENV === "development") {
      console.log("Payload for refresh token:", payload);
      console.log("Access Token Secret Key:", accessTokenSecretKey);
      console.log("Refresh Token Secret key:", refreshTokenSecretKey);
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, {
        expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience,
      }),
      token.generateToken(payload, refreshTokenSecretKey, {
        expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience,
      }),
    ]);

    token.accessToken = newAccessToken;
    token.refreshToken = newRefreshToken;

    await token.save();

    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
      secure: Env.NODE_ENV === "production",
      sameSite: "lax",
    });
    const data = {
      user: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      },
    };

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data,
      message: "Token refreshed successfully",
    });
  }
);

// data line
//
export const updateAccountService = asyncHandler(
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

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new BadRequest("User not found");
    }

    if (email) {
      const existingUser = await User.findOne({
        email: new RegExp(`^${email}$`, "i"),
      });

      if (existingUser && !existingUser._id.equals(user._id)) { // this if block prevents user from updating to an email that is already in use by another account
        if (req.file?.filename) {
          const localFilePath = "/public/uploads/" + req.file.filename;

          deleteFile(localFilePath);
        }
        throw new ConflictError("Email is already in use by another account");
      }
    }

    if (req.file && req.file.filename) {
      const localFilePath = `${Env.PWD}/public/uploads/${req.file.filename}`;
      const cloudinaryResp = await cloudinary.uploader.upload(localFilePath, {
        folder: "users",
        overwrite: true,
        resource_type: "image",
      });
      deleteFile(localFilePath);
      user.profileUrl = cloudinaryResp.secure_url;
    } else if (profileUrl) {
      user.profileUrl = profileUrl;
    } else if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    } else if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    } else if (bio) {
      user.bio = bio;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.acceptTerms =
      acceptTerms !== undefined ? acceptTerms : user.acceptTerms;
    user.skills = skills || user.skills;

    const updatedUser = await user.save();

    if (!updatedUser) {
      throw new BadRequest("Failed to update user account");
    }
    const {
      password: pass,
      confirmPassword,
      isVerified,
      idDeletd,
      status,
      acceptedTerms: accTerms,
      role,
      ...userData
    } = updatedUser._doc;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      error: false,
      data: { user: userData },
      message: "User account updated successfully",
    });
  }
);
export const deleteAccountService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    // identify user
    // check role
    // delete user using id from db
    // send response

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new BadRequest("User not found");
    }

    const reqUser = req.user;

    if (
      reqUser &&
      reqUser._id.equals(user._id) &&
      reqUser.role === AUTHORIZATION_ROLES.ADMIN
    ) {
      throw new BadRequest("Admin users cannot delete their own accounts");
    }

    if (
      reqUser &&
      !reqUser._id.equals(user._id) &&
      reqUser.role !== AUTHORIZATION_ROLES.ADMIN
    ) {
      throw new UnAuthorized("You are not authorized to delete this account");
    }

    const deletedUser = await User.findByIdAndDelete({ _id: req.params.id });

    if (!deletedUser) {
      throw new BadRequest("Failed to delete user account");
    }

    const deleteToken = await Token.findOneAndDelete({ userId: deletedUser._id });

    if(!deleteToken){
      throw new BadRequest("Failed to delete user tokens");
    }

    res.status(HTTPSTATUS.OK).json({
      message: "User account deleted successfully",
      success: true,
      data: null,
    });
  }
);

export const getProfileService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    // get user details using id
    // poupulate
    // send response

    if (!req.user) { // to sent req from postman req.user must be logged in user
      throw new UnAuthorized("You are not authorized to access this resource");
    }

    const user = await User.findById(req.user?._id)
      .select(
        "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
      )
      .populate("following", "firstName lastName profileUrl bio") // populate here does not mean filling form data, it means fetching related data from other collections based on references
      .populate("followers", "firstName lastName profileUrl bio") // it fetches who users follows therir firtname lastname profileurl and bio from user collection
      .populate("blocked", "firstName lastName profileUrl bio");

    if (!user) {
      throw new NotFound("User not found");
    }

    const {
      password: pass,
      confirmPassword,
      isVerified,
      isDeleted,
      status,
      acceptTerms,
      // role,
      ...otherUserInfo
    } = user._doc;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: { user: otherUserInfo },
      message: "User profile fetched successfully",
    });
  }
);

export const verifyEmailService = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFound("user not found");
    }

    // check if user is verified bcz we have already check in login route

    if (user.isVerified && user.status === "active") {
      res.status(HTTPSTATUS.OK).json({
        success: true,
        data: null,
        message: "Email already verified. Please login to continue",
      });
    }
    const emailVerificationToken = await Token.findOne({
      userId: user._id,
      refreshToken: req.query.token as string,
    });

    if (!emailVerificationToken) {
      throw new BadRequest("Invalid or expired email verification token");
    }

    user.isVerified = true;
    user.status = "active";

    await user.save();

    await Token.deleteOne({ _id: emailVerificationToken._id });
    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: null,
      message: "Email verified successfully. You can now login to your account",
    });
  }
);

export const forgotPasswordService = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as IUser;

    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFound(`${email} not found in our records`);
    }
    var token = await Token.findOne({ userId: user._id });

    if (!token) {
      token = new Token({ userId: user._id });
      token = await token.save();
    }

    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
    const refreshTokenSecretKey = Env.REFRESH_TOKEN_KEY as string;

    const payload = { userId: user._id.toString() };

    const [accessToken, refreshToken] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, {
        expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
      token.generateToken(payload, refreshTokenSecretKey, {
        expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
    ]);
    token.accessToken = accessToken;
    token.refreshToken = refreshToken;

    await token.save();

    const resetPassLink = `${Env.WEBSITE_URL}/reset-password?id=${user._id}&token=${token.refreshToken}`;

    const resp = await sendMail({
      to: user.email,
      ...sendResetPasswordEmailTemplate(resetPassLink, user.firstName),
    });
    // if(error:any){
    //   if(Env.NODE_ENV === 'development'){
    //     console.log("Error sending reset password email:", error);
    //   }
    // }else {
    //   if(Env.NODE_ENV === 'development'){
    //     console.log("Reset password email sent successfully");
    //   }
    // }

    const data = {
      user: {
        resetPassLink: resetPassLink,
      },
    };

    res.status(HTTPSTATUS.OK).json({
      message: "Password reset link sent to your email",
      success: true,
      data,
    });
  }
);

export const resetPasswordService = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFound("User not found");
    }
    const token = await Token.findOne({
      userId: user._id,
      refreshToken: req.params.token as string,
    });

    if (!token) {
      throw new BadRequest("Invalid or expired password reset token");
    }
    const userId = await verifyRefreshToken(req.params.token as string);

    if (!userId) {
      throw new UnAuthorized("Invalid password reset token");
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;

    await user.save();

    await Token.deleteOne({ _id: token._id });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: null,
      message:
        "Password reset successfully. You can now login with your new password",
    });
  }
);
