'use client';

import { useGLTF } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';

// New preloads (GLB singles)
const GLB_URLS = [
  'models/onepiece.glb',
  'models/setup.glb',
  'models/sopranos.glb',
  'models/bb.glb',
  'models/mug1.glb',
  'models/mug2.glb',
  'models/arsenal.glb',
  'models/basketball.glb',
];

// OBJ sequences
const SONY_COUNT = 30;
const SONY_BASE = 'models/Sony/model_';

// Only run preloads on the client to avoid SSR import-time errors
if (typeof window !== 'undefined') {
  GLB_URLS.forEach((u) => useGLTF.preload(u));
  Array.from({ length: SONY_COUNT }, (_, i) => `${SONY_BASE}${i}.obj`).forEach((u) =>
    useLoader.preload(OBJLoader, u)
  );
}

const Preloader = () => null;

export default Preloader;