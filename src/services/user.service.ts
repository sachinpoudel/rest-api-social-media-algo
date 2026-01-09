import {
  IUser,
  GetUsersOutput,
  GetUserInput,
  GetUserOutput,
  FollowUserInput,
  FollowUserOutput,
  UnFollowUserInput,
  UnFollowUserOutput,
  AddFriendInput,
  AddFriendOutput,
  UnFriendInput,
  UnFriendOutput,
  BlockUserInput,
  BlockUserOutput,
  UnblockUserInput,
  UnblockUserOutput,
} from "../interfaces/User";
import User from "../models/user-model";
import { ForbiddenError, NotFound } from "../middlewares/error/app-error";

export const getUsersService = async (): Promise<GetUsersOutput> => {
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

  return {
    users: users.map((user) => user.toObject()),
    count: users.length,
  };
};

export const getUserService = async (
  input: GetUserInput
): Promise<GetUserOutput> => {
  const { userId } = input;

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

  return {
    user: user.toObject(),
  };
};

export const followUserService = async (
  input: FollowUserInput
): Promise<FollowUserOutput> => {
  const { currentUserId, targetUserId } = input;

  if (currentUserId.equals(targetUserId)) {
    throw new ForbiddenError("You cannot follow yourself"); //response status code indicates that the server understood the request but refused to process i
  }
  const toBeFollowedUser = await User.findById(targetUserId).populate(
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
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId).populate("following");

  const isAlreadyFollowed = toBeFollowedUser.followers.some((user: any) => {
    if (user._id.toString() === currentUser?._id.toString()) {
      return true;
    }
    return false;
  });

  if (isAlreadyFollowed) {
    throw new ForbiddenError(
      `You are already following ${toBeFollowedUser.firstName} ${toBeFollowedUser.lastName}`
    );
  }
  await toBeFollowedUser.updateOne({
    $push: {
      followers: currentUser?._id,
    },
    new: true,
  });
  await currentUser?.updateOne({
    $push: {
      following: targetUserId,
    },
  });

  const updatedUser = await User.findById(currentUserId)
    .select(
      "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
    )
    .populate("followers", "firstName lastName profileUrl bio")
    .populate("following", "firstName lastName profileUrl bio");

  if (!updatedUser) {
    throw new NotFound("User not found after follow operation");
  }

  return {
    user: updatedUser.toObject(),
    followedUser: {
      firstName: toBeFollowedUser.firstName,
      lastName: toBeFollowedUser.lastName,
    },
  };
};

export const unFollowUserService = async (
  input: UnFollowUserInput
): Promise<UnFollowUserOutput> => {
  const { currentUserId, targetUserId } = input;

  if (currentUserId.toString() === targetUserId) {
    throw new ForbiddenError("You cannot unfollow yourself");
  }
  const toBeFollowedUser = await User.findById(targetUserId);

  if (!toBeFollowedUser) {
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId).populate("following");

  if (!currentUser) {
    throw new NotFound("Current user not found");
  }

  const isAlreadyFollowed = toBeFollowedUser.followers.some((user: any) => {
    if (user._id.toString() === currentUser?._id.toString()) {
      return true;
    }
    return false;
  });

  if (isAlreadyFollowed) {
    await toBeFollowedUser.updateOne({
      $pull: { followers: currentUser?._id },
      new: true,
    });

    await currentUser.updateOne({
      $pull: { following: targetUserId },
    });

    const updatedUser = await User.findById(currentUserId)
      .select(
        "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
      )
      .populate("followers", "firstName lastName profileUrl bio")
      .populate("following", "firstName lastName profileUrl bio");

    if (!updatedUser) {
      throw new NotFound("User not found after unfollow operation");
    }

    return {
      user: updatedUser.toObject(),
      unfollowedUser: {
        firstName: toBeFollowedUser.firstName,
        lastName: toBeFollowedUser.lastName,
      },
    };
  }

  throw new ForbiddenError(
    `You are not following ${toBeFollowedUser.firstName} ${toBeFollowedUser.lastName}`
  );
};
export const addFriendService = async (
  input: AddFriendInput
): Promise<AddFriendOutput> => {
  // extract the user id whom to be added as friend from req.params
  // check if the user is trying to add himself as friend
  // find the user to be added as friend from the database
  // find the current user from the database
  // check if they are already friends
  // if not already friends, add each other as friends
  // return the updated current user data

  const { currentUserId, targetUserId } = input;

  if (currentUserId.equals(targetUserId)) {
    throw new ForbiddenError("You cannot add yourself as a friend");
  }
  const user = await User.findById(targetUserId).populate(
    "friends firstName lastName profileUrl bio"
  );

  if (!user) {
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId).populate(
    "friends firstName lastName profileUrl bio"
  );

  if (!currentUser) {
    throw new NotFound("Current user not found");
  }
  const isAlreadyFriend = user.friends.some((friend: any) => {
    if (currentUserId.toString() === friend._id.toString()) {
      return true;
    }
    return false;
  });
  if (isAlreadyFriend) {
    throw new ForbiddenError(
      `You are already friends with ${user.firstName} ${user.lastName}`
    );
  }

  await currentUser.updateOne({
    $push: { friends: targetUserId },
    new: true,
  });

  await user.updateOne({
    $push: { friends: currentUserId },
    new: true,
  });

  const updatedUser = await User.findById(currentUserId)
    .select(
      "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
    )
    .populate("friends", "firstName lastName profileUrl bio");

  if (!updatedUser) {
    throw new NotFound("User not found after adding friend operation");
  }

  return {
    user: updatedUser.toObject(),
    addedFriend: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
};
export const unFriendService = async (
  input: UnFriendInput
): Promise<UnFriendOutput> => {
  // find the  user whom to be unfriended from req.params
  // check if the user is trying to unfriend himself
  // find the user to be unfriended from the database
  // find the current user from the database
  // check if they are friends
  // if they are friends, remove each other from friends list
  // return the updated current user data

  const { currentUserId, targetUserId } = input;

  if (currentUserId.equals(targetUserId)) {
    throw new ForbiddenError("You cannot unfriend yourself");
  }
  const user = await User.findById(targetUserId).populate(
    "friends firstName lastName profileUrl bio"
  );

  if (!user) {
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId).populate(
    "friends firstName lastName profileUrl bio"
  );

  if (!currentUser) {
    throw new NotFound("Current user not found");
  }
  const isAlreadyFriend = user.friends.some((friend: any) => {
    if (currentUserId.toString() === friend._id.toString()) {
      return true;
    }
    return false;
  });

  if (!isAlreadyFriend) {
    throw new ForbiddenError(
      `You are not friends with ${user.firstName} ${user.lastName}`
    );
  }
  await currentUser.updateOne({
    $pull: { friends: targetUserId },
    new: true,
  });
  await user.updateOne({
    $pull: { friends: currentUserId },
    new: true,
  });

  const updatedUser = await User.findById(currentUserId)
    .select(
      "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
    )
    .populate("friends", "firstName lastName profileUrl bio");

  if (!updatedUser) {
    throw new NotFound("User not found after unfriend operation");
  }

  return {
    user: updatedUser.toObject(),
    unfriendedUser: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
};
// ...existing code...

export const blockUserService = async (
  input: BlockUserInput
): Promise<BlockUserOutput> => {
  const { currentUserId, targetUserId } = input;

  if (currentUserId.equals(targetUserId)) {
    throw new ForbiddenError("You cannot block yourself");
  }

  const userToBlock = await User.findById(targetUserId);

  if (!userToBlock) {
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new NotFound("Current user not found");
  }

  const isAlreadyBlocked = currentUser.blocked.some(
    (blockedId: any) => blockedId.toString() === targetUserId
  );

  if (isAlreadyBlocked) {
    throw new ForbiddenError(
      `You have already blocked ${userToBlock.firstName} ${userToBlock.lastName}`
    );
  }

  // Block the user and remove from followers/following/friends
  await currentUser.updateOne({
    $push: { blocked: targetUserId },
    $pull: {
      followers: targetUserId,
      following: targetUserId,
      friends: targetUserId,
    },
  });

  // Also remove current user from the blocked user's lists
  await userToBlock.updateOne({
    $pull: {
      followers: currentUserId,
      following: currentUserId,
      friends: currentUserId,
    },
  });

  const updatedUser = await User.findById(currentUserId)
    .select("-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified")
    .populate("blocked", "firstName lastName profileUrl bio");

  if (!updatedUser) {
    throw new NotFound("User not found after block operation");
  }

  return {
    user: updatedUser.toObject(),
    blockedUser: {
      firstName: userToBlock.firstName,
      lastName: userToBlock.lastName,
    },
  };
};

export const unblockUserService = async (
  input: UnblockUserInput
): Promise<UnblockUserOutput> => {
  const { currentUserId, targetUserId } = input;

  const userToUnblock = await User.findById(targetUserId);

  if (!userToUnblock) {
    throw new NotFound(`User with id ${targetUserId} not found`);
  }

  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new NotFound("Current user not found");
  }

  const isBlocked = currentUser.blocked.some(
    (blockedId: any) => blockedId.toString() === targetUserId
  );

  if (!isBlocked) {
    throw new ForbiddenError(
      `${userToUnblock.firstName} ${userToUnblock.lastName} is not in your blocked list`
    );
  }

  await currentUser.updateOne({
    $pull: { blocked: targetUserId },
  });

  const updatedUser = await User.findById(currentUserId)
    .select("-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified")
    .populate("blocked", "firstName lastName profileUrl bio");

  if (!updatedUser) {
    throw new NotFound("User not found after unblock operation");
  }

  return {
    user: updatedUser.toObject(),
    unblockedUser: {
      firstName: userToUnblock.firstName,
      lastName: userToUnblock.lastName,
    },
  };
};