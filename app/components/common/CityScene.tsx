'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import CityModel from '../models/CityModel';
import CityControls from './CityControls';
import CityTexts from './CityTexts';
import IronThroneHotspot from './IronThroneHotspot';
import SocialFloatingGlb from '../models/SocialFloatingGlb';
import Showcase from '../models/Showcase';

interface CitySceneProps {
  active: boolean;
  fade?: boolean;
}

const FALL_DURATION = 4;

const CameraFall = ({ active, onFinished }: { active: boolean; onFinished?: () => void }) => {
  const { camera, scene } = useThree();
  const progressRef = useRef(0);
  const finishedRef = useRef(false);

  const startPos = new THREE.Vector3(0, 90, 0);
  const endPos = new THREE.Vector3(0, 11, 28);
  const lookTarget = new THREE.Vector3(0, 6, 0);

  useEffect(() => {
    camera.position.copy(startPos);
    camera.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  }, [camera]);

  useFrame((_, delta) => {
    if (!active || finishedRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta / FALL_DURATION);
    const t = 1 - Math.pow(1 - progressRef.current, 3);

    camera.position.lerpVectors(startPos, endPos, t);

    const fromQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const toQuat = new THREE.Quaternion();
    const tmp = camera.clone();
    tmp.position.copy(camera.position);
    tmp.lookAt(lookTarget);
    toQuat.copy(tmp.quaternion);
    camera.quaternion.slerpQuaternions(fromQuat, toQuat, t);

    if (t === 1 && !finishedRef.current) {
      camera.lookAt(lookTarget);
      finishedRef.current = true;
      if (onFinished) onFinished(); 
    }
  });

  if (!scene.fog) scene.fog = new THREE.FogExp2('#0a0d18', 0.009);
  return null;
};

const CityScene = ({ active, fade = true }: CitySceneProps) => {
  const [fallDone, setFallDone] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [uiCaptured, setUiCaptured] = useState(false); // disable controls when typing

  useEffect(() => {
    if (fallDone) {
      const id = setTimeout(() => setShowHint(false), 4500);
      return () => clearTimeout(id);
    }
  }, [fallDone]);

  // Adjust roam limits (shrink a bit inside model extents)
  const roamBounds = useRef({
    minX: -450,
    maxX: 450,
    minZ: -300,
    maxZ: 300
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: active ? 2 : 0,
        opacity: active ? 1 : 0,
        transition: fade ? 'opacity 0.05s linear' : undefined,
        pointerEvents: active ? 'auto' : 'none',
        background: 'black'
      }}
    >
      <Canvas
        shadows={false}
        gl={{
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 52, near: 0.1, far: 3400 }}
      >
        <color attach="background" args={['#060a12']} />

        {/* Base fill */}
        <ambientLight intensity={0.64} />

        {/* High moon/sun hybrid for broad city highlight */}
        <directionalLight
          position={[320, 600, 240]}
            intensity={4.6}
          color={'#ffffff'}
        />

        <Suspense fallback={null}>
          <CameraFall active={active} onFinished={() => setFallDone(true)} />
          <group scale={[7.5, 7.5, 7.5]}>
            <CityModel />
          </group>

          <CityTexts
            items={[
              {
                id: 't1',
                text: 'CONTACT ME',
                position: [0, 16, 73],
                rotation: [0, 3.1, 0],
                fontSize: 7,
                color: '#ffeecc',
                floatAmplitude: 0.6,
                floatSpeed: 0.5,
                fadeDistance: 800,
              },
              {
                id: 't2',
                text: 'RESUME',
                position: [1.5, 16, -55],
                rotation: [0, 0, 0],
                fontSize: 8,
                color: '#99c8ff',
                floatAmplitude: 1.0,
                floatSpeed: 0.32,
                fadeDistance: 900
              },
              {
                id: 't3',
                text: 'SOCIALS',
                position: [40, 16, 0],
                rotation: [0, -1.6, 0],
                fontSize: 10,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              },
              {
                id: 't4',
                text: 'PROJECTS',
                position: [-37, 16, 0],
                rotation: [0, 1.6, 0],
                fontSize: 10,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              },
              {
                id: 't5',
                text: 'LEETCODE',
                position:[223, 11, 28],
                rotation:[0, 4.7, 0],
                fontSize: 3.4,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              },
              {
                id: 't6',
                text: 'LINKEDIN',
                position:[173, 11, -28],
                rotation:[0, 4.7, 0],
                fontSize: 3.4,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              },
              {
                id: 't7',
                text: 'GITHUB',
                position:[73, 11, -28],
                rotation:[0, 4.7, 0],
                fontSize: 3.4,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              },
              {
                id: 't8',
                text: 'PINTEREST',
                position:[123, 11, 28],
                rotation:[0, 4.7, 0],
                fontSize: 3.4,
                color: '#ffd6a0',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                fadeDistance: 1000
              }
            ]}
          />

          <IronThroneHotspot
            position={[0, 6, -220]}
            rotation={[0.05, -0.13, 0]}
            scale={1.2}
            throneTexture="UV5"
            resumeUrl="/ResAK.pdf"
            onInteractStart={() => setUiCaptured(true)}
            onInteractEnd={() => setTimeout(() => setUiCaptured(false), 100)}
          />

          <group>
            <SocialFloatingGlb
              url="models/df.glb"
              href="https://leetcode.com/u/AKUL_TYAGI/"
              position={[220, 8, 28]}
              rotation={[0, 4.7, 0]}
              scale={20}
              floatSpeed={7}
              floatIntensity={8}
            />
            <SocialFloatingGlb
              url="models/dfnika.glb"
              href="https://www.linkedin.com/in/akul-tyagi/"
              position={[170, 5, -28]}
              rotation={[0, 4.7, 0]}
              scale={25}
              floatSpeed={7}
              floatIntensity={7}
            />
            <SocialFloatingGlb
              url="models/dfoonm.glb"
              href="https://github.com/Akul-Tyagi"
              position={[70, 8, -28]}
              rotation={[0, 4.7, 0]}
              scale={5.2}
              floatSpeed={7}
              floatIntensity={8}
            />
            <SocialFloatingGlb
              url="models/dfdf.glb"
              href="https://in.pinterest.com/VincenzoSanji/"
              position={[120, 7, 28]}
              rotation={[0, 4.7, 0]}
              scale={3}
              floatSpeed={7}
              floatIntensity={7}
            />
          </group>

          <group>
            {/* 3D models */}
            <Showcase
              url="models/macbook.glb"
              href='https://cureapt.vercel.app/'
              position={[-120, 2, 28]}
              rotationOrder="YXZ"
              rotation={[0, 3.17, 0.1]}
              scale={64}
            />
            <Showcase
              url="models/samsung.glb"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-64, 9, -37]}
              rotation={[0, 4.6, 0]}
              scale={0.13}
            />
            <Showcase
              url="models/tv.glb"
              position={[5.5, 8.6, 18]}
              rotation={[0, -0.2, 0]}
              scale={2.6}
              floatSpeed={2}
              floatIntensity={1.2}
            />

            {/* Images */}
            <Showcase
              url="models/images/naivetyhead.png"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-66, 9, -25]}
              rotation={[0, 1.5, 0]}
              scale={14}
              imageRadius={0.3}
              floatSpeed={1.5}
              floatIntensity={0.7}
            />
            <Showcase
              url="models/images/sscureapt.png"
              href='https://cureapt.vercel.app/'
              position={[-127, 11.27, 28.23]}
              rotationOrder="YXZ"
              rotation={[0.09, 1.6, 0]}
              scale={13}
              imageRadius={0.3}
            />
            <Showcase
              url="models/images/ssunagi.png"
              position={[7, 14, 14]}
              rotation={[0, -0.1, 0]}
              scale={6}
              imageRadius={0.3}
              floatSpeed={1.5}
              floatIntensity={0.7}
            />
            <Showcase
              url="models/images/ssunagis.png"
              position={[-3.5, 13.5, 12]}
              rotation={[0, 0.05, 0]}
              scale={5}
              imageRadius={0.25}
              floatSpeed={1.6}
              floatIntensity={0.7}
            />
            <Showcase
              url="models/images/ssnaivety.png"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-64.07, 8.25, -36.9]}
              rotationOrder="YXZ"
              rotation={[0, 1.455, 0]}
              scale={12.5}
              imageRadius={0.4}
            />
          </group>

          <CityControls
            enabled={active && fallDone && !uiCaptured}
            uiCaptured={uiCaptured}
            bounds={roamBounds.current}
            baseStep={12}
            walkSpeed={26}
            sprintMultiplier={2}
            sensitivity={0.0009}
          />
        </Suspense>
      </Canvas>

      {active && fallDone && showHint && (
        <div style={{
          position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
          color:'#ccc', fontFamily:'monospace', fontSize:12, letterSpacing:1,
          background:'rgba(0,0,0,0.38)', padding:'6px 12px', borderRadius:6,
          pointerEvents:'none'
        }}>
          Click or WASD to move · Shift = sprint · Move mouse to look · Esc frees cursor
        </div>
      )}
    </div>
  );
};

export default CityScene;