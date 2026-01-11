import express from "express";
import { verifyAccessToken } from "../utils/jwt-helper.ts";
import {
  deletePreferenceHelper,
  getAllPreferences,
  addOrUpdatePreferenceHelper,
} from "../utils/user-prefs-helper.ts";
import createHttpError from "http-errors";

const router = express.Router();

router.get("/prefs", verifyAccessToken, async (req, res, next) => {
  try {
    if (!req.payload || typeof req.payload === "string") {
      return next(createHttpError.Unauthorized("Invalid token"));
    }
    const userId = req.payload.aud as string;
    const userPreferences = await getAllPreferences(userId);
    const jsonToReturn = {
      data: Object.fromEntries(Object.entries(userPreferences)),
    };
    res.json(jsonToReturn);
  } catch (err) {
    next(err);
  }
});

router.post("/prefs", verifyAccessToken, async (req, res, next) => {
  try {
    if (!req.payload || typeof req.payload === "string") {
      return next(createHttpError.Unauthorized("Invalid token"));
    }
    const userId = req.payload.aud as string;
    const { key, value } = req.body;

    if (!key) throw createHttpError.BadRequest("Key is required");

    const result = await addOrUpdatePreferenceHelper(userId, key, value);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/prefs/:key", verifyAccessToken, async (req, res, next) => {
  try {
    if (!req.payload || typeof req.payload === "string") {
      return next(createHttpError.Unauthorized("Invalid token"));
    }
    const key = req.params.key;
    const userId = req.payload.aud as string;
    const deletePreferenceResult = await deletePreferenceHelper(userId, key);
    console.log(deletePreferenceResult);
    res.json(deletePreferenceResult);
  } catch (err) {
    next(err);
  }
});

router.delete("/prefs/:key", verifyAccessToken, async (req, res, next) => {
  try {
    if (!req.payload || typeof req.payload === "string") {
      return next(createHttpError.Unauthorized("Invalid token"));
    }
    const key = req.params.key;
    const userId = req.payload.aud as string;
    const deletePreferenceResult = await deletePreferenceHelper(userId, key);
    res.json(deletePreferenceResult);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
