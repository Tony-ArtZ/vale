import { createClient } from "redis";

// Create a client for regular Redis operations (get, set, etc.)
const client = createClient({
  url: process.env.REDIS_URL,
})
  .on("error", (err) => {
    console.error("Redis Client Error", err);
  })
  .on("connect", () => {
    console.log("Redis client connected");
  })
  .on("ready", () => {
    console.log("Redis client ready");
  });

// Create a separate client for SUBSCRIBING (enters subscriber mode)
const subscriberClient = createClient({
  url: process.env.REDIS_URL,
})
  .on("error", (err) => {
    console.error("Redis Subscriber Client Error", err);
  })
  .on("connect", () => {
    console.log("Redis Subscriber client connected");
  })
  .on("ready", () => {
    console.log("Redis Subscriber client ready");
  });

// Create a separate client for PUBLISHING (cannot use subscriber client)
const publisherClient = createClient({
  url: process.env.REDIS_URL,
})
  .on("error", (err) => {
    console.error("Redis Publisher Client Error", err);
  })
  .on("connect", () => {
    console.log("Redis Publisher client connected");
  })
  .on("ready", () => {
    console.log("Redis Publisher client ready");
  });

// Connect all clients
await client.connect();
await subscriberClient.connect();
await publisherClient.connect();

export const redisClient = client;
export const redisSubscriber = subscriberClient;
export const redisPublisher = publisherClient;
