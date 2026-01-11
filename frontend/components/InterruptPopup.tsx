"use client";

import React, { useEffect, useState } from "react";
import { useInterruptStore } from "@/store/useInterruptStore";

const InterruptPopup = () => {
  const {
    currentInterrupt,
    isProcessing,
    isVisible,
    aiResponse,
    hideInterrupt,
  } = useInterruptStore();
  const [dots, setDots] = useState("");

  // Animate dots while processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Auto-hide after response is shown for a while
  useEffect(() => {
    if (aiResponse && !isProcessing) {
      const timeout = setTimeout(() => {
        hideInterrupt();
      }, 10000); // Hide after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [aiResponse, isProcessing, hideInterrupt]);

  if (!isVisible || !currentInterrupt) return null;

  const getOriginIcon = (origin: string) => {
    if (origin.includes("max30102") || origin.includes("heart")) return "❤️";
    if (origin.includes("gsr") || origin.includes("stress")) return "⚡";
    if (origin.includes("temp")) return "🌡️";
    if (origin.includes("motion") || origin.includes("accel")) return "📳";
    return "📡";
  };

  const getOriginLabel = (origin: string) => {
    if (origin.includes("max30102")) return "Pulse Oximeter";
    if (origin.includes("gsr")) return "Stress Sensor";
    if (origin.includes("temp")) return "Temperature";
    if (origin.includes("motion")) return "Motion Sensor";
    return origin;
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,200,255,0.2)] p-4 min-w-[350px] max-w-[500px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-xl animate-pulse">
            {getOriginIcon(currentInterrupt.origin)}
          </div>
          <div className="flex-1">
            <div className="text-xs text-cyan-400 uppercase tracking-wider font-mono">
              Sensor Interrupt
            </div>
            <div className="text-sm text-white font-medium">
              {getOriginLabel(currentInterrupt.origin)}
            </div>
          </div>
          <button
            onClick={hideInterrupt}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Sensor Data */}
        <div className="bg-slate-900/50 rounded-lg p-3 mb-3 border border-slate-700/50">
          <div className="text-xs text-gray-400 mb-1">Sensor Reading</div>
          <div className="text-sm text-cyan-100">
            {currentInterrupt.details}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {new Date(currentInterrupt.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* VALE Response */}
        <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 rounded-lg p-3 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
              V
            </div>
            <span className="text-xs text-cyan-300 font-medium">
              VALE Response
            </span>
          </div>

          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-sm text-cyan-300/70">Analyzing{dots}</span>
            </div>
          ) : aiResponse ? (
            <div className="text-sm text-white leading-relaxed">
              {aiResponse}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Waiting for response...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterruptPopup;
