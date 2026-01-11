"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useValeSocket, setTTSFunctions } from "@/hooks/useValeSocket";
import CanvasContainer from "@/components/CanvasContainer";
import { useAudioInput } from "@/hooks/useAudioInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useChatStore } from "@/store/useChatStore";
import api from "@/lib/api";
import { useVitals } from "@/hooks/useVitals";
import SettingsModal from "@/components/SettingsModal";
import { useTTS } from "@/hooks/useTTS";
import { useValeStore } from "@/store/useValeStore";
import MissionDashboard from "@/components/MissionDashboard";
import InterruptPopup from "@/components/InterruptPopup";
import { useEmotionDetection } from "@/hooks/useEmotionDetection"; // NEW

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const { messages, addMessage, clearMessages } = useChatStore();
  const { isConnected } = useValeSocket();
  const { isListening, startListening, stopListening } = useAudioInput();
  const { playTTS, stopAudio, setPendingAnimation } = useTTS();
  const { setAnimation } = useValeStore();
  // NEW: Emotion detection hook
  const { videoRef, canvasRef, detectEmotion, detecting, currentEmotion } =
    useEmotionDetection();

  const {
    heartRate,
    o2Level,
    stress,
    missionDay,
    emergencyMode,
    alerts,
    isEmotionDetectionEnabled,
    toggleEmotionDetection,
  } = useVitals();
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pass TTS functions to WebSocket handler for interrupt processing
  useEffect(() => {
    setTTSFunctions(playTTS, stopAudio);
  }, [playTTS, stopAudio]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false); // Demo toggle for offline
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Route protection
  useEffect(() => {
    // Only redirect if we are sure we are not authenticated.
    // Wait for hydration to complete.
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Load past messages
  useEffect(() => {
    if (isAuthenticated) {
      api
        .get("/getmessage")
        .then((res) => {
          clearMessages();
          // Sort needed? Assuming backend returns sorted or we reverse.
          // Assuming backend returns array of objects { message, role, ... }
          // Check getMessage format from backend (it was just returning saveMessage calls usually)
          // For now, assume generic array.
          if (Array.isArray(res.data)) {
            res.data.forEach((m: any) => {
              // content is 'message', role is 'role'
              if (m.message) addMessage(m.role || "user", m.message);
            });
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, clearMessages, addMessage]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");
    addMessage("user", text);
    setIsProcessing(true);
    stopAudio();
    setAnimation("Thinking");

    // Detect Emotion before sending
    let detectedEmotion = null;
    if (isEmotionDetectionEnabled) {
      try {
        console.log("Detecting emotion before sending...");
        const emotionResult = await detectEmotion();
        if (emotionResult) {
          console.log("Detected User Emotion:", emotionResult);
          detectedEmotion = emotionResult;
        }
      } catch (e) {
        console.error("Emotion detection skipped:", e);
      }
    } else {
      console.log("Emotion detection disabled by user.");
    }

    try {
      const res = await api.post("/", {
        message: text,
        localTime: new Date().toISOString(),
        vitals: { heartRate, o2Level, stress },
        userEmotion: detectedEmotion, // NEW: Pass emotion to backend
      });

      const reply =
        typeof res.data === "string"
          ? res.data
          : res.data.content ||
            res.data.response ||
            res.data.message ||
            JSON.stringify(res.data);

      addMessage("assistant", reply);

      // Store animation to play after TTS finishes (prevents conflicts)
      if (typeof res.data === "object" && res.data.animation) {
        setPendingAnimation(res.data.animation);
      } else {
        setPendingAnimation(null);
      }

      await playTTS(reply);
    } catch (err) {
      console.error(err);
      addMessage("system", "Comms link failed.");
      setAnimation("Disappointed");

      // Return to idle after 3 seconds
      setTimeout(() => {
        setAnimation("Standing Idle");
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !isAuthenticated)
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        Loading Mission Control...
      </div>
    );

  return (
    <div className="h-screen w-full relative bg-black overflow-hidden font-sans">
      {/* 3D Scene Layer */}
      <CanvasContainer controlsEnabled={!isSettingsOpen} />

      {/* Interrupt Popup */}
      <InterruptPopup />

      {/* Hidden processing elements for Camera/Emotion */}
      {isEmotionDetectionEnabled && (
        <div className="hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width="320"
            height="240"
          />
          <canvas ref={canvasRef} width="320" height="240" />
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 transition-all duration-1000 ease-in-out">
        {/* Top Bar: Mission Control & Status */}
        <div className="flex justify-between items-start pointer-events-auto">
          {/* Left - VALE Status with Dashboard Toggle */}
          <div className="flex flex-col gap-3">
            {/* Vale Header */}
            <div
              onClick={() => setShowDashboard(!showDashboard)}
              className={`bg-slate-950/60 backdrop-blur-xl px-4 py-2 rounded-2xl border cursor-pointer transition-all ${
                emergencyMode
                  ? "border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.2)] animate-pulse"
                  : "border-cyan-500/20 shadow-[0_0_30px_rgba(0,200,255,0.1)] hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    emergencyMode ? "bg-red-500" : "bg-cyan-400"
                  } shadow-[0_0_10px_currentColor]`}
                />
                <div>
                  <div className="text-xs font-mono text-cyan-300 tracking-[0.2em]">
                    VALE
                  </div>
                  <div className="text-[9px] text-gray-500">
                    {offlineMode
                      ? "Local Llama 3.1 8B"
                      : "Autonomous Support AI"}
                  </div>
                </div>
                <div className="text-[10px] text-cyan-500/60 font-mono ml-4">
                  DAY {missionDay}
                </div>
                <div className="text-[10px] text-gray-500 ml-2">
                  {showDashboard ? "▼" : "◀"}
                </div>
              </div>
            </div>

            {/* Offline Mode Indicator (when enabled) */}
            {offlineMode && (
              <div className="bg-orange-950/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-orange-500/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <div className="text-[9px] text-orange-300 font-mono">
                  OFFLINE MODE
                </div>
                <div className="text-[8px] text-orange-400/60">
                  Earth Delay: 22m 14s
                </div>
              </div>
            )}

            {/* Offline Toggle (for demo) */}
            <button
              onClick={() => setOfflineMode(!offlineMode)}
              className={`text-[9px] px-2 py-1 rounded-lg transition-all ${
                offlineMode
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-slate-900/50 text-gray-500 border border-slate-700/30 hover:text-gray-300"
              }`}
            >
              {offlineMode ? "🛰️ Offline" : "☁️ Cloud"}
            </button>

            {/* Expandable Dashboard */}
            {showDashboard && <MissionDashboard />}
          </div>

          {/* Right - Quick Vitals + Profile */}
          <div className="flex flex-col items-end gap-2">
            {/* Compact Vitals Strip */}
            <div
              className={`flex gap-4 bg-slate-950/60 backdrop-blur-xl px-4 py-2 rounded-2xl border ${
                emergencyMode ? "border-red-500/30" : "border-cyan-500/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">HR</span>
                <span
                  className={`text-sm font-mono ${
                    heartRate > 100 ? "text-red-400" : "text-cyan-300"
                  }`}
                >
                  {heartRate}
                </span>
              </div>
              <div className="w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">O₂</span>
                <span
                  className={`text-sm font-mono ${
                    o2Level < 95 ? "text-red-400" : "text-cyan-300"
                  }`}
                >
                  {o2Level}%
                </span>
              </div>
              <div className="w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">STRESS</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    stress === "HIGH"
                      ? "bg-red-500/20 text-red-400"
                      : stress === "MED"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {stress}
                </span>
              </div>
              {alerts.filter((a) => !a.acknowledged).length > 0 && (
                <>
                  <div className="w-px bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <span className="text-red-400 text-[10px] animate-pulse">
                      ⚠
                    </span>
                    <span className="text-[10px] text-red-400">
                      {alerts.filter((a) => !a.acknowledged).length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Profile Pill */}
            <div
              onClick={() => setIsSettingsOpen(true)}
              className="bg-slate-950/60 backdrop-blur-xl p-1.5 pr-4 rounded-full border border-cyan-500/20 cursor-pointer hover:border-cyan-500/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                {user?.userName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-cyan-100 font-medium">
                  {user?.userName}
                </span>
                <span className="text-[9px] text-cyan-300/60 uppercase tracking-wide">
                  Crew Member
                </span>
              </div>
            </div>
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Center - Vale Area (Virtual) */}

        {/* Bottom Bar: Interactions */}
        <div className="pointer-events-auto w-full max-w-xl mx-auto flex flex-col gap-4 mb-6">
          {/* Messages Area - Floating Bubbles */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              messages.length > 0 ? "h-[30vh] opacity-100" : "h-0 opacity-0"
            }`}
          >
            <div className="h-[30vh] overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent mask-gradient-b">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3.5 px-6 rounded-2xl text-[15px] font-light leading-relaxed backdrop-blur-md transition-all hover:scale-[1.01] ${
                      msg.role === "user"
                        ? "bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-br-none shadow-[0_4px_20px_rgba(37,99,235,0.1)]"
                        : msg.role === "system"
                        ? "bg-red-900/20 text-red-200 border border-red-500/30 text-xs font-mono"
                        : "bg-slate-900/40 text-gray-100 rounded-bl-none border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="p-4 bg-slate-900/40 rounded-2xl rounded-bl-none flex gap-1.5 items-center backdrop-blur-sm border border-white/5">
                    <span className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce [animation-duration:1s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce [animation-duration:1s] delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full animate-bounce [animation-duration:1s] delay-200"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Controls - Floating Glass Bar */}
          <form
            onSubmit={handleSendMessage}
            className="group relative flex gap-2 bg-slate-950/40 p-1.5 pl-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl hover:border-white/20 transition-all duration-300"
          >
            {/* Test Animation Button - Remove after testing */}
            <Button
              type="button"
              variant="ghost"
              className="rounded-full w-10 h-10 flex-shrink-0 transition-all duration-300 hover:bg-purple-500/20 text-purple-300/70 hover:text-purple-100"
              onClick={() => {
                const testAnims = [
                  "Happy",
                  "Angry",
                  "Laughing",
                  "Sad",
                  "Surprised",
                  "Thinking",
                ];
                const randomAnim =
                  testAnims[Math.floor(Math.random() * testAnims.length)];
                console.log("Test: Setting animation to", randomAnim);
                setAnimation(randomAnim);
              }}
            >
              <span className="text-xs">🎭</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={`rounded-full w-10 h-10 flex-shrink-0 transition-all duration-300 ${
                isEmotionDetectionEnabled
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
              onClick={toggleEmotionDetection}
              title={
                isEmotionDetectionEnabled
                  ? "Emotion Detection Active"
                  : "Enable Emotion Detection"
              }
            >
              <span className="text-xs">
                {isEmotionDetectionEnabled ? "😊" : "😐"}
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={`rounded-full w-10 h-10 flex-shrink-0 transition-all duration-300 hover:bg-white/5 ${
                isListening
                  ? "text-red-400 animate-pulse bg-red-500/10"
                  : "text-cyan-200/70 hover:text-cyan-100"
              }`}
              onClick={() => (isListening ? stopListening() : startListening())}
            >
              {isListening ? (
                <div className="w-3 h-3 bg-current rounded-sm shadow-[0_0_10px_currentColor]" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
            </Button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Talk to Vale..."
              className="flex-1 h-10 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-blue-200/30 text-base font-light"
              disabled={isProcessing}
            />

            <Button
              type="submit"
              className={`h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm tracking-wide transition-all ${
                !inputText.trim()
                  ? "opacity-0 w-0 px-0 overflow-hidden"
                  : "opacity-100 w-auto shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              }`}
              disabled={!inputText.trim() || isProcessing}
            >
              Send
            </Button>
          </form>

          {messages.length === 0 && (
            <div className="text-center">
              <p className="text-blue-200/30 text-xs font-light tracking-widest uppercase">
                System Online • Listening
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
