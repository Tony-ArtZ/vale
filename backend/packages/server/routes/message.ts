import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { verifyAccessToken } from "../utils/jwt-helper.ts";
import { getMessage, saveMessage } from "../utils/message-helper.ts";
import type { JwtPayload } from "jsonwebtoken";
import createHttpError from "http-errors";
import { getTimeStamp } from "../constants/day.ts";
import { generateAIResponse } from "../utils/generate-response";

const router = express.Router();

//Main Route for getting Response
router.post(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const payload = req.payload as JwtPayload;
      const userId = payload.aud as string;
      const userName = payload.userName as string;
      const {
        message,
        spotifyToken,
        localTime,
        mcpServers,
        vitals,
        userEmotion,
      } = req.body;

      //Format the user message with timestamp
      const userMessage = message + getTimeStamp(localTime);

      //Generate response
      const response = await generateAIResponse(userMessage, "user", {
        userId,
        userName,
        spotifyToken,
        localTime,
        mcpServers,
        vitals,
        userEmotion,
      });

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

//Get previously stored messages of a certain user
router.get(
  "/getmessage",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }
      const userId = req.payload.aud as string;
      const messages = await getMessage(4, userId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }
);

// Post a message to the database
router.post(
  "/postmessage",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const userId = req.payload.aud as string;
      const timeStamp = Date.now();

      await saveMessage(
        req.body.message + " [User's Time: " + timeStamp + "]",
        "user",
        userId
      );
      res.json({ message: "Message saved successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export { router as messageRouter };
