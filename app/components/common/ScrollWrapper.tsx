'use client';

import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { useRef } from "react";
import { usePortalStore, useScrollStore } from "@stores";

const ScrollWrapper = (props: { children: React.ReactNode | React.ReactNode[]}) => {
  const { camera } = useThree();
  const data = useScroll();
  const isActive = usePortalStore((state) => !!state.activePortalId);
  const setScrollProgress = useScrollStore((state) => state.setScrollProgress);
  const HORSE_PIN_END = 0.8;         // where your Y drop currently starts (acts as “pin end” trigger)
  const SECOND_TILT_LEN = 0.15;  

  /// After the tilt completes, move forward along Z (toward the train)
  const Z2_SCROLL_START = HORSE_PIN_END + SECOND_TILT_LEN; // ~0.95
  const Z2_SCROLL_LEN = 0.35;          // how long we scroll in Z
  const Z2_SCROLL_DISTANCE = 97;       // how far to move along Z (positive = forward, negative = back)

  // Locks so we freeze Y/Z at the hand-off moment
  const zLockRef = useRef<number | null>(null);
  const yLockRef = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (data) {
      // A: up -> straight tilt
      const a = data.range(0, 0.3);
      // B: first Y descent
      const b = data.range(0.3, 0.5);
      // D: pre-tilt Z cruise
      const d = data.range(0.85, 0.18);
      // C: straight->down tilt near horse “pin end”
      const c = data.range(HORSE_PIN_END, SECOND_TILT_LEN);
      // E: second Z movement after tilt completes
      const e = data.range(Z2_SCROLL_START, Z2_SCROLL_LEN);

      // Hand-off locks (capture baselines at start of E)
      if (e > 0 && zLockRef.current === null) {
        zLockRef.current = camera.position.z;
        yLockRef.current = camera.position.y;
      }
      if (e === 0 && (zLockRef.current !== null || yLockRef.current !== null)) {
        zLockRef.current = null;
        yLockRef.current = null;
      }


      if (!isActive) {
        // Pitch: first -90deg via a, then another -90deg via c
        const rotXTarget = -0.5 * Math.PI * (a + c);
        camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, rotXTarget, 5, delta);

        // Y: descend during B, then freeze at hand-off (no further Y movement)
        const yDuringB = -67 * b;
        const yTarget = e > 0 ? (yLockRef.current ?? yDuringB) : yDuringB;
        camera.position.y = THREE.MathUtils.damp(camera.position.y, yTarget, 7, delta);

        // Z: cruise during D, then advance forward during E from the locked baseline
        const zDuringD = 5 + 10 * d;
        const zBaseAtHandoff = zLockRef.current ?? zDuringD;
        const zTarget = e > 0 ? zBaseAtHandoff + Z2_SCROLL_DISTANCE * e : zDuringD;
        camera.position.z = THREE.MathUtils.damp(camera.position.z, zTarget, 7, delta);

        // X: keep centered
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 7, delta);

        setScrollProgress(data.range(0, 1));
      }

      // Move camera slightly on mouse movement.
      if (!isMobile && !isActive) {
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -(state.pointer.x * Math.PI) / 90, 0.05);
      }
    }
  });

  const children = Array.isArray(props.children) ? props.children : [props.children];

  return <>
    {children.map((child, index) => {
      return <group key={index}>
        {child}
      </group>
    })}
  </>
}

export default ScrollWrapper;