import type { Request, Response, NextFunction } from 'express';
import { BadRequest } from '../error/app-error';

type asyncHandlerType = (req:Request, res:Response, next:NextFunction) => Promise<void | Response>;


export const asyncHandler =
  (controller: asyncHandlerType) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(controller(req, res, next)).catch(next);


    