import { Canvas } from '@react-three/fiber'
import { OrthographicCamera, Plane } from '@react-three/drei'
import { Mesh } from 'three'
import { useRef } from 'react'
import { ResizeHandle } from './ResizeHandle'

// -----------------------------------------------------------------------------
// Scene
// -----------------------------------------------------------------------------

function Scene(): React.JSX.Element {
  const meshRef = useRef<Mesh>(null!)

  return (
    <>
      {/* Orthographic camera positioned above, rotated to face straight down */}
      <OrthographicCamera makeDefault position={[0, 0, 10]} rotation={[0, 0, 0]} zoom={50} />

      <Plane ref={meshRef} position={[0, 0, 0]} scale={[3, 3, 3]}>
        <meshBasicMaterial color="#4a90d9" />
        <ResizeHandle meshRef={meshRef} />
      </Plane>
    </>
  )
}

export function Viewport(): React.JSX.Element {
  return (
    <Canvas frameloop="always" style={{ width: '100%', height: '100%' }}>
      <Scene />
    </Canvas>
  )
}
