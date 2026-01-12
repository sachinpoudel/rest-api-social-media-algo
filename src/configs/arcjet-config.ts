import arcjet, { detectBot, shield, validateEmail } from "@arcjet/node";
import { Env } from "./env-config";

export const aj = arcjet({
  key: Env.ARCJET_KEY,
  rules: [
    shield({
      mode: Env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
    }),
  
   
  ],
});
