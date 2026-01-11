import { messagesSummary } from "shared-db";
import { db } from "./db";

export const storeMessage = async (
  userId: string,
  title: string,
  summary: string,
  pendingWork: string,
  embedding: number[]
) => {
  db.insert(messagesSummary)
    .values({
      userId,
      summary,
      title,
      embedding,
      pendingWork,
    })
    .returning()
    .then((data) => {
      console.log("Message stored successfully", data);
    })
    .catch((error) => {
      console.error("Error storing message", error);
    });
};
