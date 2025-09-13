'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollStore, useVideoStore } from '@stores';

const VideoOverlay = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  const { isVideoPlaying, setVideoPlaying, setVideoPlayed, videoSrc, hasVideoPlayed } = useVideoStore();
  const scrollProgress = useScrollStore((s) => s.scrollProgress);

  // Trigger near end of scroll
  const isAtVideoTrigger = scrollProgress >= 0.995;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.readyState >= 2) setLoaded(true);
  }, [videoSrc]);

  // Start video (only if not already played before)
  useEffect(() => {
    if (hasVideoPlayed) return; // prevent any restart
    if (isAtVideoTrigger && loaded && !isVideoPlaying) {
      setVideoPlaying(true);
    }
  }, [isAtVideoTrigger, loaded, isVideoPlaying, hasVideoPlayed, setVideoPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying) {
      video.muted = true;
      video.currentTime = 0;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {/* ignore */});
      });
      document.body.style.overflow = 'hidden';
    } else {
      video.pause();
      if (!isAtVideoTrigger) document.body.style.overflow = '';
    }
  }, [isVideoPlaying, isAtVideoTrigger]);

  const finalize = () => {
    setVideoPlaying(false);
    setVideoPlayed(true); // marks as done forever
    document.body.style.overflow = '';
  };

  const handleVideoEnded = () => finalize();
  const handleSkip = () => finalize();

  // Once video has played (ended or skipped) remove overlay entirely
  if (hasVideoPlayed && !isVideoPlaying) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        opacity: isVideoPlaying ? 1 : 0,
        transition: 'opacity 0.01s ease',
        pointerEvents: isVideoPlaying ? 'all' : 'none',
        backgroundColor: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc ?? '/videos/Falling.mp4'}
        playsInline
        muted
        autoPlay
        preload="auto"
        onEnded={handleVideoEnded}
        onLoadedData={() => setLoaded(true)}
        onCanPlayThrough={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: '1.07'
        }}
      />

      {isVideoPlaying && (
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 10000,
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
};

export default VideoOverlay;