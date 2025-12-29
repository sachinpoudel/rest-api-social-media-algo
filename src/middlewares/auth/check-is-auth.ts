import { NextFunction, Response } from "express";
import { IAuthRequest } from "../../interfaces/User";
import { UnAuthorized } from "../error/app-error";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { Env } from "../../configs/env-config";
import User from "../../models/user-model";

export const isLogin = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  const token =
    (typeof authHeader === "string" && authHeader.split(" ")[1]) ||
    req.cookies?.authToken ||
    req.cookies?.accessToken ||
    req.cookies?.refreshToken;

  if (!token) {
    throw new UnAuthorized("Auth failed ! No token provided");
  }

  const jwtSecret = Env.ACCESS_TOKEN_KEY as string;

  jwt.verify(
    token,
    jwtSecret,
    async (error: VerifyErrors | null, decodedUser: any) => {
      if (error) {
        throw new UnAuthorized("Auth failed ! Invalid token");
      }
      const decodedUserInfo = await User.findById(decodedUser._id).select(
        "-password -confirmPassword"
      );

      if (!decodedUserInfo) {
        throw new UnAuthorized("Auth failed ! User not found");
      }
      req.user = decodedUserInfo;
      next();
    }
  );
};
