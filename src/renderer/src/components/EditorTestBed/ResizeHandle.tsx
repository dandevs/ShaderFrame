import { RootState } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'
import { RefObject, useMemo } from 'react'
import { useThreeScoped, withThreeDispose } from '../../utilities/hooks'
import { createDragHandler } from './createDragHandler'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** World-unit side length of each square corner handle. */
export const HANDLE_SIZE = 0.12
/** Thickness of edge handles (the short/thin dimension). */
const HANDLE_EDGE_THICKNESS = HANDLE_SIZE * 0.45
/** Z offset so handles sit above the parent plane. */
const HANDLE_Z_OFFSET = 0.1

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

/**
 * Per-edge descriptor.
 *  - `axis`    – which world axis (x or y) the drag modifies
 *  - `sign`    – +1 for top/right edges, -1 for bottom/left edges
 *  - `cursor`  – CSS cursor string
 */
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
// ResizeHandle
// Uses useThreeScoped + withThreeDispose to create 4 corner handle planes and
// 4 edge handle planes entirely in plain Three.js (no R3F JSX).  Resources
// are automatically disposed when the component unmounts.
// ─────────────────────────────────────────────────────────────────────────────

export function ResizeHandle({ meshRef }: { meshRef: RefObject<Mesh> }): null {
  const scopedCallback = useMemo(
    () => async (state: RootState, run: (action: (delta: number) => void) => Promise<void>) => {
      const target = meshRef.current
      if (!target) return

      // ── GPU resources ───────────────────────────────────────────────
      using cornerGeo = withThreeDispose(new PlaneGeometry(HANDLE_SIZE, HANDLE_SIZE))
      // Edge handles are 1×1 and scaled per-frame to fill the gap between corners.
      using edgeGeo = withThreeDispose(new PlaneGeometry(1, 1))

      // One material per handle (corners + edges) for independent tinting.
      const materials = Array.from({ length: TOTAL_HANDLES }, () =>
        withThreeDispose(
          new MeshBasicMaterial({
            color: 0xffffff,
            depthTest: false
          })
        )
      )

      // Build corner meshes (0–3)
      const cornerHandles = CORNER_SIGNS.map((_, i) => {
        const mesh = new Mesh(cornerGeo, materials[i])
        mesh.renderOrder = 999
        return mesh
      })

      // Build edge meshes (4–7)
      const edgeHandles = EDGE_DEFS.map((_, i) => {
        const mesh = new Mesh(edgeGeo, materials[CORNER_SIGNS.length + i])
        mesh.renderOrder = 998 // below corners so corners always win ray-cast
        return mesh
      })

      const allHandles = [...cornerHandles, ...edgeHandles]

      // Attach everything to the scene so the plane's scale is not inherited.
      const sceneParent = target.parent!
      for (const mesh of allHandles) sceneParent.add(mesh)

      // ── Drag state ──────────────────────────────────────────────────
      const anchorWorld = new Vector3()

      const cleanupDrag = createDragHandler(state.gl.domElement, state.camera, allHandles, {
        getCursorForHandle(idx) {
          if (idx < CORNER_SIGNS.length) return CORNER_CURSORS[idx]
          return EDGE_DEFS[idx - CORNER_SIGNS.length].cursor
        },

        onDragStart(idx) {
          if (idx < CORNER_SIGNS.length) {
            // Corner: anchor is the diagonally opposite corner.
            const [ax, ay] = CORNER_SIGNS[(idx + 2) % 4]
            anchorWorld.set(
              target.position.x + ax * target.scale.x * 0.5,
              target.position.y + ay * target.scale.y * 0.5,
              target.position.z
            )
          } else {
            // Edge: anchor is the midpoint of the opposite edge.
            const edge = EDGE_DEFS[idx - CORNER_SIGNS.length]
            if (edge.axis === 'y') {
              // Top/Bottom – anchor is the centre of the opposite horizontal edge.
              anchorWorld.set(
                target.position.x,
                target.position.y + -edge.sign * target.scale.y * 0.5,
                target.position.z
              )
            } else {
              // Left/Right – anchor is the centre of the opposite vertical edge.
              anchorWorld.set(
                target.position.x + -edge.sign * target.scale.x * 0.5,
                target.position.y,
                target.position.z
              )
            }
          }
          materials[idx].color.set(0xffcc00)
        },

        onDrag(idx, worldPos) {
          if (idx < CORNER_SIGNS.length) {
            // ── Corner drag ────────────────────────────────────────────
            const [sx, sy] = CORNER_SIGNS[idx]
            const newX =
              sx > 0
                ? Math.max(worldPos.x, anchorWorld.x + 0.01)
                : Math.min(worldPos.x, anchorWorld.x - 0.01)
            const newY =
              sy > 0
                ? Math.max(worldPos.y, anchorWorld.y + 0.01)
                : Math.min(worldPos.y, anchorWorld.y - 0.01)

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
            // ── Edge drag ──────────────────────────────────────────────
            const edge = EDGE_DEFS[idx - CORNER_SIGNS.length]

            if (edge.axis === 'y') {
              // Top or bottom edge: only Y changes; X and X-position are fixed.
              const newY =
                edge.sign > 0
                  ? Math.max(worldPos.y, anchorWorld.y + 0.01)
                  : Math.min(worldPos.y, anchorWorld.y - 0.01)
              target.scale.setY(Math.abs(newY - anchorWorld.y))
              target.position.setY((newY + anchorWorld.y) * 0.5)
            } else {
              // Left or right edge: only X changes; Y and Y-position are fixed.
              const newX =
                edge.sign > 0
                  ? Math.max(worldPos.x, anchorWorld.x + 0.01)
                  : Math.min(worldPos.x, anchorWorld.x - 0.01)
              target.scale.setX(Math.abs(newX - anchorWorld.x))
              target.position.setX((newX + anchorWorld.x) * 0.5)
            }
          }
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

          // Update corner positions – corners are fixed-size geometry.
          for (let i = 0; i < CORNER_SIGNS.length; i++) {
            const [sx, sy] = CORNER_SIGNS[i]
            cornerHandles[i].position.set(
              target.position.x + sx * hw,
              target.position.y + sy * hh,
              target.position.z + HANDLE_Z_OFFSET
            )
          }

          // Gap length available between the two corners on each edge.
          const edgeW = Math.max(0, target.scale.x - 2 * HANDLE_SIZE)
          const edgeH = Math.max(0, target.scale.y - 2 * HANDLE_SIZE)

          // Update edge positions and scale.
          // Top (0) and Bottom (2) are horizontal → scale (edgeW, thickness).
          // Right (1) and Left (3) are vertical   → scale (thickness, edgeH).
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
              // Top / Bottom: centred horizontally, at the top or bottom edge.
              mesh.position.set(
                target.position.x,
                target.position.y + edge.sign * hh,
                target.position.z + HANDLE_Z_OFFSET
              )
            } else {
              // Left / Right: centred vertically, at the left or right edge.
              mesh.position.set(
                target.position.x + edge.sign * hw,
                target.position.y,
                target.position.z + HANDLE_Z_OFFSET
              )
            }
          }
        })
      } finally {
        // ── Cleanup on unmount ─────────────────────────────────────────
        cleanupDrag()
        for (const mesh of allHandles) sceneParent.remove(mesh)
        for (const mat of materials) mat.dispose()
      }
      // `using cornerGeo` and `using edgeGeo` → .dispose() called here automatically
    },
    // meshRef is a stable ref object; the dep array is intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useThreeScoped(scopedCallback)
  return null
}
