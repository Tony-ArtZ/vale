import { create } from "zustand";

export interface VitalReading {
  heartRate: number;
  o2Level: number;
  stress: "LOW" | "MED" | "HIGH";
  timestamp: number;
}

export interface Alert {
  id: string;
  type: "WARNING" | "CRITICAL" | "INFO";
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface SleepLog {
  date: string;
  hoursSlept: number;
  quality: "Poor" | "Fair" | "Good" | "Excellent";
  notes?: string;
}

export interface CognitiveScore {
  date: string;
  reactionTime: number; // ms
  memoryScore: number; // 0-100
  focusScore: number; // 0-100
}

export interface MoodLog {
  timestamp: number;
  emotion: string;
  confidence: number;
}

// NEW: Behavioral indicators
export interface BehavioralIndicators {
  voiceSentiment: "Positive" | "Neutral" | "Negative" | "Stressed";
  socialInteractions: number; // today
  exerciseCompliance: number; // percentage
  sleepRegularity: "Regular" | "Irregular" | "Disrupted";
  communicationFrequency: "Normal" | "Reduced" | "Withdrawn";
}

// NEW: Physical health beyond vitals
export interface PhysicalHealth {
  exerciseToday: number; // minutes
  exerciseTarget: number; // minutes
  radiationMTD: number; // mSv month-to-date
  hydrationStatus: "Adequate" | "Low" | "Critical";
  lastMealHours: number;
}

interface VitalsState {
  // Current vitals
  heartRate: number;
  o2Level: number;
  stress: "LOW" | "MED" | "HIGH";

  // History (last 24 readings)
  vitalsHistory: VitalReading[];

  // Alerts
  alerts: Alert[];

  // Sleep tracking
  sleepLogs: SleepLog[];
  lastSleepHours: number;

  // Cognitive assessment
  cognitiveScores: CognitiveScore[];
  lastCognitiveScore: CognitiveScore | null;

  // Mood tracking
  moodHistory: MoodLog[];

  // NEW: Behavioral indicators
  behavioral: BehavioralIndicators;

  // NEW: Physical health
  physicalHealth: PhysicalHealth;

  // Mission stats
  missionDay: number;
  daysInIsolation: number;
  lastEarthContact: string;

  // Emergency mode
  emergencyMode: boolean;

  // Settings
  isEmotionDetectionEnabled: boolean;

  // Actions
  setVitals: (
    heartRate: number,
    o2Level: number,
    stress: "LOW" | "MED" | "HIGH"
  ) => void;
  addAlert: (type: Alert["type"], message: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  logSleep: (
    hours: number,
    quality: SleepLog["quality"],
    notes?: string
  ) => void;
  logCognitive: (
    reactionTime: number,
    memoryScore: number,
    focusScore: number
  ) => void;
  logMood: (emotion: string, confidence: number) => void;
  setEmergencyMode: (mode: boolean) => void;
  toggleEmotionDetection: () => void;
  simulateAnomaly: () => void;
  // NEW actions
  updateBehavioral: (indicators: Partial<BehavioralIndicators>) => void;
  updatePhysicalHealth: (health: Partial<PhysicalHealth>) => void;
  logExercise: (minutes: number) => void;
}

export const useVitalsStore = create<VitalsState>((set, get) => ({
  // Current vitals
  heartRate: 72,
  o2Level: 98,
  stress: "LOW",

  // History
  vitalsHistory: [],

  // Alerts
  alerts: [],

  // Sleep
  sleepLogs: [
    { date: "2026-01-10", hoursSlept: 7.5, quality: "Good" },
    { date: "2026-01-09", hoursSlept: 6.2, quality: "Fair" },
    { date: "2026-01-08", hoursSlept: 8.0, quality: "Excellent" },
  ],
  lastSleepHours: 7.5,

  // Cognitive
  cognitiveScores: [
    { date: "2026-01-10", reactionTime: 245, memoryScore: 92, focusScore: 88 },
    { date: "2026-01-09", reactionTime: 268, memoryScore: 88, focusScore: 82 },
  ],
  lastCognitiveScore: {
    date: "2026-01-10",
    reactionTime: 245,
    memoryScore: 92,
    focusScore: 88,
  },

  moodHistory: [],

  // NEW: Behavioral indicators
  behavioral: {
    voiceSentiment: "Neutral",
    socialInteractions: 3,
    exerciseCompliance: 85,
    sleepRegularity: "Regular",
    communicationFrequency: "Normal",
  },

  // NEW: Physical health
  physicalHealth: {
    exerciseToday: 95,
    exerciseTarget: 120,
    radiationMTD: 12.3,
    hydrationStatus: "Adequate",
    lastMealHours: 2.5,
  },

  // Mission
  missionDay: 127,
  daysInIsolation: 45,
  lastEarthContact: "2026-01-10T14:30:00Z",

  // Emergency
  emergencyMode: false,

  // Settings
  isEmotionDetectionEnabled: false,

  // Actions
  setVitals: (heartRate, o2Level, stress) => {
    const state = get();
    const newReading: VitalReading = {
      heartRate,
      o2Level,
      stress,
      timestamp: Date.now(),
    };

    // Keep last 24 readings
    const history = [...state.vitalsHistory, newReading].slice(-24);

    // Auto-generate alerts based on vitals
    if (heartRate > 110 && stress === "HIGH") {
      get().addAlert(
        "WARNING",
        `Elevated heart rate (${heartRate} BPM) with high stress detected`
      );
    }
    if (o2Level < 95) {
      get().addAlert(
        "CRITICAL",
        `Low oxygen saturation: ${o2Level}%. Check environmental systems.`
      );
    }

    set({ heartRate, o2Level, stress, vitalsHistory: history });
  },

  addAlert: (type, message) => {
    const alert: Alert = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: Date.now(),
      acknowledged: false,
    };
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 10) }));
  },

  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  clearAlerts: () => set({ alerts: [] }),

  logSleep: (hours, quality, notes) => {
    const log: SleepLog = {
      date: new Date().toISOString().split("T")[0],
      hoursSlept: hours,
      quality,
      notes,
    };
    set((state) => ({
      sleepLogs: [log, ...state.sleepLogs].slice(0, 30),
      lastSleepHours: hours,
    }));
  },

  logCognitive: (reactionTime, memoryScore, focusScore) => {
    const score: CognitiveScore = {
      date: new Date().toISOString().split("T")[0],
      reactionTime,
      memoryScore,
      focusScore,
    };
    set((state) => ({
      cognitiveScores: [score, ...state.cognitiveScores].slice(0, 30),
      lastCognitiveScore: score,
    }));
  },

  logMood: (emotion, confidence) => {
    const log: MoodLog = {
      timestamp: Date.now(),
      emotion,
      confidence,
    };
    set((state) => ({
      moodHistory: [log, ...state.moodHistory].slice(0, 50),
      behavioral: {
        ...state.behavioral,
        voiceSentiment:
          emotion === "Sad" || emotion === "Angry" || emotion === "Fear"
            ? "Negative"
            : emotion === "Happy"
            ? "Positive"
            : "Neutral",
      },
      stress:
        emotion === "Angry" || emotion === "Fear"
          ? "HIGH"
          : emotion === "Sad"
          ? "MED"
          : state.stress,
    }));
  },

  setEmergencyMode: (mode) => {
    set({ emergencyMode: mode });
    if (mode) {
      get().addAlert(
        "CRITICAL",
        "EMERGENCY MODE ACTIVATED - All crew protocols engaged"
      );
    }
  },

  toggleEmotionDetection: () =>
    set((state) => ({
      isEmotionDetectionEnabled: !state.isEmotionDetectionEnabled,
    })),

  simulateAnomaly: () => {
    // Simulate a stress event for demo purposes
    set({
      heartRate: 118,
      stress: "HIGH",
      behavioral: {
        voiceSentiment: "Stressed",
        socialInteractions: 1,
        exerciseCompliance: 45,
        sleepRegularity: "Disrupted",
        communicationFrequency: "Reduced",
      },
    });
    get().addAlert(
      "WARNING",
      "Stress anomaly detected. Vale is assessing your condition."
    );
  },

  // NEW: Update behavioral indicators
  updateBehavioral: (indicators) => {
    set((state) => ({
      behavioral: { ...state.behavioral, ...indicators },
    }));
  },

  // NEW: Update physical health
  updatePhysicalHealth: (health) => {
    set((state) => ({
      physicalHealth: { ...state.physicalHealth, ...health },
    }));
  },

  // NEW: Log exercise
  logExercise: (minutes) => {
    set((state) => ({
      physicalHealth: {
        ...state.physicalHealth,
        exerciseToday: state.physicalHealth.exerciseToday + minutes,
      },
    }));
    // Update compliance
    const state = get();
    const compliance = Math.min(
      100,
      Math.round(
        (state.physicalHealth.exerciseToday /
          state.physicalHealth.exerciseTarget) *
          100
      )
    );
    set((s) => ({
      behavioral: { ...s.behavioral, exerciseCompliance: compliance },
    }));
  },
}));
