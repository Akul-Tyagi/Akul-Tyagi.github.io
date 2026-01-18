'use client';
import { useLoader } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useMemo } from 'react';
import type { JSX } from 'react';

type IronThroneProps = JSX.IntrinsicElements['group'] & {
  texture?: 'UV4' | 'UV5'; // choose which sword texture to use or null for plain metal
  metalness?: number;
  roughness?: number;
};

const IronThrone = ({
  texture = 'UV5',
  metalness = 0.7,
  roughness = 0.8,
  ...rest
}: IronThroneProps) => {
  const objs = useLoader(OBJLoader, [
    '/models/IronThrone/model_0.obj',
    '/models/IronThrone/model_1.obj',
  ]) as THREE.Group[];

  const textureUrl =
    texture === 'UV4'
      ? '/models/IronThrone/sword_UV4.png'
      : '/models/IronThrone/sword_UV5.png';

  const tex = useTexture(textureUrl);

  // Normalize texture settings
  useMemo(() => {
    if (!tex) return;
    if ('colorSpace' in tex) (tex as any).colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  const mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: tex,
      color: new THREE.Color('#ffffff'),
      metalness,
      roughness,
      envMapIntensity: 0.7,
    });
  }, [tex, metalness, roughness]);

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