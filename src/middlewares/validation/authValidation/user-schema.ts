// firstname
//       lastName,
//       email,
//       password,
//       confirmPassword,
//       bio,
//       skills,
//       profileUrl,

import { isValidObjectId } from "mongoose";
import { ref } from "process";
import z, { ZodObject } from "zod";

//       acceptTerms,
//       confirmationCode,
//       gender,

export const userSchema = {
  signupUser: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long"),
    lastName: z.string().min(2, "Last name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
    bio: z
      .string()
      .max(160, "Bio must be at most 160 characters long")
      .optional(),
    skills: z.array(z.string()).optional(),
    profileUrl: z.string().url("Invalid URL").optional(),
    acceptTerms: z.boolean().optional(),
    confirmationCode: z.string().optional(),
  }),
  loginUser: z.object({
    email: z.string().lowercase(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),

  logoutUser: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),

  updateUser: z.object({
    userId: isValidObjectId("Invalid user ID"),
    email: z.string().email("Invalid email address").optional(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters long")
      .optional(),

    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits long")
      .optional(),
    profileUrl: z.string().url("Invalid URL").optional(),
    bio: z
      .string()
      .max(160, "Bio must be at most 160 characters long")
      .optional(),
    skills: z.array(z.string()).optional(),
  }),
  changePassword: z.object({
    newPassword: z
      .string()
      .min(6, "New Password must be at least 6 characters long"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm New Password must be at least 6 characters long"),
    userId: isValidObjectId("Invalid user ID"),
    // password: z.string().min(6, "Password must be at least 6 characters long")
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
  validatedUserId: z.object({
    userId: isValidObjectId("Invalid user ID"),
    token: z.string().min(1, "Verification token is required"),
  }),

  verifyUserMail: z.object({
    userId: isValidObjectId("Invalid user ID"),
    token: z.string().min(1, "Verification token is required"),
  }),
  sendVerificationMail: z.object({
    email: z.string().email("Invalid email address"),
  }),
  resetPassword: z.object({
    token: z.string().min(1, "Reset token is required"),
    userId: isValidObjectId("Invalid user ID"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  }),
  verifyToken: z.object({
    token: z.string().min(1, "Token is required"),
  }),
};
export default userSchema;
