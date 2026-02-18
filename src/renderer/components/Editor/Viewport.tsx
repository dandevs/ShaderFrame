/* eslint-disable react/no-unknown-property */
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export function Viewport() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#222' }}>
      <Canvas frameloop="demand" camera={{ position: [0, 0, 5], zoom: 1 }} orthographic>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
        <OrbitControls makeDefault />
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  )
}
