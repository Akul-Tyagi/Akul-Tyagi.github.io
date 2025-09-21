'use client';

import { Float, Image, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';

type ShowcaseProps = JSX.IntrinsicElements['group'] & {
  url: string;                    // .glb/.gltf/.png/.jpg
  href?: string;                  // optional click-through
  // Common float settings
  scale?: number | [number, number, number]; // For models; for images: uniform multiplier
  floatSpeed?: number;
  floatIntensity?: number;
  rotationIntensity?: number;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  // Image controls
  imageRadius?: number;           // corner radius in world units (applies to images)
  imageSegments?: number;         // rounded corner smoothness
  imageToneMapped?: boolean;      // default false
  rotationOrder?: THREE.EulerOrder;
};

function isModelUrl(url: string) {
  return /\.(glb|gltf)$/i.test(url);
}

const Showcase = ({
  url,
  href,
  scale = 1,
  floatSpeed = 0,
  floatIntensity = 0,
  rotationIntensity = 0,
  onInteractStart,
  onInteractEnd,
  imageRadius = 0,
  imageSegments = 12,
  imageToneMapped = false,
  rotationOrder = 'XYZ',
  ...rest
}: ShowcaseProps) => {
  const isModel = isModelUrl(url);
  const gltf = isModel ? useGLTF(url) : null;

  // For images, load texture only to read natural size for aspect ratio
  const tex = !isModel ? useTexture(url) : null;
  useMemo(() => {
    if (!tex) return;
    if ('colorSpace' in tex) (tex as any).colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  // Base scale that preserves original aspect: height = 1, width = aspect
  const imageBaseScale = useMemo<[number, number, number]>(() => {
    if (!tex || !(tex as any).image) return [1, 1, 1];
    const w = (tex as any).image.width || 1;
    const h = (tex as any).image.height || 1;
    const aspect = w / Math.max(1, h);
    return [aspect, 1, 1];
  }, [tex]);

  const groupRef = useRef<THREE.Group>(null);
  
  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.order = rotationOrder;
    }
  }, [rotationOrder]);
  
  const scaleWrapRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const aimHoverRef = useRef(false);
  const scaleRef = useRef(1);
  const { camera, raycaster, gl } = useThree();
  const ndc = useMemo(() => new THREE.Vector2(0, 0), []);

  useFrame((_, dt) => {
    const locked = document.pointerLockElement === gl.domElement;

    // Aim-hover while pointer‑locked: cast from screen center
    let aimHover = false;
    if (locked && groupRef.current) {
      ndc.set(0, 0);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(groupRef.current, true);
      aimHover = hits.length > 0;
    }
    aimHoverRef.current = aimHover;

    const active = hovered || aimHover;
    const target = active ? 1.15 : 1.0; // subtle hover scale
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, 7.5, dt);
    if (scaleWrapRef.current) scaleWrapRef.current.scale.setScalar(scaleRef.current);
  });

  const openHref = () => {
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

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
  }, [gl, onInteractStart, onInteractEnd, href]);

  // Apply user scale to models; for images, user scale is a uniform multiplier
  const imageUserScale = useMemo<[number, number, number]>(() => {
    if (Array.isArray(scale)) return [scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1];
    if (typeof scale === 'number') return [scale, scale, scale];
    return [1, 1, 1];
  }, [scale]);

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
          {isModel ? (
            <group scale={scale as any} dispose={null}>
              <primitive object={(gltf as any)?.scene ?? gltf} />
            </group>
          ) : (
            <Image
              url={url}
              // Maintain original aspect (width = aspect, height = 1), then apply user scale
              scale={[
                imageBaseScale[0] * imageUserScale[0],
                imageBaseScale[1] * imageUserScale[1],
              ]}
              transparent
              toneMapped={imageToneMapped}
              radius={imageRadius}
              segments={imageSegments as any}
              side={THREE.DoubleSide}
            />
          )}
        </Float>
      </group>
    </group>
  );
};

export default Showcase;