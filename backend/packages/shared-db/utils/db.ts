import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

export function createDbConnection(connectionString?: string) {
  dotenv.config();

  // Use provided connection string or fall back to environment variable
  const dbUrl =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgres://localhost:5432/drizzle";

  // Create SQL connection
  const sql = neon(dbUrl);

  // Return drizzle instance
  return drizzle(sql);
}
