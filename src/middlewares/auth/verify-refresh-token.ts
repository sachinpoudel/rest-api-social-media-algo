import { Env } from "../../configs/env-config";
import jwt from "jsonwebtoken";
import { UnAuthorized } from "../error/app-error";

export const verifyRefreshToken = async function (refreshToken: string) {
  try {
    const decoded = jwt.verify( // jwt verify returns string always if payload is string  and returns jwtpayload that is an object if payload is object
      refreshToken,

      Env.REFRESH_TOKEN_KEY as string
    ) as jwt.JwtPayload & { userId: string }; // here jwtpayload mean an object that has claims

    if (!decoded) {
      throw new UnAuthorized("Invalid refresh token");
    }
    if (Env.NODE_ENV === "development") {
      console.log("Decoded Refresh Token:", decoded);
    }

    return decoded.userId // it returns userId directly as string 
  } catch (error: any) {
    throw new UnAuthorized(error.message || "Invalid refresh token");
  }
};

