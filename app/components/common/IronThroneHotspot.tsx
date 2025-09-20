'use client';
import { Billboard, Float, Image } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import IronThrone from '../models/IronThrone';
import type { JSX } from 'react';

type Props = JSX.IntrinsicElements['group'] & {
  resumeUrl?: string;
  throneTexture?: 'UV4' | 'UV5' | null;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
};

const IronThroneHotspot = ({
  resumeUrl = '/ResAK.pdf',
  throneTexture = 'UV5',
  onInteractStart,
  onInteractEnd,
  ...rest
}: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const iconRef = useRef<any>(null);
  const scaleRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  const { camera, raycaster, gl } = useThree();
  const ndc = useRef(new THREE.Vector2(0, 0));
  const iconOpacity = useRef(0.9);
  const aimHoverRef = useRef(false);

  // Invisible click helper (bigger target, but still non‑visible)
  const colliderGeo = useMemo(
    () => new THREE.CylinderGeometry(2.5, 2.5, 5.2, 16, 1, true),
    []
  );
  useEffect(() => () => colliderGeo.dispose(), [colliderGeo]);

  useFrame((_, dt) => {
    const locked = document.pointerLockElement === gl.domElement;

    // Aim-hover when pointer is locked: cast from screen center
    let aimHover = false;
    if (locked && groupRef.current) {
      ndc.current.set(0, 0);
      raycaster.setFromCamera(ndc.current, camera);
      const hits = raycaster.intersectObject(groupRef.current, true);
      aimHover = hits.length > 0;
    }
    aimHoverRef.current = aimHover;

    const active = hovered || aimHover;

    // Smooth overall scale on hover/aim
    const target = active ? 1.045 : 1.0;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, 7.5, dt);
    groupRef.current?.scale.setScalar(scaleRef.current);

    // Icon pulse on active
    if (iconRef.current) {
      const cur = (iconRef.current as any).__s || 1.0;
      const next = THREE.MathUtils.damp(cur, active ? 1.12 : 1.0, 8, dt);
      (iconRef.current as any).__s = next;
      iconRef.current.scale.set(next, next, next);

      // Distance fade (subtle)
      const iconObj = iconRef.current as THREE.Object3D;
      const world = new THREE.Vector3();
      iconObj.getWorldPosition(world);
      const dist = camera.position.distanceTo(world);
      const targetFade = THREE.MathUtils.clamp(1 - (dist - 50) / 200, 0.18, 1);
      iconOpacity.current = THREE.MathUtils.damp(iconOpacity.current, targetFade, 7, dt);
      if (iconRef.current.material) {
        iconRef.current.material.opacity = iconOpacity.current;
        iconRef.current.material.transparent = true;
        iconRef.current.material.depthWrite = false;
      }
    }
  });

  // Enable click-to-open in pointer lock by raycasting from the center
 useEffect(() => {
   const canvas = gl.domElement;
   const onPointerDown = (e: PointerEvent) => {
     const locked = document.pointerLockElement === canvas;
     if (!locked) return; // normal mode handled by R3F events
     if (!groupRef.current) return;
     // If we're aiming at the throne, open the PDF and suppress controls
     if (aimHoverRef.current) {
       try {
         // Capture to suppress CityControls' step impulse
         onInteractStart?.();
         // Try best to stop other listeners
         e.preventDefault();
         e.stopPropagation();
         (e as any).stopImmediatePropagation?.();
       } catch {}
       window.open(resumeUrl, '_blank', 'noopener,noreferrer');
       setTimeout(() => onInteractEnd?.(), 120);
     }
   };
   canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
   return () => canvas.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
 }, [gl, resumeUrl, onInteractStart, onInteractEnd]);

  const onOpen = () => {
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <group {...rest}>
      <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (document.pointerLockElement !== gl.domElement) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onInteractStart?.();
          onOpen();
          setTimeout(() => onInteractEnd?.(), 120);
        }}
        // prevent text selection glitches
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.preventDefault();
          onInteractStart?.();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          onInteractEnd?.();
        }}
      >
        {/* The actual throne */}
        <IronThrone texture={throneTexture} />

        {/* Easier click area */}
        <mesh position={[0, 2.6, 0]} geometry={colliderGeo}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Floating PDF icon, always camera-facing, gently bobbing */}
        <Float speed={7} floatIntensity={3} rotationIntensity={0.2}>
          <Billboard position={[0.6, 8, 2.5]} scale={2.5}>
            <Image
              ref={iconRef}
              url="/icons/pdf.svg"
              transparent
              toneMapped={false}
            />
          </Billboard>
        </Float>
      </group>
    </group>
  );
};

export default IronThroneHotspot;