import mongoose, { Document, Types } from "mongoose";
import {
  USER_AWARD_OPTIONS,
  USER_PLAN_OPTIONS,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/auth";
import type { Request } from "express";
import { IUserDocument } from "../models/user-model";

export interface FollowT {
  name: string;
  surname: string;
  profileUrl: string;
  bio?: string;
  userId: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string;
  skills: string[];
  profileUrl: string;
  acceptTerms: boolean;
  confirmationCode?: string;
  friends: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isBlocked: boolean;
  isAdmin: boolean;
  role: string;
  viewers: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  blocked: mongoose.Types.ObjectId[];
  userAward: (typeof USER_AWARD_OPTIONS)[number];
  gender?: (typeof GENDER_OPTIONS)[number];
  plan: (typeof USER_PLAN_OPTIONS)[number];
  status: (typeof STATUS_OPTIONS)[number];
  phoneNumber?: string;
  lastLogin?: Date;
  isVerified: boolean;
  isDeleted: boolean;
  dateOfBirth?: Date;
  userId: string | undefined;
  timestamps?: boolean;
  _id: mongoose.Types.ObjectId;
  cloudinary_id?: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface IRequestUser extends Request {
  user: IUser;
}

export interface IAuthRequest extends Request {
  //   headers: { authorization?: string; Authorization?: string };
  //   cookies: { authToken?: string; accessToken?: string; refreshToken?: string };
  user?: IUser;
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string | undefined;
  skills: string[];
  profileUrl?: string;
  acceptTerms: boolean;

  gender?: (typeof GENDER_OPTIONS)[number] | undefined;
}

export interface SignUpResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
  needsVerification: boolean;
  verifyEmailLink?: string;
}

export interface UpdateAccountInput {
  userId: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  dateOfBirth?: Date | undefined;
  email?: string | undefined;
  profileUrl?: string | undefined;
  acceptTerms?: boolean | undefined;
  phoneNumber?: string | undefined;
  bio?: string | undefined;
  skills?: string[] | undefined;
  file?: Express.Multer.File | undefined;
}

export interface UpdateAccountResult {
  user: Partial<IUser>;
}

export interface DeleteAccountInput {
  userId: string;
  requestingUserId: string;
  requestingUserRole: string;
}

export interface GetProfileInput {
  userId: string;

}
export interface GetProfileResult {
  user: Partial<IUser>;
}

export interface VerifyEmailInput {
  userId: string;
  token:string;
}

export interface VerifyEmailResult {
  userName: string;
  alreadyVerified?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  userId: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordInput {
  userId:string;
  password:string;
  newPassword:string;
  confirmNewPassword:string;
}

// ============= User Service Types =============

export interface GetUsersOutput {
  users: Partial<IUser>[];
  count: number;
}

export interface GetUserInput {
  userId: string;
}

export interface GetUserOutput {
  user: Partial<IUser>;
}

export interface FollowUserInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface FollowUserOutput {
  user: Partial<IUser>;
  followedUser: {
    firstName: string;
    lastName: string;
  };
}

export interface UnFollowUserInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface UnFollowUserOutput {
  user: Partial<IUser>;
  unfollowedUser: {
    firstName: string;
    lastName: string;
  };
}

export interface AddFriendInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface AddFriendOutput {
  user: Partial<IUser>;
  addedFriend: {
    firstName: string;
    lastName: string;
  };
}

export interface UnFriendInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface UnFriendOutput {
  user: Partial<IUser>;
  unfriendedUser: {
    firstName: string;
    lastName: string;
  };
}

export interface BlockUserInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface BlockUserOutput {
  user: Partial<IUser>;
  blockedUser: {
    firstName: string;
    lastName: string;
  };
}

export interface UnblockUserInput {
  currentUserId: Types.ObjectId;
  targetUserId: string;
}

export interface UnblockUserOutput {
  user: Partial<IUser>;
  unblockedUser: {
    firstName: string;
    lastName: string;
  };
}