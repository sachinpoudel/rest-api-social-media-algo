import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/User";
import {
  USER_AWARD_OPTIONS,
  USER_PLAN_OPTIONS,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/auth";
import { AUTHORIZATION_ROLES } from "../constants/auth";
import { Env } from "../configs/env-config";
import jwt from "jsonwebtoken";
import { NotFound } from "../middlewares/error/app-error";

export interface IUserDocument extends IUser {
  comparepassword(password: string): Promise<boolean>; //I will return a boolean value wrapped in a Promise
  createJwt(): Promise<void>; //I will do something (like create a JWT), but I won’t return anything
  updatedAt: Date;
  createdAt: Date;
  _doc?: any;
}

const UserSchema: mongoose.Schema<IUserDocument> =
  new mongoose.Schema<IUserDocument>(
    {
      firstName: {
        type: String,
        trim: true,
        lowercase: true,
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [50, "First name must be at most 50 characters long"],
        required: true,
      },

      lastName: {
        type: String,
        trim: true,
        lowercase: true,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [50, "Last name must be at most 50 characters long"],
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
        maxlength: [100, "Email must be at most 100 characters long"],
        match: [/\S+@\S+\.\S+/, "Email is invalid"],
      },
      password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        maxlength: [100, "Password must be at most 100 characters long"],
        select: false,
        trim: true,
      },
      confirmPassword: {
        type: String,
        required: [true, "Confirm Password is required"],
        minlength: [8, "Confirm Password must be at least 8 characters long"],
        maxlength: [
          100,
          "Confirm Password must be at most 100 characters long",
        ],
        select: false,
        trim: true,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio must be at most 500 characters long"],
        trim: true,
      },
      skills: {
        type: [String],
        default: [],
      },
      profileUrl: {
        type: String,
        trim: true,
        default:
          "https://res.cloudinary.com/dzcmadjlq/image/upload/v1690991943/default-profile_xc6v4f.png",
      },
      acceptTerms: { type: Boolean, required: true, default: false },

      confirmationCode: {
        type: String,
        required: false,
        index: true,
        trim: true,
        sparse: true,
      },
      friends: [
        {
          type: Schema.Types.ObjectId,
          ref: "User", //This ObjectId belongs to the User collection
        },
      ],
      following: [
        {
          type: Schema.Types.ObjectId,
          ref: "User", //This ObjectId belongs to the User collection
        },
      ],
      followers: [
        {
          type: Schema.Types.ObjectId,
          ref: "User", //This ObjectId belongs to the User collection
        },
      ],
      resetPasswordToken: {
        type: String,
        required: false,
        index: true,
      },
      resetPasswordExpires: {
        type: Date,
        required: false,
      },
      isBlocked: {
        type: Boolean,
        default: false,
      },
      isAdmin: {
        type: Boolean,
        default: false,
      },
      role: {
        type: String,
        trim: true,
        lowercase: true,
        enum: [
          AUTHORIZATION_ROLES.ADMIN,
          AUTHORIZATION_ROLES.USER,
          AUTHORIZATION_ROLES.MODERATOR,
          AUTHORIZATION_ROLES.CLIENT,
          AUTHORIZATION_ROLES.GUIDE,
          AUTHORIZATION_ROLES.SUPERVISOR,
        ],
        default: AUTHORIZATION_ROLES.USER,
      },
      viewers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", //This ObjectId belongs to the User collection
        },
      ],
      posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
            // ref: 'Post'
        },
      ],
      comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
            // ref: 'Comment'
        },
      ],
      blocked: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      userAward: {
        type: String,
        enum: [...USER_AWARD_OPTIONS],
        default: "bronze",
      },
      gender: {
        type: String,
        trim: true,
        lowercase: true,
        enum: {
          values: [...GENDER_OPTIONS],
          message: "Gender must be either male, female, or other",
        },
      },
      plan: {
        type: String,
        enum: [...USER_PLAN_OPTIONS],
        default: "free",
      },
      phoneNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"],
      },
      lastLogin: {
        type: Date,
        default: Date.now,
      },
      isVerified: {
        type: Boolean,
        default: true,
        required: false,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: [...STATUS_OPTIONS],
        default: "active",
        required: false,
        trim: true,
        lowercase: true,
      },
      dateOfBirth: {
        type: Date,
        default: null,
      },
    },
    { timestamps: true }
  );

UserSchema.methods.comparepassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    throw new NotFound("Password hash not found on user document");
  }
  return await bcrypt.compare(candidatePassword, this.password); // here this.password is the hashed password stored in the database it refers to the current user document's password field
};

UserSchema.pre("save", async function () { // pre bxz it runs before saving the document to the database and saves time and after that the save operation is performed
  const user = this as IUserDocument;

  if (user.isModified("password")) { // we only want to hash the password if it has been modified (or is new)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    user.confirmPassword = await bcrypt.hash(user.confirmPassword, salt);
  }
});

// ...existing code...
UserSchema.methods.createJwt = async function () {
  const payload = {
    userId: this._id,
    email: this.email,
    name: this.firstName,
    dateOfBirth: this.dateOfBirth,
    gender: this.gender,
    role: this.role,
  };
  return jwt.sign(payload, Env.JWT_TOKEN_SECRET as string, {
    expiresIn: Env.JWT_EXPIRATION_TIME,
  });
};

UserSchema.pre("findOne", async function (next) {
  this.populate({ path: "posts" });
});

// const userId = this.getQuery()._id;

const User = mongoose.model<IUserDocument>("User", UserSchema);
export default User;
// Todo: pre thing
