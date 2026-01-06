import { RequestHandler } from "express";
import validator from "../../validator";
import { postSchema } from "./postSchema";

export const addPostValidation : RequestHandler = (req,res,next) => validator(postSchema.addPost, {...req.body}, next);

export const updatePostValidation : RequestHandler = (req,res,next) => validator(postSchema.updatePost, {...req.body, ...req.params}, next);

export const addCommentValidation : RequestHandler = (req,res,next) => validator(postSchema.addComment, {...req.body, ...req.params}, next);

export const updateCommentValidation : RequestHandler = (req,res,next) => validator(postSchema.updateComment, {...req.body, ...req.params}, next);

export const deleteCommentValidation : RequestHandler = (req,res,next) => validator(postSchema.deleteComment, {...req.params}, next);

export const validatedPostIdValidation : RequestHandler = (req,res,next) => validator(postSchema.validatedPostId, {...req.params}, next);

export const validatedCommentIdValidation : RequestHandler = (req,res,next) => validator(postSchema.validatedCommentId, {...req.params}, next); 