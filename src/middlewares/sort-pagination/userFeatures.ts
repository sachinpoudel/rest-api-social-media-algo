import { NextFunction } from "express";
import {
  TPaginationRequest,
  TPaginationResponse,
} from "../../interfaces/CustomTypes";
import User from "../../models/user-model";
import { AUTHORIZATION_ROLES } from "../../constants/auth";

export const usersPaginationMiddleware = () => {
  return async (
    req: TPaginationRequest,
    res: TPaginationResponse,
    next: NextFunction
  ) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const startIndex = (page - 1) * limit; //ie for page 2 with limit 10, startIndex = 10

    const endIndex = page * limit; //ie for page 2 with limit 10, endIndex = 20

    const results: any = {
      currentPage: {
        page,
        limit,
      },
      totalDocs: 0,
    };
    const totalCount = await User.countDocuments().exec(); // this will give total number of documents in the User collection
    results.totalDocs = totalCount;

    if (endIndex < totalCount) {
      // mean there are more documents after the current page
      // if endIndex = 20 and totalCount = 45, then there are more documents after page 2 so we can have next page

      results.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      // if startIndex = 10, then we are not on the first page so we can have previous page
      // if startindex = 0, then we are on the first page so we cannot have previous page
      results.previous = {
        page: page - 1,
        limit,
      };
    }
    results.totalPages = Math.ceil(totalCount / limit);
    // ie if totalCount = 45 and limit = 10, then totalPages = 5
    results.lastPage = results.totalPages; // ie if totalPages = 5, then lastPage = 5

    // sort

    const sort: any = {};
    if (req.query.sortBy && req.query.orderBy) {
      sort[req.query.sortBy] =
        req.query.orderBy.toLowerCase() === "desc" ? -1 : 1; // ie if sortBy = 'name' and orderBy = 'desc', then sort = { name: -1 }
    } else {
      sort.createdAt = -1;
    }

    let filter: any = {};

    if (req.query.filterBy && req.query.role) {
      console.log(req.query);
      if (req.query.role.toLowerCase() === AUTHORIZATION_ROLES.ADMIN) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.ADMIN }];
      } else if (req.query.role.toLowerCase() === AUTHORIZATION_ROLES.USER) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.USER }];
      } else if (
        req.query.role.toLowerCase() === AUTHORIZATION_ROLES.SUPERVISOR
      ) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.SUPERVISOR }];
      } else if (req.query.role.toLowerCase() === AUTHORIZATION_ROLES.CLIENT) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.CLIENT }];
      } else if (req.query.role.toLowerCase() === AUTHORIZATION_ROLES.GUIDE) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.GUIDE }];
      } else if (
        req.query.role.toLowerCase() === AUTHORIZATION_ROLES.MODERATOR
      ) {
        filter.$or = [{ role: AUTHORIZATION_ROLES.MODERATOR }];
      } else if (req.query.role.toLowerCase() === "all") {
        filter = {};
      } else {
        filter = {};
      }
    }
    // search

    if (req.query.search) {
      filter = {
        $or: [
          { name: { $regex: req.query.search } },
          { email: { $regex: req.query.search } },
          { role: { $regex: req.query.search } },
          { gender: { $regex: req.query.search } },
        ],
      };
    }

    try {
      results.results = await User.find(filter)
        .select("-password -confirmPassword -status")
        .populate("following", "firstName,lastName,email")
        .populate("followers", "firstName,lastName,email")
        .sort(sort)
        .limit(limit)
        .skip(startIndex)
        .exec();
      res.paginatedResults = results;
      return next();
    } catch (error: any) {
      return next(error);
    }
  };
};
