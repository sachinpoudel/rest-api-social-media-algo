import { Types } from "mongoose";
import { IUser } from "./User";
import { IPost } from "./Post";

// ============= User Management Types =============

export interface AdminAddUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string;
  skills?: string[];
  profileUrl?: string;
  role?: string;
  gender?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  acceptTerms: boolean;
  file?: Express.Multer.File;
}

export interface AdminAddUserOutput {
  user: {
    accessToken: string;
    refreshToken: string;
    verifyEmailLink: string;
  };
}

export interface AdminUpdateUserInput {
  userId: string;
  requestingUserId: Types.ObjectId;
  requestingUserRole: string | undefined;
  firstName?: string;
  lastName?: string;
  bio?: string;
  skills?: string[];
  profileUrl?: string;
  dateOfBirth?: Date;
  acceptTerms?: boolean;
  gender?: string;
  status?: string;
  role?: string;
  phoneNumber?: string;
  email?: string;
  userAward?: string;
  file?: Express.Multer.File;
}

export interface AdminUpdateUserOutput {
  user: Partial<IUser>;
}

export interface AdminDeleteUserInput {
  userId: string;
}

export interface AdminGetUserInput {
  userId: string;
}

export interface AdminGetUserOutput {
  user: Partial<IUser>;
}

export interface AdminGetAllUsersInput {
  page?: number;
  limit?: number;
}

export interface AdminGetAllUsersOutput {
  users: Array<{
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  totalDocs: number;
  totalPages: number;
  lastPage: number;
  count: number;
  currentPage: number;
  nextPage?: { page: number; limit: number };
  prevPage?: { page: number; limit: number };
}

export interface AdminGetUsersCountOutput {
  usersCount: number;
}

// ============= Post Management Types =============

export interface AdminGetAllPostsInput {
  page?: number;
  limit?: number;
}

export interface AdminGetAllPostsOutput {
  posts: Array<{
    _id: Types.ObjectId;
    title: string;
    description: string;
    category: string;
    photoUrl: string;
    author: Types.ObjectId;
  }>;
  totalDocs: number;
  totalPages: number;
  lastPage: number;
  count: number;
  currentPage: number;
  nextPage?: { page: number; limit: number };
  prevPage?: { page: number; limit: number };
}

export interface AdminGetPostInput {
  postId: string;
}

export interface AdminGetPostOutput {
  post: Partial<IPost>;
}

export interface AdminCreatePostInput {
  title: string;
  description: string;
  category: string;
  photoUrl?: string;
  userId: Types.ObjectId;
  file?: Express.Multer.File;
}

export interface AdminCreatePostOutput {
  post: Partial<IPost>;
}

export interface AdminDeletePostInput {
  postId: string;
}

export interface AdminDeleteAllPostForGivenUserInput {
  userId: string;
}

export interface AdminUpdatePostInput {
  postId: string;
  title?: string;
  description?: string;
  category?: string;
  photoUrl?: string;
  file?: Express.Multer.File;
}

export interface AdminUpdatePostOutput {
  post: Partial<IPost>;
}

export interface AdminDeleteCommentInPostInput {
  commentId: string;
  postId: string;
}
