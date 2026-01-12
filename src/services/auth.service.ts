import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../middlewares/auth/async-handler";
import {
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
  GetProfileInput,
  GetProfileResult,
  IUser,
  LoginInput,
  LoginResult,
  ResetPasswordInput,
  SignUpInput,
  SignUpResult,
  UpdateAccountInput,
  VerifyEmailInput,
  VerifyEmailResult,
} from "../interfaces/User";
import { AuthenticatedRequestBody } from "../interfaces/CustomTypes";
import User, { IUserDocument } from "../models/user-model";
import {
  BadRequest,
  ConflictError,
  NotFound,
  UnAuthorized,
} from "../middlewares/error/app-error";
import { getProfilePicUrl } from "../utils/get-prof-picurl";
import { getRoleFromEmail } from "../utils/get-role-from-email";
import { Env } from "../configs/env-config";
import Token from "../models/Token-model";
import { SignOptions } from "jsonwebtoken";
import { sendMail } from "../utils/sendMail";
import {
  sendEmailVerificationTemplate,
  sendResetPasswordEmailTemplate,
} from "../utils/email-template";
import { HTTPSTATUS } from "../configs/http-config";
import {
  IToken,
  RefreshTokenInput,
  RefreshTokenResult,
} from "../interfaces/Token";
import { verifyRefreshToken } from "../middlewares/auth/verify-refresh-token";
import { deleteFile } from "../utils/file";
import cloudinary from "../middlewares/uploads/cloudinary";
import { AUTHORIZATION_ROLES } from "../constants/auth";

export const signUpService = async (
  input: SignUpInput
): Promise<SignUpResult> => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    bio,
    skills,
    gender,
    acceptTerms,
  } = input;

  const existingUser = await User.findOne({
    email: new RegExp(`^${email}$`, "i"),
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  const profileUrl = getProfilePicUrl(firstName, lastName, gender);

  const role = getRoleFromEmail(email);


console.log("Assigned role during signup:", role);
  
  const finalAcceptTerms =
    acceptTerms ||
    !!(
      Env.ADMIN_EMAILS &&
      (JSON.parse(Env.ADMIN_EMAILS) as string[])?.includes(email)
    );

  const newUser = new User({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    bio,
    skills: skills || [],
    role: role,
    profileUrl,
    acceptTerms: finalAcceptTerms,
  });


if(role === AUTHORIZATION_ROLES.ADMIN){
    newUser.isVerified = true;
    newUser.status = "active";
   newUser.isAdmin = true;
  }

  const user = await newUser.save();

  let token = new Token({ userId: user._id });
  const payload = { userId: user._id.toString() };

  const accessTokenOptions: SignOptions = {
    expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
    issuer: Env.JWT_ISSUER,
    audience: user._id.toString(),
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
    issuer: Env.JWT_ISSUER,
    audience: user._id.toString(),
  };

  // Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    token.generateToken(
      payload,
      Env.ACCESS_TOKEN_KEY as string,
      accessTokenOptions
    ),
    token.generateToken(
      payload,
      Env.REFRESH_TOKEN_KEY as string,
      refreshTokenOptions
    ),
  ]);

  token.accessToken = accessToken;
  token.refreshToken = refreshToken;
  await token.save();

  const userId = user._id.toString();
  // Send verification email (fire and forget, don't block response)
  const verifyEmailLink = `${Env.WEBSITE_URL}/verify-email?id=${userId}&token=${refreshToken}`;

  sendMail({
    to: user.email,
    ...sendEmailVerificationTemplate(verifyEmailLink, user.firstName),
  }).then(({ data, error }) => {
    if (Env.NODE_ENV === "development") {
      if (error && !data) {
        console.log("Error sending email verification:", error);
      } else {
        console.log("Email verification sent to", user.email);
      }
    }
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUserService = async (
  input: LoginInput
): Promise<LoginResult> => {
  const { email, password } = input;

  const user = await User.findOne({ email }).select("+password");

  if (Env.NODE_ENV === "development") {
    console.log("User found during login:", user);
  }

  if (!user) {
    throw new UnAuthorized(
      "Invalid credentials.User not found or registered"
    );
  }

  const isPassValid = await user.comparepassword(password);

  if (!isPassValid) {
    throw new UnAuthorized("Invalid credentials. Try again");
  }

  let token = await Token.findOne({ userId: user._id });
  if (!token) {
    token = await new Token({ userId: user._id }).save();
  }

  const payload = { userId: user._id.toString() };

  // Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    token.generateToken(payload, Env.ACCESS_TOKEN_KEY as string, {
      expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
      issuer: Env.JWT_ISSUER,
      audience: user._id.toString(),
    }),
    token.generateToken(payload, Env.REFRESH_TOKEN_KEY as string, {
      expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
      issuer: Env.JWT_ISSUER,
      audience: user._id.toString(),
    }),
  ]);

  token.accessToken = accessToken;
  token.refreshToken = refreshToken;
  await token.save();

  const userId = user._id.toString();

  // Check if user needs email verification
  if (!user.isVerified || user.status !== "active") {
    const verifyEmailLink = `${Env.WEBSITE_URL}/verify-email?id=${userId}&token=${refreshToken}`;
    // Send verification email (fire and forget)
    sendMail({
      to: user.email,
      ...sendEmailVerificationTemplate(verifyEmailLink, user.firstName),
    }).then(({ data, error }) => {
      if (Env.NODE_ENV === "development") {
        if (error && !data) {
          console.log("Error sending email verification:", error);
        } else {
          console.log("Email verification sent to", user.email);
        }
      }
    });

    return {
      user,
      accessToken,
      refreshToken,
      needsVerification: true,
      verifyEmailLink,
    };
  }

  return {
    user,
    accessToken,
    refreshToken,
    needsVerification: false,
  };
};

export const logoutService = async (input: RefreshTokenInput) => {
  const { refreshToken } = input;

  if (!refreshToken) {
    throw new BadRequest("Refresh token is required");
  }

  const token = await Token.findOne({ refreshToken });

  if (!token) {
    throw new BadRequest("Invalid token or expired");
  }
  const verifyToken = await verifyRefreshToken(refreshToken);

  // if(!verifyToken){
  //   throw new UnAuthorized("Invalid refresh token");
  // }

  await Token.deleteOne({
    refreshToken,
  });
};

export const refreshTokenService =
  ///refresh-token keeps users logged in by issuing new access tokens using a valid refresh token.
  // get the token
  // verify
  //generate both
  // save token in db
  //set cookie
  // return data
  async (input: RefreshTokenInput): Promise<RefreshTokenResult> => {
    const { refreshToken } = input;

    if (!refreshToken) {
      throw new BadRequest("Refresh token is required");
    }

    const token = await Token.findOne({ refreshToken });

    if (!token) {
      throw new BadRequest("Invalid token or expired");
    }
    const verifyToken = await verifyRefreshToken(refreshToken); // yesma chai jun jwt secret refresh token ko ho tyo halnu parcha ra verify hunx just like we do jwt verify
    // we cant pass entire token document to verify function, we have to pass only the refresh token string stored in the documentz as a payload or value to be verified

    if (Env.NODE_ENV === "development") {
      console.log("Verified token payload:", verifyToken);
    }

    if (!verifyToken) {
      throw new UnAuthorized("Invalid refresh token");
    }

    const userId = verifyToken;
    const payload = { userId: userId };
    const audience = userId;

    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
    const refreshTokenSecretKey = Env.REFRESH_TOKEN_KEY as string;

    if (Env.NODE_ENV === "development") {
      console.log("Payload for refresh token:", payload);
      console.log("Access Token Secret Key:", accessTokenSecretKey);
      console.log("Refresh Token Secret key:", refreshTokenSecretKey);
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, {
        expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience,
      }),
      token.generateToken(payload, refreshTokenSecretKey, {
        expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience,
      }),
    ]);

    token.accessToken = newAccessToken;
    token.refreshToken = newRefreshToken;

    await token.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  };

export const updateAccountService = async (
  input: UpdateAccountInput
): Promise<{ user: Partial<IUser> }> => {
  const {
    userId,
    firstName,
    lastName,
    dateOfBirth,
    email,
    profileUrl,
    acceptTerms,
    phoneNumber,
    bio,
    skills,
    file,
  } = input;

  // Find the user to update
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFound("User not found");
  }

  // Check if email is already in use by another account
  if (email) {
    const existingUser = await User.findOne({
      email: new RegExp(`^${email}$`, "i"),
    });

    if (existingUser && !existingUser._id.equals(user._id)) {
      // Clean up uploaded file if email conflict
      if (file?.filename) {
        const localFilePath = `${Env.PWD}/public/uploads/${file.filename}`;
        deleteFile(localFilePath);
      }
      throw new ConflictError("Email is already in use by another account");
    }
  }

  // Handle profile image upload
  if (file?.filename) {
    const localFilePath = `${Env.PWD}/public/uploads/${file.filename}`;
    const cloudinaryResp = await cloudinary.uploader.upload(localFilePath, {
      folder: "users",
      overwrite: true,
      resource_type: "image",
    });
    deleteFile(localFilePath);
    user.profileUrl = cloudinaryResp.secure_url;
  } else if (profileUrl) {
    user.profileUrl = profileUrl;
  }

  // Update user fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (bio) user.bio = bio;
  if (skills) user.skills = skills;
  if (acceptTerms !== undefined) user.acceptTerms = acceptTerms;

  const updatedUser = await user.save();

  if (!updatedUser) {
    throw new BadRequest("Failed to update user account");
  }

  // Remove sensitive fields from response
  const {
    password: pass,
    confirmPassword,
    isVerified,
    isDeleted,
    status,
    acceptTerms: accTerms,
    ...userData
  } = updatedUser._doc;

  return { user: userData };
};

export const deleteAccountService = async (input: DeleteAccountInput) => {
  // identify user
  // check role
  // delete user using id from db
  // send response

  const { userId, requestingUserId, requestingUserRole } = input;

  const user = await User.findById(userId);

  if (!user) {
    throw new BadRequest("User not found");
  }
  const isSameUser = user._id.equals(requestingUserId);
  const isAdmin = requestingUserRole === AUTHORIZATION_ROLES.ADMIN;

  if (isSameUser && isAdmin) {
    throw new BadRequest("Admin users cannot delete their own accounts");
  }

  if (!isSameUser && !isAdmin) {
    throw new UnAuthorized("You are not authorized to delete this account");
  }

  const deletedUser = await User.findByIdAndDelete({ _id: userId });

  if (!deletedUser) {
    throw new BadRequest("Failed to delete user account");
  }
  await Token.findOneAndDelete({
    userId: deletedUser._id,
  });

  return {
    deletedUserName: `${deletedUser.firstName} ${deletedUser.lastName}`,
  };
};

export const getProfileService = async (
  input: GetProfileInput
): Promise<GetProfileResult> => {
  // get user details using id
  // poupulate
  // send response

  const { userId } = input;

  const user = await User.findById(userId)
    .select(
      "-password -confirmPassword -status -isDeleted -acceptedTerms -isVerified"
    )
    .populate("following", "firstName lastName profileUrl bio") // populate here does not mean filling form data, it means fetching related data from other collections based on references
    .populate("followers", "firstName lastName profileUrl bio") // it fetches who users follows therir firtname lastname profileurl and bio from user collection
    .populate("blocked", "firstName lastName profileUrl bio");

  if (!user) {
    throw new NotFound("User not found");
  }

  const {
    password: pass,
    confirmPassword,
    isVerified,
    isDeleted,
    status,
    acceptTerms,
    // role,
    ...otherUserInfo
  } = user._doc;

  return { user: otherUserInfo };
};

export const verifyEmailService = async (input: VerifyEmailInput): Promise<VerifyEmailResult> => { // this promisemean it will return type of VerifyEmailResult after some time not immediately thatswhy we used promsie
  const { userId, token } = input;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFound("user not found");
  }

  // check if user is verified bcz we have already check in login route

  if (user.isVerified && user.status === "active") {
    return {
      userName : `${user.firstName} ${user.lastName}`,
      alreadyVerified: true, // if it is verifed return early and go to controller flow will stop here nice logic 
    }
  }
  const emailVerificationToken = await Token.findOne({
    userId: user._id,
    refreshToken: token,
  });

  if (!emailVerificationToken) {
    throw new BadRequest("Invalid or expired email verification token");
  }

  const isVerifiedUserId = await verifyRefreshToken(token);
  
  if (!isVerifiedUserId || isVerifiedUserId !== user._id.toString()) {
    throw new UnAuthorized("Invalid email verification token");
  }


  user.isVerified = true;
  user.status = "active";

  await user.save();

  await Token.deleteOne({ _id: emailVerificationToken._id });

 const userName = `${user.firstName} ${user.lastName}`;
  return { userName , alreadyVerified: false};

};

 export const forgotPasswordService =  async (input: ForgotPasswordInput) => {
    const { email } = input;
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFound(' Email  not found in our records'  );
    }
    var token = await Token.findOne({ userId: user._id });

    if (!token) {
      token = new Token({ userId: user._id });
      token = await token.save();
    }

    const accessTokenSecretKey = Env.ACCESS_TOKEN_KEY as string;
    const refreshTokenSecretKey = Env.REFRESH_TOKEN_KEY as string;

    const payload = { userId: user._id.toString() };

    const [accessToken, refreshToken] = await Promise.all([
      token.generateToken(payload, accessTokenSecretKey, {
        expiresIn: Env.ACCESS_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
      token.generateToken(payload, refreshTokenSecretKey, {
        expiresIn: Env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: Env.JWT_ISSUER,
        audience: user._id.toString(),
      }),
    ]);
    token.accessToken = accessToken;
    token.refreshToken = refreshToken;

    await token.save();

    const userId = user._id.toString();

    const resetPassLink = `${Env.WEBSITE_URL}/reset-password?id=${userId}&token=${token.refreshToken}`;

    const {data,error} = await sendMail({
      to: user.email,
      ...sendResetPasswordEmailTemplate(resetPassLink, user.firstName),
    });
  if(Env.NODE_ENV === "development"){
    if(error && !data){
      console.log("Error sending reset password email:", error);
    }
    throw new BadRequest("Error sending reset password email");
  }
if(Env.NODE_ENV === "development"){
    console.log("Password reset email sent to", user.email);
  }

  return {emailSent: true}
};

 
  


export const resetPasswordService = async (
  input: ResetPasswordInput
): Promise<{ success: boolean }> => {
  const { userId, token, password, confirmPassword } = input;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFound("User not found");
  }

  const tokenDoc = await Token.findOne({
    userId: user._id,
    refreshToken: token,
  });

  if (!tokenDoc) {
    throw new BadRequest("Invalid or expired password reset token");
  }


  const verifiedUserId = await verifyRefreshToken(token);

  if (!verifiedUserId || verifiedUserId !== userId) {
    throw new UnAuthorized("Invalid password reset token");
  }


  user.password = password;
  user.confirmPassword = confirmPassword;

  await user.save();

 
  await Token.deleteOne({ _id: tokenDoc._id });

  return { success: true };
};

export const changePasswordService = async(
  input: ChangePasswordInput
) => {
  const { userId, password, newPassword, confirmNewPassword } = input;

// match the old password
// update with new password
// confirm new password
// save user
const user = await User.findById(userId).select("+password");

if(!user){
  throw new NotFound("User not found");

}

const comparePassOld = await user.comparepassword(password)

if(!comparePassOld){
  throw new UnAuthorized("Old password is incorrect.. Reset it");
}
if(newPassword !== confirmNewPassword){
  throw new BadRequest("New password and confirm new password do not match");
}

const isSamePassword = await user.comparepassword(newPassword);

if(isSamePassword){
  throw new BadRequest("New password cannot be same as old password");
}


user.password = newPassword;
user.confirmPassword = confirmNewPassword;

await user.save();


await Token.deleteMany({userId: user._id})

return { passwordChanged: true};

}