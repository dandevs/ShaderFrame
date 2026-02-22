import { RootState } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import { RefObject, useMemo } from 'react'
import { useThreeScoped, withThreeDispose } from '@renderer/utilities/hooks'
import { createDragHandler } from './createDragHandler'
import type { LayerId } from '@renderer/types/layers'

// ─────────────────────────────────────────────────────────────────────────────
// PanHandle
//
// A single invisible hit-plane that covers the entire layer mesh.
// Left-click-drag translates the layer; the new position is synced back to
// the MobX store via `onMove`.  Sits just below the ResizeHandle hit-planes
// in renderOrder so corner/edge handles always win the ray-cast.
// ─────────────────────────────────────────────────────────────────────────────

const PAN_Z_OFFSET = 0.05
const PAN_RENDER_ORDER = 990

export interface PanHandleProps {
  meshRef: RefObject<Mesh>
  layerId: LayerId
  onMove: (id: LayerId, position: { x: number; y: number }) => void
}

export function PanHandle({ meshRef, layerId, onMove }: PanHandleProps): null {
  const scopedCallback = useMemo(
    () => async (state: RootState, run: (action: (delta: number) => void) => Promise<void>) => {
      const target = meshRef.current
      if (!target) return

      // ── GPU resources ───────────────────────────────────────────────
      using geo = withThreeDispose(new PlaneGeometry(1, 1))
      using mat = withThreeDispose(
        new MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthTest: false
        })
      )

      const panMesh = new Mesh(geo, mat)
      panMesh.renderOrder = PAN_RENDER_ORDER

      const sceneParent = target.parent!
      sceneParent.add(panMesh)

      // ── Drag handler ────────────────────────────────────────────────
      const cleanupDrag = createDragHandler(state.gl.domElement, state.camera, [panMesh], {
        getCursorForHandle: () => 'move',

        onDragStart: () => {
          // nothing extra needed
        },

        onDrag(_idx, _worldPos, delta) {
          target.position.x += delta.x
          target.position.y += delta.y
          onMove(layerId, { x: target.position.x, y: target.position.y })
        },

        onDragEnd: () => {
          // nothing extra needed
        },

        onHoverEnter: () => {
          state.gl.domElement.style.cursor = 'move'
        },

        onHoverLeave: () => {
          state.gl.domElement.style.cursor = ''
        }
      })

      // ── Frame loop – keep hit-plane sized and positioned over the mesh ──
      try {
        await run(() => {
          panMesh.scale.set(target.scale.x, target.scale.y, 1)
          panMesh.position.set(
            target.position.x,
            target.position.y,
            target.position.z + PAN_Z_OFFSET
          )
        })
      } finally {
        cleanupDrag()
        sceneParent.remove(panMesh)
      }
      // `using geo` and `using mat` → .dispose() called here automatically
    },
    // meshRef and layerId are stable across the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useThreeScoped(scopedCallback)
  return null
}
