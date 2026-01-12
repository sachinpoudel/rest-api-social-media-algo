import { NextFunction, Request, Response } from "express";
import {
  getUsersService,
  getUserService,
  followUserService,
  unFollowUserService,
  addFriendService,
  unFriendService,
  blockUserService,
  unblockUserService,
} from "../services/user.service";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import { IUser } from "../interfaces/User";
import { HTTPSTATUS } from "../configs/http-config";



export const getUsersController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await getUsersService();

    res.status(200).json({
      success: true,
      count: data.count,
      data: data.users,
    });
  }
);

export const getUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await getUserService({ userId });

    res.status(200).json({
      success: true,
      message: `User with id ${userId} found successfully`,
      data: data.user,
    });
  }
);


export const followUserController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await followUserService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: `You are now following ${data.followedUser.firstName} ${data.followedUser.lastName}`,
      data: data.user,
    });
  }
);

export const unFollowUserController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await unFollowUserService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: `You have unfollowed ${data.unfollowedUser.firstName} ${data.unfollowedUser.lastName}`,
      data: data.user,
    });
  }
);

export const addFriendController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await addFriendService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `You have added ${data.addedFriend.firstName} ${data.addedFriend.lastName} as a friend`,
      data: data.user,
    });
  }
);

export const unFriendController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await unFriendService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: `You have unfriended ${data.unfriendedUser.firstName} ${data.unfriendedUser.lastName}`,
      data: data.user,
    });
  }
);

export const blockUserController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await blockUserService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: `You have blocked ${data.blockedUser.firstName} ${data.blockedUser.lastName}`,
      data: data.user,
    });
  }
);

export const unblockUserController = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) throw new Error("User ID is required");

    const data = await unblockUserService({
      currentUserId: req.user!._id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: `You have unblocked ${data.unblockedUser.firstName} ${data.unblockedUser.lastName}`,
      data: data.user,
    });
  }
);
