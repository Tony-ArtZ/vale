import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";

// Load .env from backend root
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  out: "./drizzle",
  schema: "./schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
