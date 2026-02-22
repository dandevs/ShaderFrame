import { Suspense, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Text } from '@react-three/drei'
import type { Mesh } from 'three'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import type { TextLayer, LayerId } from '@renderer/types/layers'
import { ResizeHandle } from './ResizeHandle'
import { PanHandle } from './PanHandle'

interface TextLayerMeshProps {
  layer: TextLayer
  renderOrder: number
}

/** Renders a text layer using drei's Text component (troika-based SDF text) */
export const TextLayerMesh = observer(function TextLayerMesh({
  layer,
  renderOrder
}: TextLayerMeshProps): React.JSX.Element | null {
  const uiStore = useUIStore()
  const projectStore = useProjectStore()
  const isSelected = uiStore.selectedLayerId === layer.id

  // A transparent hit-plane mesh sized to layer.size is our interaction target
  const hitRef = useRef<Mesh>(null!)

  const handleSelect = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      uiStore.selectLayer(layer.id)
    },
    [uiStore, layer.id]
  )

  const handleResize = useCallback(
    (id: LayerId, position: { x: number; y: number }, size: { width: number; height: number }) => {
      projectStore.updateLayer(id, { position, size })
    },
    [projectStore]
  )

  const handleMove = useCallback(
    (id: LayerId, position: { x: number; y: number }) => {
      projectStore.updateLayer(id, { position })
    },
    [projectStore]
  )

  if (!layer.visible) return null

  return (
    <group
      position={[layer.position.x, layer.position.y, 0]}
      rotation={[0, 0, (layer.rotation * Math.PI) / 180]}
    >
      <Suspense fallback={null}>
        <Text
          color={layer.color}
          fontSize={layer.fontSize}
          maxWidth={layer.size.width}
          lineHeight={layer.lineHeight}
          textAlign={layer.textAlign}
          anchorX="center"
          anchorY="middle"
          renderOrder={renderOrder}
          material-transparent={layer.opacity < 1}
          material-opacity={layer.opacity}
          material-depthWrite={false}
        >
          {layer.content}
        </Text>
      </Suspense>

      {/* Transparent hit-plane — sized to the declared layer bounds. */}
      <mesh
        ref={hitRef}
        scale={[layer.size.width, layer.size.height, 1]}
        renderOrder={renderOrder}
        onClick={handleSelect}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {isSelected && (
        <>
          <PanHandle meshRef={hitRef} layerId={layer.id} onMove={handleMove} />
          <ResizeHandle meshRef={hitRef} layerId={layer.id} onResize={handleResize} />
        </>
      )}
    </group>
  )
})
