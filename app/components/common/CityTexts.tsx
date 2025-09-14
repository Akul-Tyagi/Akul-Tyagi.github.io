'use client';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useRef } from 'react';

export interface CityTextConfig {
  id: string;
  text: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  fontSize?: number;
  color?: string;
  maxWidth?: number;
  floatAmplitude?: number;
  floatSpeed?: number;
  fadeDistance?: number; // optional distance-based fade
}

interface CityTextsProps {
  items: CityTextConfig[];
  commonFont?: string;
  anchorX?: 'center'|'left'|'right';
  anchorY?: 'middle'|'top'|'bottom';
}

const CityTexts = ({
  items,
  commonFont = '/soria-font.ttf',
  anchorX = 'center',
  anchorY = 'middle'
}: CityTextsProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    groupRef.current?.children.forEach((child: any) => {
      if (!child.userData._cfg) return;
      const cfg: CityTextConfig = child.userData._cfg;
      const amp = cfg.floatAmplitude ?? 0.9;
      const spd = cfg.floatSpeed ?? 0.35;
      child.position.y = cfg.position[1] + Math.sin(t * spd + child.position.x * 0.12) * amp;

      // Distance fade (optional)
      if (cfg.fadeDistance) {
        const dist = child.position.distanceTo(camera.position);
        const fadeStart = cfg.fadeDistance * 0.4;
        const fadeEnd = cfg.fadeDistance;
        const alpha = THREE.MathUtils.clamp(1 - (dist - fadeStart) / (fadeEnd - fadeStart), 0, 1);
        if (child.material) child.material.opacity = alpha;
        child.visible = alpha > 0.02;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {items.map(cfg => (
        <Text
          key={cfg.id}
          font={commonFont}
          fontSize={cfg.fontSize ?? 6}
          maxWidth={cfg.maxWidth}
          color={cfg.color ?? '#d6e4ff'}
          anchorX={anchorX}
          anchorY={anchorY}
          position={[...cfg.position]}
          rotation={cfg.rotation ? [...cfg.rotation] as any : undefined}
          fillOpacity={1}
          material-transparent
          material-toneMapped={false}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = ''; }}
          userData={{ _cfg: cfg }}
        >
          {cfg.text}
        </Text>
      ))}
    </group>
  );
};

export default CityTexts;