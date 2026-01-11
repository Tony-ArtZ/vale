"use client";

import React, { useState, useCallback } from "react";
import { useVitals } from "@/hooks/useVitals";
import { Button } from "./ui/Button";

type TabType = "vitals" | "health" | "sleep" | "cognitive" | "mood" | "alerts";

const MissionDashboard = () => {
  const {
    heartRate,
    o2Level,
    stress,
    moodHistory = [], // Fix: Default to empty array to prevent crash
    alerts,
    acknowledgeAlert,
    sleepLogs,
    lastSleepHours,
    lastCognitiveScore,
    missionDay,
    daysInIsolation,
    lastEarthContact,
    emergencyMode,
    setEmergencyMode,
    simulateAnomaly,
    // NEW
    behavioral,
    physicalHealth,
    isEmotionDetectionEnabled,
    toggleEmotionDetection,
  } = useVitals();

  const [activeTab, setActiveTab] = useState<TabType>("vitals");
  const [now] = useState(() => Date.now());

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  const formatTimeAgo = useCallback(
    (isoString: string) => {
      const diff = now - new Date(isoString).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    },
    [now]
  );

  return (
    <div className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-4 w-80 text-white shadow-[0_0_40px_rgba(0,200,255,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              emergencyMode ? "bg-red-500 animate-pulse" : "bg-cyan-400"
            }`}
          />
          <span className="text-xs font-mono text-cyan-300 tracking-widest">
            VALE MISSION CONTROL
          </span>
        </div>
        <span className="text-xs text-cyan-500/60 font-mono">
          DAY {missionDay}
        </span>
      </div>

      {/* Emergency Banner */}
      {emergencyMode && (
        <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-2 mb-3 animate-pulse">
          <div className="text-red-400 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span> EMERGENCY PROTOCOL ACTIVE
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-slate-900/50 rounded-lg p-1">
        {(
          [
            "vitals",
            "health",
            "sleep",
            "cognitive",
            "mood",
            "alerts",
          ] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[10px] py-1.5 rounded-md transition-all uppercase tracking-wider ${
              activeTab === tab
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "health"
              ? "📊"
              : tab === "mood"
              ? "😊"
              : tab === "alerts"
              ? "🔔"
              : tab.slice(0, 3)}
            {tab === "alerts" && unacknowledgedAlerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white px-1 rounded text-[8px]">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-50">
        {activeTab === "vitals" && (
          <div className="space-y-3">
            {/* Heart Rate */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Heart Rate
                </span>
                <span className="text-[10px] text-gray-500">BPM</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-light ${
                    heartRate > 100 ? "text-red-400" : "text-cyan-300"
                  }`}
                >
                  {heartRate}
                </span>
                <svg className="w-12 h-6 text-cyan-500/50" viewBox="0 0 50 20">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    points="0,10 10,10 15,2 20,18 25,10 30,10 35,5 40,15 45,10 50,10"
                  />
                </svg>
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                Resting: 60-80 | Elevated: 80-100 | High: 100+
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Oxygen Saturation
                </span>
                <span
                  className={`text-2xl font-light ${
                    o2Level < 95 ? "text-red-400" : "text-cyan-300"
                  }`}
                >
                  {o2Level}%
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    o2Level < 95 ? "bg-red-500" : "bg-cyan-400"
                  }`}
                  style={{ width: `${o2Level}%` }}
                />
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                Normal: 95-100% | Critical: &lt;94%
              </div>
            </div>

            {/* Stress */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Stress Index
                </span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
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
              <div className="flex gap-1 mt-2">
                {["LOW", "MED", "HIGH"].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1.5 rounded ${
                      stress === level
                        ? level === "HIGH"
                          ? "bg-red-500"
                          : level === "MED"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Demo Controls */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                className="flex-1 text-[10px] py-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30"
                onClick={simulateAnomaly}
              >
                Simulate Stress
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 text-[10px] py-1 ${
                  emergencyMode
                    ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                }`}
                onClick={() => setEmergencyMode(!emergencyMode)}
              >
                {emergencyMode ? "End Emergency" : "Emergency"}
              </Button>
            </div>
          </div>
        )}

        {/* NEW: Mood Tab */}
        {activeTab === "mood" && (
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Visual Emotion Sensor
              </span>
              <button
                onClick={toggleEmotionDetection}
                className={`text-[9px] px-2 py-1 rounded-full transition-all border ${
                  isEmotionDetectionEnabled
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-slate-800 text-gray-400 border-slate-600"
                }`}
              >
                {isEmotionDetectionEnabled ? "ACTIVE" : "DISABLED"}
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Emotional State History
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {moodHistory.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4 italic">
                    No emotional data collected yet.
                  </div>
                ) : (
                  moodHistory.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0"
                    >
                      <span className="text-gray-400 font-mono text-[9px]">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            log.emotion === "Happy" || log.emotion === "Neutral"
                              ? "text-green-400"
                              : log.emotion === "Thinking"
                              ? "text-blue-400"
                              : "text-amber-400"
                          }`}
                        >
                          {log.emotion}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full">
                          <div
                            className="h-full rounded-full bg-cyan-500/50"
                            style={{ width: `${(log.confidence || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Real-time Indicator */}
            {moodHistory.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex items-center gap-4">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Current Trend
                </div>
                <div className="flex-1 text-right text-xs text-cyan-300 font-bold">
                  {moodHistory[0].emotion} (
                  {Math.round((moodHistory[0].confidence || 0) * 100)}%)
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEW: Health/Behavioral Tab */}
        {activeTab === "health" && (
          <div className="space-y-3">
            {/* Physical Health */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Physical Health
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Exercise Today
                  </span>
                  <span className="text-xs text-cyan-300">
                    {physicalHealth.exerciseToday}m /{" "}
                    {physicalHealth.exerciseTarget}m
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-cyan-400 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (physicalHealth.exerciseToday /
                          physicalHealth.exerciseTarget) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Radiation (MTD)
                  </span>
                  <span
                    className={`text-xs ${
                      physicalHealth.radiationMTD > 50
                        ? "text-red-400"
                        : "text-cyan-300"
                    }`}
                  >
                    {physicalHealth.radiationMTD} mSv
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Hydration</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      physicalHealth.hydrationStatus === "Adequate"
                        ? "bg-green-500/20 text-green-400"
                        : physicalHealth.hydrationStatus === "Low"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {physicalHealth.hydrationStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Last Meal</span>
                  <span className="text-xs text-gray-400">
                    {physicalHealth.lastMealHours}h ago
                  </span>
                </div>
              </div>
            </div>

            {/* Behavioral Indicators */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Behavioral Analysis
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Voice Sentiment
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      behavioral.voiceSentiment === "Positive"
                        ? "bg-green-500/20 text-green-400"
                        : behavioral.voiceSentiment === "Neutral"
                        ? "bg-blue-500/20 text-blue-400"
                        : behavioral.voiceSentiment === "Negative"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {behavioral.voiceSentiment}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Social Interactions
                  </span>
                  <span className="text-xs text-cyan-300">
                    {behavioral.socialInteractions} today
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Exercise Compliance
                  </span>
                  <span
                    className={`text-xs ${
                      behavioral.exerciseCompliance < 50
                        ? "text-red-400"
                        : "text-cyan-300"
                    }`}
                  >
                    {behavioral.exerciseCompliance}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Sleep Pattern
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      behavioral.sleepRegularity === "Regular"
                        ? "bg-green-500/20 text-green-400"
                        : behavioral.sleepRegularity === "Irregular"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {behavioral.sleepRegularity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">
                    Communication
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      behavioral.communicationFrequency === "Normal"
                        ? "bg-green-500/20 text-green-400"
                        : behavioral.communicationFrequency === "Reduced"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {behavioral.communicationFrequency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sleep" && (
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Last Night
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-cyan-300">
                  {lastSleepHours}
                </span>
                <span className="text-sm text-gray-500">hours</span>
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                Recommended: 7-8 hours
              </div>
            </div>

            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              Recent Sleep Logs
            </div>
            {sleepLogs.slice(0, 5).map((log, i) => (
              <div
                key={i}
                className="bg-slate-900/30 rounded-lg p-2 flex justify-between items-center"
              >
                <span className="text-xs text-gray-400">{log.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cyan-300">
                    {log.hoursSlept}h
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      log.quality === "Excellent"
                        ? "bg-green-500/20 text-green-400"
                        : log.quality === "Good"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : log.quality === "Fair"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {log.quality}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "cognitive" && (
          <div className="space-y-3">
            {lastCognitiveScore && (
              <>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                    Reaction Time
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light text-cyan-300">
                      {lastCognitiveScore.reactionTime}
                    </span>
                    <span className="text-sm text-gray-500">ms</span>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1">
                    Baseline: 200-250ms | Fatigued: &gt;300ms
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Memory
                    </div>
                    <div className="text-2xl font-light text-cyan-300">
                      {lastCognitiveScore.memoryScore}%
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Focus
                    </div>
                    <div className="text-2xl font-light text-cyan-300">
                      {lastCognitiveScore.focusScore}%
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Cognitive Trend
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2 text-[10px] text-gray-400">
                  📊 Daily assessments track mental acuity for mission
                  readiness. Anomalies trigger Vale intervention protocols.
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <div className="text-2xl mb-2">✓</div>
                No active alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-2 border ${
                    alert.type === "CRITICAL"
                      ? "bg-red-900/20 border-red-500/30"
                      : alert.type === "WARNING"
                      ? "bg-yellow-900/20 border-yellow-500/30"
                      : "bg-blue-900/20 border-blue-500/30"
                  } ${alert.acknowledged ? "opacity-50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold ${
                          alert.type === "CRITICAL"
                            ? "text-red-400"
                            : alert.type === "WARNING"
                            ? "text-yellow-400"
                            : "text-blue-400"
                        }`}
                      >
                        {alert.type}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 mt-1">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer - Mission Stats */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2 text-[9px]">
        <div className="text-gray-500">
          Isolation:{" "}
          <span className="text-cyan-400">{daysInIsolation} days</span>
        </div>
        <div className="text-gray-500 text-right">
          Earth Contact:{" "}
          <span className="text-cyan-400">
            {formatTimeAgo(lastEarthContact)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MissionDashboard;
