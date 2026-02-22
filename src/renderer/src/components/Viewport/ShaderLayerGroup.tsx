import { useMemo, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useThree } from '@react-three/fiber'
import { ShaderMaterial } from 'three'
import type { GroupLayer } from '@renderer/types/layers'
import type { ShaderComponent, ShaderUniform } from '@renderer/types/shader'
import { useProjectStore } from '@renderer/providers/StoreProvider'

interface ShaderLayerGroupProps {
  layer: GroupLayer
  renderOrder: number
  children: React.ReactNode
}

/** Convert shader uniforms to Three.js uniform format */
function buildThreeUniforms(uniforms: ShaderUniform[]): Record<string, { value: unknown }> {
  const result: Record<string, { value: unknown }> = {}

  for (const u of uniforms) {
    switch (u.type) {
      case 'float':
      case 'int':
        result[u.uniformName] = { value: u.value }
        break
      case 'vec2':
        result[u.uniformName] = { value: u.value }
        break
      case 'vec3':
        result[u.uniformName] = { value: u.value }
        break
      case 'vec4':
        result[u.uniformName] = { value: u.value }
        break
      case 'color':
        // Convert hex color to vec3 [0-1] range
        result[u.uniformName] = { value: hexToVec3(u.value as string) }
        break
      case 'bool':
        result[u.uniformName] = { value: u.value ? 1.0 : 0.0 }
        break
      case 'enum':
        // Enums are passed as integer index
        result[u.uniformName] = { value: 0 }
        break
      default:
        result[u.uniformName] = { value: u.value }
    }
  }

  // Always provide a u_time uniform
  result['u_time'] = { value: 0.0 }
  result['u_resolution'] = { value: [1920, 1080] }

  return result
}

/** Convert hex color string to [r, g, b] in 0-1 range */
function hexToVec3(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}

/**
 * Renders a group layer with an optional shader material overlay.
 * Children (image/text layers) are rendered normally inside the group.
 * If the group has enabled shader components, a shader overlay quad is rendered on top.
 */
export const ShaderLayerGroup = observer(function ShaderLayerGroup({
  layer,
  renderOrder,
  children
}: ShaderLayerGroupProps): React.JSX.Element | null {
  if (!layer.visible) return null

  const projectStore = useProjectStore()
  const invalidate = useThree((state) => state.invalidate)

  // Get enabled shader components
  const enabledComponents = layer.shaderComponents
    .map((id) => projectStore.getShaderComponent(id))
    .filter((c): c is ShaderComponent => c != null && c.enabled)

  // Use the first enabled shader component (multi-pass is future work)
  const activeShader = enabledComponents.length > 0 ? enabledComponents[0] : null

  return (
    <group
      position={[layer.position.x, layer.position.y, 0]}
      rotation={[0, 0, (layer.rotation * Math.PI) / 180]}
    >
      {/* Render children (image/text layers) */}
      {children}

      {/* Render shader overlay if active */}
      {activeShader && (
        <ShaderOverlay
          shader={activeShader}
          width={layer.size.width}
          height={layer.size.height}
          renderOrder={renderOrder + 1000}
          invalidate={invalidate}
        />
      )}
    </group>
  )
})

interface ShaderOverlayProps {
  shader: ShaderComponent
  width: number
  height: number
  renderOrder: number
  invalidate: () => void
}

/** Renders a shader material on a plane matching the group's size */
const ShaderOverlay = observer(function ShaderOverlay({
  shader,
  width,
  height,
  renderOrder,
  invalidate
}: ShaderOverlayProps): React.JSX.Element {
  const materialRef = useRef<ShaderMaterial>(null)

  const threeUniforms = useMemo(
    () => buildThreeUniforms(shader.uniforms),
    // Re-create uniforms object when shader code changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shader.vertexShader, shader.fragmentShader]
  )

  // Update uniform values reactively from MobX
  useEffect(() => {
    const mat = materialRef.current
    if (!mat) return

    for (const u of shader.uniforms) {
      const threeUniform = mat.uniforms[u.uniformName]
      if (!threeUniform) continue

      if (u.type === 'color') {
        threeUniform.value = hexToVec3(u.value as string)
      } else if (u.type === 'bool') {
        threeUniform.value = u.value ? 1.0 : 0.0
      } else {
        threeUniform.value = u.value
      }
    }

    mat.needsUpdate = true
    invalidate()
  }, [shader.uniforms, invalidate])

  return (
    <mesh renderOrder={renderOrder} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shader.vertexShader}
        fragmentShader={shader.fragmentShader}
        uniforms={threeUniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
})
