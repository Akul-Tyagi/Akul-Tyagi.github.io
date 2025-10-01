'use client';

import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
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

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (toneDownEmissive && mat.emissive && mat.emissiveIntensity > 2) {
            mat.emissiveIntensity = Math.min(2, mat.emissiveIntensity);
          }

          // Collect textures
          if (mat.map) texSet.add(mat.map);
          if (mat.normalMap) texSet.add(mat.normalMap);
          if (mat.roughnessMap) texSet.add(mat.roughnessMap);
          if (mat.metalnessMap) texSet.add(mat.metalnessMap);
          if (mat.aoMap) texSet.add(mat.aoMap);
          if (mat.emissiveMap) texSet.add(mat.emissiveMap);
        }
      }
    });

    const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 8;

    texSet.forEach((t: THREE.Texture) => {
      t.colorSpace = THREE.SRGBColorSpace;
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

// Preload OUTSIDE component to ensure it's cached
useGLTF.preload(CITY_MODEL_PATH);

export default CityModel;