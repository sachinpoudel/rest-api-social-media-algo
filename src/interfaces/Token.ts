import mongoose, { Schema } from 'mongoose';
export interface IToken  {
    emailVerificationExpiresToken?: string;
    emailVerificationToken?: string;
    resetPasswordExpiresToken?: string;
    resetPasswordToken?: string;
    userId: mongoose.Types.ObjectId;
accessToken?: string;
refreshToken?: string;
_id: mongoose.Types.ObjectId;

}