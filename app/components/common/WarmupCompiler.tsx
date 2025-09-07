
'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';

const WarmupCompiler = () => {
  const { gl, scene, camera } = useThree();
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100) {
      requestAnimationFrame(() => {
        try {
          // Prefer softer, cheaper shadow filtering
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          // Build programs and a first shadow map once up-front
          gl.compile(scene, camera);
          gl.shadowMap.needsUpdate = true;
          // Freeze shadow map; camera movement does not require updates
          gl.shadowMap.autoUpdate = false;
        } catch {}
      });
    }
  }, [progress, gl, scene, camera]);

  return null;
};

export default WarmupCompiler;