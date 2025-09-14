
'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CityControlsProps {
  enabled: boolean;
  keepY?: number;
  baseStep?: number;
  sensitivity?: number;
  walkSpeed?: number;
  sprintMultiplier?: number;
  bounds: Bounds;
  lookDamp?: number;              // (legacy – no longer used directly)
  moveDamp?: number;
  maxLookDelta?: number;
  stepImpulseScale?: number;
  lookResponsiveness?: number;    // new: higher = tighter tracking
  microJitterSmoothing?: number;  // 0..1 blend toward trimmed mean
}

const CityControls = ({
  enabled,
  keepY = 11,
  baseStep = 12,
  sensitivity = 0.00085,          // slightly lower due to higher responsiveness
  walkSpeed = 26,
  sprintMultiplier = 2,
  bounds,
  moveDamp = 11,
  maxLookDelta = 320,
  stepImpulseScale = 1.0,
  lookResponsiveness = 90,        // 40–70 good range
  microJitterSmoothing = 0.30    // 0.15–0.35 subtle smoothing
}: CityControlsProps) => {
  const { camera, gl } = useThree();

  // Orientation
  const yaw = useRef(0);
  const pitch = useRef(0);
  const yawTarget = useRef(0);
  const pitchTarget = useRef(0);

  // Movement
  const keys = useRef<Set<string>>(new Set());
  const shiftDown = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const stepImpulse = useRef(new THREE.Vector3());

  // Look buffers
  const lookBuffer = useRef<{ x:number; y:number }>({ x:0, y:0 });
  const sampleX = useRef<number[]>([]);
  const sampleY = useRef<number[]>([]);

  // Interaction state
  const firstClickDone = useRef(false);
  const pointerLocked = useRef(false);

  // Temps
  const vForward = new THREE.Vector3();
  const vRight = new THREE.Vector3();
  const UP = new THREE.Vector3(0,1,0);

  useEffect(() => {
    if (!enabled) return;
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    pitch.current = pitchTarget.current = e.x;
    yaw.current = yawTarget.current = e.y;
  }, [enabled, camera]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement as HTMLCanvasElement & {
      webkitRequestPointerLock?: () => void;
      mozRequestPointerLock?: () => void;
    };
    canvas.tabIndex = 0;

    const requestLock = () => {
      if (pointerLocked.current) return;
      (canvas.requestPointerLock ||
        canvas.webkitRequestPointerLock ||
        (canvas as any).mozRequestPointerLock)?.call(canvas);
    };

    const addStepImpulse = () => {
      camera.getWorldDirection(vForward).setY(0);
      if (vForward.lengthSq() < 1e-5) return;
      vForward.normalize();
      stepImpulse.current.addScaledVector(vForward, baseStep * stepImpulseScale);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!firstClickDone.current) {
        firstClickDone.current = true;
        requestLock();
        return;
      }
      if (!pointerLocked.current) requestLock();
      addStepImpulse();
    };

    const pushLookDelta = (dx: number, dy: number) => {
      lookBuffer.current.x += dx;
      lookBuffer.current.y += dy;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!enabled || !pointerLocked.current) return;
      pushLookDelta(e.movementX, e.movementY);
    };

    const onRaw = (e: PointerEvent) => {
      if (!enabled || !pointerLocked.current) return;
      pushLookDelta(e.movementX, e.movementY);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointerLocked.current) document.exitPointerLock?.();
        return;
      }
      if (e.key === 'Shift') shiftDown.current = true;
      const k = e.key.toLowerCase();
      if (['w','a','s','d'].includes(k)) keys.current.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftDown.current = false;
      const k = e.key.toLowerCase();
      if (['w','a','s','d'].includes(k)) keys.current.delete(k);
    };

    const onLockChange = () => {
      pointerLocked.current = (document.pointerLockElement === canvas);
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    canvas.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('pointerrawupdate', onRaw as any);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerrawupdate', onRaw as any);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [enabled, gl, camera, baseStep, stepImpulseScale]);

  // Helper: trimmed mean smoothing for delta
  function smoothDelta(samplesRef: React.MutableRefObject<number[]>, raw: number) {
    const arr = samplesRef.current;
    arr.push(raw);
    if (arr.length > 6) arr.shift();
    if (arr.length < 3) return raw;

    const sorted = [...arr].sort((a,b)=>a-b);
    if (sorted.length > 4) {
      // drop min & max
      sorted.shift();
      sorted.pop();
    }
    const avg = sorted.reduce((a,b)=>a+b,0) / sorted.length;
    // Light blend: keeps immediacy while shaving high‑freq jitter
    return THREE.MathUtils.lerp(raw, avg, microJitterSmoothing);
  }

  useFrame((_, rawDt) => {
    if (!enabled) return;

    // Only clamp extreme stalls (tab switches). Else keep real dt for proper feel.
    const dt = Math.min(rawDt, 0.1);

    // --- LOOK ---
    const buf = lookBuffer.current;
    if (buf.x !== 0 || buf.y !== 0) {
      let dx = buf.x;
      let dy = buf.y;

      // Hard spike reject (very rare)
      const mag = Math.hypot(dx, dy);
      if (mag > maxLookDelta * 8) {
        dx = 0; dy = 0;
      } else {
        dx = THREE.MathUtils.clamp(dx, -maxLookDelta, maxLookDelta);
        dy = THREE.MathUtils.clamp(dy, -maxLookDelta, maxLookDelta);

        // Trimmed-mean smoothing (low latency)
        dx = smoothDelta(sampleX, dx);
        dy = smoothDelta(sampleY, dy);

        yawTarget.current -= dx * sensitivity;
        pitchTarget.current -= dy * sensitivity;
      }
      buf.x = 0;
      buf.y = 0;
    }

    // Normalize yaw occasionally
    if (Math.abs(yawTarget.current) > Math.PI * 500) {
      yawTarget.current = ((yawTarget.current + Math.PI) % (Math.PI * 2)) - Math.PI;
      yaw.current = yawTarget.current;
    }

    // Pitch clamp
    const maxPitch = Math.PI/2 - 0.05;
    pitchTarget.current = THREE.MathUtils.clamp(pitchTarget.current, -maxPitch, maxPitch);

    // Fast responsive damping (analytic exponential)
    const lookAlpha = 1 - Math.exp(-lookResponsiveness * dt);
    yaw.current += (yawTarget.current - yaw.current) * lookAlpha;
    pitch.current += (pitchTarget.current - pitch.current) * lookAlpha;

    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
    camera.position.y = keepY;

    // --- MOVEMENT ---
    targetVelocity.current.set(0,0,0);
    if (keys.current.size) {
      const forwardFactor = (keys.current.has('w') ? 1 : 0) + (keys.current.has('s') ? -1 : 0);
      const strafeFactor  = (keys.current.has('d') ? 1 : 0) + (keys.current.has('a') ? -1 : 0);
      if (forwardFactor || strafeFactor) {
        vForward.set(0,0,-1).applyQuaternion(camera.quaternion).setY(0).normalize();
        vRight.copy(vForward).cross(UP).normalize();
        const speed = walkSpeed * (shiftDown.current ? sprintMultiplier : 1);
        if (forwardFactor) targetVelocity.current.addScaledVector(vForward, forwardFactor * speed);
        if (strafeFactor)  targetVelocity.current.addScaledVector(vRight, strafeFactor * speed);
      }
    }

    if (stepImpulse.current.lengthSq() > 1e-5) {
      targetVelocity.current.add(stepImpulse.current);
      const decay = Math.pow(0.5, dt / 0.18); // half-life ~0.18s
      stepImpulse.current.multiplyScalar(decay);
      if (stepImpulse.current.lengthSq() < 1e-4) stepImpulse.current.set(0,0,0);
    }

    // Velocity smoothing (exponential)
    const moveAlpha = 1 - Math.exp(-moveDamp * dt);
    velocity.current.lerp(targetVelocity.current, moveAlpha);

    if (Number.isFinite(velocity.current.x) && Number.isFinite(velocity.current.z)) {
      camera.position.addScaledVector(velocity.current, dt);
    }

    clampToBounds(camera.position, bounds);
  });

  return null;
};

function clampToBounds(v: THREE.Vector3, b: Bounds) {
  v.x = THREE.MathUtils.clamp(v.x, b.minX, b.maxX);
  v.z = THREE.MathUtils.clamp(v.z, b.minZ, b.maxZ);
}

export default CityControls;