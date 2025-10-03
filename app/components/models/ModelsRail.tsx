'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Float, Text, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { JSX } from 'react';
import { li } from 'framer-motion/client';

type ItemBase = {
  id: string;
  label?: string;
  hoverText?: string;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  textPosition?: [number, number, number];
  textRotation?: [number, number, number];
  floatSpeed?: number;
  floatIntensity?: number;
  rotationIntensity?: number;
  hoverScale?: number;
  linkId?: string;
  linkScale?: number;
  scaleDamp?: number;
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
    const radius = 2;
    const t = THREE.MathUtils.clamp(1 - Math.abs(camZ - targetZ) / radius, 0, 1);
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

const labelFont = './cv.otf';

const itemDefaults = {
  scale: [1, 1, 1] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  textPosition: [0, 1, 0] as [number, number, number],
  textRotation: [0, 0, 0] as [number, number, number],
  floatSpeed: 1.6,
  floatIntensity: 0.8,
  rotationIntensity: 0.25,
  hoverScale: 1.15,
  scaleDamp: 7.5,
};

const ModelLightRig = ({ scaleFactor = 1 }: { scaleFactor?: number }) => {
  const s = Math.max(0.5, scaleFactor);
  return (
    <>
      <pointLight
        intensity={7}
        distance={20 * s}
        decay={1.5}
        position={[2.5, 2.5, 2]}
        color="#ffffff"
      />
    </>
  );
};

// Global registry for linked hover state
const linkRegistry = new Map<string, { activeCount: number }>();

const FloatingModel = ({ item }: { item: Item }) => {
  const groupRef = useRef<THREE.Group>(null);
  const scaleWrapRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const scaleRef = useRef(1);
  const prevSelfActiveRef = useRef(false);
  const textOpacity = useRef(0);
  const textScale = useRef(0.5);
  const textY = useRef(0);
  
  // Debounce hover state changes
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  const scale = item.scale ?? itemDefaults.scale;
  const rotation = item.rotation ?? itemDefaults.rotation;
  const textPosition = item.textPosition ?? itemDefaults.textPosition;
  const textRotation = item.textRotation ?? itemDefaults.textRotation;
  const floatSpeed = item.floatSpeed ?? itemDefaults.floatSpeed;
  const floatIntensity = item.floatIntensity ?? itemDefaults.floatIntensity;
  const rotationIntensity = item.rotationIntensity ?? itemDefaults.rotationIntensity;
  const hoverScale = item.hoverScale ?? itemDefaults.hoverScale;
  const linkScale = item.linkScale ?? hoverScale;
  const scaleDamp = item.scaleDamp ?? itemDefaults.scaleDamp;
  const scaleFactor = Math.max(...scale);

  // Ensure registry bucket exists for linkId
  useEffect(() => {
    if (!item.linkId) return;
    if (!linkRegistry.has(item.linkId)) {
      linkRegistry.set(item.linkId, { activeCount: 0 });
    }
    return () => {
      const bucket = linkRegistry.get(item.linkId!);
      if (!bucket) return;
      if (prevSelfActiveRef.current) {
        bucket.activeCount = Math.max(0, bucket.activeCount - 1);
      }
      if (bucket.activeCount <= 0) {
        linkRegistry.delete(item.linkId!);
      }
    };
  }, [item.linkId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useFrame((_, dt) => {
  const selfActive = hovered;

  // Update registry when self-active state changes
  if (item.linkId && selfActive !== prevSelfActiveRef.current) {
    const bucket = linkRegistry.get(item.linkId) ?? { activeCount: 0 };
    bucket.activeCount += selfActive ? 1 : -1;
    bucket.activeCount = Math.max(0, bucket.activeCount);
    linkRegistry.set(item.linkId, bucket);
    prevSelfActiveRef.current = selfActive;
  }

  const linkedActive = item.linkId
    ? (linkRegistry.get(item.linkId)?.activeCount ?? 0) > 0
    : selfActive;

  const target = linkedActive
    ? (item.linkId ? linkScale : hoverScale)
    : 1.0;

  scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, scaleDamp, dt);
  if (scaleWrapRef.current) {
    scaleWrapRef.current.scale.setScalar(scaleRef.current);
  }

  // Smooth text animations
  const textTarget = hovered ? 1 : 0;
  textOpacity.current = THREE.MathUtils.damp(textOpacity.current, textTarget, 8, dt);
  
  // Scale with elastic ease
  const scaleTarget = hovered ? 1 : 0.5;
  textScale.current = THREE.MathUtils.damp(textScale.current, scaleTarget, 10, dt);
  
  // Slide up animation
  const yTarget = hovered ? 0 : -0.3;
  textY.current = THREE.MathUtils.damp(textY.current, yTarget, 9, dt);

  // Apply text transformations
  if (textRef.current) {
    textRef.current.material.opacity = textOpacity.current;
    textRef.current.scale.setScalar(textScale.current);
    textRef.current.position.set(
      textPosition[0], 
      textPosition[1] + textY.current,
      textPosition[2]
    );
    // Completely hide text when opacity is near 0
    textRef.current.visible = textOpacity.current > 0.1;  // Add this line
  }
});

  const handlePointerOver = (e: any) => {
  e.stopPropagation();
  
  // Clear any pending timeout
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
  }
  
  isHoveringRef.current = true;
  
  // Immediate hover activation
  if (!hovered) {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }
};

const handlePointerOut = (e: any) => {
  e.stopPropagation();
  
  isHoveringRef.current = false;
  
  // Add a small delay before deactivating to prevent jitter
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
  }
  
  hoverTimeoutRef.current = setTimeout(() => {
    if (!isHoveringRef.current) {
      setHovered(false);
      document.body.style.cursor = '';
    }
  }, 50); // 50ms debounce
};

  const textProps = {
    font: labelFont,
    fontSize: 0.7,
    color: 'white',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    letterSpacing: -0.05,
    lineHeight: 1,
  };

  return (
    <group
      ref={groupRef}
      position={item.position}
      rotation={rotation}
      frustumCulled={false}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <ModelLightRig scaleFactor={scaleFactor} />
      
      <group ref={scaleWrapRef}>
        <Float
          speed={floatSpeed}
          floatIntensity={floatIntensity}
          rotationIntensity={rotationIntensity}
        >
          <group scale={scale}>
            {item.kind === 'glb' && <GlbModel url={item.url} />}
          </group>
        </Float>
      </group>

      {/* Hover text popup with smooth animations */}
      {item.hoverText && (
        <Text
          ref={textRef}
          {...textProps}
          position={textPosition}
          rotation={textRotation}
          material-transparent
          material-opacity={0}
          visible={false}
        >
          {item.hoverText}
        </Text>
      )}
    </group>
  );
};

const ModelsRail = () => {
  const items: Item[] = [
    {
      kind: 'glb',
      id: 'op',
      url: '/models/onepiece.glb',
      hoverText: 'The ONE PIECE is Real!',
      position: [4, -17, 1],
      scale: [1.5, 1.5, 1.5],
      rotation: [-1.6, -0.8, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      rotationIntensity: 0.3,
      hoverScale: 1.2,
      scaleDamp: 6,
      textPosition: [7, 5, 0],
      textRotation: [0, 0, -0.05],  
    },
    {
      kind: 'glb',
      id: 'setup',
      url: '/models/setup.glb',
      hoverText: 'I Spend More Time On My Setup Than...\n          aaghh Wait My Back Hurts.',
      position: [5, -43, 2.8],
      scale: [1, 1, 1],
      rotation: [4.9, 4.2, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.15,
      textPosition: [0, 7, -0.5],
      textRotation: [0, 1.7, 0],
    },
    {
      kind: 'glb',
      id: 'sopranos',
      url: '/models/sopranos.glb',
      hoverText: 'Oh, With All Due Respect\nI Fricken Love SOPRANOS',
      position: [-6, 0, 4.3],
      scale: [0.03, 0.03, 0.03],
      rotation: [4.5, -5.4, 0.7],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.18,
      textPosition: [10.5, 6.2,-4.3],
      textRotation: [0,0,-0.55],
    },
    {
      kind: 'glb',
      id: 'bb',
      url: '/models/bb.glb',
      hoverText: 'You Know The Business and I Know How To Code \n I Am Thinking Maybe You and I Could Partner Up',
      position: [8, -26, 1],
      scale: [1.7, 1.7, 1.7],
      rotation: [4.5, 0.3, -0.1],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.16,
      textPosition: [-2.5, 5, 1],
      textRotation: [0, -0.5, 0],
    },
    {
      kind: 'glb',
      id: 'mug1',
      url: '/models/mug1.glb',
      hoverText: 'Kinda Vibe I Bring To The Table',
      position: [-5, -49, 2],
      scale: [20, 20, 20],
      rotation: [4.8, 1, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.12,
      textPosition: [0, 6.4, 0],
      textRotation: [0, -0.8, 0],
      linkId: 'mugs',
    },
    {
      kind: 'glb',
      id: 'mug2',
      url: '/models/mug2.glb',
      hoverText: 'Better Call Saul(Me)! IYKYK',
      position: [-5.7, -45.5, 1.8],
      scale: [1.2, 1.2, 1.2],
      rotation: [4.8, 2.3, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.12,
      textPosition: [0, 5.5, 0],
      textRotation: [0, -2.2, 0],
      linkId: 'mugs',
    },
    {
      kind: 'glb',
      id: 'ps5',
      url: '/models/ps5.glb',
      hoverText: 'If Not Coding You Will Find Me \n With One of These Badboys.',
      position: [-5.5, -38, 2.5],
      scale: [0.016, 0.016, 0.016],
      rotation: [-1.6, 1.4, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.2,
      textPosition: [-1.2, 7.1, 0],
      textRotation: [0, -1.2, 0],
      linkId: 'psxm',
    },
    {
      kind: 'glb',
      id: 'xm5',
      url: '/models/xm5.glb',
      hoverText: 'How Do People Even\nLive Without Music?',
      position: [-5.3, -30, 3.5],
      scale: [1.6, 1.6, 1.6],
      rotation: [4.8, 2, -0.3],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.17,
      textPosition: [5, 8, 0],
      textRotation: [0, -1.7, 0],
      linkId: 'psxm',
    },
    {
      kind: 'glb',
      id: 'arsenal',
      url: '/models/arsenal.glb',
      hoverText: ' North London Forever...COYG!\nMartin Ødegaard Is My Captain',
      position: [-6.5, -23, 0.6],
      scale: [5, 5, 5],
      rotation: [-1.7, 0.5, 0],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      hoverScale: 1.14,
      textPosition: [-0.5, 4.7, 3],
      textRotation: [0, -0.2, 0.05],
    },
    {
      kind: 'glb',
      id: 'basketball',
      url: '/models/basketball.glb',
      hoverText: 'You Cannot Win If You Are Against Me On The Court',
      position: [6, -55, 0],
      scale: [1.5, 1.5, 1.5],
      rotation: [-1, 0.7, 5.5],
      floatSpeed: 2.5,
      floatIntensity: 3.4,
      rotationIntensity: 0.4,
      hoverScale: 1.25,
      textPosition: [0, 4, -2],
      textRotation: [0, -1, 0.55],
    },
  ];

  return (
    <group>
      {items.map((item) => (
        <ApproachRotator key={item.id} targetZ={item.position[2]}>
          <FloatingModel item={item} />
        </ApproachRotator>
      ))}
    </group>
  );
};

export default ModelsRail;