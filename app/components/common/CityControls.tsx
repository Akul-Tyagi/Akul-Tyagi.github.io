'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useCityCollisionStore } from '@stores';

interface CityControlsProps {
  enabled: boolean;
  keepY?: number;
  baseStep?: number;        // base forward distance
  boostMultiplier?: number; // Shift key multiplier
  moveDuration?: number;    // seconds per step
  sensitivity?: number;     // mouse look sensitivity
  collisionBuffer?: number; // clearance from building
  easing?: number;          // camera tween easing factor
}

const tmpVec = new THREE.Vector3();
const ray = new THREE.Ray();
const worldDir = new THREE.Vector3();

const CityControls = ({
  enabled,
  keepY = 7,
  baseStep = 34,
  boostMultiplier = 3,
  moveDuration = 0.4,
  sensitivity = 0.0008,
  collisionBuffer = 10,
  easing = 0.15
}: CityControlsProps) => {
  const { camera, gl } = useThree();
  const boxes = useCityCollisionStore(s => s.boxes);

  // Keep latest boxes in a ref so we don't rebind listeners
  const boxesRef = useRef<THREE.Box3[]>([]);
  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  // Orientation (yaw/pitch in radians)
  const yaw = useRef(0);
  const pitch = useRef(0);
  const targetQuat = useRef(new THREE.Quaternion());

  // Movement tween
  const moving = useRef(false);
  const moveStart = useRef(new THREE.Vector3());
  const moveEnd = useRef(new THREE.Vector3());
  const moveT = useRef(0);

  // Interaction state
  const pointerLocked = useRef(false);
  const dragActive = useRef(false);
  const lastPos = useRef<{x:number;y:number}|null>(null);
  const aimActive = useRef(false); // after first click
  const shiftDown = useRef(false);

  // Initialize yaw/pitch once when enabled flips true
  useEffect(() => {
    if (!enabled) return;
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    pitch.current = e.x;
    yaw.current = e.y;
  }, [enabled, camera]);

  // Stable event listeners (do NOT depend on boxes)
  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement as HTMLCanvasElement & {
      webkitRequestPointerLock?: () => void;
      mozRequestPointerLock?: () => void;
    };
    canvas.style.pointerEvents = 'auto'; // explicit
    canvas.tabIndex = 0;

    const requestLock = () => {
      (canvas.requestPointerLock ||
       canvas.webkitRequestPointerLock ||
       (canvas as any).mozRequestPointerLock)?.call(canvas);
    };

    const applyDelta = (dx: number, dy: number) => {
      yaw.current -= dx * sensitivity;
      pitch.current -= dy * sensitivity;
      const maxPitch = Math.PI / 2 - 0.05;
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current));
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!aimActive.current) return;
      if (pointerLocked.current) {
        applyDelta(e.movementX, e.movementY);
      } else if (dragActive.current && lastPos.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        applyDelta(dx, dy);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      if (!aimActive.current) aimActive.current = true;
      dragActive.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (!pointerLocked.current) requestLock();
    };

    const onPointerUp = () => {
      dragActive.current = false;
      lastPos.current = null;
    };

    const onClick = () => {
      if (!pointerLocked.current) requestLock();
      if (!aimActive.current) aimActive.current = true;
    };

    const onDblClick = (e: MouseEvent) => {
      if (!aimActive.current) aimActive.current = true;
      e.preventDefault();
      if (!pointerLocked.current) requestLock();
      if (moving.current) return;

      camera.getWorldDirection(worldDir);
      // Flatten Y safely
      worldDir.y = 0;
      const lenSq = worldDir.lengthSq();
      if (lenSq < 1e-6) return; // avoid NaN normalize
      worldDir.normalize();

      // Distance with boost
      let desired = baseStep * (shiftDown.current ? boostMultiplier : 1);

      // Ray collision test
      ray.origin.copy(camera.position);
      ray.direction.copy(worldDir);

      for (const box of boxesRef.current) {
        if (box.containsPoint(ray.origin)) continue;
        const hit = ray.intersectBox(box, tmpVec);
        if (hit) {
          const dist = ray.origin.distanceTo(hit) - collisionBuffer;
            if (dist > 0 && dist < desired) desired = dist;
        }
      }

      if (desired < 0.5) return;

      moveStart.current.copy(camera.position);
      moveEnd.current.copy(camera.position).addScaledVector(worldDir, desired);
      moveEnd.current.y = keepY;
      moveT.current = 0;
      moving.current = true;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pointerLocked.current) {
        document.exitPointerLock?.();
        (document as any).webkitExitPointerLock?.();
      }
      if (e.key === 'Shift') shiftDown.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftDown.current = false;
    };
    const onLockChange = () => {
      pointerLocked.current = document.pointerLockElement === canvas;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('dblclick', onDblClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [enabled, gl, camera, sensitivity, baseStep, boostMultiplier, collisionBuffer, keepY, moveDuration]); // removed boxes

  useFrame((_, dt) => {
    if (!enabled) return;

    // Rotation smoothing (simple lerp / slerp factor)
    targetQuat.current.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
    camera.quaternion.slerp(targetQuat.current, 1 - Math.exp(-easing * (dt * 60)));

    // Keep constant altitude
    camera.position.y = keepY;

    // Movement tween
    if (moving.current) {
      moveT.current += dt / moveDuration;
      const t = moveT.current >= 1 ? 1 : moveT.current;
      camera.position.lerpVectors(moveStart.current, moveEnd.current, t);
      if (t === 1) moving.current = false;
    }
  });

  return null;
};

export default CityControls;