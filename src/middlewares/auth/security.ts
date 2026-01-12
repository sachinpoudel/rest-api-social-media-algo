import type {Request, Response ,NextFunction, RequestHandler } from "express";
import xss from "xss";

export const xssSanitier = ():RequestHandler => {
  return  (req: Request, res: Response, next: NextFunction) => {
    const sanitize = (data: any): any => {
      if (typeof data === "string") return xss(data);
      if (Array.isArray(data)) return data.map(sanitize);

      if (typeof data === "object" && data !== null) {
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, sanitize(value)])
        );
      }
      return data;
    };
    next()
  };

};