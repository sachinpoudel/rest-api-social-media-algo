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

const user = await User.findById(userId)
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

    const isAlreadyFollowed = toBeFollowedUser.followers.some((user:any) => {
      if (user._id.toString() === currentUser?._id.toString()) {
        return true;
      }
      return false;
    });

    if (isAlreadyFollowed) {
      throw new ForbiddenError(`You are already following ${toBeFollowedUser.firstName} ${toBeFollowedUser.lastName}`);
    }
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

    const isAlreadyFollowed = toBeFollowedUser.followers.some((user:any) => {
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
export const addFriendService = asyncHandler(
  async(req:AuthenticatedRequestBody<IUser>, res:Response, next:NextFunction) =>{
    // extract the user id whom to be added as friend from req.params
    // check if the user is trying to add himself as friend
    // find the user to be added as friend from the database
    // find the current user from the database
    // check if they are already friends
    // if not already friends, add each other as friends
    // return the updated current user data


const {userId} = req.params;

if(req.user?._id.equals(userId)){
  throw new ForbiddenError("You cannot add yourself as a friend");
}
const user = await User.findById(userId).populate('friends firstName lastName profileUrl bio');

if(!user){
  throw new NotFound(`User with id ${userId} not found`);
}

const currentUser = await User.findById(req.user?._id).populate('friends firstName lastName profileUrl bio');

if(!currentUser){
  throw new NotFound("Current user not found");

}
const isAlreadyFriend = user.friends.some((friend:any) => {
  if(req.user?._id.toString() === friend._id.toString()){
    return true;
  }
  return false;
})
if(isAlreadyFriend){
  throw new ForbiddenError(`You are already friends with ${user.firstName} ${user.lastName}`);
}

await currentUser.updateOne({
  $push: {friends: userId}, new:true
})

await user.updateOne({
  $push: {friends: req.user?._id}, new:true
})


const updatedUser = await User.findById(req.user?._id).select(
  "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
)
.populate("friends", "firstName lastName profileUrl bio");


if(!updatedUser){
  throw new NotFound("User not found after adding friend operation");
}

const data = {
  user: {...updatedUser._doc},
}
res.status(200).json({
  success: true,
  message: `You have added ${user.firstName} ${user.lastName} as a friend`,
  data: data,
})
  }
)
export const unFriendService = asyncHandler(
  async(req:AuthenticatedRequestBody<IUser>, res:Response, next:NextFunction) =>{
    // find the  user whom to be unfriended from req.params
    // check if the user is trying to unfriend himself
    // find the user to be unfriended from the database
    // find the current user from the database
    // check if they are friends
    // if they are friends, remove each other from friends list
    // return the updated current user data

const {userId} = req.params;

if(req.user?._id.equals(userId)){
  throw new ForbiddenError("You cannot unfriend yourself");
}
const user = await User.findById(userId).populate('friends firstName lastName profileUrl bio');

if(!user){
  throw new NotFound(`User with id ${userId} not found`);
}

const currentUser = await User.findById(req.user?._id).populate('friends firstName lastName profileUrl bio');

if(!currentUser){
  throw new NotFound("Current user not found");
}
const isAlreadyFriend = user.friends.some((friend:any) => {
  if(req.user?._id.toString() === friend._id.toString()){
    return true;
  }
  return false;
})

if(!isAlreadyFriend){
  throw new ForbiddenError(`You are not friends with ${user.firstName} ${user.lastName}`);
}
await currentUser.updateOne({
  $pull: {friends: userId}, new:true
})
await user.updateOne({
  $pull: {friends: req.user?._id}, new:true
})

const updatedUser = await User.findById(req.user?._id).select(
  "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
)
.populate("friends", "firstName lastName profileUrl bio");

const data = {
  user: {...updatedUser!._doc},
}
res.status(200).json({
  success: true,
  message: `You have unfriended ${user.firstName} ${user.lastName}`,
  data: data,
})
  }
)
// ...existing code...

export const blockUserService = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (req.user?._id.equals(userId)) {
      throw new ForbiddenError("You cannot block yourself");
    }

    const userToBlock = await User.findById(userId);

    if (!userToBlock) {
      throw new NotFound(`User with id ${userId} not found`);
    }

    const currentUser = await User.findById(req.user?._id);

    if (!currentUser) {
      throw new NotFound("Current user not found");
    }

    const isAlreadyBlocked = currentUser.blocked.some(
      (blockedId: any) => blockedId.toString() === userId
    );

    if (isAlreadyBlocked) {
      throw new ForbiddenError(`You have already blocked ${userToBlock.firstName} ${userToBlock.lastName}`);
    }

    // Block the user and remove from followers/following/friends
    await currentUser.updateOne({
      $push: { blocked: userId },
      $pull: { 
        followers: userId, 
        following: userId, 
        friends: userId 
      }
    });

    // Also remove current user from the blocked user's lists
    await userToBlock.updateOne({
      $pull: { 
        followers: req.user?._id, 
        following: req.user?._id, 
        friends: req.user?._id 
      }
    });

    const updatedUser = await User.findById(req.user?._id)
      .select("-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified")
      .populate("blocked", "firstName lastName profileUrl bio");

    res.status(200).json({
      success: true,
      message: `You have blocked ${userToBlock.firstName} ${userToBlock.lastName}`,
      data: updatedUser,
    });
  }
);

export const unblockUserService = asyncHandler(
  async (req: AuthenticatedRequestBody<IUser>, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const userToUnblock = await User.findById(userId);

    if (!userToUnblock) {
      throw new NotFound(`User with id ${userId} not found`);
    }

    const currentUser = await User.findById(req.user?._id);

    if (!currentUser) {
      throw new NotFound("Current user not found");
    }

    const isBlocked = currentUser.blocked.some(
      (blockedId: any) => blockedId.toString() === userId
    );

    if (!isBlocked) {
      throw new ForbiddenError(`${userToUnblock.firstName} ${userToUnblock.lastName} is not in your blocked list`);
    }

    await currentUser.updateOne({
      $pull: { blocked: userId }
    });

    const updatedUser = await User.findById(req.user?._id)
      .select("-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified")
      .populate("blocked", "firstName lastName profileUrl bio");

    res.status(200).json({
      success: true,
      message: `You have unblocked ${userToUnblock.firstName} ${userToUnblock.lastName}`,
      data: updatedUser,
    });
  }
);