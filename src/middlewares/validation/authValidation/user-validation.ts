import { RequestHandler } from "express";
import validator from "../../validator";
import { userSchema } from "./user-schema";

export const signupValidation : RequestHandler =(req,res,next) => validator(userSchema.signupUser, {...req.body}, next);

export const loginValidation : RequestHandler =(req,res,next) => validator(userSchema.loginUser, {...req.body}, next);  

export const logouValidation: RequestHandler = (req,res,next) => validator(userSchema.logoutUser, {...req.body}, next);


export const refreshTokenValidation: RequestHandler = (req,res,next) => validator(userSchema.refreshToken, {...req.body}, next);

export const userIdValidation: RequestHandler =(req,res,next) => validator(userSchema.validatedUserId, {...req.params}, next);

export const verifyUserMailValidation: RequestHandler =(req,res,next) => validator(userSchema.verifyUserMail, {...req.body}, next);

export const sendVerificationMailValidation: RequestHandler =(req,res,next) => validator(userSchema.sendVerificationMail, {...req.body}, next);

export const resetPasswordValidation: RequestHandler =(req,res,next) => validator(userSchema.resetPassword, {...req.body}, next);

export const verifyTokenValidation: RequestHandler =(req,res,next) => validator(userSchema.verifyToken, {...req.body}, next);

export const updateUserValidation: RequestHandler =(req,res,next) => validator(userSchema.updateUser, {...req.body, ...req.params}, next);