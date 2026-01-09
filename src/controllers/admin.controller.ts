import { NextFunction , Request, Response} from "express";
import { adminAddUserService, adminCreatePostService, adminDeleteAllPostForGivenUserService, adminDeleteCommentInPostService, adminDeleteUserService, adminGetAllPostsService, adminGetAllUsersService, adminGetPostService, adminGetUsersCountService, adminGetUserService, adminUpdatePostService, adminUpdateUserService } from "../services/admin.service";

export const adminAddUserController = async(req:Request, res:Response, next:NextFunction) => adminAddUserService(req, res, next);

export const adminUpdateUserController = async(req:Request, res:Response, next:NextFunction) => adminUpdateUserService(req, res, next);

export const adminDeleteUserController = async(req:Request, res:Response, next:NextFunction) => adminDeleteUserService(req, res, next);

export const adminGetUserController = async(req:Request, res:Response, next:NextFunction) => adminGetUserService(req, res, next);

export const adminGetAllUsersController = async(req:Request, res:Response, next:NextFunction) => adminGetAllUsersService(req, res, next);

export const adminGetUsersCountController = async(req:Request, res:Response, next:NextFunction) => adminGetUsersCountService(req, res, next);

export const adminGetPostController = async(req:Request, res:Response, next:NextFunction) => adminGetPostService(req, res, next);

export const adminGetAllPostsController = async(req:Request, res:Response, next:NextFunction) => adminGetAllPostsService(req, res, next);

export const adminCreatePostController = async(req:Request, res:Response, next:NextFunction) => adminCreatePostService(req, res, next);

export const adminUpdatePostController = async(req:Request, res:Response, next:NextFunction) => adminUpdatePostService(req, res, next);

export const adminDeleteCommentInPostController = async(req:Request, res:Response, next:NextFunction) => adminDeleteCommentInPostService(req, res, next);

export const adminDeleteAllPostForGivenUserController = async(req:Request, res:Response, next:NextFunction) => adminDeleteAllPostForGivenUserService(req, res, next);