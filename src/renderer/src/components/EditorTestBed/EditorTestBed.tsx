import { useLocalObservable } from 'mobx-react-lite'
import { observable } from 'mobx'
import { Layer } from './layer';
import { useRef, useEffect } from 'react';
import { Inspector } from './Inspector';
import * as THREE from 'three';

interface Props {
  onBack: () => void
}

export function EditorTestBed({ onBack }: Props): React.JSX.Element {
  // create an observable state object so Inspector can react
  const state = useLocalObservable(() => new EditorState(new Layer()))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    state.canvas = canvas
    state.renderer = renderer
    state.scene = scene
    state.camera = camera

    // example geometry so we see something
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshNormalMaterial()
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    function animate() {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    resize()
    animate()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [state])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>
      <div style={{ padding: '8px 12px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <button onClick={onBack} style={{ cursor: 'pointer' }}>
          ← Back
        </button>
        <span style={{ marginLeft: 12, color: '#aaa', fontSize: 13 }}>
          EditorTestBed – Viewport
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <Inspector state={state} />
      </div>
    </div>
  )
}

export class EditorState {
  @observable public selectedLayer: Layer | null = null
  @observable public rootLayer: Layer

  // vanilla three renderer and canvas info
  public canvas: HTMLCanvasElement | null = null
  public renderer: THREE.WebGLRenderer | null = null
  public scene: THREE.Scene | null = null
  public camera: THREE.PerspectiveCamera | null = null

  constructor(rootLayer: Layer) {
    this.rootLayer = rootLayer
  }
}
