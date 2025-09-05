'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { useRef } from 'react';
import type { JSX } from 'react';

// Add appearAt prop so you can control when it shows
type TrainProps = JSX.IntrinsicElements['group'] & {
  appearAt?: number;   // normalized scroll offset [0..1]
};

const TrainModel = ({ scale: modelScale = 1, appearAt = 0.8, ...rest }: TrainProps) => {
  const gltf = useGLTF('models/train.glb');

  const rootRef = useRef<THREE.Group>(null);
  const lightsGroupRef = useRef<THREE.Group>(null);
  const lightRefs = useRef<THREE.PointLight[]>([]);
  const { camera } = useThree();
  const data = useScroll();

  useFrame(() => {
    // Show only after appearAt
    if (rootRef.current) {
      const offset = data.offset ?? 0;
      rootRef.current.visible = offset >= appearAt;
    }

    if (!lightsGroupRef.current) return;

    // Interior light proximity
    const worldPos = new THREE.Vector3();
    lightsGroupRef.current.getWorldPosition(worldPos);
    const dz = Math.abs(camera.position.z - worldPos.z);
    const radius = 7;
    const k = 1 - Math.min(1, dz / radius);
    const smoothK = k * k * (3 - 2 * k);
    const base = 1.5;
    const extra = 8;

    lightRefs.current.forEach((l) => {
      if (l) l.intensity = base + extra * smoothK;
    });
  });

  return (
    <group ref={rootRef} {...rest} dispose={null}>
      <group ref={lightsGroupRef}>
        <pointLight ref={(el) => (lightRefs.current[0] = el!)} color="#fff6e0" position={[0, 0.6, -10]} distance={10} decay={2} castShadow />
        <pointLight ref={(el) => (lightRefs.current[1] = el!)} color="#fff6e0" position={[0, 0.6, -5]} distance={10} decay={2} castShadow />
        <pointLight ref={(el) => (lightRefs.current[2] = el!)} color="#fff6e0" position={[0, 0.6, -0.2]} distance={10} decay={2} castShadow />
      </group>

      <group scale={modelScale as any}>
        <primitive object={(gltf as any).scene ?? gltf} />
      </group>
    </group>
  );
};

useGLTF.preload('models/train.glb');

export default TrainModel;