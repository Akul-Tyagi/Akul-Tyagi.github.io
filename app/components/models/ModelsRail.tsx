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

type ObjSeqItem = ItemBase & {
  kind: 'obj-seq';
  base: string;     // e.g. 'models/Sony/model_'
  count: number;    // e.g. 30
  ext: 'obj';
};

type GlbSeqItem = ItemBase & {
  kind: 'glb-seq';
  base: string;     // e.g. 'models/basketball/model_'
  count: number;    // e.g. 28
  ext: 'glb';
};

type Item = GlbItem | ObjSeqItem | GlbSeqItem;

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
// Sony textures loader (loads known map types if files exist)
const useSonyTextures = () => {
  const [maps, setMaps] = useState<Partial<{
    map: THREE.Texture;
    normalMap: THREE.Texture;
    roughnessMap: THREE.Texture;
    metalnessMap: THREE.Texture;
    aoMap: THREE.Texture;
    emissiveMap: THREE.Texture;
  }>>({});

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    // Adjust this prefix to match your 11 files’ prefix. The example you gave implies they share it:
    // C:\Users\Vishesh\Desktop\OnePiece\CodinDocs\Portfolio\public\models\Sony\Sony_WH_1000XM5_vmppmax31_8_2_1_*.png
    const PREFIX = '/models/Sony/Sony_WH_1000XM5_vmppmax31_8_2_1_';

    // Try common suffixes. Add/remove as needed to match your 11 files.
    const candidateSets: { key: keyof typeof maps; suffixes: string[]; isSRGB?: boolean }[] = [
      { key: 'map',         suffixes: ['d.png'], isSRGB: true },
      //{ key: 'normalMap',   suffixes: ['normal.png', 'd.png', 'nor.png'] },
      { key: 'roughnessMap',suffixes: ['r.png'] },
      { key: 'metalnessMap',suffixes: ['g.png'] },
      //{ key: 'aoMap',       suffixes: ['ao.png', 'occlusion.png'] },
      //{ key: 'emissiveMap', suffixes: ['emissive.png', 'e.png'] },
    ];

    const tryLoad = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          url,
          (tex) => resolve(tex),
          undefined,
          () => reject(new Error('not found'))
        );
      });

    (async () => {
      const result: typeof maps = {};
      for (const { key, suffixes, isSRGB } of candidateSets) {
        for (const sfx of suffixes) {
          try {
            const tex = await tryLoad(`${PREFIX}${sfx}`);
            if (cancelled) return;
            // Texture setup
            tex.flipY = false;
            // three r150+: colorSpace. If your version is older, replace with tex.encoding = THREE.sRGBEncoding for base color only.
            if (isSRGB && 'colorSpace' in tex) (tex as any).colorSpace = THREE.SRGBColorSpace;
            (result as any)[key] = tex;
            break; // take first found
          } catch {
            // try next suffix
          }
        }
      }
      if (!cancelled) setMaps(result);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return maps;
};

const ObjSequence = ({ base, count, ext, ...rest }: { base: string; count: number; ext: 'obj' } & JSX.IntrinsicElements['group']) => {
  const urls = useMemo(() => Array.from({ length: count }, (_, i) => `${base}${i}.${ext}`), [base, count, ext]);
  const objects = useLoader(OBJLoader, urls);
  
  // Load Sony texture
  const sonyMaps = useSonyTextures();
  
  const texturedMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.7,
      metalness: 0.3,
    });
    if (sonyMaps.map) mat.map = sonyMaps.map;
    if (sonyMaps.roughnessMap) mat.roughnessMap = sonyMaps.roughnessMap;
    if (sonyMaps.metalnessMap) mat.metalnessMap = sonyMaps.metalnessMap;
    mat.needsUpdate = true;
    return mat;
  }, [sonyMaps]);

  return (
    <group {...rest}>
      {objects.map((obj, i) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = texturedMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        return <primitive key={i} object={obj} />;
      })}
    </group>
  );
};

const GlbSequence = ({ base, count, ext, ...rest }: { base: string; count: number; ext: 'glb' } & JSX.IntrinsicElements['group']) => {
  const urls = useMemo(() => Array.from({ length: count }, (_, i) => `${base}${i}.${ext}`), [base, count, ext]);
  const gltfs = urls.map((u) => useGLTF(u));
  return (
    <group {...rest}>
      {gltfs.map((g, i) => (
        <primitive key={i} object={(g as any).scene ?? g} />
      ))}
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
      <pointLight
        intensity={7}
        distance={12 * s}
        decay={1.5}
        position={[-2, 1.5, -1]}
        color="#ffffff"
      />
    </>
  );
};

const ModelsRail = () => {
  // Place everything around the horse area: group at [0, -13, 5.6]
  // Camera z goes ~5 -> ~15; space items between z ~7..15 so we pass them smoothly
  const items: Item[] = [
    { kind: 'glb', id: 'op',        url: 'models/onepiece.glb',   label: 'ONE PIECE',     position: [4, -17, 1],  scale: [1.5,1.5,1.5], rotation: [-1.6, -0.8, 0] },
    { kind: 'glb', id: 'setup',     url: 'models/setup.glb',      label: 'SETUP',    position: [ 5, -43, 2.8],  scale: [1, 1, 1],     rotation: [4.9, 4.2, 0] },
    { kind: 'glb', id: 'sopranos',  url: 'models/sopranos.glb',   label: 'SOPRANOS',      position: [-7, 0, 4.3], scale:[0.03,0.03,0.03], rotation: [4.5, -5.4, 0.7] },
    { kind: 'glb', id: 'bb',        url: 'models/bb.glb',         label: 'BREAKING BAD',  position: [ 7, -26, 2], scale: [1.7, 1.7, 1.7], rotation: [4.5, 0.3, -0.1] },
    { kind: 'glb', id: 'mug1',      url: 'models/mug1.glb',       label: 'mug1',          position: [-5, -49, 2], scale: [20,20,20], rotation: [4.8, 1, 0] },
    { kind: 'glb', id: 'mug2',      url: 'models/mug2.glb',       label: 'mug2',          position: [-5.7, -45.5, 1.8], scale: [1.2,1.2,1.2], rotation: [4.8, 2.3, 0] },

    // Keep SONY as OBJ sequence
    { kind: 'obj-seq', id: 'sony', base: 'models/Sony/model_', count: 30, ext: 'obj', label: 'SONY', position: [ -5.5, -37, 0], scale: [0.03, 0.03, 0.03], rotation: [0, 3, 0.5] },

    // Replace these with single GLBs
    { kind: 'glb', id: 'arsenal',   url: 'models/arsenal.glb',    label: 'ARSENAL',     position: [-8.5, -23, 0.6], scale: [5, 5, 5], rotation: [-1.7, 0.5, 0] },
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
                {it.kind === 'obj-seq' && <ObjSequence base={it.base} count={it.count} ext={it.ext} />}
                {it.kind === 'glb-seq' && <GlbSequence base={it.base} count={it.count} ext={it.ext} />}
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