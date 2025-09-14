'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import CityModel from '../models/CityModel';
import CityControls from './CityControls';
import CityTexts, { CityTextConfig } from './CityTexts';

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
  const endPos = new THREE.Vector3(0, 7, 28);
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
                position: [1.5, 16, -55],
                rotation: [0, 0, 0],
                fontSize: 7,
                color: '#ffeecc',
                floatAmplitude: 0.6,
                floatSpeed: 0.5,
                fadeDistance: 800,
              },
              {
                id: 't2',
                text: 'RESUME',
                position: [0, 16, 73],
                rotation: [0, 3.1, 0],
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
              }
            ]}
          />

          <CityControls
            enabled={active && fallDone}
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