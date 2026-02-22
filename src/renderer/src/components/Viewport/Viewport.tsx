import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import type { Layer } from '@renderer/types/layers'
import { isGroupLayer, isImageLayer, isTextLayer } from '@renderer/types/layers'
import { ImageLayerMesh } from './ImageLayerMesh'
import { TextLayerMesh } from './TextLayerMesh'
import { ShaderLayerGroup } from './ShaderLayerGroup'
import { ViewportControls } from './ViewportControls'

interface ViewportProps {
  className?: string
}

/** Recursively render the layer tree as R3F scene nodes */
function renderLayerTree(layers: Layer[], baseOrder: number): React.JSX.Element[] {
  const elements: React.JSX.Element[] = []

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    const order = baseOrder + i

    if (isImageLayer(layer)) {
      elements.push(
        <Suspense key={layer.id} fallback={null}>
          <ImageLayerMesh layer={layer} renderOrder={order} />
        </Suspense>
      )
    } else if (isTextLayer(layer)) {
      elements.push(<TextLayerMesh key={layer.id} layer={layer} renderOrder={order} />)
    } else if (isGroupLayer(layer)) {
      const childElements = renderLayerTree(layer.children, order * 100)
      elements.push(
        <ShaderLayerGroup key={layer.id} layer={layer} renderOrder={order}>
          {childElements}
        </ShaderLayerGroup>
      )
    }
  }

  return elements
}

/** The main scene rendered inside the Canvas */
const Scene = observer(function Scene(): React.JSX.Element {
  const projectStore = useProjectStore()

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} />
      <ViewportControls />

      {/* Background grid pattern */}
      <gridHelper
        args={[2000, 100, 0x444444, 0x222222]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -1]}
        renderOrder={-1}
      />

      {/* Render the layer tree */}
      {renderLayerTree(projectStore.layers, 0)}
    </>
  )
})

/** Viewport component — wraps R3F Canvas with the project's scene graph */
export const Viewport = observer(function Viewport({
  className = ''
}: ViewportProps): React.JSX.Element {
  const uiStore = useUIStore()

  const handleClick = (): void => {
    // Deselect layer when clicking empty canvas area
    // (actual layer selection will be handled by mesh click events later)
  }

  void handleClick
  void uiStore

  return (
    <div className={`relative w-full h-full bg-surface-900 ${className}`}>
      <Canvas
        frameloop="demand"
        gl={{ alpha: false, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <Scene />
      </Canvas>
    </div>
  )
})
