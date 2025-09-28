'use client';

import { useGLTF, useScroll, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh
  }
  materials: {
    [key: string]: THREE.MeshPhysicalMaterial
  }
}

const HorseModel = (props: Partial<THREE.Object3D>) => {
  const rootRef = useRef<THREE.Group>(null);
  // Model group for rotation only (kept separate from pinning)
  const modelRef = useRef<THREE.Group>(null);
    


  // Tunables
  const appearStart = 0.01; // reduced to show earlier
  const pinStart = 0.39;    // reduced to start pinning much earlier
  const pinEnd = 2;     // kept the same
  const pinEase = 0.01;    // reduced for faster transition
  const maxZFollow = 0.1;    // reduced to limit following distance

  // Pin logic refs
  const pinArmedRef = useRef(false);
  const baseYRef = useRef(0);
  const baseZRef = useRef(0);
  const camYAtPinRef = useRef(0);
  const camZAtPinRef = useRef(0);
  const zFrozenRef = useRef<number | null>(null); // freeze deltas at pinEnd
  const yFrozenRef = useRef<number | null>(null);



  const { camera } = useThree();
  
  // Load all horse models
  const horse0 = useGLTF('/models/horse/model_0.glb', true) as unknown as GLTFResult;
  const horse1 = useGLTF('/models/horse/model_1.glb', true) as unknown as GLTFResult;
  const horse2 = useGLTF('/models/horse/model_2.glb', true) as unknown as GLTFResult;
  const horse3 = useGLTF('/models/horse/model_3.glb', true) as unknown as GLTFResult;
  const horse4 = useGLTF('/models/horse/model_4.glb', true) as unknown as GLTFResult;
  
  const horses = [horse0, horse1, horse2, horse3, horse4];
  
  // Load textures from the horse folder (adjust these names based on your actual texture files)
  const textures = useTexture({
    map: '/models/horse/Horse_low0_albedo.png', // Replace with your actual texture file names
    normalMap: '/models/horse/Horse_low0_normal.png', // Optional - if you have normal maps
    roughnessMap: '/models/horse/Horse_low0_roughness.png', // Optional - if you have roughness maps
    aoMap: '/models/horse/Horse_low0_ao.png',
    metalnessMap: '/models/horse/Horse_low0_metallic.png',

    // Add more textures as needed based on what you have in the folder
  });

  const data = useScroll();
  
  const initialRotation: [number, number, number] = [3, 0, 0];
const targetRotation: [number, number, number] = [4, -1, -0.5];

useFrame((_, delta) => {
    const offset = data.offset ?? 0;
    if (!rootRef.current) return;

    // Appear gating
    const visibleNow = offset >= appearStart;
    rootRef.current.visible = visibleNow;
    if (!visibleNow) {
      // Reset pin state when fully before appear window
      pinArmedRef.current = false;
      zFrozenRef.current = null;
      yFrozenRef.current = null;
      return;
    }

    // Rotate model (not the root that we pin)
    if (modelRef.current) {
      const animationEnd = 0.4;
      const t = Math.min(offset, animationEnd) / animationEnd;
      modelRef.current.rotation.x = THREE.MathUtils.lerp(initialRotation[0], targetRotation[0], t);
      modelRef.current.rotation.y = THREE.MathUtils.lerp(initialRotation[1], targetRotation[1], t);
      modelRef.current.rotation.z = THREE.MathUtils.lerp(initialRotation[2], targetRotation[2], t);
    }

    // Smooth gate in/out around pinStart to avoid jumps on backward scroll
    const gate = THREE.MathUtils.smoothstep(offset, pinStart - pinEase, pinStart + pinEase);

    // Capture baselines when entering the gate the first time
    if (gate > 0 && !pinArmedRef.current) {
      pinArmedRef.current = true;
      baseYRef.current = rootRef.current.position.y;
      baseZRef.current = rootRef.current.position.z;
      camYAtPinRef.current = camera.position.y;
      camZAtPinRef.current = camera.position.z;
      zFrozenRef.current = null;
      yFrozenRef.current = null;
    }

    // Disarm once fully out of gate on the left; keep damping to base to stay smooth
    if (gate === 0 && pinArmedRef.current && offset < pinStart - pinEase) {
      pinArmedRef.current = false;
      zFrozenRef.current = null;
      yFrozenRef.current = null;
    }

    // If not armed yet (never crossed), just ensure we smoothly stay at base
    if (!pinArmedRef.current) {
      // Smoothly return to base if needed - reduced damping from 7 to 4 for faster response
      rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, baseYRef.current, 4, delta);
      rootRef.current.position.z = THREE.MathUtils.damp(rootRef.current.position.z, baseZRef.current, 4, delta);
      return;
    }

    // Camera deltas since pin start
    const dy = camera.position.y - camYAtPinRef.current;
    const dzRaw = camera.position.z - camZAtPinRef.current;
    const dzClamped = Math.sign(dzRaw) * Math.min(Math.abs(dzRaw), maxZFollow);

    // At/after pinEnd: stop advancing deltas so the horse remains in place while camera passes by
    const pastPinEnd = offset >= pinEnd;
    if (pastPinEnd) {
      if (zFrozenRef.current === null) zFrozenRef.current = dzClamped;
      if (yFrozenRef.current === null) yFrozenRef.current = dy;
    }
    const dzUsed = pastPinEnd ? (zFrozenRef.current ?? dzClamped) : dzClamped;
    const dyUsed = pastPinEnd ? (yFrozenRef.current ?? dy) : dy;

    // Target = base + delta * gate (continuous both directions)
    // Added cameraOffset to keep the horse at a consistent distance
    const targetY = baseYRef.current + dyUsed * gate;
    const targetZ = baseZRef.current + dzUsed * gate;

    // Reduced damping from 7 to 4 for faster response
    rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, targetY, 4, delta);
    rootRef.current.position.z = THREE.MathUtils.damp(rootRef.current.position.z, targetZ, 4, delta);
  });

  // Single shared material (avoid creating N materials during render)
  const horseMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      aoMap: textures.aoMap,
      metalnessMap: textures.metalnessMap,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.1,
      transmission: 0,
      emissive: new THREE.Color(0x808080),
      emissiveIntensity: 0.15,
    });
    return m;
  }, [textures]);

  useEffect(() => () => horseMat.dispose(), [horseMat]);
  
  const renderHorseParts = () => {
    return horses.flatMap((horse, hi) =>
      Object.entries(horse.nodes).map(([nodeName, node]) => {
        if ((node as any).isMesh) {
          const mesh = node as THREE.Mesh;
          return (
            <mesh
              key={`${hi}-${nodeName}`}
              castShadow
              receiveShadow
              geometry={mesh.geometry}
              material={horseMat}
              position={mesh.position}
              rotation={mesh.rotation}
              scale={mesh.scale}
            />
          );
        }
        return null;
      })
    );
  };

  return (
    <group ref={rootRef} {...props} dispose={null} frustumCulled={false}>
      {/* Light attached to the horse with your exact settings */}
      <pointLight position={[1, 1, -2.5]} intensity={80} distance={10} />

      <group ref={modelRef} position={[0, 0, 0]} scale={[2, 2, 2]}>
        {renderHorseParts()}
      </group>
    </group>
  );
};

useGLTF.preload('/models/horse/model_0.glb');
useGLTF.preload('/models/horse/model_1.glb');
useGLTF.preload('/models/horse/model_2.glb');
useGLTF.preload('/models/horse/model_3.glb');
useGLTF.preload('/models/horse/model_4.glb');

export default HorseModel;