import { Request } from "express";
import { IUser } from "./User";

export interface AuthenticatedRequestBody<T> extends Request {
    body: T;
    user?: IUser;
    file?: Express.Multer.File | undefined;
}