import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { createClient } from "redis";
import type {
  PubClientActionRequest,
  PubClientActionResult,
  WebSocketRequest,
  WebSocketResponse,
} from "shared-db";

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("[WS-SERVER] Redis URL:", process.env.REDIS_URL || "NOT SET");

const redisPublisher = createClient({
  url: process.env.REDIS_URL,
})
  .on("error", (err) => {
    console.error("[WS-SERVER] Redis Publisher Error", err);
  })
  .on("connect", () => {
    console.log("[WS-SERVER] Redis Publisher connected");
  });

const redisSubscriber = createClient({
  url: process.env.REDIS_URL,
})
  .on("error", (err) => {
    console.error("[WS-SERVER] Redis Subscriber Error", err);
  })
  .on("connect", () => {
    console.log("[WS-SERVER] Redis Subscriber connected");
  });

await redisPublisher.connect();
await redisSubscriber.connect();

console.log("[WS-SERVER] Both Redis clients connected successfully");

type WebSocketClient = Record<string, WebSocket>;

const clients: WebSocketClient = {};

const handleAuth = (socket: WebSocket, token: string, id: string) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret";
  JWT.verify(token, secret, (err, payload) => {
    if (err) {
      console.log("[WS-SERVER] Auth failed - invalid token:", err.message);
      const response: WebSocketResponse = {
        type: "RESULT",
        id,
        payload: {
          success: false,
          message: "Invalid token",
        },
      };
      socket.send(JSON.stringify(response));
      socket.close();
    } else {
      if (!payload || typeof payload === "string") {
        console.log("[WS-SERVER] Auth failed - invalid payload");
        const response: WebSocketResponse = {
          type: "RESULT",
          id,
          payload: {
            success: false,
            message: "Invalid token payload",
          },
        };
        socket.send(JSON.stringify(response));

        socket.close();
        return;
      }

      const userId = payload.aud as string;
      clients[userId] = socket;
      console.log(`[WS-SERVER] ✓ Client authenticated: userId=${userId}`);
      console.log(
        `[WS-SERVER] Connected clients: [${Object.keys(clients).join(", ")}]`
      );

      // Send success response
      const response: WebSocketResponse = {
        type: "RESULT",
        id,
        payload: {
          success: true,
          message: "Authenticated successfully",
        },
      };
      socket.send(JSON.stringify(response));
    }
  });
};

const handleResult = (
  socket: WebSocket,
  token: string,
  id: string,
  data: WebSocketRequest["payload"]
) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret";
  JWT.verify(token, secret, (err, payload) => {
    if (err) {
      const response: WebSocketResponse = {
        type: "RESULT",
        id,
        payload: {
          success: false,
          message: "Invalid token",
        },
      };
      console.error("Invalid token:", err);
      socket.send(JSON.stringify(response));
      socket.close();
    } else {
      if (!payload || typeof payload === "string") {
        const response: WebSocketResponse = {
          type: "RESULT",
          id,
          payload: {
            success: false,
            message: "Invalid token payload",
          },
        };
        socket.send(JSON.stringify(response));
        socket.close();
        return;
      }

      const userId = payload.aud as string;
      const result: PubClientActionResult = {
        userId,
        id,
        result: {
          success: data?.success || false,
          message: data?.message || "",
        },
      };

      console.log("Publishing result to Redis:", result);
      redisPublisher.publish("clientActionResult", JSON.stringify(result));
    }
  });
};

const server = http.createServer((req, res) => {
  res.writeHead(400);
  res.end("Invalid request");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket: WebSocket) => {
  console.log("New WebSocket connection");

  socket.on("close", () => {
    for (const userId in clients) {
      if (clients[userId] === socket) {
        delete clients[userId];
        delete clientsLastActivity[userId];
        console.log(`Client ${userId} disconnected`);
        break;
      }
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  socket.on("message", (message: string) => {
    try {
      const request = JSON.parse(message) as WebSocketRequest;

      console.log("Received message:", request);

      // Update activity timestamp when a valid message is received
      if (request.token) {
        // Verify the token to get the userId
        const secret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret";
        try {
          const payload = JWT.verify(request.token, secret);
          if (payload && typeof payload !== "string") {
            const userId = payload.aud as string;
            clientsLastActivity[userId] = Date.now();
          }
        } catch (err) {
          // Token verification failed,
          console.error("Token verification failed:", err);
          return;
        }
      }

      switch (request.type) {
        case "HEARTBEAT":
          // Send heartbeat response back to client
          const heartbeatResponse: WebSocketResponse = {
            type: "HEARTBEAT",
            id: request.id,
            payload: {
              success: true,
            },
          };
          socket.send(JSON.stringify(heartbeatResponse));
          break;

        case "AUTH":
          // Handle authentication
          if (request.token) {
            handleAuth(socket, request.token, request.id);
          } else {
            const response: WebSocketResponse = {
              type: "RESULT",
              id: request.id,
              payload: {
                success: false,
                message: "Token is required for authentication",
              },
            };
            socket.send(JSON.stringify(response));
          }
          break;

        case "RESULT":
          // Handle result
          if (request.token && request.payload) {
            handleResult(socket, request.token, request.id, request.payload);
          } else {
            console.error("Token and payload are required for result");
            const response: WebSocketResponse = {
              type: "RESULT",
              id: request.id,
              payload: {
                success: false,
                message: "Token and payload are required for result",
              },
            };
            socket.send(JSON.stringify(response));
          }
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const response: WebSocketResponse = {
        type: "RESULT",
        id: "",
        payload: {
          success: false,
          message: "Error processing message",
        },
      };
      socket.send(JSON.stringify(response));
    }
  });
});

// Track last activity time for each client
const clientsLastActivity: Record<string, number> = {};

// Check for inactive clients every minute
setInterval(() => {
  const now = Date.now();
  for (const userId in clientsLastActivity) {
    // Client inactive for more than 2 minutes
    if (now - clientsLastActivity[userId] > 120000) {
      console.log(`Client ${userId} timed out due to inactivity`);
      if (clients[userId]) {
        clients[userId].close();
        delete clients[userId];
        delete clientsLastActivity[userId];
      }
    }
  }
}, 60000);

console.log("[WS-SERVER] Subscribing to clientActionRequest channel...");
redisSubscriber.subscribe("clientActionRequest", (message) => {
  console.log(
    "[WS-SERVER] Received Redis message on clientActionRequest channel"
  );

  const parsedMessage = JSON.parse(message) as PubClientActionRequest;
  if (!parsedMessage || !parsedMessage.userId || !parsedMessage.action) {
    console.error("[WS-SERVER] Invalid message format:", message);
    return;
  }

  console.log("[WS-SERVER] Parsed client action request:", parsedMessage);
  console.log("[WS-SERVER] Currently connected clients:", Object.keys(clients));

  const { userId, action, id } = parsedMessage;

  if (clients[userId]) {
    console.log(`[WS-SERVER] Found client ${userId}, forwarding request...`);
    const response: WebSocketResponse = {
      id,
      type: "REQUEST",
      payload: {
        request: action.request,
        parameters: action.parameters,
      },
    };
    clients[userId].send(JSON.stringify(response));
    console.log(`[WS-SERVER] Sent request to client ${userId}:`, response);
  } else {
    console.log(
      `[WS-SERVER] Client ${userId} NOT connected. Cannot forward request.`
    );
    console.log(
      `[WS-SERVER] Available clients: [${Object.keys(clients).join(", ")}]`
    );
  }
});

redisSubscriber.subscribe("sensorData", (message) => {
  try {
    const data = JSON.parse(message);
    const { userId, heartRate, spo2, stress } = data;

    if (userId && clients[userId]) {
      const response: WebSocketResponse = {
        type: "VITALS",
        id: "", // Notification, no request ID
        payload: {
          heartRate,
          spo2,
          stress,
        },
      };
      // Send to the client
      clients[userId].send(JSON.stringify(response));
    }
  } catch (err) {
    console.error("Error processing sensorData message:", err);
  }
});

// Start the server
const PORT = process.env.WS_PORT || 8081;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
