'use client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import CityModel from '../models/CityModel';
import CityControls from './CityControls';
import CityTexts from './CityTexts';
import IronThroneHotspot from './IronThroneHotspot';
import SocialFloatingGlb from '../models/SocialFloatingGlb';
import Showcase from '../models/Showcase';
import { usePortalStore, useScrollStore, useVideoStore, useCityStore, useAudioStore } from '@stores';
import AudioToggle from './AudioToggle';

interface CitySceneProps {
  active: boolean;
  fade?: boolean;
}

const FALL_DURATION = 3;
const MAX_FRAME_STEP = 1 / 60;

const START_POS = new THREE.Vector3(0, 340, 0);
const END_POS = new THREE.Vector3(0, 11, 64);
const LOOK_TARGET = new THREE.Vector3(0, 6, 0);

const START_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const FINAL_QUAT = (() => {
  const tempCam = new THREE.PerspectiveCamera();
  tempCam.position.copy(END_POS);
  tempCam.lookAt(LOOK_TARGET);
  return tempCam.quaternion.clone();
})();

const GO_BACK_THRESHOLD_Z = 160;          // single threshold
const GO_BACK_HALF_WIDTH = 12.5;   

const GoBackTrigger = ({ active, onTrigger }: { active: boolean; onTrigger: () => void }) => {
  const { camera } = useThree();
  const armedRef = useRef(true);          // allow triggering once per activation
  const prevZRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when scene (re)activates
    if (active) {
      armedRef.current = true;
      prevZRef.current = null;
    }
  }, [active]);

  useFrame(() => {
    if (!active || !armedRef.current) return;
    const { x, z } = camera.position;
    if (prevZRef.current === null) {
      prevZRef.current = z;
      return;
    }
    // Detect forward crossing of threshold inside corridor
    if (
      prevZRef.current < GO_BACK_THRESHOLD_Z &&
      z >= GO_BACK_THRESHOLD_Z &&
      Math.abs(x) <= GO_BACK_HALF_WIDTH
    ) {
      armedRef.current = false;
      onTrigger();
    }
    prevZRef.current = z;
  });

  return null;
};

const CameraFall = ({ active, onBegin, onFinished }: { active: boolean; onBegin?: () => void; onFinished?: () => void }) => {
  const { camera, scene } = useThree();
  const progressRef = useRef(0);
  const finishedRef = useRef(false);
  const initializedRef = useRef(false);
  const startedRef = useRef(false);
  const tmpQuatRef = useRef(new THREE.Quaternion());

  useEffect(() => {
    if (!scene.fog) scene.fog = new THREE.FogExp2('#0a0d18', 0.006);
  }, [scene]);

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      finishedRef.current = false;
      initializedRef.current = false;
      startedRef.current = false;
      return;
    }

    camera.position.copy(START_POS);
    camera.quaternion.copy(START_QUAT);
    camera.updateMatrixWorld(true);
    initializedRef.current = true;
  }, [active, camera]);

  useFrame((_, delta) => {
    if (!active || !initializedRef.current || finishedRef.current) return;

    if (!startedRef.current) {
      startedRef.current = true;
      onBegin?.();
    }

    const dt = Math.min(delta, MAX_FRAME_STEP);
    progressRef.current = Math.min(1, progressRef.current + dt / FALL_DURATION);
    const progress = progressRef.current;

    const easedPos = 1 - Math.pow(1 - progress, 4);
    camera.position.lerpVectors(START_POS, END_POS, easedPos);

    const orientBlend = THREE.MathUtils.smootherstep(progress, 0.30, 0.70);
    const q = tmpQuatRef.current;
    q.copy(START_QUAT).slerp(FINAL_QUAT, orientBlend);
    camera.quaternion.copy(q);

    camera.updateMatrixWorld(true);

    if (progress >= 1 && !finishedRef.current) {
      finishedRef.current = true;
      camera.position.copy(END_POS);
      camera.quaternion.copy(FINAL_QUAT);
      camera.updateMatrixWorld(true);
      onFinished?.();
    }
  });

  return null;
};

const CityScene = ({ active, fade = true }: CitySceneProps) => {
  const [fallDone, setFallDone] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [uiCaptured, setUiCaptured] = useState(false); // disable controls when typing
  const [introMaskVisible, setIntroMaskVisible] = useState(false);
  const [maskOpacity, setMaskOpacity] = useState(0);
  const maskFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setVideoPlaying = useVideoStore(s => s.setVideoPlaying);
  const setVideoPlayed = useVideoStore(s => s.setVideoPlayed);
  const resetScrollToStart = useScrollStore(s => s.resetScrollToStart);
  const setScrollProgress = useScrollStore(s => s.setScrollProgress);
  const setActivePortal = usePortalStore(s => s.setActivePortal);
  const beginEpochReset = useScrollStore(s => s.beginEpochReset);
  const ensureAudioPlaying = useAudioStore(s => s.ensurePlaying);
  const audioReady = useAudioStore(s => s.audioReady);
  const mutedByUser = useAudioStore(s => s.mutedByUser);

  const cityGPUCompiled = useCityStore(s => s.cityGPUCompiled);
  const setCityGPUCompiled = useCityStore(s => s.setCityGPUCompiled);

  useEffect(() => {
    if (active && audioReady && !mutedByUser) {
      ensureAudioPlaying();
    }
  }, [active, audioReady, mutedByUser, ensureAudioPlaying]);

  useEffect(() => {
    if (maskFadeTimeoutRef.current) {
      clearTimeout(maskFadeTimeoutRef.current);
      maskFadeTimeoutRef.current = null;
    }

  if (!active) {
      setFallDone(false);
      setShowHint(true);
      setUiCaptured(false);
      setIntroMaskVisible(false);
      setMaskOpacity(0);
      return;
    }

    setIntroMaskVisible(true);
    setMaskOpacity(1);
  }, [active]);

  useEffect(() => {
    return () => {
      if (maskFadeTimeoutRef.current) {
        clearTimeout(maskFadeTimeoutRef.current);
        maskFadeTimeoutRef.current = null;
      }
    };
  }, []);

  const handleFallStart = useCallback(() => {
    setMaskOpacity(0);
    if (maskFadeTimeoutRef.current) clearTimeout(maskFadeTimeoutRef.current);
    maskFadeTimeoutRef.current = setTimeout(() => {
      setIntroMaskVisible(false);
      maskFadeTimeoutRef.current = null;
    }, 220);
  }, []);

  const handleFallFinished = useCallback(() => {
    setFallDone(true);
  }, []);

  useEffect(() => {
    if (fallDone) {
      const id = setTimeout(() => setShowHint(false), 1000);
      return () => clearTimeout(id);
    }
  }, [fallDone]);

  const isVideoPlaying = useVideoStore(s => s.isVideoPlaying);

  // Adjust roam limits (shrink a bit inside model extents)
  const roamBounds = useRef({
    minX: -450,
    maxX: 450,
    minZ: -300,
    maxZ: 300
  });

  const handleReturnToHero = useCallback(() => {
    document.exitPointerLock?.();
    document.body.style.cursor = '';

    if (maskFadeTimeoutRef.current) {
      clearTimeout(maskFadeTimeoutRef.current);
      maskFadeTimeoutRef.current = null;
    }
    setIntroMaskVisible(false);
    setMaskOpacity(0);

    // Start a new scroll epoch (activates guard & resets progression tracking)
    beginEpochReset();

    // Perform DOM / ScrollControls reset
    resetScrollToStart();
    setScrollProgress(0);

    // Defer video + portal flags until after scroll settled (still inside guard window)
    requestAnimationFrame(() => {
      setVideoPlaying(false);
      setVideoPlayed(false);
      setActivePortal(null);
    });

    setFallDone(false);
    setShowHint(true);
    setUiCaptured(false);
  }, [
    beginEpochReset,
    resetScrollToStart,
    setScrollProgress,
    setVideoPlaying,
    setVideoPlayed,
    setActivePortal
  ]);

  return (
  <>
    {introMaskVisible && active && (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: '#060a12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.18s ease-out',
        opacity: maskOpacity,
        pointerEvents: 'none'
      }}>
        {maskOpacity > 0.15 && (
          <div style={{
            width: 120,
            height: 2,
            background: 'rgba(255,255,255,0.25)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div className='city-mask-loader'/>
          </div>
        )}
      </div>
    )}

    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: active ? 2 : 0,
        opacity: active ? 1 : 0,
        transition: fade ? 'opacity 0.15s ease-out' : undefined,
        pointerEvents: active ? 'auto' : 'none',
        background: 'black'
      }}
    >
      <Canvas
        shadows={false}
        frameloop={isVideoPlaying ? 'never' : (active ? 'always' : (cityGPUCompiled ? 'demand' : 'always'))}
        gl={{
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 52, near: 0.1, far: 3400 }}
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color('#060a12');
          console.log('🎬 City Canvas created, GPU ready');
        }}
      >
        <color attach="background" args={['#060a12']} />

        {/* Base fill */}
        <ambientLight intensity={0.67} />

        {/* High moon/sun hybrid for broad city highlight */}
        <directionalLight
          position={[160, 300, 120]}
            intensity={3}
          color={'#ffffff'}
        />

        <Suspense fallback={null}>
          <CameraFall active={active} onBegin={handleFallStart} onFinished={handleFallFinished} />
          <GoBackTrigger active={active && fallDone} onTrigger={handleReturnToHero} />
          <group scale={[7.5, 7.5, 7.5]}>
            <CityModel />
          </group>

          <CityTexts
            items={[
              {
                id: 't1',
                text: 'GO BACK',
                position: [0, 16, 73],
                rotation: [0, 3.1, 0],
                fontSize: 7,
                color: 'red',
                floatAmplitude: 1,
                floatSpeed: 0.5,
              },
              {
                id: 't2',
                text: 'RESUME',
                position: [1.5, 16, -55],
                rotation: [0, 0, 0],
                fontSize: 8,
                color: 'red',
                floatAmplitude: 1.0,
                floatSpeed: 0.5,
              },
              {
                id: 't3',
                text: 'SOCIALS',
                position: [40, 16, 0],
                rotation: [0, -1.6, 0],
                fontSize: 10,
                color: 'red',
                floatAmplitude: 1,
                floatSpeed: 0.5,
              },
              {
                id: 't4',
                text: 'PROJECTS',
                position: [-37, 16, 0],
                rotation: [0, 1.6, 0],
                fontSize: 10,
                color: 'red',
                floatAmplitude: 1,
                floatSpeed: 0.5,
              },
              {
                id: 't5',
                text: 'LEETCODE',
                position:[223, 11, 28],
                rotation:[0, 4.7, 0],
                fontSize: 4.3,
                color: 'white',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                font: '/cv.otf'
              },
              {
                id: 't6',
                text: 'LINKEDIN',
                position:[173, 11, -28],
                rotation:[0, 4.7, 0],
                fontSize: 4.3,
                color: 'white',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                font: '/cv.otf'
              },
              {
                id: 't7',
                text: 'GITHUB',
                position:[73, 11, -28],
                rotation:[0, 4.7, 0],
                fontSize: 4.3,
                color: 'white',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                font: '/cv.otf'
              },
              {
                id: 't8',
                text: 'PINTEREST',
                position:[123, 11, 28],
                rotation:[0, 4.7, 0],
                fontSize: 4.3,
                color: 'white',
                floatAmplitude: 0.8,
                floatSpeed: 0.42,
                font: '/cv.otf'
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
              url="/models/df.glb"
              href="https://leetcode.com/u/AKUL_TYAGI/"
              position={[220, 8, 28]}
              rotation={[0, 4.7, 0]}
              scale={20}
              floatSpeed={7}
              floatIntensity={8}
            />
            <SocialFloatingGlb
              url="/models/dfnika.glb"
              href="https://www.linkedin.com/in/akul-tyagi/"
              position={[170, 5, -28]}
              rotation={[0, 4.7, 0]}
              scale={25}
              floatSpeed={7}
              floatIntensity={7}
            />
            <SocialFloatingGlb
              url="/models/dfoonm.glb"
              href="https://github.com/Akul-Tyagi"
              position={[70, 8, -28]}
              rotation={[0, 4.7, 0]}
              scale={5.2}
              floatSpeed={7}
              floatIntensity={8}
            />
            <SocialFloatingGlb
              url="/models/dfdf.glb"
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
              url="/models/monitor.glb"
              href='https://cureapt.vercel.app/'
              position={[-128, 12, 28]}
              rotationOrder="YXZ"
              rotation={[0, 1.6, 0]}
              scale={30}
              linkId='cureapt'
            />
            <Showcase
              url="/models/samsung.glb"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-64, 9, -37]}
              rotation={[0, 4.6, 0]}
              scale={0.13}
              linkId='naivety'
            />
            <Showcase
              url="/models/tv.glb"
              href='https://unagico.vercel.app/'
              position={[-207, 9.7, -0.15]}
              rotation={[0, 1.6, 0]}
              scale={12}
              linkId='unagi'
            />
            <Showcase
              url="/models/tv.glb"
              href='https://unagico.vercel.app/'
              position={[-199, 9.65, -24.7]}
              rotation={[0, 0.91, 0]}
              scale={12}
              linkId='unagi'
            />
            <Showcase
              url="/models/tv.glb"
              href='https://unagico.vercel.app/'
              position={[-199, 9.65, 25]}
              rotation={[0, 2.157, 0]}
              scale={12}
              linkId='unagi'
            />

            {/* Images */}
            <Showcase
              url="/models/images/naivetyhead.png"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-66, 9, -25]}
              rotation={[0, 1.5, 0]}
              scale={14}
              imageRadius={0.3}
              
            />
            <Showcase
              url="/models/images/sscureapt.png"
              href='https://cureapt.vercel.app/'
              position={[-127.98, 12, 27.7]}
              rotationOrder="YXZ"
              rotation={[0, 1.6, 0]}
              scale={12}
              scaleDamp={6.1}
              linkId='cureapt'
            />
            <Showcase
              url="/models/images/ssunagi.png"
              position={[-199, 10.03, -24.65]}
              rotation={[0, 0.91, 0]}
              href='https://unagico.vercel.app/'
              scale={13.1}
              imageRadius={0.5}
              linkId='unagi'
            />
            <Showcase
              url="/models/images/ssunagis.png"
              position={[-198.6, 10, 25.65]}
              rotation={[0, 2.156, 0]}
              href='https://unagico.vercel.app/'
              scale={13.1}
              imageRadius={0.5}
              linkId='unagi'
            />
            <Showcase
              url="/models/images/sslinkedin.png"
              position={[-207, 10.1, -0.15]}
              rotation={[0, 1.6, 0]}
              href='https://unagico.vercel.app/'
              scale={13.1}
              imageRadius={0.5}
              linkId='unagi'
            />
            <Showcase
              url="/models/images/ssnaivety.png"
              href='https://play.google.com/store/apps/details?id=com.abundance.naivety'
              position={[-64.07, 8.25, -36.9]}
              rotationOrder="YXZ"
              rotation={[0, 1.455, 0]}
              scale={12.5}
              imageRadius={0.4}
              linkId='naivety'
            />
          </group>

          <CityControls
            enabled={active && fallDone && !uiCaptured}
            uiCaptured={uiCaptured}
            bounds={roamBounds.current}
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
      <AudioToggle />
    </div>
    </>
  );
};

export default CityScene;