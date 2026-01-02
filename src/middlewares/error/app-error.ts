import  { httpstatusCodeType,HTTPSTATUS } from "../../configs/http-config";

class AppError extends Error {
  public statusCode: httpstatusCodeType;
  constructor(message: string, statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR) {
    super(message );
    this.statusCode = statusCode;
  }
}


export class BadRequest extends AppError {
    constructor(message = "bad request") {
        super(message, HTTPSTATUS.BAD_REQUEST);
    }
}
export class UnAuthorized extends AppError {
    constructor(message = "unauthorized") {
        super(message, HTTPSTATUS.UNAUTHORIZED);
    }
}
export class NotFound extends AppError {
    constructor(message = "not found") {
        super(message, HTTPSTATUS.NOT_FOUND);
    }
}
export class InternalException extends AppError {
    constructor(message = "internal server error") {
        super(message, HTTPSTATUS.INTERNAL_SERVER_ERROR);
    }
}
export class ConflictError extends AppError {
    constructor(message = "conflict error") {
        super(message, HTTPSTATUS.CONFLICT);
    }
}
export class UnprocessableEntity extends AppError {
    constructor(message = "unprocessable entity") {
        super(message, HTTPSTATUS.UNPROCESSED_ENTITY);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "forbidden") {
        super(message, HTTPSTATUS.FORBIDDEN)
    }
}
export default AppError;
