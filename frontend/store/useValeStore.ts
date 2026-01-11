import { create } from "zustand";

export interface ValeState {
  currentAnimation: string;
  isSpeaking: boolean;
  viseme: string;
  expressions: Record<string, number>; // For morph targets
  setAnimation: (anim: string) => void;
  setSpeaking: (speaking: boolean) => void;
  setViseme: (viseme: string) => void;
  setExpression: (name: string, value: number) => void;
}

export const useValeStore = create<ValeState>((set) => ({
  currentAnimation: "Standing Idle",
  isSpeaking: false,
  viseme: "",
  expressions: {},
  setAnimation: (anim) => set({ currentAnimation: anim }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setViseme: (viseme) => set({ viseme }),
  setExpression: (name, value) =>
    set((state) => ({
      expressions: { ...state.expressions, [name]: value },
    })),
}));
