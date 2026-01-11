import { create } from "zustand";

export interface InterruptData {
  origin: string;
  details: string;
  userName: string;
  userId: string;
  timestamp: string;
}

interface InterruptState {
  // Current interrupt being processed
  currentInterrupt: InterruptData | null;
  isProcessing: boolean;
  isVisible: boolean;
  aiResponse: string | null;

  // Actions
  setInterrupt: (data: InterruptData) => void;
  setProcessing: (processing: boolean) => void;
  setResponse: (response: string) => void;
  clearInterrupt: () => void;
  showInterrupt: () => void;
  hideInterrupt: () => void;
}

export const useInterruptStore = create<InterruptState>((set) => ({
  currentInterrupt: null,
  isProcessing: false,
  isVisible: false,
  aiResponse: null,

  setInterrupt: (data) =>
    set({
      currentInterrupt: data,
      isVisible: true,
      isProcessing: true,
      aiResponse: null,
    }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  setResponse: (response) =>
    set({
      aiResponse: response,
      isProcessing: false,
    }),

  clearInterrupt: () =>
    set({
      currentInterrupt: null,
      isProcessing: false,
      isVisible: false,
      aiResponse: null,
    }),

  showInterrupt: () => set({ isVisible: true }),
  hideInterrupt: () => set({ isVisible: false }),
}));
