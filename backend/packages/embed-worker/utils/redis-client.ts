import { createClient } from "redis";

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

await client.connect();

export const redisClient = client;
