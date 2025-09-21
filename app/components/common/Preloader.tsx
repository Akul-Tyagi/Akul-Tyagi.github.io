'use client';

import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useVideoStore, useCityStore } from '@stores';

const GLB_URLS = [
  'models/onepiece.glb',
  'models/setup.glb',
  'models/sopranos.glb',
  'models/bb.glb',
  'models/mug1.glb',
  'models/mug2.glb',
  'models/arsenal.glb',
  'models/basketball.glb',
  'models/ps5.glb',
  'models/xm5.glb',
  'models/train.glb',
  'models/city/scene.gltf',
  'models/df.glb',
  'models/dfnika.glb',
  'models/dfoonm.glb',
  'models/dfdf.glb',
  'models/IronThrone/model_0.obj',
  'models/IronThrone/model_1.obj',
  'models/macbook.glb',
  'models/samsung.glb',
  'models/tv.glb'
];

const TEX_URLS = [
  'models/horse/Horse_low0_albedo.png',
  'models/horse/Horse_low0_normal.png',
  'models/horse/Horse_low0_roughness.png',
  'models/horse/Horse_low0_ao.png',
  'models/horse/Horse_low0_metallic.png',
  'models/IronThrone/sword_UV4.png',
  'models/images/naivetyhead.png',
  'models/images/sscureapt.png',
  'models/images/ssunagi.png',
  'models/images/ssunagis.png',
  'models/images/ssnaivety.png'
];

const CITY_GLTF_PATH = 'models/city/scene.gltf';

async function preloadCityImageURIs(): Promise<string[]> {
  try {
    const res = await fetch(CITY_GLTF_PATH, { cache: 'force-cache' });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.images) return [];
    const baseDir = CITY_GLTF_PATH.slice(0, CITY_GLTF_PATH.lastIndexOf('/') + 1);
    return json.images
      .map((img: any) => img?.uri)
      .filter(Boolean)
      .map((u: string) => baseDir + u);
  } catch {
    return [];
  }
}

async function fetchAndDecode(url: string) {
  try {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) return;
    const blob = await r.blob();
    // Decode bitmap (prevents decode hitch later)
    const img = await createImageBitmap(blob);
    img.close();
  } catch {}
}


if (typeof window !== 'undefined') {
  GLB_URLS.forEach((u) => useGLTF.preload(u));
  TEX_URLS.forEach((u) => useTexture.preload(u));
}

const VIDEO_PATH = '/videos/Falling.mp4';

const Preloader = () => {
  const setVideoSrc = useVideoStore((s) => s.setVideoSrc);
  const setCityReady = useCityStore(s => s.setCityReady);

  useEffect(() => {
    let hiddenVideo: HTMLVideoElement | null = null;
    let blobUrl: string | null = null;
    let aborted = false;

    const warmDecode = async () => {
      try {
        // 1) Fetch and fully buffer the file
        const res = await fetch(VIDEO_PATH, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Video fetch failed');
        // Put into Cache Storage as well (best-effort)
        try {
          if ('caches' in window) {
            const cache = await caches.open('media-v1');
            await cache.put(VIDEO_PATH, res.clone());
          }
        } catch {}

        const blob = await res.blob();
        if (aborted) return;
        blobUrl = URL.createObjectURL(blob);

        // 2) Create an offscreen video to warm up decoder
        hiddenVideo = document.createElement('video');
        hiddenVideo.preload = 'auto';
        hiddenVideo.playsInline = true;
        hiddenVideo.muted = true;
        hiddenVideo.src = blobUrl;
        hiddenVideo.disableRemotePlayback = true as any;
        hiddenVideo.style.position = 'fixed';
        hiddenVideo.style.left = '-10000px';
        hiddenVideo.style.top = '-10000px';
        hiddenVideo.style.width = '1px';
        hiddenVideo.style.height = '1px';
        hiddenVideo.style.opacity = '0';
        document.body.appendChild(hiddenVideo);

        // Some browsers need explicit load() to kick things off
        try { hiddenVideo.load(); } catch {}

        // Try to start playback to force decode
        try { await hiddenVideo.play(); } catch {}

        // Wait for a decoded frame (best signal that decode is warmed)
        await new Promise<void>((resolve) => {
          if (!hiddenVideo) return resolve();
          // Prefer requestVideoFrameCallback, fallback to canplaythrough/timeupdate
          const done = () => {
            hiddenVideo?.removeEventListener('canplaythrough', done);
            hiddenVideo?.removeEventListener('timeupdate', done);
            resolve();
          };
          const rvfc = (hiddenVideo as any).requestVideoFrameCallback;
          if (rvfc) {
            rvfc(() => resolve());
          } else {
            hiddenVideo.addEventListener('canplaythrough', done, { once: true });
            hiddenVideo.addEventListener('timeupdate', done, { once: true });
          }
        });

        // Pause and rewind so overlay starts at 0 instantly
        try {
          hiddenVideo?.pause();
          if (hiddenVideo) hiddenVideo.currentTime = 0;
        } catch {}

        // 3) Publish blob URL to the store for the overlay to use
        if (!aborted) setVideoSrc(blobUrl);
      } catch {
        // Fallback to direct path if anything fails
        if (!aborted) setVideoSrc(VIDEO_PATH);
      }
    };

    warmDecode();

    return () => {
      aborted = true;
      if (hiddenVideo) {
        try { hiddenVideo.pause(); } catch {}
        hiddenVideo.removeAttribute('src');
        hiddenVideo.load();
        hiddenVideo.parentNode?.removeChild(hiddenVideo);
      }
      // Keep blob URL alive for the overlay; do not revoke here.
      // If you ever need to revoke: window.addEventListener('beforeunload', () => URL.revokeObjectURL(blobUrl!))
    };
  }, [setVideoSrc]);

  // City texture prefetch + decode queue (staggered to avoid main thread spike)
  useEffect(() => {
    let aborted = false;
    (async () => {
      const urls = await preloadCityImageURIs();
      // Preload via drei (initiates TextureLoader caching)
      urls.forEach(u => { try { useTexture.preload(u); } catch {} });

      // Sequential decode to smooth CPU usage
      for (const url of urls) {
        if (aborted) break;
        await fetchAndDecode(url);
        const ric: any = (window as any).requestIdleCallback;
        await new Promise(res => {
          if (typeof ric === 'function') {
            ric(() => res(null));
          } else {
            setTimeout(res, 8);
          }
        });
      }
      if (!aborted) setCityReady(true);
    })();

    return () => { aborted = true; };
  }, [setCityReady]);

  return null;
};

export default Preloader;