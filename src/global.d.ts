import { IUser } from "../models/user.model"; // adjust path to your User type
import { IUserDocument } from "./models/user-model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}