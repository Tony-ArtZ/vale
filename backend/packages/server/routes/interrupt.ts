import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import createHttpError from "http-errors";
import { verifyAccessToken } from "../utils/jwt-helper";
import type { JwtPayload } from "jsonwebtoken";
import type { InterruptRequest } from "../types/interrupt";
import { createNativeRequest } from "../utils/create-native-request";
import { getTimeStamp } from "../constants/day";
import { generateAIResponse } from "../utils/generate-response";
import { redisClient } from "../utils/redis-client";

const router = express.Router();

// Get all queued interrupts
router.get(
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

      // Get all interrupts for this user from Redis
      const interruptKey = `interrupts:${userId}`;
      const interrupts = await redisClient.lRange(interruptKey, 0, -1);

      // Parse the JSON strings back into objects
      const parsedInterrupts = interrupts.map((item) => JSON.parse(item));

      res.json({ interrupts: parsedInterrupts });
    } catch (err) {
      next(err);
    }
  }
);

// Add a new interrupt
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

      const interruptRequest = req.body as InterruptRequest;
      if (!interruptRequest.origin || !interruptRequest.details) {
        return next(createHttpError.BadRequest("Invalid parameters"));
      }

      const interruptData = {
        origin: interruptRequest.origin,
        details: interruptRequest.details,
        userName: userName,
        userId: userId,
        timestamp: interruptRequest.timestamp || new Date().toISOString(),
      };

      const response = await createNativeRequest(
        userId,
        "INTERUPT",
        JSON.stringify(interruptData)
      );
      if (
        response === "User's device timed out" ||
        response.includes("Something went wrong:")
      ) {
        const interruptKey = `interrupts:${userId}`;
        await redisClient.rPush(interruptKey, JSON.stringify(interruptData));
      }

      res.json({
        message: "Interrupt created and stored",
        nativeResponse: response,
      });
    } catch (err) {
      next(err);
    }
  }
);

// TODO: REMOVE THIS TEST ROUTE
router.post(
  "/test",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const userName = req.body.userName as string;
      if (!userId || !userName) {
        return next(createHttpError.BadRequest("Invalid parameters"));
      }

      console.log(
        `[INTERRUPT-TEST] Received test request for userId=${userId}, userName=${userName}`
      );

      const interruptRequest = req.body as InterruptRequest;
      if (!interruptRequest.origin || !interruptRequest.details) {
        return next(createHttpError.BadRequest("Invalid parameters"));
      }

      const interruptData = {
        origin: interruptRequest.origin,
        details: interruptRequest.details,
        userName: userName,
        userId: userId,
        timestamp: interruptRequest.timestamp || new Date().toISOString(),
      };

      console.log(`[INTERRUPT-TEST] Sending native request to device...`);
      const response = await createNativeRequest(
        userId,
        "INTERRUPT",
        JSON.stringify(interruptData)
      );
      console.log(`[INTERRUPT-TEST] Native response: ${response}`);

      if (
        response === "User's device timed out" ||
        response.includes("Something went wrong:")
      ) {
        console.log(
          `[INTERRUPT-TEST] Device not available, storing in Redis queue`
        );
        const interruptKey = `interrupts:${userId}`;
        await redisClient.rPush(interruptKey, JSON.stringify(interruptData));
      }

      res.json({
        message: "Interrupt created and stored",
        nativeResponse: response,
      });
    } catch (err) {
      next(err);
    }
  }
);

//Generate a interrupt response
router.post(
  "/response",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const payload = req.payload as JwtPayload;
      const userId = payload.aud as string;
      const userName = payload.userName as string;
      const { message, spotifyToken, localTime } = req.body;

      const interruptRequest: InterruptRequest = JSON.parse(message);

      // Format the interrupt message as a special instruction within a user message
      const systemMessage = `[SYSTEM INSTRUCTION - DO NOT RESPOND TO THIS DIRECTLY]\n\nYou need to act as if you just noticed this information: User has received an interrupt from ${
        interruptRequest.origin
      } with details: ${
        interruptRequest.details
      }.\n\nCasually bring up this information. Do not mention it's an interrupt or notification. The user does not know about this alert. Act natural.${getTimeStamp(
        localTime
      )}`;

      const response = await generateAIResponse(systemMessage, "user", {
        userId,
        userName,
        spotifyToken,
        localTime,
      });

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// Post Sensor Data (ESP32 / Vitals)
router.post(
  "/sensor",
  verifyAccessToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.payload || typeof req.payload === "string") {
        return next(createHttpError.Unauthorized("Invalid token"));
      }

      const payload = req.payload as JwtPayload;
      const userId = payload.aud as string;
      const { heartRate, spo2, stress } = req.body;

      // 1. Publish to Redis for WS forwarding
      const sensorData = {
        userId,
        heartRate,
        spo2,
        stress: stress || "LOW",
      };

      console.log("Publishing sensor data:", sensorData);
      await redisClient.publish("sensorData", JSON.stringify(sensorData));

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export { router as interruptRouter };
