import { Env } from "../../configs/env-config";
import jwt from "jsonwebtoken";
import { UnAuthorized } from "../error/app-error";

export const verifyRefreshToken = async function (refreshToken: string) {
  try {
    const decoded = jwt.verify(
      refreshToken,

      Env.REFRESH_TOKEN_KEY as string
    );

    if (!decoded) {
      throw new UnAuthorized("Invalid refresh token");
    }
    if (Env.NODE_ENV === "development") {
      console.log("Decoded Refresh Token:", decoded);
    }

    return decoded  as string 
  } catch (error: any) {
    throw new UnAuthorized(error.message || "Invalid refresh token");
  }
};
