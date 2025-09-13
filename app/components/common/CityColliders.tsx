'use client';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useCityCollisionStore } from '@stores';

interface Props {
  rootRef: React.RefObject<THREE.Group | null>;
  active: boolean;
}

const CityColliders = ({ rootRef, active }: Props) => {
  const setBoxes = useCityCollisionStore(s => s.setBoxes);
  const built = useCityCollisionStore(s => s.built);
  const setBuilt = useCityCollisionStore(s => s.setBuilt);

  useEffect(() => {
    if (!active) return;
    if (built) return;
    if (!rootRef.current) return;

    const boxes: THREE.Box3[] = [];
    rootRef.current.updateWorldMatrix(true, true);

    rootRef.current.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      if (!bb) return;
      const worldBox = new THREE.Box3().copy(bb).applyMatrix4(mesh.matrixWorld);

      const size = new THREE.Vector3();
      worldBox.getSize(size);
      if (Math.max(size.x, size.z) < 3) return;

      worldBox.expandByScalar(-0.5);
      boxes.push(worldBox);
    });

    setBoxes(boxes);
    setBuilt(true);
  }, [active, built, rootRef, setBoxes, setBuilt]);

  return null;
};

export default CityColliders;