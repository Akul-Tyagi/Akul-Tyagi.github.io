'use client';

import { Text, Html } from "@react-three/drei";
import { useScrollStore, useVideoStore, useCityStore } from "@stores";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import CloudContainer from "../models/Cloud";
import HorseModel from "../models/HorseModel";
import ModelsRail from "../models/ModelsRail";
import TrainModel from "../models/TrainModel";
import { useFrame } from "@react-three/fiber";
import HeroCtas from "./HeroCtas";

interface RotatingStarProps {
  position: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
  color?: string;
}

const RotatingStar = ({ 
  position, 
  scale = 1, 
  rotationSpeed = 0.02,
  color = "#FFD700" 
}: RotatingStarProps) => {
  const starRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (starRef.current) {
      starRef.current.rotation.z += rotationSpeed;
    }
  });

  // 4-pointed star shape
  const starShape = new THREE.Shape();
  const outerRadius = 0.15;
  const innerRadius = 0.06;
  
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      starShape.moveTo(x, y);
    } else {
      starShape.lineTo(x, y);
    }
  }
  starShape.closePath();

  return (
    <mesh ref={starRef} position={position} scale={scale}>
      <shapeGeometry args={[starShape]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

const Hero = () => {
  const titleRef = useRef<THREE.Mesh>(null);
  const aboutBtnRef = useRef<HTMLButtonElement>(null);
  const projectsBtnRef = useRef<HTMLButtonElement>(null);
  const { progress } = useProgress();
  const setVideoPlaying = useVideoStore(s => s.setVideoPlaying);
  const setVideoPlayed = useVideoStore(s => s.setVideoPlayed);
  const videoSrc = useVideoStore(s => s.videoSrc);
  const cityReady = useCityStore(s => s.cityReady);
  const cityGPUCompiled = useCityStore(s => s.cityGPUCompiled);

  const handleAboutClick = () => {
    gsap.timeline()
      .to(".scroll-hint", { opacity: 1, duration: 0.1 })
      .fromTo(
        ".scroll-hint",
        { scale: 1 },
        { scale: 1.3, duration: 0.18, yoyo: true, repeat: 3, ease: "power.inOut" }
      )
      .fromTo(
        ".scroll-hint span",
        { letterSpacing: "0.15em" },
        { letterSpacing: "0.35em", duration: 0.18, yoyo: true, repeat: 3, ease: "power.inOut" },
        "<"
      );
  };

  const handleProjectsClick = () => {
    if (!cityReady || !cityGPUCompiled || !videoSrc) {
      gsap.fromTo(
        projectsBtnRef.current,
        { scale: 1 },
        { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }
      );
      return;
    }
    setVideoPlayed(false);
    setVideoPlaying(true);
  };

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

  const fontPropsh = {
    font: "./buzzer.otf",
    fontSize: 9,
    letterSpacing: -0.03,
    color: "red",
    alpha: 0.9,
  };
  const fontProps = {
    font: "./ruigslay.otf",
    fontSize: 0.95,
    letterSpacing: -0.02,
    color: "white",
    alpha: 0.8,
    outlineWidth: 0.03,
    outlineColor: "white",
    outlineOpacity: 0.11,
    outlineBlur: 0.4
  };
  const fontPropss = {
    font: "./pfdi.ttf",
    fontSize: 0.7,
    letterSpacing: -0.02,
    color: "white",
    alpha: 1,
    outlineWidth: 0.03,
    outlineColor: "white",
    outlineOpacity: 0.11,
    outlineBlur: 0.4
  };

  return (
    <>
      <Text position={[0, 0, -10]} {...fontPropsh} ref={titleRef}>AKUL</Text>
      <Text position={[0,7.1, -10]} {...fontProps} >Plot Twist</Text>
      <Text position={[0, 6.1, -10]} {...fontProps} >You Found The Perfect Developer</Text>
      <Text position={[0, -5.5, -10]} {...fontPropss} >&quot;I Hope You Get What You Want Before You Stop Wanting It&quot;</Text>
      <HeroCtas onAbout={handleAboutClick} onProjects={handleProjectsClick} />
      <RotatingStar position={[-12.2, -2, -10]} scale={2.5} rotationSpeed={0.03} />
      <RotatingStar position={[0, -4, -10]} scale={2} rotationSpeed={0.01} />
      <RotatingStar position={[10, 3, -10]} scale={2.5} rotationSpeed={0.03} />
      <RotatingStar position={[14, -3, -10]} scale={3} rotationSpeed={0.015} />
      <RotatingStar position={[0, 1, -10]} scale={1.5} rotationSpeed={0.05} />
      <RotatingStar position={[0, 4.9, -10]} scale={2} rotationSpeed={0.01} />
      <RotatingStar position={[-12.5, 4.2, -10]} scale={3} rotationSpeed={0.015} />
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
