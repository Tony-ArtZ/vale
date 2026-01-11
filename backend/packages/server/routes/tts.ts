import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { verifyAccessToken } from "../utils/jwt-helper";
import createHttpError from "http-errors";
import { generateSpeech } from "../utils/tts-helper";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const { text } = req.body;

      if (!text) {
        return next(createHttpError.BadRequest("Missing text"));
      }

      const audioBuffer = await generateSpeech(text);

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length,
      });

      res.send(audioBuffer);
    } catch (err) {
      next(err);
    }
  }
);

export { router as ttsRouter };
