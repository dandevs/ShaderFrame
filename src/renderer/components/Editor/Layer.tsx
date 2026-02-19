import { observer } from "mobx-react-lite"
import { useRef, useState, useCallback, useMemo } from "react";
import { Mesh, Vector3, Plane as ThreePlane, Raycaster, ShaderMaterial } from "three";
import { Plane } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";

// Wavy gradient shader component
const WavyGradientMaterial = () => {
  const materialRef = useRef<ShaderMaterial | null>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={{
        uTime: { value: 0 }
      }}
      vertexShader={`
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float uTime;
        varying vec2 vUv;
        
        void main() {
          // Wavy pattern using sine waves
          float wave1 = sin(vUv.x * 10.0 + uTime * 0.5) * 0.5 + 0.5;
          float wave2 = sin(vUv.y * 8.0 + uTime * 0.3) * 0.5 + 0.5;
          float wave3 = sin((vUv.x + vUv.y) * 6.0 + uTime * 0.4) * 0.5 + 0.5;
          
          // Combine waves
          float wave = (wave1 + wave2 + wave3) / 3.0;
          
          // Add diagonal gradient
          float diagonal = (vUv.x + vUv.y) * 0.5;
          
          // Mix with wave
          float pattern = mix(diagonal, wave, 0.7);
          
          // Blue and red colors
          vec3 blue = vec3(0.0, 0.3, 1.0);
          vec3 red = vec3(1.0, 0.1, 0.2);
          
          // Mix colors based on pattern
          vec3 color = mix(blue, red, pattern);
          
          // Add some shimmer
          float shimmer = sin(vUv.x * 20.0 + vUv.y * 15.0 + uTime * 2.0) * 0.1 + 0.9;
          color *= shimmer;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `}
    />
  );
};

export const Layer = observer(() => {
  const meshRef = useRef<Mesh>(null!);

  return (
    <>
      <Plane ref={e => { meshRef.current = e! }}>
        <WavyGradientMaterial />
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for drag state to avoid stale closure issues
  const dragStartWorld = useRef<Vector3 | null>(null);
  const startScale = useRef<Vector3 | null>(null);
  const startPos = useRef<Vector3 | null>(null);
  
  // Refs to track layer transforms during drag
  const layerScaleRef = useRef<Vector3 | null>(null);
  const layerPosRef = useRef<Vector3 | null>(null);
  
  const { camera, invalidate } = useThree();

  const handleSize = 0.15;

  // Get current layer transform (from refs during drag, from mesh otherwise)
  const getLayerTransform = () => {
    if (layerScaleRef.current && layerPosRef.current && isDragging) {
      return {
        scale: layerScaleRef.current,
        position: layerPosRef.current
      };
    }
    return {
      scale: layer.scale,
      position: layer.position
    };
  };

  // Memoized handle position based on current layer transform
  const handlePosition = useMemo(() => {
    const { scale, position } = getLayerTransform();
    const ox = scale.x / 2;
    const oy = scale.y / 2;
    const z = position.z + 0.01;
    
    switch (type) {
      case 'nw': return [position.x - ox,  position.y + oy, z];
      case 'ne': return [position.x + ox,  position.y + oy, z];
      case 'se': return [position.x + ox,  position.y - oy, z];
      case 'sw': return [position.x - ox,  position.y - oy, z];
    }
  }, [getLayerTransform, type, isDragging]);

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    const worldPos = unprojectOntoZ0(e, camera);
    if (!worldPos) return;

    setIsDragging(true);
    dragStartWorld.current = worldPos.clone();
    startScale.current = layer.scale.clone();
    startPos.current = layer.position.clone();
    
    // Initialize refs with current layer state
    layerScaleRef.current = layer.scale.clone();
    layerPosRef.current = layer.position.clone();
    
    e.target.setPointerCapture(e.pointerId);
  }, [camera, layer]);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging || !dragStartWorld.current || !startScale.current || !startPos.current) return;

    const worldPos = unprojectOntoZ0(e, camera);
    if (!worldPos) return;

    const dx = worldPos.x - dragStartWorld.current.x;
    const dy = worldPos.y - dragStartWorld.current.y;

    // Corner-anchored scaling: opposite corner stays fixed
    let newScaleX = startScale.current.x;
    let newScaleY = startScale.current.y;
    let newPosX = startPos.current.x;
    let newPosY = startPos.current.y;

    switch (type) {
      case 'nw':
        newScaleX = startScale.current.x - dx;
        newScaleY = startScale.current.y + dy;
        newPosX = startPos.current.x - dx / 2;
        newPosY = startPos.current.y + dy / 2;
        break;
      case 'ne':
        newScaleX = startScale.current.x + dx;
        newScaleY = startScale.current.y + dy;
        newPosX = startPos.current.x + dx / 2;
        newPosY = startPos.current.y + dy / 2;
        break;
      case 'se':
        newScaleX = startScale.current.x + dx;
        newScaleY = startScale.current.y - dy;
        newPosX = startPos.current.x + dx / 2;
        newPosY = startPos.current.y - dy / 2;
        break;
      case 'sw':
        newScaleX = startScale.current.x - dx;
        newScaleY = startScale.current.y - dy;
        newPosX = startPos.current.x - dx / 2;
        newPosY = startPos.current.y - dy / 2;
        break;
    }

    // Update refs
    layerScaleRef.current = new Vector3(Math.max(0.05, newScaleX), Math.max(0.05, newScaleY), 1);
    layerPosRef.current = new Vector3(newPosX, newPosY, startPos.current.z);
    
    // Update Three.js mesh
    layer.scale.copy(layerScaleRef.current);
    layer.position.copy(layerPosRef.current);
    
    // Trigger re-render
    invalidate();
  }, [camera, layer, type, isDragging, invalidate]);

  const handlePointerUp = useCallback((e: any) => {
    setIsDragging(false);
    dragStartWorld.current = null;
    startScale.current = null;
    startPos.current = null;
    layerScaleRef.current = null;
    layerPosRef.current = null;
    e.target.releasePointerCapture(e.pointerId);
    invalidate();
  }, [invalidate]);

  return (
    <Plane
      position={handlePosition as [number, number, number]}
      scale={[handleSize, handleSize, 1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <meshStandardMaterial
        color={isDragging ? '#ffff00' : isHovered ? '#aaaaff' : 'white'}
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
