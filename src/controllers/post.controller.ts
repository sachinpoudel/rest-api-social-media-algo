import { Request, Response, NextFunction } from "express";
import { addCommentInPostService, createPostService, deleteUserCommentInPostService, deleteUserPostService, getAllPostsService, getCommentInPostService, getPostService, getTimelinePostsService, likePostService, updateCommentInPostService, updatePostService } from "../services/post.service";


export const createPostController = async(req:Request, res:Response, next:NextFunction) => createPostService(req,res,next)

export const likePostController = async(req:Request, res:Response, next:NextFunction) => likePostService(req,res,next)

export const getPostController = async(req:Request, res:Response, next:NextFunction) => getPostService(req,res,next)

export const getAllPostController = async(req:Request, res:Response, next:NextFunction) => getAllPostsService(req,res,next)

export const getTimeLinePostsController = async(req:Request, res:Response, next:NextFunction) => getTimelinePostsService(req,res,next)

export const updatePostController = async(req:Request, res:Response, next:NextFunction) => updatePostService(req,res,next)

export const deleteUserPostController = async(req:Request, res:Response, next:NextFunction) => deleteUserPostService(req,res,next)


export const addCommentInPostController = async(req:Request, res:Response, next:NextFunction) => addCommentInPostService(req,res,next)

export const deleteUserCommentInPostController = async(req:Request, res:Response, next:NextFunction) => deleteUserCommentInPostService(req,res,next)

export const updateCommentInPostController = async(req:Request, res:Response, next:NextFunction) => updateCommentInPostService(req,res,next)

export const getCommentInPostController = async(req:Request, res:Response, next:NextFunction) => getCommentInPostService(req,res,next)

