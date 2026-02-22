import { Suspense } from 'react'
import { observer } from 'mobx-react-lite'
import { Text } from '@react-three/drei'
import type { TextLayer } from '@renderer/types/layers'

interface TextLayerMeshProps {
  layer: TextLayer
  renderOrder: number
}

/** Renders a text layer using drei's Text component (troika-based SDF text) */
export const TextLayerMesh = observer(function TextLayerMesh({
  layer,
  renderOrder
}: TextLayerMeshProps): React.JSX.Element | null {
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
    </group>
  )
})
