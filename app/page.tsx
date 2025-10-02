'use client';

import { useMemo } from 'react';
import { useVideoStore, useCityStore } from '@stores';
import CanvasLoader from "./components/common/CanvasLoader";
import ScrollWrapper from "./components/common/ScrollWrapper";
import Hero from "./components/hero";
import CityScene from "./components/common/CityScene";

const Home = () => {
  const hasVideoPlayed = useVideoStore(s => s.hasVideoPlayed);
  const isVideoPlaying = useVideoStore(s => s.isVideoPlaying);
  const cityReady = useCityStore(s => s.cityReady);
  const cityGPUCompiled = useCityStore(s => s.cityGPUCompiled);

  // City becomes active after video completely finished
  const cityActive = useMemo(
    () => hasVideoPlayed && !isVideoPlaying && cityReady && cityGPUCompiled,
    [hasVideoPlayed, isVideoPlaying, cityReady, cityGPUCompiled]
  );

  // Only mount City Scene AFTER video has played (not during)
  const shouldMountCity = hasVideoPlayed || cityActive;

  return (
    <>  
      {/* Phase 1 scroll scene */}
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

      {/* City scene - ONLY mount after video played */}
      {shouldMountCity && <CityScene active={cityActive} />}
    </>
  );
};

export default Home;