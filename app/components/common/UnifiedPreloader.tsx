'use client';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { HERO_GLBS_PHASE1, HERO_GLBS_PHASE2, VIDEO_PATH } from '@/app/constants/assets';
import { preloadCityModel } from '@/app/components/models/CityModel';
import { useBootStore, useCityStore, useVideoStore, useAudioStore } from '@stores';
import { ASSET_MANIFEST } from '@constants';

THREE.Cache.enabled = true;

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const texLoader = new THREE.TextureLoader();

type Loaded = {
  phase1Gltfs: THREE.Group[];
  textures: THREE.Texture[];
  videoReady: boolean;
};

const LightRig = () => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
    <pointLight position={[0, 10, 0]} intensity={0.8} />
    <spotLight position={[0, 20, 0]} angle={0.3} penumbra={0.5} intensity={1} castShadow />
  </>
);

const UnifiedPreloader = () => {
  const hasVideoPlayed = useVideoStore(s => s.hasVideoPlayed);
  const { gl, scene } = useThree();
  const setBootPhase = useBootStore(s => s.setPhase);
  const setProgress = useBootStore(s => s.setProgress);
  const markReady = useBootStore(s => s.markReady);
  const setCityReady = useCityStore(s => s.setCityReady);
  const setCityGPUCompiled = useCityStore(s => s.setCityGPUCompiled);
  const setVideoSrc = useVideoStore(s => s.setVideoSrc);
  const setAudio = useAudioStore(s => s.setAudio);
  const setVolume = useAudioStore(s => s.setVolume);

  const startedRef = useRef(false);
  const loadedDataRef = useRef<Loaded | null>(null);
  const compilePhaseRef = useRef(0);
  const compileCamRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(52, 1, 0.1, 4000)
  );

  const compilePasses = useRef([
    { p: [0, 11, -10] as [number, number, number], l: [0, 6, 0] as [number, number, number] },
    { p: [0, -13, 5.6] as [number, number, number], l: [0, -13, 10] as [number, number, number] },
    { p: [0, -64, 10.5] as [number, number, number], l: [0, -64, 15] as [number, number, number] },
    { p: [0, 340, 0] as [number, number, number], l: [0, 6, 0] as [number, number, number] },
    { p: [0, 11, 64] as [number, number, number], l: [0, 6, 0] as [number, number, number] },
    { p: [120, 11, 120] as [number, number, number], l: [0, 11, 0] as [number, number, number] },
    { p: [-200, 9, 0] as [number, number, number], l: [-180, 9, 0] as [number, number, number] },
  ]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        setBootPhase('loading');
        setProgress(0, 'Fetching assets');

        const loaded: Loaded = {
          phase1Gltfs: [],
          textures: [],
          videoReady: false,
        };

        const totalAssets =
          ASSET_MANIFEST.phase1Glbs.length +
          ASSET_MANIFEST.phase1Images.length +
          2;

        let completed = 0;
        const updateProgress = () => {
          completed++;
          const pct = (completed / totalAssets) * 50;
          setProgress(pct, `Loading ${completed}/${totalAssets}`);
        };

        const audioPromise = new Promise<void>((resolve) => {
          const audio = new Audio('/fdfmn.mp3');
          audio.preload = 'auto';

          const cleanup = () => {
            audio.removeEventListener('canplaythrough', onReady);
            audio.removeEventListener('error', onError);
          };

          const onReady = () => {
            setVolume(0.8);
            setAudio(audio);
            updateProgress();
            resolve();
            cleanup();
          };

          const onError = (err: any) => {
            console.warn('✗ Audio preload failed', err);
            updateProgress();
            resolve();
            cleanup();
          };

          audio.addEventListener('canplaythrough', onReady, { once: true });
          audio.addEventListener('error', onError, { once: true });

          try {
            audio.load();
          } catch (err) {
            onError(err);
          }
        });

        await audioPromise;

        // Phase 1 GLBs with error handling
        const p1Promises = ASSET_MANIFEST.phase1Glbs.map((url: string) =>
          gltfLoader.loadAsync(url)
            .then(gltf => {
              loaded.phase1Gltfs.push(gltf.scene);
              console.log(`✓ Loaded phase1: ${url}`);
              updateProgress();
            })
            .catch(err => {
              console.error(`✗ Failed phase1: ${url}`, err);
              updateProgress(); // Count it anyway to keep progress moving
            })
        );

        // Textures with error handling
        const texPromises = ASSET_MANIFEST.phase1Images.map((url: string) =>
          texLoader.loadAsync(url)
            .then(tex => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.needsUpdate = true;
              loaded.textures.push(tex);
              console.log(`✓ Loaded texture: ${url}`);
              updateProgress();
            })
            .catch(err => {
              console.error(`✗ Failed texture: ${url}`, err);
              updateProgress();
            })
        );

        // Video
        const videoPromise = new Promise<void>(resolve => {
          const vid = document.createElement('video');
          vid.src = ASSET_MANIFEST.video;
          vid.preload = 'auto';
          vid.oncanplaythrough = () => {
            loaded.videoReady = true;
            setVideoSrc(ASSET_MANIFEST.video);
            console.log('✓ Video ready');
            updateProgress();
            resolve();
          };
          vid.onerror = () => {
            console.warn('✗ Video preload failed');
            updateProgress();
            resolve();
          };
          vid.load();
        });

        await Promise.all([...p1Promises, ...texPromises, videoPromise]);

        console.log('📦 All assets loaded:', {
          phase1: loaded.phase1Gltfs.length,
          textures: loaded.textures.length,
          video: loaded.videoReady
        });

        setProgress(50, 'Assets loaded');

        // GPU compilation
        setBootPhase('compiling');
        setProgress(55, 'Preparing GPU resources');

        const cloneGroup = new THREE.Group();
        cloneGroup.visible = false;
        cloneGroup.name = 'preload-clones';

        // Phase 1 models
        loaded.phase1Gltfs.forEach(g => {
          const c = g.clone();
          cloneGroup.add(c);
        });

        scene.add(cloneGroup);

        loadedDataRef.current = loaded;
        compilePhaseRef.current = 0;

        setProgress(60, 'Compiling shaders');
      } catch (err) {
        console.error('Preload critical error:', err);
        markReady();
      }
    })();
  }, [gl, scene, setBootPhase, setProgress, markReady, setVideoSrc, setAudio, setVolume]);

  useFrame(() => {
    if (!loadedDataRef.current) return;

    const pass = compilePasses.current[compilePhaseRef.current];
    if (!pass) {
      setProgress(100, 'Ready');
      markReady();
      loadedDataRef.current = null;
      return;
    }

    const cam = compileCamRef.current;
    cam.position.set(...pass.p);
    cam.lookAt(new THREE.Vector3(...pass.l));

    gl.compile(scene, cam);
    gl.render(scene, cam);

    const pct = 60 + ((compilePhaseRef.current + 1) / compilePasses.current.length) * 40;
    setProgress(pct, `Compiling pass ${compilePhaseRef.current + 1}/${compilePasses.current.length}`);

    compilePhaseRef.current++;
  }, 1);

  return <LightRig />;
};

export default UnifiedPreloader;