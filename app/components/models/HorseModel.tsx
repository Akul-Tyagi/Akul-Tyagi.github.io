'use client';

import { useGLTF, useScroll, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
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
  const horseRefs = useRef<(THREE.Group | null)[]>([]);
  
  // Load all horse models
  const horse0 = useGLTF('models/horse/model_0.glb', true) as GLTFResult;
  const horse1 = useGLTF('models/horse/model_1.glb', true) as GLTFResult;
  const horse2 = useGLTF('models/horse/model_2.glb', true) as GLTFResult;
  const horse3 = useGLTF('models/horse/model_3.glb', true) as GLTFResult;
  const horse4 = useGLTF('models/horse/model_4.glb', true) as GLTFResult;
  
  const horses = [horse0, horse1, horse2, horse3, horse4];
  
  // Load textures from the horse folder (adjust these names based on your actual texture files)
  const textures = useTexture({
    map: 'models/horse/Horse_low0_albedo.png', // Replace with your actual texture file names
    normalMap: 'models/horse/Horse_low0_normal.png', // Optional - if you have normal maps
    roughnessMap: 'models/horse/Horse_low0_roughness.png', // Optional - if you have roughness maps
    aoMap: 'models/horse/Horse_low0_ao.png',
    metalnessMap: 'models/horse/Horse_low0_metallic.png',

    // Add more textures as needed based on what you have in the folder
  });

  const data = useScroll();
  
  const initialRotations: [number, number, number][] = [
  [3,0,0],
  [3, 0, 0],
  [3, 0, 0],
  [3, 0, 0],
  [3, 0, 0],
];
const targetRotation: [number, number, number] = [4, -1, -0.5];

useFrame(() => {

   // Set the scroll range for the animation (e.g., 0 to 0.25)
  const animationEnd = 0.40;
  // Clamp and normalize progress to [0, 1] within the animation range
  const animProgress = Math.min(data.offset, animationEnd) / animationEnd;

  const scrollProgress = data.offset;
  horseRefs.current.forEach((ref, index) => {
    if (ref) {
      ref.rotation.x = initialRotations[index][0] + (targetRotation[0] - initialRotations[index][0]) * animProgress;
      ref.rotation.y = initialRotations[index][1] + (targetRotation[1] - initialRotations[index][1]) * animProgress;
      ref.rotation.z = initialRotations[index][2] + (targetRotation[2] - initialRotations[index][2]) * animProgress;
    }
  });
});

  // Random positions for horses
  const positions: [number, number, number][] = [
    [0, 0, 0],           // Center
    [0,0,0],       // Left back
    [0,0,0],        // Right front
    [0, 0, 0],          // Left front elevated
    [0, 0, 0],       // Right back lowered
  ];

  const rotations: [number, number, number][] = [
    [4, -1, -0.5],                 // No rotation
    [4, -1, -0.5],       // 90 deg around Y
    [4, -1, -0.5],           // 180 deg around Y
    [4, -1, -0.5],      // -90 deg around Y
    [4, -1, -0.5],       // 45 deg around Y
  ];

  const renderHorse = (horse: GLTFResult, index: number) => {
    const position = positions[index];

    return (
      <group 
        key={index}
        ref={(el) => (horseRefs.current[index] = el)}
        position={position}
        scale={[2, 2, 2]} // Adjust scale as needed
      >
        {Object.entries(horse.nodes).map(([nodeName, node]) => {
          if (node.type === 'Mesh') {
            const mesh = node as THREE.Mesh;
            return (
              <mesh
                key={nodeName}
                castShadow
                receiveShadow
                geometry={mesh.geometry}
                material={
                  // Create a new material with your textures
                  new THREE.MeshPhysicalMaterial({
                    map: textures.map,
                    normalMap: textures.normalMap,
                    roughnessMap: textures.roughnessMap,
                    aoMap: textures.aoMap,
                    metalnessMap: textures.metalnessMap,

                    // Add more texture maps as needed

                    // Adjust material properties as needed
                    roughness: 0.3,
                    metalness: 0.1,
                    clearcoat: 0.7,
                    clearcoatRoughness: 0.1,
                    sheen: 0.2,
                    sheenColor: new THREE.Color(0xffffff),
                    sheenRoughness: 0.1,
                    transmission: 0,
                    emissive: new THREE.Color(0x808080),//grey
                    emissiveIntensity: 0.15,
                    
                  })
                }
                position={mesh.position}
                rotation={mesh.rotation}
                scale={mesh.scale}
              />
            );
          }
          return null;
        })}
      </group>
    );
  };

  return (
    <group {...props} dispose={null}>
      {horses.map((horse, index) => renderHorse(horse, index))}
    </group>
  );
};

// Preload all models
useGLTF.preload('models/horse/model_0.glb');
useGLTF.preload('models/horse/model_1.glb');
useGLTF.preload('models/horse/model_2.glb');
useGLTF.preload('models/horse/model_3.glb');
useGLTF.preload('models/horse/model_4.glb');

export default HorseModel;