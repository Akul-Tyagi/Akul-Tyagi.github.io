'use client';

import { useGSAP } from "@gsap/react";
import { AdaptiveDpr, Preload, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { Suspense, useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import VideoOverlay from "./VideoOverlay";
import { useThemeStore, useVideoStore, useBootStore } from "@stores";
import UnifiedPreloader from './UnifiedPreloader';
import ProgressLoader from "./ProgressLoader";
import { ScrollHint } from "./ScrollHint";
import ThemeSwitcher from "./ThemeSwitcher";

const CanvasLoader = (props: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundColor = useThemeStore((state) => state.color);
  const isVideoPlaying = useVideoStore(state => state.isVideoPlaying);
  const bootProgress = useBootStore(s => s.progress);
  const bootPhase = useBootStore(s => s.phase);

  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    overflow: "hidden",
  });

  useEffect(() => {
    if (!isMobile) {
      const borderStyle = {
        inset: '1rem',
        width: 'calc(100% - 2rem)',
        height: 'calc(100% - 2rem)',
      };
      setCanvasStyle((prev) => ({ ...prev, ...borderStyle }));
    }
  }, []);

  useGSAP(() => {
    if (bootProgress === 100 && bootPhase === 'ready') {
      gsap.to('.base-canvas', { opacity: 1, duration: 1.4, delay: 0.2 });
    }
  }, [bootProgress, bootPhase]);

  useGSAP(() => {
    gsap.to(ref.current, { backgroundColor, duration: 1 });
    gsap.to(canvasRef.current, { backgroundColor, duration: 1, ...noiseOverlayStyle });
  }, [backgroundColor]);

  const noiseOverlayStyle = {
    backgroundBlendMode: "soft-light" as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E\")",
    backgroundRepeat: "repeat" as const,
    backgroundSize: "100px",
  };

  return (
    <div className="h-[100dvh] wrapper relative">
      {/* Boot loader overlay */}
      {bootPhase !== 'ready' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
          <ProgressLoader progress={bootProgress} />
        </div>
      )}

      {/* Hidden preload canvas */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1 }}>
        <Canvas gl={{ powerPreference: 'high-performance' }}>
          <UnifiedPreloader />
        </Canvas>
      </div>

      {/* Main scene canvas - STOP frameloop when video plays */}
      <div
        className="h-[100dvh] relative"
        ref={ref}
        style={{
          opacity: 1,
          pointerEvents: 'auto'
        }}
      >
        <Canvas
          className="base-canvas -translate-y-[0.5px] rounded-3xl"
          shadows
          style={{ ...canvasStyle }}
          ref={canvasRef}
          dpr={[1, isMobile ? 1.25 : 1.75]}
          frameloop={isVideoPlaying ? 'never' : 'always'} // CRITICAL FIX
          gl={{ powerPreference: 'high-performance', antialias: true }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.8} />

            {bootPhase === 'ready' && (
              <ScrollControls pages={20} damping={0.4} maxSpeed={1} distance={1} style={{ zIndex: 1 }}>
                {props.children}
              </ScrollControls>
            )}

            <Preload all />
          </Suspense>
          <AdaptiveDpr pixelated />
        </Canvas>
      </div>

      {!isVideoPlaying && <ThemeSwitcher />}
      {!isVideoPlaying && <ScrollHint />}

      <VideoOverlay />
    </div>
  );
};

export default CanvasLoader;