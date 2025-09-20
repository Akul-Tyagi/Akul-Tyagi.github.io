'use client';

import { Float, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';

type SocialFloatingGlbProps = JSX.IntrinsicElements['group'] & {
  url: string;
  href: string;
  scale?: number | [number, number, number];
  floatSpeed?: number;
  floatIntensity?: number;
  rotationIntensity?: number;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
};

const SocialFloatingGlb = ({
  url,
  href,
  scale = 1,
  floatSpeed = 1.6,
  floatIntensity = 0.8,
  rotationIntensity = 0.25,
  onInteractStart,
  onInteractEnd,
  ...rest
}: SocialFloatingGlbProps) => {
  const gltf = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const scaleWrapRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const aimHoverRef = useRef(false);
  const scaleRef = useRef(1);

  const { camera, raycaster, gl } = useThree();
  const ndc = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame((_, dt) => {
    const locked = document.pointerLockElement === gl.domElement;

    // Aim-hover while pointer-locked: cast from screen center
    let aimHover = false;
    if (locked && groupRef.current) {
      ndc.set(0, 0);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(groupRef.current, true);
      aimHover = hits.length > 0;
    }
    aimHoverRef.current = aimHover;

    const active = hovered || aimHover;
    const target = active ? 1.2 : 1.0; // subtle hover scale
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, 7.5, dt);
    if (scaleWrapRef.current) scaleWrapRef.current.scale.setScalar(scaleRef.current);
  });

  const openHref = () => window.open(href, '_blank', 'noopener,noreferrer');

  // Handle clicks while pointer-locked (from screen center)
  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      const locked = document.pointerLockElement === canvas;
      if (!locked) return; // normal mode handled by R3F onClick
      if (!groupRef.current) return;
      if (aimHoverRef.current) {
        try {
          onInteractStart?.();
          e.preventDefault();
          e.stopPropagation();
          (e as any).stopImmediatePropagation?.();
        } catch {}
        openHref();
        setTimeout(() => onInteractEnd?.(), 120);
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => canvas.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
  }, [gl, onInteractStart, onInteractEnd]);

  return (
    <group
      ref={groupRef}
      {...rest}
      frustumCulled={false}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (document.pointerLockElement !== gl.domElement) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onInteractStart?.();
        openHref();
        setTimeout(() => onInteractEnd?.(), 120);
      }}
      onPointerDown={(e) => {
        // prevent selection glitches and step impulse before we open
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        onInteractStart?.();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onInteractEnd?.();
      }}
    >
      <group ref={scaleWrapRef}>
        <Float speed={floatSpeed} floatIntensity={floatIntensity} rotationIntensity={rotationIntensity}>
          <group scale={scale as any} dispose={null}>
            <primitive object={(gltf as any).scene ?? gltf} />
          </group>
        </Float>
      </group>
    </group>
  );
};

export default SocialFloatingGlb;