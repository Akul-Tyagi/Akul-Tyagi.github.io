import { create } from 'zustand';

interface VideoStore {
  isVideoPlaying: boolean;
  hasVideoPlayed: boolean;
  videoSrc: string | null; // blob URL or fallback path
  setVideoPlaying: (playing: boolean) => void;
  setVideoPlayed: (played: boolean) => void;
  setVideoSrc: (src: string | null) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  isVideoPlaying: false,
  hasVideoPlayed: false,
  videoSrc: null,
  setVideoPlaying: (playing) => set({ isVideoPlaying: playing }),
  setVideoPlayed: (played) => set({ hasVideoPlayed: played }),
  setVideoSrc: (src) => set({ videoSrc: src }),
}));