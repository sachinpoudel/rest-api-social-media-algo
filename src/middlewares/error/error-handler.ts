import { Request, Response, NextFunction } from "express";
import AppError from "./app-error";
import { HTTPSTATUS } from "../../configs/http-config";
import { z, ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    const isServerError = err.statusCode >= HTTPSTATUS.INTERNAL_SERVER_ERROR;
    if (isServerError || !err.isOperational) {
      console.error(err);
    }
    return res.status(err.statusCode).json({
      error: err.name,
      message: isServerError ? "Internal server error" : err.message,
    });
  }


  if (err instanceof ZodError) {
    return formatZodError(res, err);
  }
  console.log(err)
    return res.status(500).json({
    message: "Internal server errors",
  });
};

const formatZodError = (res: Response, err: z.ZodError) => {
  const errors = err?.issues?.map((issue: any) => ({
    field: issue.path.join(","),
    message: issue.message,
  }));

  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "validation error",
    errors: errors,
  });
};
