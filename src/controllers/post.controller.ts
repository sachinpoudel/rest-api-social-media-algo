import { Request, Response, NextFunction } from "express";
import { createPostService } from "../services/post.service";


export const createPostController = async(req:Request, res:Response, next:NextFunction) => createPostService(req,res,next)