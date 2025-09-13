'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import CityModel from '../models/CityModel';
import CityControls from './CityControls';
import CityColliders from './CityColliders';

interface CitySceneProps {
  active: boolean;
  fade?: boolean;
}

const FALL_DURATION = 4;

const CameraFall = ({
  active,
  onFinished
}: { active: boolean; onFinished?: () => void }) => {
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

    const downQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const fwdQuat = new THREE.Quaternion();
    const tmp = camera.clone();
    tmp.position.copy(camera.position);
    tmp.lookAt(lookTarget);
    fwdQuat.copy(tmp.quaternion);
    camera.quaternion.slerpQuaternions(downQuat, fwdQuat, t);

    if (t === 1 && !finishedRef.current) {
      camera.lookAt(lookTarget);
      finishedRef.current = true;
      if (onFinished) onFinished(); // changed from: onFinished && onFinished();
    }
  });

  if (!scene.fog) scene.fog = new THREE.FogExp2('#0a0d18', 0.012);
  return null;
};

const CityScene = ({ active, fade = true }: CitySceneProps) => {
  const [fallDone, setFallDone] = useState(false);
  const cityRootRef = useRef<THREE.Group | null>(null);

  // Track pointer lock state so we decide whether to let wheel scroll the page
  const [pointerLocked, setPointerLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleLockChange = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      setPointerLocked(document.pointerLockElement === canvas);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  // Forward wheel scrolling to the document when NOT pointer locked
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!active) return;
    if (pointerLocked) {
      // Suppress page scroll while in look mode
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        // Raise only while active so it can receive clicks / pointer lock,
        // otherwise keep it behind the scroll scene without blocking scroll.
        zIndex: active ? 2 : 0,
        opacity: active ? 1 : 0,
        transition: fade ? 'opacity 0.05s linear' : undefined,
        pointerEvents: active ? 'auto' : 'none',
        background: 'black',
      }}
    >
      <Canvas
        shadows={false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 1000 }}
      >
        <color attach="background" args={['#05070d']} />
        <ambientLight intensity={2} />
        <Suspense fallback={null}>
          <CameraFall
            active={active}
            onFinished={() => setFallDone(true)}
          />
          <group ref={cityRootRef} scale={[7.5, 7.5, 7.5]}>
            <CityModel />
          </group>
            <CityColliders rootRef={cityRootRef} active={active} />
          <CityControls enabled={active && fallDone} />
        </Suspense>
      </Canvas>

      {active && fallDone && (
        <>
          <div style={{
            position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
            color:'#ccc', fontFamily:'monospace', fontSize:12, letterSpacing:1,
            background:'rgba(0,0,0,0.35)', padding:'6px 10px', borderRadius:6,
            pointerEvents:'none'
          }}>
            Click to lock mouse. Move to look. Double‑click to step forward. Esc to release. (Wheel scroll works when not locked)
          </div>
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:10, height:10, marginLeft:-5, marginTop:-5,
            borderRadius:'50%', background:'rgba(255,255,255,0.4)',
            pointerEvents:'none'
          }} />
        </>
      )}
    </div>
  );
};

export default CityScene;