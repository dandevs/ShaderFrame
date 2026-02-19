import { observer } from "mobx-react-lite"
import { useRef, useState, useCallback } from "react";
import { Mesh, Vector3, Plane as ThreePlane, Raycaster } from "three";
import { Plane } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export const Layer = observer(() => {
  const meshRef = useRef<Mesh>(null!);

  return (
    <>
      <Plane
        ref={e => { meshRef.current = e! }}
      >
        <meshStandardMaterial color={'#6be092'} />
      </Plane>

      {meshRef.current && <LayerResizeControl layer={meshRef.current} />}
    </>
  );
});

type HandleType = 'nw' | 'ne' | 'se' | 'sw';

// Unproject a pointer event's screen coords onto a fixed Z=0 world plane.
// This gives a stable world-space position regardless of what mesh the ray hits.
function unprojectOntoZ0(e: any, camera: any): Vector3 | null {
  const plane = new ThreePlane(new Vector3(0, 0, 1), 0);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(e.pointer, camera);
  const target = new Vector3();
  const hit = raycaster.ray.intersectPlane(plane, target);
  return hit;
}

const ResizeHandle = ({ type, layer }: { type: HandleType; layer: Mesh }) => {
  const [isHovered, setIsHovered] = useState(false);
  // Use a ref for dragging state — avoids stale closure in pointer move handler
  const isDragging = useRef(false);
  const dragStartWorld = useRef<Vector3 | null>(null);
  const startScale = useRef<Vector3 | null>(null);
  const { camera } = useThree();

  const handleSize = 0.15;

  const cornerPosition = (): [number, number, number] => {
    const s = layer.scale;
    const ox = s.x / 2 + handleSize / 2;
    const oy = s.y / 2 + handleSize / 2;
    const z = layer.position.z + 0.01;
    switch (type) {
      case 'nw': return [-ox,  oy, z];
      case 'ne': return [ ox,  oy, z];
      case 'se': return [ ox, -oy, z];
      case 'sw': return [-ox, -oy, z];
    }
  };

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    const worldPos = unprojectOntoZ0(e, camera);
    if (!worldPos) return;

    isDragging.current = true;
    dragStartWorld.current = worldPos.clone();
    startScale.current = layer.scale.clone();
    e.target.setPointerCapture(e.pointerId);
  }, [camera, layer]);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current || !dragStartWorld.current || !startScale.current) return;

    const worldPos = unprojectOntoZ0(e, camera);
    if (!worldPos) return;

    const dx = worldPos.x - dragStartWorld.current.x;
    const dy = worldPos.y - dragStartWorld.current.y;

    let newX = startScale.current.x;
    let newY = startScale.current.y;

    // Each corner drag moves one edge, scaling from center means full delta = 2× half-delta
    switch (type) {
      case 'nw': newX = startScale.current.x - dx * 2; newY = startScale.current.y + dy * 2; break;
      case 'ne': newX = startScale.current.x + dx * 2; newY = startScale.current.y + dy * 2; break;
      case 'se': newX = startScale.current.x + dx * 2; newY = startScale.current.y - dy * 2; break;
      case 'sw': newX = startScale.current.x - dx * 2; newY = startScale.current.y - dy * 2; break;
    }

    layer.scale.set(Math.max(0.05, newX), Math.max(0.05, newY), 1);
  }, [camera, layer, type]);

  const handlePointerUp = useCallback((e: any) => {
    isDragging.current = false;
    dragStartWorld.current = null;
    startScale.current = null;
    e.target.releasePointerCapture(e.pointerId);
  }, []);

  const pos = cornerPosition();

  return (
    <Plane
      position={pos}
      scale={[handleSize, handleSize, 1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <meshStandardMaterial
        color={isDragging.current ? '#ffff00' : isHovered ? '#aaaaff' : 'white'}
        transparent
        opacity={0.9}
      />
    </Plane>
  );
};

export const LayerResizeControl = observer(({ layer }: { layer: Mesh }) => {
  if (!layer) return null;

  return (
    <group name="Resize Control">
      <ResizeHandle type="nw" layer={layer} />
      <ResizeHandle type="ne" layer={layer} />
      <ResizeHandle type="se" layer={layer} />
      <ResizeHandle type="sw" layer={layer} />
    </group>
  );
});
