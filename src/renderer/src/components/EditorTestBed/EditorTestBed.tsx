import { makeObservable, observable } from 'mobx'
import { Layer } from './layer'
import { useRef, useEffect, useMemo } from 'react'
import { Inspector } from './Inspector'
import { Hierarchy } from './Hierarchy'
import * as THREE from 'three'

interface Props {
  onBack: () => void
}

type DragMode = 'move' | 'resize'

interface ResizeHandle {
  xDir: -1 | 0 | 1
  yDir: -1 | 0 | 1
}

export function EditorTestBed({ onBack }: Props): React.JSX.Element {
  // create an observable state object so Inspector can react
  const state = useMemo(() => new EditorState(new Layer()), [])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fixedWidth = 1920
  const fixedHeight = 1080

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const targetCanvas: HTMLCanvasElement = canvas

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const dragIntersection = new THREE.Vector3()
    const dragOffset = new THREE.Vector3()
    let draggingLayer: Layer | null = null
    let dragMode: DragMode | null = null
    let activeHandle: ResizeHandle = { xDir: 0, yDir: 0 }
    let dragStartCenter = new THREE.Vector2()
    let dragStartScale = new THREE.Vector2()

    // place camera further back and point it down the -Z axis
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)

    renderer.setSize(fixedWidth, fixedHeight, false)
    camera.aspect = fixedWidth / fixedHeight
    camera.updateProjectionMatrix()

    targetCanvas.style.width = `${fixedWidth}px`
    targetCanvas.style.height = `${fixedHeight}px`
    targetCanvas.style.transform = 'none'

    state.canvas = canvas
    state.renderer = renderer
    state.scene = scene
    state.camera = camera

    state.createLayer()

    function updatePointer(event: PointerEvent) {
      const rect = targetCanvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      // update cursor based on hit location unless currently dragging
      if (!draggingLayer) {
        const hits = raycaster.intersectObjects(
          state.rootLayer.children.map((layer) => layer.mesh),
          false
        )
        if (hits.length === 0) {
          targetCanvas.style.cursor = 'default'
        } else {
          const handle = getResizeHandle(hits[0].uv ?? new THREE.Vector2(0.5, 0.5))
          targetCanvas.style.cursor = cursorForHandle(handle)
        }
      }
    }

    function getResizeHandle(uv: THREE.Vector2): ResizeHandle {
      // expanded grab region for edges/corners
      const threshold = 0.3
      const left = uv.x <= threshold
      const right = uv.x >= 1 - threshold
      const bottom = uv.y <= threshold
      const top = uv.y >= 1 - threshold

      const xDir: -1 | 0 | 1 = left ? -1 : right ? 1 : 0
      const yDir: -1 | 0 | 1 = bottom ? -1 : top ? 1 : 0

      return { xDir, yDir }
    }

    function cursorForHandle(handle: ResizeHandle): string {
      const { xDir, yDir } = handle
      if (xDir !== 0 && yDir !== 0) {
        return xDir === yDir ? 'nwse-resize' : 'nesw-resize'
      }
      if (xDir !== 0) {
        return 'ew-resize'
      }
      if (yDir !== 0) {
        return 'ns-resize'
      }
      return 'grab'
    }

    function onPointerDown(event: PointerEvent) {
      updatePointer(event)
      const hits = raycaster.intersectObjects(
        state.rootLayer.children.map((layer) => layer.mesh),
        false
      )

      if (hits.length === 0) {
        state.selectLayer(null)
        draggingLayer = null
        dragMode = null
        return
      }

      const hit = hits[0]
      const layer = hit.object.userData.layer as Layer | undefined

      if (!layer) return
      state.selectLayer(layer)
      draggingLayer = layer

      dragStartCenter.set(layer.mesh.position.x, layer.mesh.position.y)
      dragStartScale.set(layer.mesh.scale.x, layer.mesh.scale.y)

      const handle = getResizeHandle(hit.uv ?? new THREE.Vector2(0.5, 0.5))
      activeHandle = handle
      dragMode = handle.xDir === 0 && handle.yDir === 0 ? 'move' : 'resize'

      if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
        if (dragMode === 'move') {
          dragOffset.copy(layer.mesh.position).sub(dragIntersection)
        } else {
          dragOffset.set(0, 0, 0)
        }
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (!draggingLayer || !dragMode) return
      updatePointer(event)

      if (dragMode === 'move') {
        targetCanvas.style.cursor = 'grabbing'
      }

      if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
        if (dragMode === 'move') {
          draggingLayer.transform.setPosition(
            dragIntersection.x + dragOffset.x,
            dragIntersection.y + dragOffset.y
          )
          return
        }

        const minSize = 0.1

        let minX = dragStartCenter.x - dragStartScale.x * 0.5
        let maxX = dragStartCenter.x + dragStartScale.x * 0.5
        let minY = dragStartCenter.y - dragStartScale.y * 0.5
        let maxY = dragStartCenter.y + dragStartScale.y * 0.5

        if (activeHandle.xDir !== 0) {
          const anchorX = activeHandle.xDir === 1 ? minX : maxX
          const rawDraggedX = dragIntersection.x

          if (activeHandle.xDir === 1) {
            maxX = Math.max(rawDraggedX, anchorX + minSize)
            minX = anchorX
          } else {
            minX = Math.min(rawDraggedX, anchorX - minSize)
            maxX = anchorX
          }
        }

        if (activeHandle.yDir !== 0) {
          const anchorY = activeHandle.yDir === 1 ? minY : maxY
          const rawDraggedY = dragIntersection.y

          if (activeHandle.yDir === 1) {
            maxY = Math.max(rawDraggedY, anchorY + minSize)
            minY = anchorY
          } else {
            minY = Math.min(rawDraggedY, anchorY - minSize)
            maxY = anchorY
          }
        }

        const newWidth = Math.max(minSize, maxX - minX)
        const newHeight = Math.max(minSize, maxY - minY)
        const newX = (minX + maxX) * 0.5
        const newY = (minY + maxY) * 0.5

        draggingLayer.transform.setTransform(newX, newY, newWidth, newHeight)
      }
    }

    function onPointerUp() {
      draggingLayer = null
      dragMode = null
    }

    function animate() {
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()
    targetCanvas.addEventListener('pointerdown', onPointerDown)
    targetCanvas.addEventListener('pointermove', onPointerMove)
    targetCanvas.addEventListener('pointerup', onPointerUp)
    targetCanvas.addEventListener('pointerleave', onPointerUp)

    return () => {
      targetCanvas.removeEventListener('pointerdown', onPointerDown)
      targetCanvas.removeEventListener('pointermove', onPointerMove)
      targetCanvas.removeEventListener('pointerup', onPointerUp)
      targetCanvas.removeEventListener('pointerleave', onPointerUp)
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

      <div style={{ flex: 1, display: 'flex' }}>
        <Hierarchy state={state} />
        <div
          ref={containerRef}
          style={{
            flexGrow: 1,
            position: 'relative',
            background: '#0a0a0a',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
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
    makeObservable(this)
  }

  public createLayer(): Layer {
    const layer = new Layer()
    this.rootLayer.addChild(layer)

    if (this.scene) {
      this.scene.add(layer.mesh)
    }

    this.selectLayer(layer)
    return layer
  }

  public selectLayer(layer: Layer | null) {
    if (this.selectedLayer === layer) return

    if (this.selectedLayer) {
      this.selectedLayer.setSelected(false)
    }

    this.selectedLayer = layer

    if (this.selectedLayer) {
      this.selectedLayer.setSelected(true)
    }
  }
}
