import { create } from 'zustand';

interface CityStore {
  cityReady: boolean;          // network + parse (from Preloader)
  cityGPUCompiled: boolean;    // second canvas GPU programs compiled
  setCityReady: (v: boolean) => void;
  setCityGPUCompiled: (v: boolean) => void;
}

export const useCityStore = create<CityStore>((set) => ({
  cityReady: false,
  cityGPUCompiled: false,
  setCityReady: (v) => set({ cityReady: v }),
  setCityGPUCompiled: (v) => set({ cityGPUCompiled: v }),
}));