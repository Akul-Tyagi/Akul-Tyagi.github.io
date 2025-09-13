import { create } from 'zustand';

interface CityStore {
  cityReady: boolean;
  setCityReady: (v: boolean) => void;
}

export const useCityStore = create<CityStore>((set) => ({
  cityReady: false,
  setCityReady: (v) => set({ cityReady: v }),
}));