import { Request } from "express";
import { IUser } from "./User";
import { Response } from "express";
import mongoose from "mongoose";

export interface AuthenticatedRequestBody<T> extends Request {
    body: T;
    user?: IUser;
    file?: Express.Multer.File | undefined;
}



export interface TPaginationRequest extends Request {
    query: {
        limit: string;
        page: string;
        orderBy: string;
        sortBy: string;
        filterBy: string;
        category: string;
        search: string;
        content: string;
        role: string;
        sort    : string;
        fields: string;
    }
}

export interface TPaginationResponse extends Response {
  paginatedResults?: {
    results: any;
    next?: {
      page: number;
      limit: number;
    };
    previous?: {
      page: number;
      limit: number;
    };
    currentPage: {
      page: number;
      limit: number;
    };
    totalDocs: number;
    totalPages: number;
    lastPage: number;
  };
}

