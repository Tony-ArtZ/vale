import { desc, eq, messages, messagesSummary } from "shared-db";
import { redisClient } from "./redis-client.ts";
import { db } from "../db/index.ts";

type Role = "user" | "system" | "assistant";
type Message = typeof messages.$inferSelect;

const MESSAGE_LIMIT = 10;
const EMBED_QUEUE_NAME = "message:embedding:tasks";

const saveMessage = async (
  message: string,
  role: Role,
  userId: string
): Promise<void> => {
  try {
    const key = `messages:${userId}`;
    const messageData = JSON.stringify({
      role,
      content: message,
      userId,
      timeStamp: new Date().toISOString(),
    });

    const messageCount = await redisClient.lLen(key);

    if (messageCount === 0) {
      await redisClient.rPush(key, messageData);
    } else {
      // For subsequent messages, push normally
      await redisClient.rPush(key, messageData);
      await redisClient.lTrim(key, -MESSAGE_LIMIT, -1);
    }

    // Check if we need to queue up for embedding
    const newMessageCount = await redisClient.lLen(key);
    if (newMessageCount >= MESSAGE_LIMIT) {
      await queueForEmbedding(userId);
    }
  } catch (err) {
    throw err;
  }
};

const queueForEmbedding = async (userId: string): Promise<void> => {
  try {
    // Add task to Redis Stream with user ID
    await redisClient.xAdd(
      EMBED_QUEUE_NAME,
      "*", // Auto-generate ID
      { userId }
    );
    console.log(`Queued user ${userId} for message embedding`);
  } catch (err) {
    console.error("Failed to queue for embedding:", err);
    throw err;
  }
};

const getMessage = async (
  limit: number,
  userId: string
): Promise<Message[]> => {
  try {
    const key = `messages:${userId}`;
    const actualLimit = Math.min(limit, MESSAGE_LIMIT);

    // Get the last N messages
    const messages = await redisClient.lRange(key, -actualLimit, -1);

    // Return messages in the order of oldest to newest
    return messages.map((msg) => JSON.parse(msg));
  } catch (err) {
    throw err;
  }
};

const getPreviousSummary = async (limit: number, userId: string) => {
  try {
    const data = await db
      .select({
        title: messagesSummary.title,
        summary: messagesSummary.summary,
        createdAt: messagesSummary.createdAt,
      })
      .from(messagesSummary)
      .where(eq(messagesSummary.userId, userId))
      .orderBy(desc(messagesSummary.createdAt))
      .limit(limit);

    return data.reverse();
  } catch (err) {
    console.error("Error fetching previous summaries:", err);
    throw err;
  }
};

export { saveMessage, getMessage, getPreviousSummary };
