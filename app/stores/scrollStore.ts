// ...existing code...
import { create } from 'zustand';

const noop = () => {};

interface ScrollStore {
  scrollProgress: number;
  maxProgress: number;
  resetEpoch: number;
  epochStartedAt: number;
  guard: boolean;                       // guard period after a reset (ignore stale high offsets)
  setScrollProgress: (progress: number) => void;
  resetScrollToStart: () => void;       // injected by ScrollWrapper
  setScrollResetter: (fn: (() => void) | null) => void;
  beginEpochReset: () => void;          // call BEFORE or right around DOM scroll reset
}

export const useScrollStore = create<ScrollStore>((set, get) => ({
  scrollProgress: 0,
  maxProgress: 0,
  resetEpoch: 0,
  epochStartedAt: Date.now(),
  guard: false,
  resetScrollToStart: noop,
  setScrollProgress: (progress) =>
    set((s) => ({
      scrollProgress: progress,
      maxProgress: progress > s.maxProgress ? progress : s.maxProgress,
    })),
  setScrollResetter: (fn) =>
    set(() => ({ resetScrollToStart: fn ?? noop })),
  beginEpochReset: () => {
    const next = get().resetEpoch + 1;
    set({
      resetEpoch: next,
      epochStartedAt: Date.now(),
      guard: true,
      scrollProgress: 0,
      maxProgress: 0,
    });
    // Clear guard after a short settling window (stale offsets flushed)
    setTimeout(() => {
      // Only clear if still in this epoch
      if (get().resetEpoch === next) {
        set({ guard: false });
      }
    }, 450); // 3–6 frames + safety
  },
}));