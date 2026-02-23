import { Canvas } from '@react-three/fiber'


export function Viewport(): React.JSX.Element {
  return (
    <Canvas frameloop="always" style={{ width: '100%', height: '100%' }}>

    </Canvas>
  )
}
