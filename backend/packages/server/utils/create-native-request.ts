import type { PubClientActionRequest, PubClientActionResult } from "shared-db";
import { redisSubscriber, redisPublisher } from "./redis-client";

export const createNativeRequest = async (
  userId: string,
  requestAction: string,
  info: string
): Promise<String> => {
  const request: PubClientActionRequest = {
    userId,
    id: crypto.randomUUID(),
    action: {
      request: requestAction,
      parameters: info,
    },
  };

  console.log(
    "[NATIVE-REQUEST] Publishing to clientActionRequest channel:",
    request
  );

  // Use publisher client for publishing
  await redisPublisher.publish("clientActionRequest", JSON.stringify(request));
  console.log("[NATIVE-REQUEST] Published successfully");

  const response: Promise<String> = new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("[NATIVE-REQUEST] Timeout waiting for response from device");
      redisSubscriber.unsubscribe("clientActionResult");
      resolve("User's device timed out");
    }, 20000);

    const messageHandler = (message: string) => {
      console.log(
        "[NATIVE-REQUEST] Received message on clientActionResult:",
        message
      );
      const parsedMessage: PubClientActionResult = JSON.parse(message);
      if (parsedMessage.userId === userId && parsedMessage.id === request.id) {
        console.log(
          "[NATIVE-REQUEST] Message matches our request, processing..."
        );
        clearTimeout(timeout);
        // Use subscriber client for unsubscribing
        redisSubscriber.unsubscribe("clientActionResult");
        if (parsedMessage.result.success) {
          resolve(parsedMessage.result.message);
        } else {
          resolve("Something went wrong: " + parsedMessage.result.message);
        }
      } else {
        console.log(
          "[NATIVE-REQUEST] Message doesn't match our request. Expected userId:",
          userId,
          "id:",
          request.id
        );
      }
    };

    console.log(
      "[NATIVE-REQUEST] Subscribing to clientActionResult channel..."
    );
    // Use subscriber client for subscribing
    redisSubscriber.subscribe("clientActionResult", messageHandler);
  });
  return response;
};
