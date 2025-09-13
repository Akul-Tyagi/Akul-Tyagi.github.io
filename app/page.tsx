'use client';

import { useMemo } from 'react';
import { useVideoStore } from './stores/videoStore';
import { useCityStore } from './stores/cityStore';
import CanvasLoader from "./components/common/CanvasLoader";
import ScrollWrapper from "./components/common/ScrollWrapper";
import Hero from "./components/hero";
import CityScene from "./components/common/CityScene";

const Home = () => {
  const hasVideoPlayed = useVideoStore(s => s.hasVideoPlayed);
  const isVideoPlaying = useVideoStore(s => s.isVideoPlaying);
  const cityReady = useCityStore(s => s.cityReady);

  // Phase2 active exactly when video finished
  const cityActive = useMemo(
    () => hasVideoPlayed && !isVideoPlaying && cityReady,
    [hasVideoPlayed, isVideoPlaying, cityReady]
  );

  return (
    <>
      {/* Phase 1 scroll scene (kept mounted, just faded out) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: cityActive ? 0 : 1,
          transition: 'opacity 0.18s ease',
          pointerEvents: cityActive ? 'none' : 'auto',
          zIndex: 1
        }}
      >
        <CanvasLoader>
          <ScrollWrapper>
            <Hero />
          </ScrollWrapper>
        </CanvasLoader>
      </div>

      {/* City scene always mounted & pre-rendered; activates instantly */}
      <CityScene active={cityActive} />

      {/* Only show a prep overlay if video ended but city still finalizing (rare) */}
      {hasVideoPlayed && !isVideoPlaying && !cityReady && (
        <div style={{
          position:'fixed', inset:0, display:'flex',
          alignItems:'center', justifyContent:'center',
          background:'#000', color:'#888', fontFamily:'monospace',
          zIndex: 5, fontSize: 14
        }}>
          Preparing city…
        </div>
      )}
    </>
  );
};

export default Home;