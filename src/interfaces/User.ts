import mongoose, { Document, Types } from "mongoose";
import {
  USER_AWARD_OPTIONS,
  USER_PLAN_OPTIONS,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/auth";
import type { Request } from "express";

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
  userId?: string;
  timestamps?: boolean;
  _id: mongoose.Types.ObjectId;
  cloudinary_id?: string;
}

export interface IRequestUser extends Request {
  user: IUser;
}

export interface IAuthRequest extends Request {
//   headers: { authorization?: string; Authorization?: string };
//   cookies: { authToken?: string; accessToken?: string; refreshToken?: string };
  user?: IUser;
}
