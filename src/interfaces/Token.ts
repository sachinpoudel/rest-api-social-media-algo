import mongoose, { Schema } from 'mongoose';
export interface IToken  {
    emailVerificationExpiresToken?: string;
    emailVerificationToken?: string;
    resetPasswordExpiresToken?: string;
    resetPasswordToken?: string;
    userId: mongoose.Types.ObjectId;
accessToken?: string;
refreshToken?: string | undefined;
_id: mongoose.Types.ObjectId;

}
export interface RefreshTokenInput {
    refreshToken: string;
}

export interface RefreshTokenResult {
    accessToken: string;
    refreshToken: string;
    
}