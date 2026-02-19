import { OrbitControls, Plane, SpotLight } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Layer } from './Layer'

export function Viewport() {
  return (
    <Canvas
      key='viewport-canvas'
      camera={{
        position: [0, 0, 5], 
        rotation: [0, 0, 0],
        zoom: 100
      }}
      orthographic
      style={{ width: '100%', height: '100%', background: '#222' }}
      frameloop='always'
    >
      {/* <OrbitControls /> */}
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      
      <Layer/>
    </Canvas>
  )
}
