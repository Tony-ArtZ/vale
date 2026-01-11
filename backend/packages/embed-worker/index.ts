import { redisClient } from "./utils/redis-client";
import {
  getOldestMessages,
  removeOldestMessages,
} from "./utils/message-utils.ts";
import { summarizeMessages } from "./utils/summarizer.ts";
import { generateEmbeddings } from "./utils/embeder.ts";
import { storeMessage } from "./utils/storeMessage.ts";

const EMBED_QUEUE_NAME = "message:embedding:tasks";
const CONSUMER_GROUP = "embed-workers";
const CONSUMER_NAME = `worker-${Math.floor(Math.random() * 1000)}`;
const BATCH_SIZE = 10;
const MAX_RETRY_DELAY = 30000; // Max retry delay of 30 seconds

// Create consumer group if it doesn't exist
async function setupConsumerGroup() {
  try {
    // Check if the stream exists first
    const streamInfo = await redisClient.exists(EMBED_QUEUE_NAME);

    if (!streamInfo) {
      // Create the consumer group with the stream using a dummy message
      await redisClient.xGroupCreate(EMBED_QUEUE_NAME, CONSUMER_GROUP, "0-0", {
        MKSTREAM: true,
      });
      console.log("Created new stream and consumer group");
    } else {
      try {
        // Try to create the group (will fail if it already exists)
        await redisClient.xGroupCreate(EMBED_QUEUE_NAME, CONSUMER_GROUP, "0-0");
        console.log("Created consumer group on existing stream");
      } catch (err) {
        // Group already exists, ignore
        console.log("Consumer group already exists");
      }
    }
    return true;
  } catch (err) {
    console.error("Error setting up consumer group:", err);
    throw err;
  }
}

// Function to check if error is related to consumer group not found
function isConsumerGroupNotFoundError(err: Error): boolean {
  return (
    typeof err.message === "string" &&
    (err.message.includes("NOGROUP") ||
      err.message.includes("consumer group not found"))
  );
}

function getRetryDelay(retryCount: number): number {
  // Exponential backoff with jitter: 2^retryCount * (0.5-1.5 random factor) with a maximum
  const delay = Math.min(
    Math.pow(2, retryCount) * (500 + Math.random() * 1000),
    MAX_RETRY_DELAY
  );
  return Math.floor(delay);
}

async function processTask(userId: string) {
  try {
    console.log(`Processing embedding task for user ${userId}`);

    const messages = await getOldestMessages(userId, 10);

    if (messages.length === 0) {
      console.log(`No messages found for user ${userId}`);
      return;
    }

    console.log(`Retrieved ${messages.length} messages for user ${userId}`);

    const { title, summary, pendingWork } = await summarizeMessages(messages);

    const embedding = await generateEmbeddings(title + summary);

    await storeMessage(userId, title, summary, pendingWork, embedding);

    await removeOldestMessages(userId, messages.length);

    console.log(`Successfully processed embedding task for user ${userId}`);
  } catch (err) {
    console.error(`Error processing task for user ${userId}:`, err);
  }
}

async function startWorker() {
  await setupConsumerGroup();
  console.log(`Embed worker ${CONSUMER_NAME} started`);

  let retryCount = 0;

  while (true) {
    try {
      // Get tasks from the stream
      const tasks = await redisClient.xReadGroup(
        CONSUMER_GROUP,
        CONSUMER_NAME,
        [{ key: EMBED_QUEUE_NAME, id: ">" }], // '>' means get only new messages
        { COUNT: BATCH_SIZE, BLOCK: 5000 } // Wait up to 5 seconds for new messages
      );

      retryCount = 0;

      if (!tasks || tasks.length === 0) {
        continue;
      }

      const streamEntries = tasks[0].messages;

      for (const entry of streamEntries) {
        const { userId } = entry.message;
        await processTask(userId);

        // Acknowledge the message as processed
        await redisClient.xAck(EMBED_QUEUE_NAME, CONSUMER_GROUP, entry.id);
      }
    } catch (err) {
      console.error("Error in worker loop:", err);

      if (err instanceof Error && isConsumerGroupNotFoundError(err)) {
        console.log("Consumer group not found, attempting to recreate...");
        try {
          await setupConsumerGroup();
          console.log("Successfully recreated consumer group");
          retryCount = 0;
        } catch (setupErr) {
          console.error("Failed to recreate consumer group:", setupErr);
          retryCount++;
        }
      } else {
        retryCount++;
      }

      const delay = getRetryDelay(retryCount);
      console.log(`Retrying in ${delay}ms (attempt ${retryCount})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

startWorker().catch((err) => {
  console.error("Error starting worker:", err);
});
