import { create } from 'zustand';

interface AudioStore {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  volume: number;
  audioReady: boolean;
  mutedByUser: boolean;
  setAudio: (audio: HTMLAudioElement) => void;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  ensurePlaying: () => Promise<void>;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  audio: null,
  isPlaying: false,
  volume: 0.8,
  audioReady: false,
  mutedByUser: false,
  setAudio: (audio) => {
    const current = get().audio;
    if (current && current !== audio) {
      current.pause();
    }
    if (!audio) {
      set({ audio: null, audioReady: false, isPlaying: false });
      return;
    }
    audio.loop = true;
    audio.volume = get().volume;
    set({ audio, audioReady: true });
    if (!get().mutedByUser) {
      get().play().catch(() => {
        console.warn('Background audio play blocked');
      });
    }
  },
  play: async () => {
    const audio = get().audio;
    if (!audio) return;
    audio.loop = true;
    audio.volume = get().volume;
    try {
      await audio.play();
      set({ isPlaying: true, mutedByUser: false });
    } catch (err) {
      console.warn('Background audio play blocked', err);
      set({ isPlaying: false });
    }
  },
  ensurePlaying: async () => {
    const state = get();
    if (!state.audio || state.mutedByUser) return;
    if (state.isPlaying && !state.audio.paused) return;
    try {
      await state.play();
    } catch (err) {
      console.warn('Background audio resume blocked', err);
    }
  },
  pause: () => {
    const audio = get().audio;
    if (!audio) return;
    audio.pause();
    set({ isPlaying: false });
  },
  toggle: () => {
    const state = get();
    if (state.isPlaying) {
      state.pause();
      set({ mutedByUser: true });
    } else {
      set({ mutedByUser: false });
      state.play();
    }
  },
  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const audio = get().audio;
    if (audio) audio.volume = clamped;
    set({ volume: clamped });
  },
}));