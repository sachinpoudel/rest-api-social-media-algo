import { NextFunction, Request, Response } from "express";
import { aj } from "../../configs/arcjet-config";
import { Env } from "../../configs/env-config";
import { ForbiddenError } from "../error/app-error";
import { isSpoofedBot } from "@arcjet/inspect";
import { ArcjetNodeRequest } from "@arcjet/node";
import { detectBot } from "@arcjet/node";



export const botDetector = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
const botAj = aj.withRule(
      detectBot({
          mode: Env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
          allow: ["CATEGORY:SEARCH_ENGINE"],
        })
)

      const decision = await botAj.protect(req as ArcjetNodeRequest );
      if (Env.NODE_ENV === "development") {
        console.log("Arcjet Bot Detection Decision:", decision);
      }

      if (decision.isDenied()) {
        return next(
          new ForbiddenError("Access denied. Bot traffic is not allowed.")
        );
      }
      if (decision.ip.isHosting()) {
        return next(
          new ForbiddenError("Access denied. Hosting IPs are not allowed.")
        );
      }
      if (decision.results.some(isSpoofedBot)) {
        return next(
          new ForbiddenError(
            "Access denied. Spoofed bot traffic is not allowed."
          )
        );
      }
    } catch (error: any) {
      next(error);
    }
  };
};
