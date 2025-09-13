'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCityStore } from '@stores';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Lightweight hidden warm-up to push textures & shaders to GPU before city scene mount
const CITY_PATH = 'models/city/scene.gltf';

const CityWarmup = () => {
  const ready = useCityStore(s => s.cityReady);
  const injectedRef = useRef(false);
  const { scene, gl } = useThree();
  const gltf = useGLTF(CITY_PATH);

  useEffect(() => {
    if (!ready || injectedRef.current) return;
    injectedRef.current = true;

    // Clone (avoid mutating original)
    const clone = gltf.scene.clone(true);
    clone.visible = false;              // invisible but still traversed
    clone.name = '__city_warmup__';
    scene.add(clone);

    // Normalize materials / mark for compile
    const mats = new Set<THREE.Material>();
    clone.traverse(o => {
      if ((o as any).isMesh) {
        const m = (o as any).material;
        if (Array.isArray(m)) m.forEach(mm => mats.add(mm));
        else mats.add(m);
      }
    });

    mats.forEach((m: any) => {
      m.side = THREE.FrontSide;
      m.transparent = false;
      m.needsUpdate = true;
    });

    // Schedule compile across a few frames
    let frameCount = 0;
    const compileSteps = Array.from(mats);

    const dispose = () => {
      // Keep clone (optional). Remove if you want to free memory:
      // scene.remove(clone);
    };

    const stepCompile = () => {
      if (frameCount < compileSteps.length) {
        // Force a trivial render to upload texture
        gl.compile(scene, new THREE.PerspectiveCamera());
      }
      frameCount++;
      if (frameCount > compileSteps.length + 5) {
        dispose();
      }
    };

    (clone as any).__warmupStep = stepCompile;
  }, [ready, gltf, scene, gl]);

  // Per-frame run compile step while warming
  useFrame(() => {
    const warm = scene.getObjectByName('__city_warmup__') as any;
    if (warm && warm.__warmupStep) warm.__warmupStep();
  });

  return null;
};

export default CityWarmup;