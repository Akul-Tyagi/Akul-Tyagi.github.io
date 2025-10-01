import { create } from 'zustand';

type BootPhase = 'idle' | 'loading' | 'compiling' | 'ready';

interface BootStore {
  phase: BootPhase;
  progress: number;        // 0..100 (aggregate)
  detail: string;          // current step label
  setPhase: (p: BootPhase) => void;
  setProgress: (p: number, detail?: string) => void;
  markReady: () => void;
}

export const useBootStore = create<BootStore>((set) => ({
  phase: 'idle',
  progress: 0,
  detail: 'Starting',
  setPhase: (phase) => set({ phase }),
  setProgress: (progress, detail) => set((s) => ({
    progress: Math.min(100, progress),
    detail: detail ?? s.detail
  })),
  markReady: () => set({ phase: 'ready', progress: 100, detail: 'Ready' }),
}));