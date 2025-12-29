import type { Request, Response, NextFunction } from 'express';
import { deleteAccountService, forgotPasswordService, getProfileService, loginService, logoutService, refreshTokenService, resetPasswordService, signUpService, updateAccountService, verifyEmailService } from '../services/auth.service';
import { AuthenticatedRequestBody } from '../interfaces/CustomTypes';
import { IUser } from '../interfaces/User';


export const signUpController = async (req:Request, res:Response, next:NextFunction) =>
    signUpService(req,res,next);

export const loginController = async (req:Request, res:Response, next: NextFunction) => loginService(req,res,next);


export const logoutController = async (req:Request, res:Response, next: NextFunction) => logoutService(req,res,next);

export const refreshTokenController = async (req:Request, res:Response, next: NextFunction) => refreshTokenService(req,res,next);

export const deleteAccountController = async (req:AuthenticatedRequestBody<IUser>, res:Response, next: NextFunction) => deleteAccountService(req,res,next);

export const updateAccountController = async (req:AuthenticatedRequestBody<IUser>, res:Response, next: NextFunction) => updateAccountService(req,res,next);


export const getProfileController = async (req:AuthenticatedRequestBody<IUser>, res:Response, next: NextFunction) => getProfileService(req,res,next);


export const verifyEmailController = async (req:Request, res:Response, next: NextFunction) => verifyEmailService(req,res,next);

export const forgotPasswordController = async (req:Request, res:Response, next: NextFunction) => forgotPasswordService(req,res,next);

export const resetPasswordController = async (req:Request, res:Response, next: NextFunction) => resetPasswordService(req,res,next);