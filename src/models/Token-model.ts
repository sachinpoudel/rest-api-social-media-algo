import { IToken } from "../interfaces/Token";
import mongoose, { Schema, Types } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";

export interface ITokenDocument extends IToken,Document {
  generatePasswordRest(): Promise<void>;
  generateEmailVerificationToken(): Promise<void>;
  generateToken(payload: {userId: string}, secret: string, signOptions: SignOptions): Promise<string>;
}

export const TokenSchema: Schema<ITokenDocument> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    emailVerificationToken: {
      type: String,
      required: false,
    },
    resetPasswordExpiresToken: {
      type: Date,
      required: false,
    },
    emailVerificationExpiresToken: {
      type: Date,
      required: false,
    },
    accessToken: {
      type: String,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
TokenSchema.methods.generatePasswordReset = function () {
    this.emailVerificationToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
}

TokenSchema.methods.generateEmailVerificationToken = function () {
    this.emailVerificationToken = crypto.randomBytes(20).toString("hex");
    this.emailVerificationExpiresToken = Date.now() + 3600000; // 1 hour    
}

// refresh and access token


TokenSchema.methods.generateToken = function (
    payload: {userId: string},
    secret: string,
    signOptions: any,
): Promise<string> {
    return new Promise((resolve, reject) => {
 jwt.sign(payload, secret,signOptions, (err: Error | null, encoded: string | undefined) => {
    if(err || !encoded) {
        reject(new Error("Token generation failed"));
    }else {
        resolve(encoded as string);
    }
 })
})
}
TokenSchema.post('save', function () {
  if (process?.env?.NODE_ENV && process.env.NODE_ENV === 'development') {
    console.log('Token is been Save ', this);
  }
});

const Token = mongoose.model<ITokenDocument>('Token', TokenSchema);

export default Token;
