//OpenAI chatCompletion functions and other parameters
import * as dotenv from "dotenv";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { cerebras } from "@ai-sdk/cerebras";
dotenv.config();

export const openAiConfig = {
  model: openai("gpt-5-mini"),
};

// export const openAiConfig = {
// model: google("gemini-3-flash-preview"),
// };

// export const openAiConfig = {
//   model: cerebras("llama3.1-8b"),
// };

export const openAiEmbedConfig = {
  model: openai.embedding("text-embedding-ada-002"),
};

export const EMBEDDING_DIMENSIONS = 1536;
