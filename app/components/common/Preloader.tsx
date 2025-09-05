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
  'models/ps5.glb',
  'models/xm5.glb',
  'models/train.glb'
];

// Only run preloads on the client to avoid SSR import-time errors
if (typeof window !== 'undefined') {
  GLB_URLS.forEach((u) => useGLTF.preload(u));
}

const Preloader = () => null;

export default Preloader;