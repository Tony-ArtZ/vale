import { useEffect, useCallback } from "react";
import { useSocketStore } from "../store/useSocketStore";
import { useAuthStore } from "../store/useAuthStore";
import { useValeStore } from "../store/useValeStore";
import { useVitalsStore } from "../store/useVitalsStore";
import { useChatStore } from "@/store/useChatStore";
import { useInterruptStore } from "@/store/useInterruptStore";
import api from "@/lib/api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081";

// We'll pass TTS functions from the page component
let ttsPlayFn: ((text: string) => Promise<void>) | null = null;
let ttsStopFn: (() => void) | null = null;

// Track processed interrupts to prevent duplicates
const processedInterrupts = new Set<string>();

export const setTTSFunctions = (
  play: (text: string) => Promise<void>,
  stop: () => void
) => {
  console.log("[WS] TTS functions registered");
  ttsPlayFn = play;
  ttsStopFn = stop;
};

export const useValeSocket = () => {
  const { connect, socket, isConnected } = useSocketStore();
  const { accessToken, isAuthenticated } = useAuthStore();
  // Use selector pattern for stable references
  const setAnimation = useValeStore((state) => state.setAnimation);
  const { addMessage } = useChatStore();
  const { setVitals, addAlert, heartRate, o2Level, stress } = useVitalsStore();
  const { setInterrupt, setResponse, setProcessing } = useInterruptStore();

  // Process interrupt with AI
  const processInterrupt = useCallback(
    async (interruptData: {
      origin: string;
      details: string;
      userName: string;
      userId: string;
      timestamp: string;
    }) => {
      try {
        console.log(
          "[WS] Processing interrupt, ttsPlayFn available:",
          !!ttsPlayFn
        );
        console.log("[WS] Setting Thinking animation");

        // Show popup and set thinking animation
        setInterrupt(interruptData);
        if (ttsStopFn) ttsStopFn();
        setAnimation("Thinking");

        // Create a contextual message for the AI
        const interruptMessage = `[SENSOR INTERRUPT from ${interruptData.origin}]: ${interruptData.details}.
Please acknowledge this sensor reading and provide appropriate guidance based on the data.`;

        // Add to chat as system message
        addMessage("system", `📡 Sensor Alert: ${interruptData.details}`);

        // Send to AI for response
        console.log("[WS] Sending to AI API...");
        const res = await api.post("/", {
          message: interruptMessage,
          localTime: new Date().toISOString(),
          vitals: { heartRate, o2Level, stress },
        });
        console.log(
          "[WS] AI API response received:",
          typeof res.data,
          res.data
        );

        const reply =
          typeof res.data === "string"
            ? res.data
            : res.data.content ||
              res.data.response ||
              res.data.message ||
              JSON.stringify(res.data);

        console.log("[WS] Extracted reply:", reply?.substring(0, 100));

        // Update interrupt popup with response
        setResponse(reply);

        // Add to chat
        addMessage("assistant", reply);

        // Play animation if provided
        if (typeof res.data === "object" && res.data.animation) {
          console.log("[WS] Setting animation from API:", res.data.animation);
          setAnimation(res.data.animation);
        }

        // Play TTS
        if (ttsPlayFn) {
          console.log(
            "[WS] Calling TTS with response:",
            reply?.substring(0, 50) + "..."
          );
          await ttsPlayFn(reply);
        } else {
          console.warn("[WS] ttsPlayFn is null - TTS functions not registered");
        }
      } catch (err) {
        console.error("Failed to process interrupt:", err);
        setResponse(
          "I detected a sensor reading but couldn't process it fully. Please check the sensor data."
        );
        setAnimation("Disappointed");
      }
    },
    [
      setInterrupt,
      setResponse,
      setAnimation,
      addMessage,
      heartRate,
      o2Level,
      stress,
    ]
  );

  // Connect when authenticated
  useEffect(() => {
    if (accessToken && isAuthenticated && !isConnected) {
      connect(WS_URL);
    }
  }, [accessToken, isAuthenticated, isConnected, connect]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS Message:", data);

        if (data.type === "HEARTBEAT") {
          // Maybe respond with pong?
        }

        if (data.type === "VITALS") {
          const { heartRate, spo2, stress } = data.payload;
          setVitals(heartRate, spo2, stress);
        }

        if (data.type === "REQUEST") {
          const { request, parameters } = data.payload || {};
          const requestId = data.id;

          console.log("[WS] Received REQUEST:", request, parameters);

          // Handle INTERRUPT - generate AI response
          if (request === "INTERRUPT") {
            try {
              const interruptData = JSON.parse(parameters);

              // Deduplicate using timestamp + origin
              const interruptKey = `${interruptData.timestamp}-${interruptData.origin}`;
              if (processedInterrupts.has(interruptKey)) {
                console.log("[WS] Skipping duplicate interrupt:", interruptKey);
                return;
              }
              processedInterrupts.add(interruptKey);
              // Clean old entries after 10 seconds
              setTimeout(() => processedInterrupts.delete(interruptKey), 10000);

              console.log("[WS] Processing INTERRUPT:", interruptData);

              // Add alert
              addAlert(
                "INFO",
                `Sensor: ${interruptData.origin} - ${interruptData.details}`
              );

              // Process with AI (async)
              processInterrupt(interruptData);
            } catch (e) {
              console.error("Failed to parse interrupt data", e);
            }
          } else if (request) {
            setAnimation(request);
          }

          if (request === "Chat") {
            // Handle chat messages from WebSocket
          }

          // Send RESULT response back to acknowledge receipt
          const token = useAuthStore.getState().accessToken;
          if (token && socket.readyState === WebSocket.OPEN) {
            const response = {
              type: "RESULT",
              id: requestId,
              token: token,
              payload: {
                success: true,
                message: `Processed ${request} successfully`,
              },
            };
            console.log("[WS] Sending RESULT response:", response);
            socket.send(JSON.stringify(response));
          }
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, setAnimation, addMessage, setVitals, addAlert, processInterrupt]);

  return { isConnected };
};
