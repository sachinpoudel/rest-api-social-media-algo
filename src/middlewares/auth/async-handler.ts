import type { Request, Response, NextFunction, RequestHandler } from "express";

type asyncHandlerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

const forwardError = (nextFn: ErrorForwarder, error: unknown) => {
  nextFn(toError(error));
};

type ErrorForwarder = (error: unknown) => void;

export const asyncHandler = (controller: asyncHandlerType): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    void controller(req, res, next).catch((error: unknown) => {
      forwardError(next as ErrorForwarder, error);
    });
  };
};
