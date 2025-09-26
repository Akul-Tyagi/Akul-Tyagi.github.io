'use client';

import { useEffect, useRef } from 'react';
import { useScrollStore, useVideoStore } from '@stores';

const TRIGGER_THRESHOLD = 0.995;
const MIN_INTENT_PROGRESS = 0.6;

const VideoOverlay = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video store pieces (each selector stable, no tuple needed)
  const isVideoPlaying = useVideoStore(s => s.isVideoPlaying);
  const hasVideoPlayed = useVideoStore(s => s.hasVideoPlayed);
  const videoSrc = useVideoStore(s => s.videoSrc);
  const setVideoPlaying = useVideoStore(s => s.setVideoPlaying);
  const setVideoPlayed = useVideoStore(s => s.setVideoPlayed);

  // Scroll store pieces (separate selectors avoid tuple typing + equality issues)
  const scrollProgress = useScrollStore(s => s.scrollProgress);
  const resetEpoch = useScrollStore(s => s.resetEpoch);
  const guard = useScrollStore(s => s.guard);
  const maxProgress = useScrollStore(s => s.maxProgress);

  // Internal refs
  const prevProgressRef = useRef(0);
  const seenEpochRef = useRef(resetEpoch);

  // Re-arm per epoch
  useEffect(() => {
    if (seenEpochRef.current !== resetEpoch) {
      seenEpochRef.current = resetEpoch;
      prevProgressRef.current = 0;
    }
  }, [resetEpoch]);

  const atVideoTrigger = !guard && scrollProgress >= TRIGGER_THRESHOLD;

  // Forward crossing trigger
  useEffect(() => {
    if (hasVideoPlayed) return;
    if (isVideoPlaying) return;
    if (guard) return;
    if (maxProgress < MIN_INTENT_PROGRESS) return;

    const prev = prevProgressRef.current;
    const now = scrollProgress;
    if (prev < TRIGGER_THRESHOLD && now >= TRIGGER_THRESHOLD) {
      setVideoPlaying(true);
    }
    prevProgressRef.current = now;
  }, [
    scrollProgress,
    guard,
    maxProgress,
    hasVideoPlayed,
    isVideoPlaying,
    setVideoPlaying
  ]);

  // Playback side-effects
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying) {
      try { video.pause(); } catch {}
      video.muted = true;
      try { video.currentTime = 0; } catch {}
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
      document.body.style.overflow = 'hidden';
    } else {
      try { video.pause(); } catch {}
      if (!atVideoTrigger) document.body.style.overflow = '';
    }
  }, [isVideoPlaying, atVideoTrigger]);

  const finalize = () => {
    if (!isVideoPlaying) return;
    setVideoPlaying(false);
    setVideoPlayed(true);
    document.body.style.overflow = '';
  };

  const handleVideoEnded = () => finalize();
  const handleSkip = () => finalize();

  if (hasVideoPlayed && !isVideoPlaying) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        opacity: isVideoPlaying ? 1 : 0,
        transition: 'opacity 0.12s linear',
        pointerEvents: isVideoPlaying ? 'all' : 'none',
        backgroundColor: '#000'
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
            bottom: 20,
            right: 20,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
};

export default VideoOverlay;