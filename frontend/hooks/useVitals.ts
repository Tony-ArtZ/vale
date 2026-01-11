import { useVitalsStore } from "../store/useVitalsStore";
import { useEffect } from "react";

export const useVitals = () => {
  const {
    heartRate,
    o2Level,
    stress,
    setVitals,
    vitalsHistory,
    alerts,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    sleepLogs,
    lastSleepHours,
    cognitiveScores,
    lastCognitiveScore,
    logSleep,
    logCognitive,
    missionDay,
    daysInIsolation,
    lastEarthContact,
    emergencyMode,
    setEmergencyMode,
    simulateAnomaly,
    // NEW
    behavioral,
    physicalHealth,
    updateBehavioral,
    updatePhysicalHealth,
    logExercise,
    isEmotionDetectionEnabled,
    toggleEmotionDetection,
    moodHistory,
    logMood,
  } = useVitalsStore();

  // Simulate real-time vitals from ESP32/sensors
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small fluctuations in vitals
      const baseHR = 72;
      const variance = Math.random() * 10 - 5; // -5 to +5
      const newHR = Math.round(
        baseHR + variance + (stress === "HIGH" ? 20 : stress === "MED" ? 10 : 0)
      );

      const baseO2 = 98;
      const o2Variance = Math.random() * 2 - 1; // -1 to +1
      const newO2 = Math.round(baseO2 + o2Variance);

      // Only update if not in manual demo mode (significant change)
      if (Math.abs(newHR - heartRate) < 15) {
        setVitals(newHR, Math.max(94, Math.min(100, newO2)), stress);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [stress, heartRate, setVitals]);

  return {
    heartRate,
    o2Level,
    stress,
    vitalsHistory,
    alerts,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    sleepLogs,
    lastSleepHours,
    cognitiveScores,
    lastCognitiveScore,
    logSleep,
    logCognitive,
    missionDay,
    daysInIsolation,
    lastEarthContact,
    emergencyMode,
    setEmergencyMode,
    simulateAnomaly,
    // NEW
    behavioral,
    physicalHealth,
    updateBehavioral,
    updatePhysicalHealth,
    logExercise,
    isEmotionDetectionEnabled,
    toggleEmotionDetection,
    moodHistory,
    logMood,
  };
};
