import { httpstatusCodeType, HTTPSTATUS } from "../../configs/http-config";

type AppErrorOptions = {
  cause?: unknown;
  isOperational?: boolean;
};

class AppError extends Error {
  public readonly statusCode: httpstatusCodeType;
  public readonly isOperational: boolean;
  public readonly cause?: unknown;
  constructor(message: string, statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? statusCode < 500;
    this.cause = options.cause;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequest extends AppError {
  constructor(message = "bad request", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.BAD_REQUEST, options);
  }
}
export class UnAuthorized extends AppError {
  constructor(message = "unauthorized", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.UNAUTHORIZED, options);
  }
}
export class NotFound extends AppError {
  constructor(message = "not found", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.NOT_FOUND, options);
  }
}
export class InternalException extends AppError {
  constructor(message = "internal server error", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.INTERNAL_SERVER_ERROR, options);
  }
}
export class ConflictError extends AppError {
  constructor(message = "conflict error", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.CONFLICT, options);
  }
}
export class UnprocessableEntity extends AppError {
  constructor(message = "unprocessable entity", options?: AppErrorOptions) {
    super(message, HTTPSTATUS.UNPROCESSED_ENTITY, options);
  }
}

export class ForbiddenError extends AppError {
    constructor(message = "forbidden") {
        super(message, HTTPSTATUS.FORBIDDEN)
    }
}
export default AppError;
