import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import cookieParser from "cookie-parser";
import apiRoutes from "./api/api";
import { errorHandler } from "./middlewares/error/error-handler";
import helmet, {
  hidePoweredBy,
  noSniff,
  referrerPolicy,
  xssFilter,
} from "helmet";
import { xssSanitier } from "./middlewares/auth/security";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/static", express.static("public"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust as needed
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    hidePoweredBy: true,
    xssFilter: false,
    referrerPolicy: { policy: "no-referrer" },
  })
);

app.use(xssSanitier());

app.use("/api/v1", apiRoutes);

// should be the last middleware
app.use(errorHandler);

export default app;
