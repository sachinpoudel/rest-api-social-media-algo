import dotenv from "dotenv-safe";
import { getEnv } from "../utils/env";
import { CLIENT_RENEG_LIMIT } from "tls";
import { jwt } from "zod";
dotenv.config({
  allowEmptyValues: true,
});

const envConfigs = () => {
  const config = {
    NODE_ENV: getEnv("NODE_ENV"),
    PORT: getEnv("PORT"),
    MONGO_URL: getEnv("MONGO_URL"),
    JWT_TOKEN_SECRET: getEnv("JWT_TOKEN_SECRET"),
    JWT_EXPIRATION_TIME: getEnv("JWT_EXPIRATION_TIME"),

    ADMIN_EMAILS: getEnv("ADMIN_EMAILS"),
    // MANAGER_EMAILS: getEnv("MANAGER_EMAILS"),
    MODERATOR_EMAILS: getEnv("MODERATOR_EMAILS"),
    SUPERVISOR_EMAILS: getEnv("SUPERVISOR_EMAILS"),
    CLIENT_EMAILS: getEnv("CLIENT_EMAILS"),

    ACCESS_TOKEN_KEY: getEnv("ACCESS_TOKEN_KEY"),
    ACCESS_TOKEN_EXPIRES_IN: getEnv("ACCESS_TOKEN_EXPIRES_IN"),
    REFRESH_TOKEN_KEY: getEnv("REFRESH_TOKEN_KEY"),
    REFRESH_TOKEN_EXPIRES_IN: getEnv("REFRESH_TOKEN_EXPIRES_IN"),
    JWT_ISSUER: getEnv("JWT_ISSUER"),

    RESEND_API_KEY: getEnv("RESEND_API_KEY"),
    EMAIL_SENDER: getEnv("EMAIL_SENDER"),

    WEBSITE_URL: getEnv("WEBSITE_URL"),

    CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),

    PWD: getEnv("PWD"),
  };
  return config;
};

export const Env = envConfigs();
