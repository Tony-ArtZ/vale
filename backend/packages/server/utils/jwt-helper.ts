import JWT from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import createHttpError from "http-errors";
import { saveRefreshTokenToDb } from "../services/user-service.ts";
import * as dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
dotenv.config();

//Create new Access Token
export const signAccessToken = (
  userId: string,
  userName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const payload = { userId, userName };
    const secret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret";
    const options: SignOptions = {
      expiresIn: "1h",
      issuer: "veronica-ai",
      audience: userId,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.error(err.message);
        reject(createHttpError.InternalServerError());
        return;
      }
      resolve(token as string);
    });
  });
};

//Create new Refresh Token
export const signRefreshToken = (
  userId: string,
  userName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const payload = { userId, userName };
    const secret = process.env.REFRESH_TOKEN_SECRET || "refresh-token-secret";
    const options: SignOptions = {
      expiresIn: "1y",
      issuer: "veronica-ai",
      audience: userId,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.error(err.message);
        reject(createHttpError.InternalServerError());
        return;
      }
      resolve(token as string);
    });
  });
};

// Extend Express Request interface to include the payload property
declare global {
  namespace Express {
    interface Request {
      payload?: JWT.JwtPayload | string;
    }
  }
}

//Middleware to protect routes with Access Tokens
export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(createHttpError.Unauthorized("Access token is required"));
    }

    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    if (!token) {
      return next(createHttpError.Unauthorized("Invalid token format"));
    }

    const secret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret";
    JWT.verify(token, secret, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createHttpError.Unauthorized(message));
      }

      req.payload = payload;
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to verify token without middleware (for internal use)
export const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, secret, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        reject(createHttpError.Unauthorized(message));
        return;
      }
      resolve(payload);
    });
  });
};

//Function to verify Refresh Tokens when issuing new Access Token
export const verifyRefreshToken = (
  refreshToken: string
): Promise<{ userId: string; userName: string }> => {
  return new Promise((resolve, reject) => {
    const secret = process.env.REFRESH_TOKEN_SECRET || "refresh-token-secret";

    JWT.verify(refreshToken, secret, (err, payload: any) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        reject(createHttpError.Unauthorized(message));
        return;
      }

      const userId = payload.userId;
      const userName = payload.userName;
      resolve({ userId, userName });
    });
  });
};

//Save Refresh Token
export const saveRefreshToken = async (
  userId: string | number,
  refreshToken: string
): Promise<void> => {
  await saveRefreshTokenToDb(Number(userId), refreshToken);
};
