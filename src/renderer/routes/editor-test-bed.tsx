import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Viewport } from '../components/Editor/Viewport'
import { Inspector } from '../components/Editor/Inspector'
import { Canvas, ThreeElements, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Mesh } from 'three'

export const Route = createFileRoute('/editor-test-bed')({
  component: EditorTestBed,
})

function EditorTestBed() {
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#111'
    }}>
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>

        <Viewport />

        {/* Overlay back button */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
          <Link
            to="/"
            style={{
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              backdropFilter: 'blur(4px)',
              fontFamily: 'sans-serif'
            }}
          >
            ← Back
          </Link>
        </div>
      </div>

      <Inspector />
    </div>
  )
}

function Box(props: ThreeElements['mesh']) {
  const meshRef = useRef<Mesh>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  useFrame((state, delta) => (meshRef.current.rotation.x += delta))
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxGeometry scale={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : '#2f74c0'} />
    </mesh>
  )
}