'use client';

import { Text } from "@react-three/drei";

import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import CloudContainer from "../models/Cloud";
import HorseModel from "../models/HorseModel";
import ModelsRail from "../models/ModelsRail";
import TrainModel from "../models/TrainModel";

const Hero = () => {
  const titleRef = useRef<THREE.Mesh>(null);
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100 && titleRef.current) {
      gsap.fromTo(titleRef.current.position, {
        y: -10,
        duration: 1,
        // delay: 1.5,
      }, {
        y: 0,
        duration: 3
      });
    }
  }, [progress]);

  const fontProps = {
    font: "./soria-font.ttf",
    fontSize: 1.2,
  };

  return (
    <>
      <Text position={[0, 2, -10]} {...fontProps} ref={titleRef}>Hi, I am Akul Tyagi.</Text>
      <CloudContainer/>
      <group position={[0, -13, 5.6]}>
        <HorseModel receiveShadow/>
        <ModelsRail/>
        {/* Centered where down-tilt completes (hand-off to X scroll) */}
        {/* World target ~ [0, -64, 10.5] => local ~ [0, -51, 5.4] relative to this group */}
        <TrainModel appearAt={0.8} position={[0, -53, 5.5]} scale={[0.01, 0.01, 0.01]} rotation={[3.15, 0, 0]} />
      </group>
    </>
  );
};

export default Hero;
