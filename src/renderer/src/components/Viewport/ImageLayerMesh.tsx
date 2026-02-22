import { useMemo, useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useLoader, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'
import type { Mesh } from 'three'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import type { ImageLayer, LayerId } from '@renderer/types/layers'
import { ResizeHandle } from './ResizeHandle'
import { PanHandle } from './PanHandle'

interface ImageLayerMeshProps {
  layer: ImageLayer
  renderOrder: number
}

/** Renders an image layer as a textured plane in the R3F scene */
export const ImageLayerMesh = observer(function ImageLayerMesh({
  layer,
  renderOrder
}: ImageLayerMeshProps): React.JSX.Element | null {
  const uiStore = useUIStore()
  const projectStore = useProjectStore()
  const isSelected = uiStore.selectedLayerId === layer.id

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
      <ImagePlane
        layer={layer}
        renderOrder={renderOrder}
        isSelected={isSelected}
        onSelect={handleSelect}
        onResize={handleResize}
        onMove={handleMove}
      />
    </group>
  )
})

interface ImagePlaneProps {
  layer: ImageLayer
  renderOrder: number
  isSelected: boolean
  onSelect: (e: { stopPropagation: () => void }) => void
  onResize: (
    id: LayerId,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void
  onMove: (id: LayerId, position: { x: number; y: number }) => void
}

/** Inner component that loads the texture via useLoader (suspense-based) */
function ImagePlane({
  layer,
  renderOrder,
  isSelected,
  onSelect,
  onResize,
  onMove
}: ImagePlaneProps): React.JSX.Element {
  const texture = useLoader(TextureLoader, layer.src)
  const invalidate = useThree((state) => state.invalidate)
  const meshRef = useRef<Mesh>(null!)

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useEffect(() => {
    invalidate()
  }, [texture, invalidate])

  useMemo(() => undefined, []) // keep geometry comment below

  // Scale the plane to pixel dimensions (1 unit = 1 pixel).
  // Camera zoom controls the visual scale.

  return (
    <>
      <mesh
        ref={meshRef}
        renderOrder={renderOrder}
        scale={[layer.size.width, layer.size.height, 1]}
        onClick={onSelect}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent={layer.opacity < 1}
          opacity={layer.opacity}
          depthWrite={false}
        />
      </mesh>

      {isSelected && (
        <>
          <PanHandle meshRef={meshRef} layerId={layer.id} onMove={onMove} />
          <ResizeHandle meshRef={meshRef} layerId={layer.id} onResize={onResize} />
        </>
      )}
    </>
  )
}
