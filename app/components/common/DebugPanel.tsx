'use client';
import { useScrollStore, useVideoStore, useCityStore, useBootStore } from '@stores';

const DebugPanel = () => {
  const scrollProgress = useScrollStore(s => s.scrollProgress);
  const maxProgress = useScrollStore(s => s.maxProgress);
  const guard = useScrollStore(s => s.guard);
  const isVideoPlaying = useVideoStore(s => s.isVideoPlaying);
  const hasVideoPlayed = useVideoStore(s => s.hasVideoPlayed);
  const cityReady = useCityStore(s => s.cityReady);
  const cityGPUCompiled = useCityStore(s => s.cityGPUCompiled);
  const bootPhase = useBootStore(s => s.phase);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: '#0f0',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: 11,
      borderRadius: 4,
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      <div>Boot: {bootPhase}</div>
      <div>Scroll: {(scrollProgress * 100).toFixed(1)}%</div>
      <div>Max: {(maxProgress * 100).toFixed(1)}%</div>
      <div>Guard: {guard ? 'ON' : 'OFF'}</div>
      <div>Video: {isVideoPlaying ? 'PLAYING' : hasVideoPlayed ? 'DONE' : 'WAITING'}</div>
      <div>City: {cityReady ? '✓' : '✗'} / {cityGPUCompiled ? '✓' : '✗'}</div>
    </div>
  );
};

export default DebugPanel;