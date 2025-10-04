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
  font?: string;
}

interface CityTextsProps {
  items: CityTextConfig[];
  commonFont?: string;
  anchorX?: 'center'|'left'|'right';
  anchorY?: 'middle'|'top'|'bottom';
}

const CityTexts = ({
  items,
  commonFont = '/ruigslay.otf',
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
    });
  });

  return (
    <group ref={groupRef}>
      {items.map(cfg => (
        <Text
          key={cfg.id}
          font={cfg.font ?? commonFont}
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