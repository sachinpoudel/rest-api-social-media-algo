import { ArcjetNodeRequest, validateEmail } from "@arcjet/node";
import { NextFunction, Request, Response } from "express";
import { aj } from "../../configs/arcjet-config";
import { Env } from "../../configs/env-config";
import { HTTPSTATUS } from "../../configs/http-config";

export const emailValidator = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const emailAj = aj.withRule(
      validateEmail({
        mode: Env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
        deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
      })
    );
    try {
      const decision = await emailAj.protect(req as ArcjetNodeRequest, {
        email: req.body.email,
      });

      if (decision.isDenied()) {
        res.status(HTTPSTATUS.FORBIDDEN).json({
          error: "disposable email not allowed",
          details: decision.results.map((res) => res.reason),
        });
        return;
      }
      next();
    } catch (error: any) {
        next(error);
    }
  };
};
