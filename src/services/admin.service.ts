import mongoose from "mongoose";
import { IUser } from "../interfaces/User";
import User from "../models/user-model";
import { Env } from "../configs/env-config";
import { deleteFile } from "../utils/file";
import {
  BadRequest,
  ForbiddenError,
  UnAuthorized,
  UnprocessableEntity,
} from "../middlewares/error/app-error";
import cloudinary from "../middlewares/uploads/cloudinary";
import { getProfilePicUrl } from "../utils/get-prof-picurl";
import { getRoleFromEmail } from "../utils/get-role-from-email";
import Token from "../models/Token-model";
import { SignOptions } from "jsonwebtoken";
import { sendMail } from "../utils/sendMail";
import { sendEmailVerificationTemplate } from "../utils/email-template";
import { AUTHORIZATION_ROLES } from "../constants/auth";
import { Post } from "../models/Post-model";
import { Comment } from "../models/Comment-model";
import {
  AdminAddUserInput,
  AdminAddUserOutput,
  AdminUpdateUserInput,
  AdminUpdateUserOutput,
  AdminDeleteUserInput,
  AdminGetUserInput,
  AdminGetUserOutput,
  AdminGetAllUsersInput,
  AdminGetAllUsersOutput,
  AdminGetUsersCountOutput,
  AdminGetAllPostsInput,
  AdminGetAllPostsOutput,
  AdminGetPostInput,
  AdminGetPostOutput,
  AdminCreatePostInput,
  AdminCreatePostOutput,
  AdminDeletePostInput,
  AdminDeleteAllPostForGivenUserInput,
  AdminUpdatePostInput,
  AdminUpdatePostOutput,
  AdminDeleteCommentInPostInput,
} from "../interfaces/Admin";

export const adminAddUserService = async (
  input: AdminAddUserInput
): Promise<AdminAddUserOutput> => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    bio,
    skills,
    profileUrl,
    role,
    gender,
    phoneNumber,
    dateOfBirth,
    acceptTerms,
    file,
  } = input;

  const EmailExists = await User.findOne({
    email: new RegExp(`^${email}$`, "i"),
  });

  if (EmailExists) {
    if (file?.filename) {
      const localPath = `${Env.PWD}/public/uploads/users/${file.filename}`;
      deleteFile(localPath);
    }
    throw new UnprocessableEntity("Email already exists");
  }
  let cloudinaryResult;

  if (file?.filename) {
    const localpath = `${Env.PWD}/public/uploads/users/${file.filename}`;
    cloudinaryResult = await cloudinary.uploader.upload(localpath, {
      folder: "users",
    });
    deleteFile(localpath);
  }
  // get profilepic url

  const profilePicUrl: string = getProfilePicUrl(
    firstName,
    lastName,
    gender,
    profileUrl
  );

  // determine the role based on email of user

  const finalRole = getRoleFromEmail(email);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    bio,
    skills,
    profileUrl: profilePicUrl,
    cloudinary_id: cloudinaryResult ? cloudinaryResult.public_id : undefined,
    role: finalRole,
    acceptTerms,
  });
  const user = await newUser.save();

  let token = new Token({ userId: user._id }); // this will create a new token document for the user it is required bcz there is no token created at the time of user registration
  const payload = { userId: user._id.toString() };

  const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
  const refreshTokenSecretKey = Env.REFRESH_TOKEN_KEY as string;

  const accessTokenSignOptions: SignOptions = {
    expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
    issuer: Env.JWT_ISSUER,
    audience: user._id.toString(),
  };

  const refreshTokenSignOptions: SignOptions = {
    expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
    issuer: Env.JWT_ISSUER,
    audience: String(user._id),
  };

  // always remember use string type everywhere for userId in payload and audience
  // always use mongoose id for db storage and string for jwt payload and audience

  const [newAccessToken, newRefreshToken] = await Promise.all([
    token.generateToken(
      payload,
      accessTokenSecretKey,
      accessTokenSignOptions
    ),
    token.generateToken(
      payload,
      refreshTokenSecretKey,
      refreshTokenSignOptions
    ),
  ]);

  token.accessToken = newAccessToken;
  token.refreshToken = newRefreshToken;

  await token.save();

  const verifyEmailLink = `${
    Env.WEBSITE_URL
  }/verify-email?id=${user._id.toString()}&token=${newRefreshToken}`;

  const { data: resendEmailData, error } = await sendMail({
    to: user.email,
    ...sendEmailVerificationTemplate(verifyEmailLink, user.firstName),
  });
  if (error) {
    if (Env.NODE_ENV === "development") {
      console.log("Email sending error: ", error);
    } else if (Env.NODE_ENV === "development") {
      console.log("Email sending Success: ", resendEmailData);
    }
  }

  return {
    user: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      verifyEmailLink,
    },
  };
};
export const adminUpdateUserService = async (
  input: AdminUpdateUserInput
): Promise<AdminUpdateUserOutput> => {
  const {
    userId,
    requestingUserId,
    requestingUserRole,
    firstName,
    lastName,
    bio,
    skills,
    profileUrl,
    dateOfBirth,
    acceptTerms,
    gender,
    status,
    role,
    phoneNumber,
    email,
    userAward,
    file,
  } = input;

  const user = await User.findById(userId);

  if (!user) {
    throw new BadRequest("User not found");
  }

  if (
    requestingUserId.equals(user._id) &&
    role &&
    requestingUserRole === AUTHORIZATION_ROLES.ADMIN
  ) {
    throw new ForbiddenError("Admin users cannot change their own role");
  }

  const EmailExits = await User.findOne({
    email: new RegExp(`^${email}$`, "i"),
  });

  if (EmailExits && !EmailExits._id.equals(user._id)) {
    // this mean the email is taken by some other user
    if (file?.filename) {
      const localPath = `${Env.PWD}/public/uploads/users/${file.filename}`;
      deleteFile(localPath);
    }
    throw new UnprocessableEntity("Email already Taken by another user");
  } else if (file?.filename && user.cloudinary_id) {
    await cloudinary.uploader.destroy(user.cloudinary_id);
  }
  // now upload new profile pic to cloudinary if there is new file

  let cloudinaryResult;

  if (file?.filename) {
    const localPath = `${Env.PWD}/public/uploads/users/${file.filename}`;
    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "users",
    });
    deleteFile(localPath);
  }

  if (bio) {
    user.bio = bio;
  }
  if (phoneNumber) {
    user.phoneNumber = phoneNumber;
  }
  if (dateOfBirth) {
    user.dateOfBirth = dateOfBirth;
  }
  if (cloudinaryResult) {
    user.cloudinary_id = cloudinaryResult.public_id;
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.skills = skills || user.skills;
  user.profileUrl = getProfilePicUrl(
    firstName || user.firstName,
    lastName || user.lastName,
    profileUrl || user.profileUrl,
    gender
  );
  user.email = email || user.email;
  user.acceptTerms = acceptTerms || user.acceptTerms;
  if (status) user.status = status as "pending" | "active";
  if (role) user.role = role;
  if (userAward) user.userAward = userAward as "bronze" | "silver" | "gold";

  const updatedUser = await user.save();

  return {
    user: updatedUser.toObject(),
  };
};

export const adminDeleteUserService = async (
  input: AdminDeleteUserInput
): Promise<void> => {
  // first get userId from req.params
  // delete user from db
  // remove profile pic from cloudinary if exists

  const { userId } = input;

  const user = await User.findById(userId);

  if (!user) {
    throw new BadRequest("User not found");
  }

  if (user.cloudinary_id) {
    await cloudinary.uploader.destroy(user.cloudinary_id);
  }

  await User.findByIdAndDelete(userId);
};

export const adminGetUserService = async (
  input: AdminGetUserInput
): Promise<AdminGetUserOutput> => {
  const { userId } = input;

  // if(!mongoose.Types.ObjectId.isValid(userId)){
  //   throw new UnprocessableEntity("Invalid userId");
  // }

  const user = await User.findById(userId)
    .select(
      "-password -confirmPassword -resetPasswordToken -resetPasswordExpires -confirmationCode"
    )
    .populate("firstName lastName email bio skills profileUrl role status ");

  if (!user) {
    throw new BadRequest("User not found");
  }

  return {
    user: user.toObject(),
  };
};

export const adminGetAllUsersService = async (
  paginatedResults: any
): Promise<AdminGetAllUsersOutput> => {
  if (!paginatedResults) {
    throw new BadRequest("Pagination results not available");
  }

  const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = paginatedResults;

  const responseObject: AdminGetAllUsersOutput = {
    totalDocs: totalDocs,
    totalPages: totalPages,
    lastPage: lastPage,
    count: results.length,
    currentPage: currentPage.page,
    users: results?.map((user: any) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    })),
  };

  if (next) {
    responseObject.nextPage = next;
  }
  if (previous) {
    responseObject.prevPage = previous;
  }

  return responseObject;
};



export const adminGetUsersCountService = async (): Promise<AdminGetUsersCountOutput> => {
  const usersCount = await User.countDocuments();

  return {
    usersCount,
  };
};

export const adminGetAllPostsService = async (
  paginatedResults: any
): Promise<AdminGetAllPostsOutput> => {
  if (!paginatedResults) {
    throw new BadRequest("Pagination results not available");
  }

  const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = paginatedResults;

  const responseObject: AdminGetAllPostsOutput = {
    totalDocs: totalDocs || 0,
    totalPages: totalPages || 0,
    lastPage: lastPage || 0,
    count: results?.length || 0,
    currentPage: currentPage?.page || 0,
    posts: results?.map((post: any) => ({
      _id: post._id,
      title: post.title,
      description: post.description,
      category: post.category,
      photoUrl: post.photoUrl,
      author: post.author,
    })),
  };

  if (next) {
    responseObject.nextPage = next;
  }
  if (previous) {
    responseObject.prevPage = previous;
  }

  return responseObject;
};

export const adminGetPostService = async (
  input: AdminGetPostInput
): Promise<AdminGetPostOutput> => {
  const { postId } = input;

  const post = await Post.findById(postId).populate(
    "title description category filename photoUrl likes comments author "
  );

  if (!post) {
    throw new BadRequest("Post not found");
  }

  return {
    post: post._doc,
  };
};
export const adminCreatePostService = async (
  input: AdminCreatePostInput
): Promise<AdminCreatePostOutput> => {
  const { title, description, category, photoUrl, userId, file } = input;

  if (!userId) {
    throw new UnAuthorized("User not authorized");
  }

  if (!file) {
    throw new BadRequest("Post image is required");
  }

  let cloudinaryResult;
  if (file?.filename) {
    const localPath = `${Env.PWD}/public/uploads/posts/${file.filename}`;
    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
    });
    deleteFile(localPath);
  }

  const photo = cloudinaryResult?.secure_url || photoUrl;

  const newPost = new Post({
    title,
    description,
    category,
    photoUrl: photo,
    author: userId || "",
    cloudinary_id: cloudinaryResult ? cloudinaryResult.public_id : undefined,
  });
  await newPost.save();

  return {
    post: newPost._doc,
  };
};

export const adminDeletePostService = async (
  input: AdminDeletePostInput
): Promise<void> => {
  // find the post by id from req.params
  // delete the post from db
  // remove the post image from cloudinary if exists
  // delte comments likes disLikes shares and views associated with the post

  const { postId } = input;

  const post = await Post.findById(postId);

  if (!post) {
    throw new BadRequest("Post not found");
  }

  if (post.cloudinary_id) {
    await cloudinary.uploader.destroy(post.cloudinary_id);
  }

  await post.deleteOne();

  // now remove comments likes disLikes shares and views associated with the post
  // assuming comments likes disLikes shares and views are subdocuments of post
  // but comments are separate model so we need to delete them from comments collection

  await Comment.deleteMany({ postId: post._id }); // this will delete all comments associated with the post
};

export const adminDeleteAllPostForGivenUserService = async (
  input: AdminDeleteAllPostForGivenUserInput
): Promise<void> => {
  // here we have to delete all post of a given user by userId from req.params

  const { userId } = input;

  if (!userId) {
    throw new BadRequest("User ID is required");
  }

  // const user = await User.findById(userId);
  const post = await Post.find({ author: userId });

  if (post.length === 0) {
    throw new BadRequest("No posts found for the given user");
  }

  const deletedPosts = await Post.deleteMany({ author: userId });

  if (!deletedPosts) {
    throw new BadRequest("No posts found for the given user");
  }

  await Comment.deleteMany({ postId: { $in: post.map((p) => p._id) } }); // delete all comments associated with the posts

  // remove imgs associated with the posts from cloudinary
  post.forEach(async (post) => {
    if (post?.cloudinary_id) {
      await cloudinary.uploader.destroy(post.cloudinary_id);
    }
  });
};
export const adminUpdatePostService = async (
  input: AdminUpdatePostInput
): Promise<AdminUpdatePostOutput> => {
  const { postId, title, description, category, photoUrl, file } = input;

  const post = await Post.findById(postId);

  if (!post) {
    throw new BadRequest("Post not found");
  }

  let cloudinaryResult;

  if (file?.filename) {
    if (post.cloudinary_id) {
      await cloudinary.uploader.destroy(post.cloudinary_id);
    }
  } else {
    const localPath = `${Env.PWD}/public/uploads/posts/${file?.filename}`;
    cloudinaryResult = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
    });
    deleteFile(localPath);
  }

  const photo = cloudinaryResult?.secure_url || photoUrl;

  if (cloudinaryResult) {
    post.cloudinary_id = cloudinaryResult.public_id;
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.category = category || post.category;
  post.photoUrl = photo || post.photoUrl;

  const updatedPost = await post.save();

  return {
    post: updatedPost._doc,
  };
};

export const adminDeleteCommentInPostService = async (
  input: AdminDeleteCommentInPostInput
): Promise<void> => {
  const { commentId, postId } = input;

  const comment = await Comment.findById(commentId).populate("postId");

  if (!comment) {
    throw new BadRequest("Comment not found");
  }

  if (comment.post._id.toString() !== postId) {
    throw new UnprocessableEntity("Comment does not belong to the specified post");
  }

  await comment.deleteOne();
};