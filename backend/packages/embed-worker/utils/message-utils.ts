import { redisClient } from "./redis-client";

export type Message = {
  role: string;
  content: string;
  userId: string;
  timeStamp: string;
};

export async function getOldestMessages(
  userId: string,
  limit: number
): Promise<Message[]> {
  try {
    const key = `messages:${userId}`;
    const messages = await redisClient.lRange(key, 0, limit - 1);

    if (!messages || messages.length === 0) {
      return [];
    }

    return messages.map((msg) => JSON.parse(msg));
  } catch (err) {
    console.error(`Error fetching messages for user ${userId}:`, err);
    throw err;
  }
}

export async function removeOldestMessages(
  userId: string,
  count: number
): Promise<void> {
  try {
    const key = `messages:${userId}`;
    // Remove the oldest 'count' messages
    await redisClient.lTrim(key, count, -1);
  } catch (err) {
    console.error(`Error removing messages for user ${userId}:`, err);
    throw err;
  }
}
