'use client';

import { Text } from '@react-three/drei';
import { useState } from 'react';
import * as THREE from 'three';

interface HeroCtasProps {
  onAbout(): void;
  onProjects(): void;
}

const lineMaterial = new THREE.MeshBasicMaterial({ color: 'white', opacity: 0.85, transparent: true });

const HeroCtas = ({ onAbout, onProjects }: HeroCtasProps) => {
  const [aboutHover, setAboutHover] = useState(false);
  const [projectsHover, setProjectsHover] = useState(false);

  return (
    <group position={[0, -3,0.1]}>
      <group
        position={[-0.7, 0, 0]}
        scale={aboutHover ? 1.12 : 1}
        onPointerOver={() => setAboutHover(true)}
        onPointerOut={() => setAboutHover(false)}
        onClick={onAbout}
      >
        <Text
          font="./cv.otf"
          fontSize={0.2}
          letterSpacing={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          ABOUT&nbsp;ME
        </Text>
        <mesh position={[0, -0.15, 0]}>
          <planeGeometry args={[aboutHover ? 0.85 : 0.5, 0.02]} />
          <primitive object={lineMaterial} />
        </mesh>
      </group>

      <group
        position={[0.7, 0, 0]}
        scale={projectsHover ? 1.12 : 1}
        onPointerOver={() => setProjectsHover(true)}
        onPointerOut={() => setProjectsHover(false)}
        onClick={onProjects}
      >
        <Text
          font="./cv.otf"
          fontSize={0.2}
          letterSpacing={0.02}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          PROJECTS
        </Text>
        <mesh position={[0, -0.15, 0]}>
          <planeGeometry args={[projectsHover ? 0.85 : 0.5, 0.02]} />
          <primitive object={lineMaterial} />
        </mesh>
      </group>
    </group>
  );
};

export default HeroCtas;