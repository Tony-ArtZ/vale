import { useState, useRef, useEffect, useCallback } from "react";
import { useValeStore } from "../store/useValeStore";
import api from "@/lib/api";

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingAnimationRef = useRef<string | null>(null);
  const smoothedExpressionsRef = useRef<Record<string, number>>({});

  // Get functions directly from store to avoid stale closures
  const setSpeaking = useValeStore((state) => state.setSpeaking);
  const setAnimation = useValeStore((state) => state.setAnimation);
  const setExpression = useValeStore((state) => state.setExpression);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAudio = useCallback(
    (updateAnimation = true) => {
      console.log("[TTS] stopAudio called", { updateAnimation });
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) {
          // limit noise
        }
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      setIsPlaying(false);
      setSpeaking(false);

      // Apply pending animation if exists, otherwise idle
      if (updateAnimation) {
        if (pendingAnimationRef.current) {
          const pendingAnim = pendingAnimationRef.current;
          console.log("[TTS] Applying pending animation:", pendingAnim);
          setAnimation(pendingAnim);
          pendingAnimationRef.current = null;

          // If it's not a looping animation, return to idle after 4 seconds
          const loopingAnimations = ["Standing Idle", "Thinking", "Talking"];
          if (!loopingAnimations.includes(pendingAnim)) {
            console.log(
              `Pending animation ${pendingAnim} will auto-return to idle`
            );
            // Note: ValeModel now handles this with animation finished event, but keep as backup
          }
        } else {
          console.log("[TTS] Setting animation to Standing Idle");
          setAnimation("Standing Idle");
        }
      }

      // Reset all vowels smoothly
      ["A", "I", "U", "E", "O"].forEach((v) =>
        setExpression(`Fcl_MTH_${v}`, 0)
      );
      smoothedExpressionsRef.current = {};
    },
    [setSpeaking, setAnimation, setExpression]
  );

  const playTTS = useCallback(
    async (text: string) => {
      console.log(
        "[TTS] playTTS called with text:",
        text?.substring(0, 50) + "..."
      );
      if (!text) {
        console.log("[TTS] No text provided, returning");
        return;
      }

      // Interrupt existing, but preserve animation until we're ready
      stopAudio(false);

      try {
        console.log("[TTS] Fetching audio from /tts endpoint...");
        // Fetch audio
        const response = await api.post(
          "/tts",
          { text },
          { responseType: "arraybuffer" }
        );

        console.log("[TTS] Got response, size:", response.data?.byteLength);
        const arrayBuffer = response.data;

        // Init AudioContext if needed
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          console.log("[TTS] Created new AudioContext");
        }

        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          console.log("[TTS] Resuming suspended AudioContext");
          await ctx.resume();
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        console.log("[TTS] Decoded audio, duration:", audioBuffer.duration);

        // Setup Source & Analyser
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        sourceRef.current = source;
        analyserRef.current = analyser;

        // Animation & State
        console.log("[TTS] Setting animation to Talking");
        setIsPlaying(true);
        setSpeaking(true);
        setAnimation("Talking");

        source.onended = () => {
          console.log("[TTS] Audio playback ended");
          stopAudio();
        };

        source.start(0);
        console.log("[TTS] Audio started playing");

        // Animation Loop for Lip Sync
        let frameCount = 0;
        const updateVisemes = () => {
          if (!analyserRef.current) return;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Calculate overall volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avgVolume = sum / dataArray.length;
          const normalizedVolume = Math.min(
            1.0,
            Math.max(0, (avgVolume - 5) / 50)
          );

          // Frequency band analysis for vowel approximation
          const getEnergy = (start: number, end: number) => {
            let s = 0;
            for (let i = start; i <= end && i < dataArray.length; i++)
              s += dataArray[i];
            return s / (end - start + 1);
          };

          const lowFreq = getEnergy(1, 4); // ~86-344Hz
          const midFreq = getEnergy(5, 20); // ~430-1720Hz
          const highFreq = getEnergy(21, 60); // ~1806-5160Hz

          // Target shapes based on frequency analysis
          const targets: Record<string, number> = {
            Fcl_MTH_A: 0,
            Fcl_MTH_I: 0,
            Fcl_MTH_U: 0,
            Fcl_MTH_E: 0,
            Fcl_MTH_O: 0,
          };

          if (normalizedVolume > 0.08) {
            // Boost volume for visibility
            const boostedVolume = Math.min(1.0, normalizedVolume * 3.5);

            // Determine dominant vowel based on frequency distribution
            if (highFreq > midFreq * 1.3 && highFreq > lowFreq * 1.5) {
              // High frequencies -> I/E sounds
              targets.Fcl_MTH_I = boostedVolume * 0.9;
              targets.Fcl_MTH_E = boostedVolume * 0.5;
            } else if (lowFreq > midFreq * 1.2 && lowFreq > highFreq * 1.3) {
              // Low frequencies -> O/U sounds
              targets.Fcl_MTH_O = boostedVolume * 0.85;
              targets.Fcl_MTH_U = boostedVolume * 0.4;
            } else {
              // Mid-range -> A/E sounds (most common)
              const cycle = (frameCount % 30) / 30;
              if (cycle < 0.5) {
                targets.Fcl_MTH_A = boostedVolume * 0.9;
              } else {
                targets.Fcl_MTH_E = boostedVolume * 0.7;
                targets.Fcl_MTH_A = boostedVolume * 0.3;
              }
            }
          }

          // Smooth the transitions (lerp)
          const smoothingFactor = 0.3;
          Object.keys(targets).forEach((key) => {
            const current = smoothedExpressionsRef.current[key] || 0;
            const target = targets[key];
            const smoothed = current + (target - current) * smoothingFactor;
            smoothedExpressionsRef.current[key] = smoothed;
            setExpression(key, smoothed);
          });

          frameCount++;
          rafId.current = requestAnimationFrame(updateVisemes);
        };

        updateVisemes();
      } catch (err) {
        console.error("[TTS] Playback failed:", err);
        stopAudio();
      }
    },
    [stopAudio, setSpeaking, setAnimation, setExpression]
  );

  const setPendingAnimation = useCallback((anim: string | null) => {
    pendingAnimationRef.current = anim;
  }, []);

  return { playTTS, isPlaying, stopAudio, setPendingAnimation };
};
