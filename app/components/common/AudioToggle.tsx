'use client';

import { useAudioStore } from '@stores';

interface AudioToggleProps {
  className?: string;
}

const AudioToggle = ({ className = '' }: AudioToggleProps) => {
  const audioReady = useAudioStore(s => s.audioReady);
  const isPlaying = useAudioStore(s => s.isPlaying);
  const toggle = useAudioStore(s => s.toggle);

  const label = isPlaying ? 'Mute background music' : 'Play background music';

  return (
    <div className={`fixed bottom-6 right-6 z-[2000] ${className}`}>
      <button
        type="button"
        aria-label={label}
        disabled={!audioReady}
        onClick={toggle}
        style={{
          width: 44,
          height: 44,
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.35)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: audioReady ? 'pointer' : 'not-allowed',
          opacity: audioReady ? 0.9 : 0.45,
          backdropFilter: 'blur(6px)',
          transition: 'transform 0.2s ease, opacity 0.2s ease',
        }}
      >
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9v6h3l4 4V5l-4 4H5z" />
            <path d="M16 9a3 3 0 010 6" />
            <path d="M18 7a6 6 0 010 10" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9v6h3l4 4V5l-4 4H5z" />
            <line x1="19" y1="9" x2="23" y2="13" />
            <line x1="23" y1="9" x2="19" y2="13" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AudioToggle;