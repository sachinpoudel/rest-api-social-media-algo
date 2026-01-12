// src/controllers/feed.controller.ts
import { Response } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import { getPersonalizedFeedService } from "../services/feed.service";
import { UnAuthorized } from "../middlewares/error/app-error";

export const getPersonalizedFeedController = asyncHandler(
  async (req: AuthenticatedRequestBody<any>, res: Response) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new UnAuthorized("User not authenticated");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getPersonalizedFeedService({
      userId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Personalized feed fetched successfully",
      data: result,
    });
  }
);