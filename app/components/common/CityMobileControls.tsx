'use client';

import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CityMobileControlsProps {
  enabled: boolean;
  bounds: Bounds;
  keepY?: number;
  lookSpeed?: number;
  tapStep?: number;
  doubleTapStep?: number;
  tapThresholdPx?: number;
  doubleTapMs?: number;
}

const clampToBounds = (v: THREE.Vector3, b: Bounds) => {
  v.x = THREE.MathUtils.clamp(v.x, b.minX, b.maxX);
  v.z = THREE.MathUtils.clamp(v.z, b.minZ, b.maxZ);
};

const CityMobileControls = ({
  enabled,
  bounds,
  keepY = 11,
  lookSpeed = 0.008,
  tapStep = 10,
  doubleTapStep = 24,
  tapThresholdPx = 6,
  doubleTapMs = 280,
}: CityMobileControlsProps) => {
  const { camera } = useThree();

  const yaw = useRef(0);
  const pitch = useRef(0);

  const activeId = useRef<number | null>(null);
  const lastTapAt = useRef(0);
  const moved = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    pitch.current = e.x;
    yaw.current = e.y;
  }, [enabled, camera]);

  const applyLookDelta = (dx: number, dy: number) => {
    yaw.current -= dx * lookSpeed;
    pitch.current -= dy * lookSpeed;
    const maxPitch = Math.PI / 2 - 0.05;
    pitch.current = THREE.MathUtils.clamp(pitch.current, -maxPitch, maxPitch);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
  };

  const moveForward = (dist: number) => {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    camera.position.addScaledVector(forward, dist);
    camera.position.y = keepY;
    clampToBounds(camera.position, bounds);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    activeId.current = e.pointerId;
    moved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || activeId.current !== e.pointerId) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    if (Math.abs(dx) + Math.abs(dy) > tapThresholdPx) {
      moved.current = true;
    }

    lastPos.current = { x: e.clientX, y: e.clientY };

    // Look around
    applyLookDelta(dx, dy);
    camera.position.y = keepY;
    clampToBounds(camera.position, bounds);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeId.current !== e.pointerId) return;

    const now = performance.now();
    if (!moved.current) {
      const isDouble = now - lastTapAt.current <= doubleTapMs;
      moveForward(isDouble ? doubleTapStep : tapStep);
      lastTapAt.current = now;
    }

    activeId.current = null;
    moved.current = false;
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    moved.current = false;
  };

  if (!enabled) return null;

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
    </Html>
  );
};

export default CityMobileControls;