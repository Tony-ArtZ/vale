import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.ts";
import type { ErrorResponse } from "./types/error.ts";
import { spotifyRouter } from "./routes/spotify.ts";
import { messageRouter } from "./routes/message.ts";
import { userRouter } from "./routes/user-prefs.ts";
import * as dotenv from "dotenv";
import { interruptRouter } from "./routes/interrupt.ts";
import { ttsRouter } from "./routes/tts.ts";
import path from "path";

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const port = process.env.PORT || 3000;
const app = express();

//CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

//Middleware Helpers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Ping
app.get("/ping", (req, res) => {
  res.send("pong");
});

//Auth Route
app.use("/auth", authRouter);

//Spotify Auth Route
app.use("/spotify", spotifyRouter);

//User Prefs
app.use("/user", userRouter);

//Interrupt
app.use("/interrupt", interruptRouter);

//TTS
app.use("/tts", ttsRouter);

//Messages Route (Root handler - keep last)
app.use("/", messageRouter);

//URL Encoded data to JSON Body data Converter

app.use((req, res, next) => {
  if (req.is("application/x-www-form-urlencoded")) {
    req.body = req.body || {};
    for (let key in req.query) {
      req.body[key] = req.query[key];
    }
  }
  next();
});

//Error Handling
app.use(
  (
    err: Error & { status?: number },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status || 500);
    res.send({
      error: {
        status: err.status || 500,
        message: err.message,
      },
    } as ErrorResponse);
  }
);

//Initialization
app.listen(port, () => console.log(`Listening on port ${port}`));
