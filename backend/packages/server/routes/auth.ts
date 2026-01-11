import express from "express";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt-helper.ts";
import createHttpError from "http-errors";
import {
  createUser,
  findUserByEmail,
  validateUserPassword,
  createUserPreferences,
  saveRefreshTokenToDb,
  findRefreshToken,
  deleteRefreshToken,
} from "../services/user-service.ts";
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
} from "../types/auth";
import type { JwtPayload } from "jsonwebtoken";

const router = express.Router();

//Registration
router.post("/register", async (req, res, next) => {
  try {
    const data = req.body as RegisterRequest;
    if (!data.userName || !data.email || !data.password)
      throw new Error("Invalid parameters");

    const userExists = await findUserByEmail(data.email);
    if (userExists) throw new Error("Email is already in use");

    const savedUser = await createUser(
      data.userName,
      data.email,
      data.password
    );

    const accessToken = await signAccessToken(
      savedUser.id.toString(),
      savedUser.userName
    );
    const refreshToken = await signRefreshToken(
      savedUser.id.toString(),
      savedUser.userName
    );

    await saveRefreshTokenToDb(savedUser.id, refreshToken);
    await createUserPreferences(savedUser.id);

    const response: AuthResponse = { accessToken, refreshToken };
    res.json({ message: "success", ...response });
  } catch (err) {
    next(err);
  }
});

//Login
router.post("/login", async (req, res, next) => {
  try {
    const data = req.body as LoginRequest;

    if (!data.email || !data.password) throw new Error("Invalid parameters");

    const user = await findUserByEmail(data.email);
    if (!user) throw new Error("User not registered");

    const passwordMatch = await validateUserPassword(user, data.password);
    if (!passwordMatch) throw new Error("Email or password was incorrect");

    const accessToken = await signAccessToken(
      user.id.toString(),
      user.userName
    );
    const refreshToken = await signRefreshToken(
      user.id.toString(),
      user.userName
    );

    await saveRefreshTokenToDb(user.id, refreshToken);

    // Check if user preferences exist, create if not
    await createUserPreferences(user.id).catch(() => {
      // Ignore if already exists
    });

    const response: AuthResponse = { accessToken, refreshToken };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

//Get new Access Token
router.post("/refreshtoken", async (req, res, next) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;
    if (!refreshToken) throw createHttpError.BadRequest();

    const { userId, userName } = await verifyRefreshToken(refreshToken);

    //Check if refresh token is currently in use
    const refreshTokenInUse = await findRefreshToken(userId, refreshToken);

    if (!refreshTokenInUse) {
      throw createHttpError.Unauthorized();
    }

    //Remove old refreshToken
    await deleteRefreshToken(refreshToken);

    //Create and save new refreshToken
    const accessToken = await signAccessToken(userId, userName);
    const newRefreshToken = await signRefreshToken(userId, userName);

    await saveRefreshTokenToDb(Number(userId), newRefreshToken);

    const response: AuthResponse = {
      accessToken,
      refreshToken: newRefreshToken,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

//Google Auth
router.get("/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: process.env.CURRENT_URL + "/auth/google/callback",
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "consent",
    state: req.query.link ? `link:${req.query.link}` : "",
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

// Get user info
router.get("/user", verifyAccessToken, async (req, res, next) => {
  try {
    if (!req.payload || typeof req.payload === "string") {
      return next(createHttpError.Unauthorized("Invalid token"));
    }

    const payload = req.payload as JwtPayload;
    const userId = payload.aud as string;
    const userName = payload.userName as string;
    res.json({ userId, userName });
  } catch (err) {
    next(err);
  }
});

//Login or register user with Google
router.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) throw createHttpError.BadRequest();

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: process.env.CURRENT_URL + "/auth/google/callback",
      grant_type: "authorization_code",
      code: code as string,
    });

    const response = await fetch(
      `https://oauth2.googleapis.com/token?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await response.json();
    if (data.error) throw createHttpError.InternalServerError(data.error);

    const accessToken = data.access_token;
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );
    const userInfo = await userInfoResponse.json();

    if (userInfo.error)
      throw createHttpError.InternalServerError(userInfo.error);

    let user = await findUserByEmail(userInfo.email);
    if (!user) {
      user = await createUser(userInfo.name, userInfo.email, "");
    }

    const jwtAccessToken = await signAccessToken(
      user.id.toString(),
      user.userName
    );
    const jwtRefreshToken = await signRefreshToken(
      user.id.toString(),
      user.userName
    );

    // Save refresh token to the database
    await saveRefreshTokenToDb(user.id, jwtRefreshToken);

    // Redirect to the app with tokens
    // Check if we are in a web context (simplistic check or just support web by default for this project)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/auth/callback?access_token=${jwtAccessToken}&refresh_token=${jwtRefreshToken}&state=${state}`
    );
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };
