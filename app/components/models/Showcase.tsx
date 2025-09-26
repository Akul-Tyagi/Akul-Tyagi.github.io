'use client';

import { Float, Image, useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SkeletonUtils } from 'three-stdlib';
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

  // Linking – items with the same linkId scale together
  linkId?: string;                // group key
  hoverScale?: number;            // default 1.15
  linkScale?: number;             // default = hoverScale
  scaleDamp?: number;             // damping factor (default 7.5)
};

function isModelUrl(url: string) {
  return /\.(glb|gltf)$/i.test(url);
}

// Simple global registry to share hover state by linkId
const linkRegistry = new Map<string, { activeCount: number }>();
let nextShowcaseId = 1;

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
  linkId,
  hoverScale = 1.15,
  linkScale,
  scaleDamp = 7.5,
  ...rest
}: ShowcaseProps) => {
  const isModel = isModelUrl(url);
  const rawGltf = isModel ? useGLTF(url) : null;
  const clonedScene = useMemo(() => {
    if (!rawGltf) return null;
    const source = (rawGltf as any).scene ?? rawGltf;
    return SkeletonUtils.clone(source);
  }, [rawGltf]);

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
    if (groupRef.current) groupRef.current.rotation.order = rotationOrder;
  }, [rotationOrder]);

  const idRef = useRef<number>(nextShowcaseId++);
  const scaleWrapRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const prevSelfActiveRef = useRef(false);
  const scaleRef = useRef(1);
  const { camera, raycaster, gl } = useThree();
  const ndc = useMemo(() => new THREE.Vector2(0, 0), []);

  // Ensure registry bucket exists for this linkId
  useEffect(() => {
    if (!linkId) return;
    if (!linkRegistry.has(linkId)) linkRegistry.set(linkId, { activeCount: 0 });
    return () => {
      // On unmount, if we were active, decrement
      const bucket = linkRegistry.get(linkId);
      if (!bucket) return;
      if (prevSelfActiveRef.current) bucket.activeCount = Math.max(0, bucket.activeCount - 1);
      if (bucket.activeCount <= 0) linkRegistry.delete(linkId);
    };
  }, [linkId]);

  useFrame((_, dt) => {
    // Aim-hover while pointer‑locked: cast from screen center
    let aimHover = false;
    const locked = document.pointerLockElement === gl.domElement;
    if (locked && groupRef.current) {
      ndc.set(0, 0);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(groupRef.current, true);
      aimHover = hits.length > 0;
    }

    const selfActive = hovered || aimHover;

    // Update registry when self-active state changes
    if (linkId && selfActive !== prevSelfActiveRef.current) {
      const bucket = linkRegistry.get(linkId) ?? { activeCount: 0 };
      bucket.activeCount += selfActive ? 1 : -1;
      bucket.activeCount = Math.max(0, bucket.activeCount);
      linkRegistry.set(linkId, bucket);
      prevSelfActiveRef.current = selfActive;
    }

    const linkedActive =
      linkId ? (linkRegistry.get(linkId)?.activeCount ?? 0) > 0 : selfActive;

    const target = linkedActive
      ? (linkId ? (linkScale ?? hoverScale) : hoverScale)
      : 1.0;

    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, scaleDamp, dt);
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

      // If linked group is active (aim-hover), treat as click
      const active =
        linkId ? (linkRegistry.get(linkId)?.activeCount ?? 0) > 0 : prevSelfActiveRef.current;
      if (active) {
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
  }, [gl, onInteractStart, onInteractEnd, href, linkId]);

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
        if (!document.pointerLockElement) document.body.style.cursor = '';
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
              {clonedScene && <primitive object={clonedScene} />}
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