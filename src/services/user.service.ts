import { Response, NextFunction } from "express";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import { asyncHandler } from "../middlewares/auth/async-handler";
import { IUser } from "../interfaces/User";
import User from "../models/user-model";
import { ForbiddenError, NotFound } from "../middlewares/error/app-error";
import { updateAccountController } from "../controllers/auth.controller";

export const getUsersService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const users = await User.find({})
      .select(
        "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
      )
      .populate("followers", "firstName lastName profileUrl bio")
      .populate("following", "firstName lastName profileUrl bio")
      .populate("blocked", "firstName lastName profileUrl bio");

    if (!users) {
      throw new NotFound("No users found");
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  }
);

export const getUserService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    const { userId } = req.params;

    const user = await User.findOne({
      id: userId,
    })
      .select(
        "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
      )
      .populate("followers", "firstName lastName profileUrl bio")
      .populate("following", "firstName lastName profileUrl bio")
      .populate("blocked", "firstName lastName profileUrl bio");

    if (!user) {
      throw new NotFound(`User with id ${userId} not found`);
    }

    res.status(200).json({
      success: true,
      message: `User with id ${userId} found successfully`,
      data: user,
    });
  }
);

export const followUserService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    if (req.user?._id.equals(req.params.userId)) {
      throw new ForbiddenError("You cannot follow yourself"); //response status code indicates that the server understood the request but refused to process i
    }
    const toBeFollowedUser = await User.findById(req.params.userId).populate(
      "followers"
    ); // here populates Mongoose:

    // Takes each follower ID

    // Queries the User collection

    // Replaces IDs with actual user documents

    //followers: [
    //   { _id, username, email, ... },
    //   { _id, username, email, ... }
    // ]

    if (!toBeFollowedUser) {
      throw new NotFound(`User with id ${req.params.userId} not found`);
    }

    const currentUser = await User.findById(req.user?._id).populate(
      "following"
    );

    const isAlreadyFollowed = toBeFollowedUser.followers.some((user) => {
      if (user._id.toString() === currentUser?._id.toString()) {
        return true;
      }
      return false;
    });

    if (!isAlreadyFollowed) {
      await toBeFollowedUser.updateOne({
        $push: {
          followers: currentUser?._id,
        },
        new: true,
      });
      await currentUser?.updateOne({
        $push: {
          following: req.params.userId,
        },
      });

      const updatedUser = await User.findById(req.user?._id)
        .select(
          "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
        )
        .populate("followers", "firstName lastName profileUrl bio")
        .populate("following", "firstName lastName profileUrl bio");

      if (!updatedUser) {
        throw new NotFound("User not found after follow operation");
      }

      res.status(200).json({
        success: true,
        message: `You are now following ${toBeFollowedUser.firstName} ${toBeFollowedUser.lastName}`,
        data: updatedUser,
      });
    }
  }
);

export const unFollowUserService = asyncHandler(
  async (
    req: AuthenticatedRequestBody<IUser>,
    res: Response,
    next: NextFunction
  ) => {
    if (req.user?._id === req.params.userId) {
      throw new ForbiddenError("You cannot unfollow yourself");
    }
    const toBeFollowedUser = await User.findById(req.params.userId);

    if (!toBeFollowedUser) {
      throw new NotFound(`User with id ${req.params.userId} not found`);
    }

    const currentUser = await User.findById(req.user?._id).populate(
      "following"
    );

    if (!currentUser) {
      throw new NotFound("Current user not found");
    }

    const isAlreadyFollowed = toBeFollowedUser.followers.some((user) => {
      if (user._id.toString() === currentUser?._id.toString()) {
        return true;
      }
        return false;
    });

    if(isAlreadyFollowed){
        await toBeFollowedUser.updateOne({
            $pull: {followers: currentUser?._id}, new: true
        })

        await currentUser.updateOne({
            $pull: {following: req.params.userId}
        })

const updatedUser = await User.findById(req.user?._id).select(
    "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
  )
  .populate("followers", "firstName lastName profileUrl bio")
  .populate("following", "firstName lastName profileUrl bio");

if (!updatedUser) {
  throw new NotFound("User not found after unfollow operation");
}

res.status(200).json({
  success: true,
  message: `You have unfollowed ${toBeFollowedUser.firstName} ${toBeFollowedUser.lastName}`,
  data: updatedUser,
});


    }
  }
);
