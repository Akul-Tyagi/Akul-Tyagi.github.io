'use client';

import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

type CityModelProps = React.ComponentProps<'group'> & {
  castShadows?: boolean;
  receiveShadows?: boolean;
  toneDownEmissive?: boolean;
};

const CITY_MODEL_PATH = '/models/city/scene.gltf';

const CityModel = ({
  castShadows = false,
  receiveShadows = false,
  toneDownEmissive = true,
  ...rest
}: CityModelProps) => {
  const gltf = useGLTF(CITY_MODEL_PATH);
  const { gl } = useThree();

  useEffect(() => {
    const texSet = new Set<THREE.Texture>();

    gltf.scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.frustumCulled = true;
        mesh.castShadow = castShadows;
        mesh.receiveShadow = receiveShadows;

        const mats: THREE.Material[] = Array.isArray(mesh.material)
          ? (mesh.material as THREE.Material[])
          : [mesh.material as THREE.Material];

        mats.forEach((m: any) => {
          if (!m || !m.isMaterial) return;
          m.transparent = false;
          m.alphaTest = 0;
          m.depthWrite = true;
            m.depthTest = true;
          m.side = THREE.FrontSide;
          if (toneDownEmissive && m.emissive && m.emissiveIntensity !== undefined && m.emissiveIntensity > 1) {
            m.emissiveIntensity = 1;
          }
          ['map','emissiveMap','normalMap','roughnessMap','metalnessMap','aoMap','specularMap'].forEach(k => {
            if (m[k] && m[k].isTexture) texSet.add(m[k]);
          });
        });
      }
    });

    const maxAniso = (gl.capabilities as any).getMaxAnisotropy
      ? (gl.capabilities as any).getMaxAnisotropy()
      : 8;

    texSet.forEach((t: any) => {
      if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      t.generateMipmaps = true;
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.needsUpdate = true;
    });
  }, [gltf, castShadows, receiveShadows, toneDownEmissive, gl]);

  return (
    <group {...rest} dispose={null} frustumCulled={false}>
      <primitive object={gltf.scene} />
    </group>
  );
};

useGLTF.preload(CITY_MODEL_PATH);

export default CityModel;