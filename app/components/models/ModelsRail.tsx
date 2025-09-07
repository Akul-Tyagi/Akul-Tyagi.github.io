'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Text, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import type { JSX } from 'react';

type ItemBase = {
  id: string;
  label?: string;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  textOffset?: [number, number, number];
};

type GlbItem = ItemBase & {
  kind: 'glb';
  url: string;
};

type Item = GlbItem;

const ApproachRotator = ({ targetZ, children }: { targetZ: number; children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!ref.current) return;
    const camZ = camera.position.z;
    const radius = 2; // how far before/after the item we start/stop effect
    const t = THREE.MathUtils.clamp(1 - Math.abs(camZ - targetZ) / radius, 0, 1);
    // Subtle y-rotation when approaching, eased
    const targetRotY = 0.25 * (t * t);
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetRotY, 4, delta);
  });

  return <group ref={ref}>{children}</group>;
};

const GlbModel = ({ url, ...rest }: { url: string } & JSX.IntrinsicElements['group']) => {
  const gltf = useGLTF(url);
  return (
    <group {...rest} dispose={null}>
      <primitive object={(gltf as any).scene ?? gltf} />
    </group>
  );
};

const labelFont = './soria-font.ttf';

const itemDefaults = {
  scale: [1, 1, 1] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  textOffset: [0, 0.6, 0] as [number, number, number],
};

// Lights that do NOT inherit model scale.
// Distances auto-scale from the item’s scale so big/small models get consistent lighting.
const ModelLightRig = ({ scaleFactor = 1 }: { scaleFactor?: number }) => {
  const s = Math.max(0.5, scaleFactor);
  return (
    <>
      {/* Key light */}
      <pointLight
        intensity={7}
        distance={20 * s}
        decay={1.5}
        position={[2.5, 2.5, 2]}
        color="#ffffff"
      />
      {/* Fill light */}
      {/* <pointLight
        intensity={7}
        distance={12 * s}
        decay={1.5}
        position={[-2, 1.5, -1]}
        color="#ffffff"
      /> */}
    </>
  );
};

const ModelsRail = () => {
  // Place everything around the horse area: group at [0, -13, 5.6]
  // Camera z goes ~5 -> ~15; space items between z ~7..15 so we pass them smoothly
  const items: Item[] = [
    { kind: 'glb', id: 'op',        url: 'models/onepiece.glb',   label: 'ONE PIECE',     position: [4, -17, 1],  scale: [1.5,1.5,1.5], rotation: [-1.6, -0.8, 0] },
    { kind: 'glb', id: 'setup',     url: 'models/setup.glb',      label: 'SETUP',    position: [ 5, -43, 2.8],  scale: [1, 1, 1],     rotation: [4.9, 4.2, 0] },
    { kind: 'glb', id: 'sopranos',  url: 'models/sopranos.glb',   label: 'SOPRANOS',      position: [-6, 0, 4.3], scale:[0.03,0.03,0.03], rotation: [4.5, -5.4, 0.7] },
    { kind: 'glb', id: 'bb',        url: 'models/bb.glb',         label: 'BREAKING BAD',  position: [ 8, -26, 1], scale: [1.7, 1.7, 1.7], rotation: [4.5, 0.3, -0.1] },
    { kind: 'glb', id: 'mug1',      url: 'models/mug1.glb',       label: 'mug1',          position: [-5, -49, 2], scale: [20,20,20], rotation: [4.8, 1, 0] },
    { kind: 'glb', id: 'mug2',      url: 'models/mug2.glb',       label: 'mug2',          position: [-5.7, -45.5, 1.8], scale: [1.2,1.2,1.2], rotation: [4.8, 2.3, 0] },

    { kind: 'glb', id: 'ps5',       url: 'models/ps5.glb',        label: 'PS5',         position: [-5.5, -37, 2.5], scale: [0.016, 0.016, 0.016], rotation: [-1.6, 1.4, 0] },
    { kind: 'glb', id: 'xm5',       url: 'models/xm5.glb',        label: 'XM5',         position: [-5.85, -31,3.5], scale: [1.6, 1.6, 1.6], rotation: [4.8, 2, -0.3] },

    // Replace these with single GLBs
    { kind: 'glb', id: 'arsenal',   url: 'models/arsenal.glb',    label: 'ARSENAL',     position: [-6.5, -23, 0.6], scale: [5, 5, 5], rotation: [-1.7, 0.5, 0] },
    { kind: 'glb', id: 'basketball',url: 'models/basketball.glb', label: 'BASKETBALL',  position: [ 6, -55, 0],  scale: [1.5, 1.5, 1.5], rotation: [-1, 0.7,5.5] },
  ];

  const textProps = {
    font: labelFont,
    fontSize: 0.25,
    color: 'white',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
  };

  return (
    <group>
      {items.map((it) => {
        const scale = it.scale ?? itemDefaults.scale;
        const rotation = it.rotation ?? itemDefaults.rotation;
        const textOffset = it.textOffset ?? itemDefaults.textOffset;
        const [x, y, z] = it.position;
        const scaleFactor = Math.max(...scale);

        return (
          <ApproachRotator key={it.id} targetZ={z}>
            {/* Outer group: position/rotation; lights go here (no scale) */}
            <group position={[x, y, z]} rotation={rotation} frustumCulled={false}>
              <ModelLightRig scaleFactor={scaleFactor} />
              {/* Inner group: only scale the model so lights remain in world scale */}
              <group scale={scale}>
                {it.kind === 'glb' && <GlbModel url={it.url} />}
              </group>
              {/* Optional labels if you want them back:
              <Text {...textProps} position={[textOffset[0], textOffset[1], textOffset[2]]}>
                {it.label}
              </Text>
              */}
            </group>
          </ApproachRotator>
        );
      })}
    </group>
  );
};

export default ModelsRail;