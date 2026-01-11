import { useState, useRef, useEffect, useCallback } from "react";
import { useVitalsStore } from "../store/useVitalsStore";
import axios from "axios";

// NOTE: This URL might need to be proxied if CORS is an issue or if it's mixed content (http vs https).
// Ideally, this should come from process.env, but hardcoding as requested for now.
const EMOTION_API_URL = "http://10.0.170.203:5000/detect-emotion";

export const useEmotionDetection = () => {
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { logMood, isEmotionDetectionEnabled } = useVitalsStore();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    // Start camera when enabled
    const startCamera = async () => {
      if (!isEmotionDetectionEnabled) return;

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("Camera not supported or blocked");
          return;
        }

        // Small delay to ensure ref is attached
        if (!videoRef.current) {
          await new Promise((r) => setTimeout(r, 100));
        }

        if (!isMounted) return; // check if unmounted/disabled during delay

        if (!videoRef.current) {
          console.warn("Video ref not ready for emotion detection");
          return;
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
        });

        if (!isMounted) {
          // If component unmounted or effect cleanup ran, stop immediately
          newStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = newStream;

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .catch((e) => console.error("Play error:", e));
          };
        }
      } catch (err) {
        console.error("Failed to start camera for emotion detection", err);
      }
    };

    // Stop camera
    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    if (isEmotionDetectionEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isEmotionDetectionEnabled]);

  const detectEmotion = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Video or canvas not ready");
      return null;
    }

    try {
      setDetecting(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.readyState !== 4) {
        // HAVE_ENOUGH_DATA
        setDetecting(false);
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg")
        );
        if (!blob) throw new Error("Failed to create blob");

        // Prepare form data
        const formData = new FormData();
        formData.append("image", blob, "capture.jpg");

        // Send to API
        const response = await axios.post(EMOTION_API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 3000, // 3s timeout
        });

        console.log("Emotion API Response:", response.data);

        const result = response.data;
        if (result && result.emotion) {
          setCurrentEmotion(result.emotion);
          logMood(result.emotion, result.confidence || 0);
          return {
            emotion: result.emotion,
            confidence: result.confidence || 0,
          };
        }
      }
    } catch (error) {
      console.error("Emotion detection failed:", error);
    } finally {
      setDetecting(false);
    }
    return null;
  }, [logMood]);

  return {
    videoRef,
    canvasRef,
    currentEmotion,
    detecting,
    detectEmotion,
  };
};
