import { Canvas } from '@react-three/fiber'

export function Viewport() {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 5], 
        zoom: 1,
        type: 'OrthographicCamera',
        left: -10,
        right: 10,
        top: 10,
        bottom: -10,
        near: 0.1,
        far: 1000
      }}
      style={{ width: '100%', height: '100%', background: '#222' }}
      frameloop="demand"
    >
      <SceneContent />
    </Canvas>
  )
}

function SceneContent() {
  return (
    <>
      <mesh>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <planeGeometry args={[2, 2]} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <meshBasicMaterial color="#444" />
      </mesh>
    </>
  )
}
