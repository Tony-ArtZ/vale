import { Router } from "express";
import createHttpError from "http-errors";
import * as dotenv from "dotenv";
import { verifyAccessToken } from "../utils/jwt-helper.ts";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db/index.ts";
import { tokens } from "shared-db";
import {
  type SpotifyAuthRequest,
  type SpotifyTokenRequest,
  type SpotifyRefreshRequest,
  type SpotifyTokenResponse,
  // TokenType,
} from "../types/spotify.ts";

dotenv.config();

const router = Router();

interface AuthorizedRequest extends Request {
  payload?: {
    aud: string;
  };
}

//Get User's consent from spotify authorization page
router.get("/authorize", (req: Request, res: Response, next: NextFunction) => {
  try {
    const scope = "user-modify-playback-state user-read-currently-playing";
    const redirect_uri =
      req.protocol + "://" + req.get("host") + "/spotify/redirect";

    res.redirect(
      "https://accounts.spotify.com/authorize?" +
        "response_type=code" +
        "&client_id=" +
        process.env.Client_ID +
        "&redirect_uri=" +
        redirect_uri +
        "&scope=" +
        scope
    );
  } catch (err) {
    next(err);
  }
});

//Redirected from spotify authorization page and deep link to Veronica app
router.get("/redirect", (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = (req.query.code as string) || null;
    const state = (req.query.state as string) || null;

    if (!code) {
      throw createHttpError.InternalServerError;
    } else {
      const appDeepLink = `veronica://spotifyauth/?code=${code}`;
      console.log(appDeepLink);
      res.redirect(appDeepLink);
    }
  } catch (err) {
    next(err);
  }
});

//Save the Authorization code
router.post(
  "/save",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const { code }: SpotifyAuthRequest = req.body;
      const userId = req.payload.aud as string;

      if (!code || !userId) {
        throw createHttpError.BadRequest;
      }

      const [authToken] = await db
        .insert(tokens)
        .values({
          userId,
          token: code,
          // type: TokenType.AUTHORIZATION,
          type: 0,
        })
        .returning();

      res.json({ token: authToken.token });
    } catch (err) {
      next(err);
    }
  }
);

//Send Authorization code to get Access Token
router.post(
  "/getaccesstokenfromauhtorization",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code }: SpotifyTokenRequest = req.body;

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(
            process.env.Client_ID + ":" + process.env.Client_Secret
          )}`,
        },
        body: new URLSearchParams({
          redirect_uri:
            req.protocol + "://" + req.get("host") + "/spotify/redirect",
          grant_type: "authorization_code",
          code,
        }),
      });

      const data = (await response.json()) as SpotifyTokenResponse;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

//Send Refresh Token to get Access Token
router.post(
  "/getaccesstokenfromrefresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken }: SpotifyRefreshRequest = req.body;

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(
            process.env.Client_ID + ":" + process.env.Client_Secret
          )}`,
        },
        body: new URLSearchParams({
          redirect_uri:
            req.protocol + "://" + req.get("host") + "/spotify/redirect",
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      const data = (await response.json()) as SpotifyTokenResponse;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export { router as spotifyRouter };
