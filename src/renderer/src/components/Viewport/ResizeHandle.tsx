import { RootState } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'
import { RefObject, useMemo } from 'react'
import { useThreeScoped, withThreeDispose } from '@renderer/utilities/hooks'
import { createDragHandler } from './createDragHandler'
import type { LayerId } from '@renderer/types/layers'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** World-unit side length of each square corner handle. */
export const HANDLE_SIZE = 12
/** Thickness of edge handles (the short/thin dimension). */
const HANDLE_EDGE_THICKNESS = HANDLE_SIZE * 0.45
/** Z offset so handles sit above the parent plane. */
const HANDLE_Z_OFFSET = 0.5

// ─────────────────────────────────────────────────────────────────────────────
// Corner configuration  (indices 0–3)
// Order: top-left, top-right, bottom-right, bottom-left
// ─────────────────────────────────────────────────────────────────────────────

/** [signX, signY] multipliers for each of the 4 corner positions. */
const CORNER_SIGNS: Array<[number, number]> = [
  [-1, 1], // 0 – top-left
  [1, 1], // 1 – top-right
  [1, -1], // 2 – bottom-right
  [-1, -1] // 3 – bottom-left
]

/** CSS resize cursors for corners in the same order as CORNER_SIGNS. */
const CORNER_CURSORS = ['nwse-resize', 'nesw-resize', 'nwse-resize', 'nesw-resize']

// ─────────────────────────────────────────────────────────────────────────────
// Edge configuration  (indices 4–7)
// ─────────────────────────────────────────────────────────────────────────────

interface EdgeDef {
  axis: 'x' | 'y'
  sign: 1 | -1
  cursor: string
}

const EDGE_DEFS: EdgeDef[] = [
  { axis: 'y', sign: 1, cursor: 'ns-resize' }, // 4 – top
  { axis: 'x', sign: 1, cursor: 'ew-resize' }, // 5 – right
  { axis: 'y', sign: -1, cursor: 'ns-resize' }, // 6 – bottom
  { axis: 'x', sign: -1, cursor: 'ew-resize' } // 7 – left
]

const TOTAL_HANDLES = CORNER_SIGNS.length + EDGE_DEFS.length // 8

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ResizeHandleProps {
  meshRef: RefObject<Mesh>
  layerId: LayerId
  onResize: (
    id: LayerId,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// ResizeHandle
// Ported from EditorTestBed – adapted to sync back to the MobX store via
// `onResize`.  Holding Ctrl during a corner drag locks the aspect ratio.
// ─────────────────────────────────────────────────────────────────────────────

export function ResizeHandle({ meshRef, layerId, onResize }: ResizeHandleProps): null {
  const scopedCallback = useMemo(
    () => async (state: RootState, run: (action: (delta: number) => void) => Promise<void>) => {
      const target = meshRef.current
      if (!target) return

      // ── GPU resources ───────────────────────────────────────────────
      using cornerGeo = withThreeDispose(new PlaneGeometry(HANDLE_SIZE, HANDLE_SIZE))
      using edgeGeo = withThreeDispose(new PlaneGeometry(1, 1))

      const materials = Array.from({ length: TOTAL_HANDLES }, () =>
        withThreeDispose(
          new MeshBasicMaterial({
            color: 0xffffff,
            depthTest: false
          })
        )
      )

      const cornerHandles = CORNER_SIGNS.map((_, i) => {
        const mesh = new Mesh(cornerGeo, materials[i])
        mesh.renderOrder = 999
        return mesh
      })

      const edgeHandles = EDGE_DEFS.map((_, i) => {
        const mesh = new Mesh(edgeGeo, materials[CORNER_SIGNS.length + i])
        mesh.renderOrder = 998
        return mesh
      })

      const allHandles = [...cornerHandles, ...edgeHandles]

      const sceneParent = target.parent!
      for (const mesh of allHandles) sceneParent.add(mesh)

      // ── Drag state ──────────────────────────────────────────────────
      const anchorWorld = new Vector3()
      /** Aspect ratio captured at drag-start for Ctrl-lock. */
      let dragStartAspect = 1

      const cleanupDrag = createDragHandler(state.gl.domElement, state.camera, allHandles, {
        getCursorForHandle(idx) {
          if (idx < CORNER_SIGNS.length) return CORNER_CURSORS[idx]
          return EDGE_DEFS[idx - CORNER_SIGNS.length].cursor
        },

        onDragStart(idx) {
          if (idx < CORNER_SIGNS.length) {
            // Anchor = diagonally opposite corner
            const [ax, ay] = CORNER_SIGNS[(idx + 2) % 4]
            anchorWorld.set(
              target.position.x + ax * target.scale.x * 0.5,
              target.position.y + ay * target.scale.y * 0.5,
              target.position.z
            )
          } else {
            const edge = EDGE_DEFS[idx - CORNER_SIGNS.length]
            if (edge.axis === 'y') {
              anchorWorld.set(
                target.position.x,
                target.position.y + -edge.sign * target.scale.y * 0.5,
                target.position.z
              )
            } else {
              anchorWorld.set(
                target.position.x + -edge.sign * target.scale.x * 0.5,
                target.position.y,
                target.position.z
              )
            }
          }
          // Capture current aspect ratio (width / height) for Ctrl-lock
          dragStartAspect = target.scale.y > 0 ? target.scale.x / target.scale.y : 1
          materials[idx].color.set(0xffcc00)
        },

        onDrag(idx, worldPos, _delta, event) {
          if (idx < CORNER_SIGNS.length) {
            // ── Corner drag ──────────────────────────────────────────
            const [sx, sy] = CORNER_SIGNS[idx]
            let newX =
              sx > 0
                ? Math.max(worldPos.x, anchorWorld.x + 0.01)
                : Math.min(worldPos.x, anchorWorld.x - 0.01)
            let newY =
              sy > 0
                ? Math.max(worldPos.y, anchorWorld.y + 0.01)
                : Math.min(worldPos.y, anchorWorld.y - 0.01)

            // Ctrl held → lock aspect ratio using the dominant axis
            if (event.ctrlKey && dragStartAspect > 0) {
              const rawW = Math.abs(newX - anchorWorld.x)
              const rawH = Math.abs(newY - anchorWorld.y)
              if (rawW / rawH > dragStartAspect) {
                // Width is dominant → constrain height
                const constrainedH = rawW / dragStartAspect
                newY = anchorWorld.y + sy * constrainedH
              } else {
                // Height is dominant → constrain width
                const constrainedW = rawH * dragStartAspect
                newX = anchorWorld.x + sx * constrainedW
              }
            }

            target.scale.set(
              Math.abs(newX - anchorWorld.x),
              Math.abs(newY - anchorWorld.y),
              target.scale.z
            )
            target.position.set(
              (newX + anchorWorld.x) * 0.5,
              (newY + anchorWorld.y) * 0.5,
              target.position.z
            )
          } else {
            // ── Edge drag ────────────────────────────────────────────
            const edge = EDGE_DEFS[idx - CORNER_SIGNS.length]
            if (edge.axis === 'y') {
              const newY =
                edge.sign > 0
                  ? Math.max(worldPos.y, anchorWorld.y + 0.01)
                  : Math.min(worldPos.y, anchorWorld.y - 0.01)
              target.scale.setY(Math.abs(newY - anchorWorld.y))
              target.position.setY((newY + anchorWorld.y) * 0.5)
            } else {
              const newX =
                edge.sign > 0
                  ? Math.max(worldPos.x, anchorWorld.x + 0.01)
                  : Math.min(worldPos.x, anchorWorld.x - 0.01)
              target.scale.setX(Math.abs(newX - anchorWorld.x))
              target.position.setX((newX + anchorWorld.x) * 0.5)
            }
          }

          // Sync back to store after every drag tick
          onResize(
            layerId,
            { x: target.position.x, y: target.position.y },
            { width: target.scale.x, height: target.scale.y }
          )
        },

        onDragEnd(idx) {
          materials[idx].color.set(0xffffff)
        },

        onHoverEnter(idx) {
          materials[idx].color.set(0xaaddff)
        },

        onHoverLeave(idx) {
          materials[idx].color.set(0xffffff)
        }
      })

      // ── Frame loop ──────────────────────────────────────────────────
      try {
        await run(() => {
          const hw = target.scale.x * 0.5
          const hh = target.scale.y * 0.5

          for (let i = 0; i < CORNER_SIGNS.length; i++) {
            const [sx, sy] = CORNER_SIGNS[i]
            cornerHandles[i].position.set(
              target.position.x + sx * hw,
              target.position.y + sy * hh,
              target.position.z + HANDLE_Z_OFFSET
            )
          }

          const edgeW = Math.max(0, target.scale.x - 2 * HANDLE_SIZE)
          const edgeH = Math.max(0, target.scale.y - 2 * HANDLE_SIZE)

          const edgeScales: Array<[number, number]> = [
            [edgeW, HANDLE_EDGE_THICKNESS], // 4 – top
            [HANDLE_EDGE_THICKNESS, edgeH], // 5 – right
            [edgeW, HANDLE_EDGE_THICKNESS], // 6 – bottom
            [HANDLE_EDGE_THICKNESS, edgeH] // 7 – left
          ]

          for (let i = 0; i < EDGE_DEFS.length; i++) {
            const edge = EDGE_DEFS[i]
            const mesh = edgeHandles[i]
            const [sw, sh] = edgeScales[i]
            mesh.scale.set(sw, sh, 1)

            if (edge.axis === 'y') {
              mesh.position.set(
                target.position.x,
                target.position.y + edge.sign * hh,
                target.position.z + HANDLE_Z_OFFSET
              )
            } else {
              mesh.position.set(
                target.position.x + edge.sign * hw,
                target.position.y,
                target.position.z + HANDLE_Z_OFFSET
              )
            }
          }
        })
      } finally {
        cleanupDrag()
        for (const mesh of allHandles) sceneParent.remove(mesh)
        for (const mat of materials) mat.dispose()
      }
    },
    // meshRef and layerId are stable across the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useThreeScoped(scopedCallback)
  return null
}
