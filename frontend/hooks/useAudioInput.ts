"use client";

import { useEffect, useRef, useState } from "react";
import { useValeStore } from "@/store/useValeStore";

export const useAudioInput = () => {
  const [isListening, setIsListening] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafId = useRef<number>(0);

  const { setExpression } = useValeStore();

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContext.current = new AudioContextClass();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 512;

      source.current = audioContext.current.createMediaStreamSource(stream);
      source.current.connect(analyser.current);

      setIsListening(true);
      analyze();
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  };

  const stopListening = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (source.current) source.current.disconnect();
    if (audioContext.current) audioContext.current.close();
    setIsListening(false);
    setExpression("Fcl_MTH_A", 0); // Reset mouth
  };

  const analyze = () => {
    if (!analyser.current) return;

    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(dataArray);

    // Band 200Hz - 800Hz
    // Sample rate 44100 / 512 = ~86Hz per bin
    // 200Hz ~= bin 2
    // 800Hz ~= bin 9

    let sum = 0;
    const startBin = 2;
    const endBin = 9;

    for (let i = startBin; i <= endBin; i++) {
      sum += dataArray[i];
    }

    const average = sum / (endBin - startBin + 1);
    const volume = Math.min(average / 100, 1.0); // Normalize 0-1 (sensitivity tweak)

    // Drive shape keys
    // "Fcl_MTH_A" -> Mouth Open
    // Maybe mix in "Fcl_MTH_U" for variation if we analyzed formants, but simple volume -> A is standard.

    setExpression("Fcl_MTH_A", volume); // Values 0.0 to 1.0

    rafId.current = requestAnimationFrame(analyze);
  };

  return { isListening, startListening, stopListening };
};
