import { create } from 'zustand';
import * as THREE from 'three';

interface CityCollisionStore {
  boxes: THREE.Box3[];
  setBoxes: (b: THREE.Box3[]) => void;
  built: boolean;
  setBuilt: (v: boolean) => void;
}

export const useCityCollisionStore = create<CityCollisionStore>((set) => ({
  boxes: [],
  built: false,
  setBoxes: (b) => set({ boxes: b }),
  setBuilt: (v) => set({ built: v }),
}));