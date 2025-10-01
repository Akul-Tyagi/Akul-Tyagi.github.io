'use client';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useBootStore, useCityStore, useVideoStore } from '@stores';
import { ASSET_MANIFEST } from '@constants';

THREE.Cache.enabled = true;

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const texLoader = new THREE.TextureLoader();

type Loaded = {
  phase1Gltfs: THREE.Group[];
  phase2Gltfs: THREE.Group[];
  objs: THREE.Group[];
  textures: THREE.Texture[];
  city: THREE.Group | null;
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
  const { gl, scene } = useThree();
  const setBootPhase = useBootStore(s => s.setPhase);
  const setProgress = useBootStore(s => s.setProgress);
  const markReady = useBootStore(s => s.markReady);
  const setCityReady = useCityStore(s => s.setCityReady);
  const setCityGPUCompiled = useCityStore(s => s.setCityGPUCompiled);
  const setVideoSrc = useVideoStore(s => s.setVideoSrc);

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
          phase2Gltfs: [],
          objs: [],
          textures: [],
          city: null,
          videoReady: false,
        };

        const totalAssets =
          ASSET_MANIFEST.phase1Glbs.length +
          ASSET_MANIFEST.phase2Glbs.length +
          ASSET_MANIFEST.objs.length +
          ASSET_MANIFEST.images.length +
          1;

        let completed = 0;
        const updateProgress = () => {
          completed++;
          const pct = (completed / totalAssets) * 50;
          setProgress(pct, `Loading ${completed}/${totalAssets}`);
        };

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

        // Phase 2 GLBs with error handling
        const p2Promises = ASSET_MANIFEST.phase2Glbs.map((url: string) =>
          gltfLoader.loadAsync(url)
            .then(gltf => {
              if (url.includes('city/scene.gltf')) {
                loaded.city = gltf.scene;
                console.log(`✓ Loaded city: ${url}`);
              } else {
                loaded.phase2Gltfs.push(gltf.scene);
                console.log(`✓ Loaded phase2: ${url}`);
              }
              updateProgress();
            })
            .catch(err => {
              console.error(`✗ Failed phase2: ${url}`, err);
              updateProgress();
            })
        );

        // OBJs with error handling
        const objPromises = ASSET_MANIFEST.objs.map((url: string) =>
          objLoader.loadAsync(url)
            .then(obj => {
              loaded.objs.push(obj);
              console.log(`✓ Loaded OBJ: ${url}`);
              updateProgress();
            })
            .catch(err => {
              console.error(`✗ Failed OBJ: ${url}`, err);
              updateProgress();
            })
        );

        // Textures with error handling
        const texPromises = ASSET_MANIFEST.images.map((url: string) =>
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

        await Promise.all([...p1Promises, ...p2Promises, ...objPromises, ...texPromises, videoPromise]);

        console.log('📦 All assets loaded:', {
          phase1: loaded.phase1Gltfs.length,
          phase2: loaded.phase2Gltfs.length,
          city: !!loaded.city,
          objs: loaded.objs.length,
          textures: loaded.textures.length,
          video: loaded.videoReady
        });

        setProgress(50, 'Assets loaded');
        setCityReady(true);

        // GPU compilation
        setBootPhase('compiling');
        setProgress(55, 'Preparing GPU resources');

        const cloneGroup = new THREE.Group();
        cloneGroup.visible = false;
        cloneGroup.name = 'preload-clones';

        // Phase 1 models
        loaded.phase1Gltfs.forEach(g => {
          const c = g.clone();
          c.traverse(n => {
            if ((n as THREE.Mesh).isMesh) {
              const m = n as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
            }
          });
          cloneGroup.add(c);
        });

        // Phase 2 models
        loaded.phase2Gltfs.forEach(g => cloneGroup.add(g.clone()));

        // City
        if (loaded.city) {
          const cityClone = loaded.city.clone();
          cityClone.scale.set(7.5, 7.5, 7.5);
          cityClone.traverse(n => {
            if ((n as THREE.Mesh).isMesh) {
              const m = n as THREE.Mesh;
              if (m.material) {
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat.emissive && mat.emissiveIntensity > 2) {
                  mat.emissiveIntensity = Math.min(2, mat.emissiveIntensity);
                }
              }
            }
          });
          cloneGroup.add(cityClone);
        }

        // OBJ throne
        loaded.objs.forEach(o => cloneGroup.add(o.clone()));

        scene.add(cloneGroup);

        loadedDataRef.current = loaded;
        compilePhaseRef.current = 0;

        setProgress(60, 'Compiling shaders');
      } catch (err) {
        console.error('Preload critical error:', err);
        // Still mark ready to allow site to function
        setCityReady(true);
        setCityGPUCompiled(true);
        markReady();
      }
    })();
  }, [gl, scene, setBootPhase, setProgress, markReady, setCityReady, setCityGPUCompiled, setVideoSrc]);

  useFrame(() => {
    if (!loadedDataRef.current) return;

    const pass = compilePasses.current[compilePhaseRef.current];
    if (!pass) {
      setProgress(100, 'Ready');
      setCityGPUCompiled(true);
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