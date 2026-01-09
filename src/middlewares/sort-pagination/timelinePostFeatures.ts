import { NextFunction } from "express";
import {
  TPaginationRequest,
  TPaginationResponse,
  AuthenticatedRequestBody,
} from "../../interfaces/CustomTypes";
import { Model, Types } from "mongoose";
import User from "../../models/user-model";
import { UnAuthorized } from "../error/app-error";
import { IPost } from "../../interfaces/Post";

export const timelinePostPaginationMiddleware = (model: Model<any>) => {
  return async (
    req: AuthenticatedRequestBody<IPost> & TPaginationRequest,
    res: TPaginationResponse,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?._id?.toString();

      if (!userId) {
        throw new UnAuthorized("User not authenticated");
      }

      // Get user's friends and following
      const user = await User.findById(userId)
        .populate("following friends")
        .exec();

      if (!user) {
        throw new UnAuthorized("User not found");
      }

      const friendsIds = user.friends.map(
        (friend: any) => friend._id
      ) as unknown as Types.ObjectId[];
      const followingIds = user.following.map(
        (follow: any) => follow._id
      ) as unknown as Types.ObjectId[];

      const userIds = [userId, ...friendsIds, ...followingIds].filter(
        (id): id is Types.ObjectId => !!id
      );

      // Pagination
      const page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 10;

      if (limit > 100) {
        limit = 100;
      }

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const results: any = {
        currentPage: { page, limit },
        totalDocs: 0,
      };

      const totalCount = await model
        .countDocuments({ author: { $in: userIds } })
        .exec();
      results.totalDocs = totalCount;

      if (endIndex < totalCount) {
        results.next = {
          page: page + 1,
          limit,
        };
      }

      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit,
        };
      }

      results.totalPages = Math.ceil(totalCount / limit);
      results.lastPage = Math.ceil(totalCount / limit);

      // Build query for timeline posts
      let query = model.find({ author: { $in: userIds } });

      // Sorting
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }

      // Fields Limiting
      if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
      } else {
        query = query.select("-_v");
      }

      // Final query with pagination
      query = query.limit(limit).skip(startIndex);

      results.results = await query
        .populate("author", "firstName  lastName  profileUrl bio")
        .populate("likes.user", "firstName  lastName  profileUrl bio")
        .populate("disLikes.user", "firstName  lastName  profileUrl bio")
        .populate("comments", "comment user createdAt")
        .populate("views.user", "firstName  lastName  profileUrl bio")
        .populate("shares.user", "firstName  lastName  profileUrl bio")
        .exec();

      // Add paginated Results to the response
      res.paginatedResults = results;
      next();
    } catch (error: any) {
      next(error);
    }
  };
};
