'use client';
import { useLoader } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useMemo } from 'react';
import type { JSX } from 'react';

type IronThroneProps = JSX.IntrinsicElements['group'] & {
  texture?: 'UV4' | 'UV5' | null; // choose which sword texture to use or null for plain metal
  metalness?: number;
  roughness?: number;
};

const IronThrone = ({
  texture = 'UV4',
  metalness = 0.7,
  roughness = 0.8,
  ...rest
}: IronThroneProps) => {
  const objs = useLoader(OBJLoader, [
    '/models/IronThrone/model_0.obj',
    '/models/IronThrone/model_1.obj',
  ]) as THREE.Group[];

  const tex4 = useTexture('/models/IronThrone/sword_UV4.png');
  const tex5 = useTexture('/models/IronThrone/sword_UV5.png');

  // Normalize texture settings
  useMemo(() => {
    [tex4, tex5].forEach((t) => {
      if (!t) return;
      if ('colorSpace' in t) (t as any).colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [tex4, tex5]);

  const mat = useMemo(() => {
    const map = texture === 'UV4' ? tex4 : texture === 'UV5' ? tex5 : undefined;
    return new THREE.MeshStandardMaterial({
      map,
      color: map ? new THREE.Color('#ffffff') : new THREE.Color('#c7c7c7'),
      metalness,
      roughness,
      envMapIntensity: 0.7,
    });
  }, [texture, tex4, tex5, metalness, roughness]);

  const group = useMemo(() => {
    const g = new THREE.Group();
    objs.forEach((o) => {
      o.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          child.material = mat;
        }
      });
      g.add(o);
    });
    return g;
  }, [objs, mat]);

  return <primitive object={group} {...rest} />;
};

export default IronThrone;