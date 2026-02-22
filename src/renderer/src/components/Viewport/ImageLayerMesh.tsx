import { useMemo, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useLoader, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'
import type { ImageLayer } from '@renderer/types/layers'

interface ImageLayerMeshProps {
  layer: ImageLayer
  renderOrder: number
}

/** Renders an image layer as a textured plane in the R3F scene */
export const ImageLayerMesh = observer(function ImageLayerMesh({
  layer,
  renderOrder
}: ImageLayerMeshProps): React.JSX.Element | null {
  if (!layer.visible) return null

  return (
    <group
      position={[layer.position.x, layer.position.y, 0]}
      rotation={[0, 0, (layer.rotation * Math.PI) / 180]}
    >
      <ImagePlane
        src={layer.src}
        width={layer.size.width}
        height={layer.size.height}
        opacity={layer.opacity}
        renderOrder={renderOrder}
      />
    </group>
  )
})

interface ImagePlaneProps {
  src: string
  width: number
  height: number
  opacity: number
  renderOrder: number
}

/** Inner component that loads the texture via useLoader (suspense-based) */
function ImagePlane({
  src,
  width,
  height,
  opacity,
  renderOrder
}: ImagePlaneProps): React.JSX.Element {
  const texture = useLoader(TextureLoader, src)
  const invalidate = useThree((state) => state.invalidate)

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  // Invalidate frame when texture loads
  useEffect(() => {
    invalidate()
  }, [texture, invalidate])

  const geometry = useMemo(() => {
    // Scale the plane geometry to pixel dimensions (1 unit = 1 pixel)
    // We'll let the camera zoom handle the actual visual scale
    return undefined // Using scale prop instead
  }, [])

  void geometry // unused, using scale instead

  return (
    <mesh renderOrder={renderOrder} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}
