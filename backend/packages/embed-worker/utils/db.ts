import { createDbConnection } from "shared-db";
import * as schema from "shared-db";
import * as dotenv from "dotenv";
dotenv.config();

// Create a separate DB instance for the server
const db = createDbConnection(process.env.DATABASE_URL);

// Export everything
export { db, schema };
