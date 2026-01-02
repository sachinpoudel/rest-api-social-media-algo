import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { IPostDocument, Post } from "../models/Post-model";
import { UnprocessableEntity } from "../middlewares/error/app-error";
import { Env } from "../configs/env-config";
import cloudinary from "../middlewares/uploads/cloudinary";
import { deleteFile } from "../utils/file";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";

// Extend Express Request interface to include 'user'
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         _id?: string;
//         // add other user properties if needed
//       };
//     }
//   }
// }

export const createPostService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IPostDocument>,
    res: Response,
    next: NextFunction
  ) => {
    const { title, description, category, photoUrl } =
      req.body as IPostDocument;

    if (!req.file || !photoUrl) {
      throw new UnprocessableEntity("Post image is required");
    }

    try {
          var cloudinaryResult;
    let localPath: string | undefined;

    if (req.file?.filename) {
      localPath = `${Env.PWD}/public/uploads/${req.file?.filename}`;
    }

    if (!localPath) {
      throw new UnprocessableEntity("Local file path is missing for upload.");
    }

    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
      resource_type: "image",
    });
    deleteFile(localPath);

    const photo = cloudinaryResult.secure_url || photoUrl;

    const postData = new Post({
      title,
      description,
      category: category ? category.toLowerCase() : "",
      photoUrl: photo,
      cloudinary_id: cloudinaryResult.public_id,
      author: req.user?._id || "",
    });

    const createdPost = await Post.create(postData);

    if (!createdPost) {
      throw new UnprocessableEntity("Failed to create post");
    }

    const data = {
      post: {
        ...createdPost._doc,
        author: {
          _id: req.user?._id,
          firtName: req.user?.firstName,
          lastName: req.user?.lastName,
          email: req.user?.email,
        },
      },
    };

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data,
    });
    } catch (error) {
        if(req.file && req.file.filename){
            const localPath = `${Env.PWD}/public/uploads/${req.file.filename}`;
            deleteFile(localPath);
        }
    }
  
  }
);
