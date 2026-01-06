import { title } from "process";
import z from "zod";
import { POST_CATEGORIES } from "../../../constants/post";
import { isValidObjectId } from "mongoose";

export const postSchema = {
    addPost: z.object({
        filename: z.string().min(1, "filename is required"),
        photoUrl: z.string().optional(),
        title: z.string().min(5, "title must be at least 5 characters long"),
        description: z.string().min(10, "description must be at least 10 characters long"),
        // category: z.string().check(
        //     POST_CATEGORIES.BUSINESS,
        //     POST_CATEGORIES.ENTERTAINMENT,
        //     POST_CATEGORIES.HEALTH,
        //     POST_CATEGORIES.SPORTS,
        //     POST_CATEGORIES.TECHNOLOGY
        // , "invalid category"),
    
    }),

    updatePost: z.object({
        title: z.string().min(5, "title must be at least 5 characters long").optional(),
        description: z.string().min(10, "description must be at least 10 characters long").optional(),
        category: z.string().optional(),
        postId: isValidObjectId("Invalid post ID"),
        filename: z.string().optional(),
        photoUrl: z.string().optional(),
    }),
    addComment: z.object({
        comment: z.string().min(1, "comment cannot be empty"),
        postId: isValidObjectId("Invalid post ID"),
    }),
    updateComment: z.object({
        comment: z.string().min(1, "comment cannot be empty"),
        postId: isValidObjectId("Invalid post ID"),
        commentId: isValidObjectId("Invalid comment ID"),
    }),
    deleteComment: z.object({
        postId: isValidObjectId("Invalid post ID"),
        commentId: isValidObjectId("Invalid comment ID"),
    }),
    validatedPostId: z.object({
        postId: isValidObjectId("Invalid post ID"),
    }),
    validatedCommentId: z.object({
        postId: isValidObjectId("Invalid post ID"),
        commentId: isValidObjectId("Invalid comment ID"),
    }),

        
}