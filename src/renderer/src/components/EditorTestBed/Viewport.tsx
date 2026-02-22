import { Canvas, RootState } from '@react-three/fiber'
import { OrthographicCamera, Plane } from '@react-three/drei'
import {
  Camera,
  Mesh,
  MeshBasicMaterial,
  Plane as ThreePlane,
  PlaneGeometry,
  Raycaster,
  Vector2,
  Vector3
} from 'three'
import { RefObject, useMemo, useRef } from 'react'
import { useThreeScoped, withThreeDispose } from '../../utilities/hooks'

// ─────────────────────────────────────────────────────────────────────────────
// Corner configuration
// Order: top-left, top-right, bottom-right, bottom-left
// ─────────────────────────────────────────────────────────────────────────────

/** [signX, signY] multipliers for each of the 4 corners. */
const CORNER_SIGNS: Array<[number, number]> = [
  [-1, 1], // 0 – top-left
  [1, 1], // 1 – top-right
  [1, -1], // 2 – bottom-right
  [-1, -1] // 3 – bottom-left
]

const HANDLE_SIZE = 0.12 // world-unit square side length
const HANDLE_Z_OFFSET = 0.1 // sits slightly above the parent plane

// ─────────────────────────────────────────────────────────────────────────────
// Drag framework
// A plain-TS, R3F-free system that converts DOM pointer events into
// world-space drag callbacks for a set of Three.js Mesh hit-targets.
// ─────────────────────────────────────────────────────────────────────────────

export interface DragCallbacks {
  /** Fired once when a valid pointer-down hits a handle. */
  onDragStart: (handleIndex: number, worldPos: Vector3) => void
  /** Fired every pointer-move while a drag is active. */
  onDrag: (handleIndex: number, worldPos: Vector3, delta: Vector3) => void
  /** Fired on pointer-up or pointer-cancel. */
  onDragEnd: (handleIndex: number, worldPos: Vector3) => void
  /** Optional – pointer entered a handle without pressing. */
  onHoverEnter?: (handleIndex: number) => void
  /** Optional – pointer left a handle without pressing. */
  onHoverLeave?: (handleIndex: number) => void
}

/**
 * Attaches pointer event listeners to `domElement` and translates them into
 * world-space {@link DragCallbacks} for the supplied `handles` meshes.
 *
 * @returns A cleanup function that removes all listeners.
 */
function createDragHandler(
  domElement: HTMLElement,
  camera: Camera,
  handles: Mesh[],
  callbacks: DragCallbacks
): () => void {
  const raycaster = new Raycaster()
  const ndcScratch = new Vector2()

  let activeIndex = -1
  let prevWorld = new Vector3()
  let hoveredIndex = -1

  /** Convert a PointerEvent to a world-space position on a Z-plane. */
  function toWorldPos(e: PointerEvent, targetZ: number): Vector3 {
    const rect = domElement.getBoundingClientRect()
    ndcScratch.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      ((e.clientY - rect.top) / rect.height) * -2 + 1
    )
    raycaster.setFromCamera(ndcScratch, camera)
    const hitPlane = new ThreePlane(new Vector3(0, 0, 1), -targetZ)
    const point = new Vector3()
    raycaster.ray.intersectPlane(hitPlane, point)
    return point
  }

  /** Returns the index of the first handle hit by the pointer, or -1. */
  function hitHandleIndex(e: PointerEvent): number {
    const rect = domElement.getBoundingClientRect()
    ndcScratch.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      ((e.clientY - rect.top) / rect.height) * -2 + 1
    )
    raycaster.setFromCamera(ndcScratch, camera)
    const hits = raycaster.intersectObjects(handles, false)
    if (hits.length === 0) return -1
    return handles.indexOf(hits[0].object as Mesh)
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    const idx = hitHandleIndex(e)
    if (idx < 0) return

    e.stopPropagation()
    activeIndex = idx

    const worldZ = handles[idx].getWorldPosition(new Vector3()).z
    prevWorld = toWorldPos(e, worldZ)

    domElement.setPointerCapture(e.pointerId)
    callbacks.onDragStart(idx, prevWorld.clone())
    domElement.style.cursor = 'nwse-resize'
  }

  function onPointerMove(e: PointerEvent): void {
    // ── Active drag ──────────────────────────────────────────────────────
    if (activeIndex >= 0) {
      const worldZ = handles[activeIndex].getWorldPosition(new Vector3()).z
      const world = toWorldPos(e, worldZ)
      const delta = world.clone().sub(prevWorld)
      callbacks.onDrag(activeIndex, world, delta)
      prevWorld = world
      domElement.style.cursor = 'nwse-resize'
      return
    }

    // ── Hover (no button held) ────────────────────────────────────────────
    if (e.buttons === 0) {
      const idx = hitHandleIndex(e)
      if (idx !== hoveredIndex) {
        if (hoveredIndex >= 0) callbacks.onHoverLeave?.(hoveredIndex)
        hoveredIndex = idx
        if (idx >= 0) {
          callbacks.onHoverEnter?.(idx)
          domElement.style.cursor = 'nwse-resize'
        } else {
          domElement.style.cursor = ''
        }
      }
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (activeIndex < 0) return
    const worldZ = handles[activeIndex].getWorldPosition(new Vector3()).z
    const world = toWorldPos(e, worldZ)
    callbacks.onDragEnd(activeIndex, world)
    domElement.releasePointerCapture(e.pointerId)
    activeIndex = -1
    domElement.style.cursor = ''
  }

  domElement.addEventListener('pointerdown', onPointerDown)
  domElement.addEventListener('pointermove', onPointerMove)
  domElement.addEventListener('pointerup', onPointerUp)
  domElement.addEventListener('pointercancel', onPointerUp)

  return (): void => {
    domElement.removeEventListener('pointerdown', onPointerDown)
    domElement.removeEventListener('pointermove', onPointerMove)
    domElement.removeEventListener('pointerup', onPointerUp)
    domElement.removeEventListener('pointercancel', onPointerUp)
    domElement.style.cursor = ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────

function Scene(): React.JSX.Element {
  const meshRef = useRef<Mesh>(null!)

  return (
    <>
      {/* Orthographic camera positioned above, rotated to face straight down */}
      <OrthographicCamera makeDefault position={[0, 0, 10]} rotation={[0, 0, 0]} zoom={50} />

      <Plane ref={meshRef} position={[0, 0, 0]} scale={[3, 3, 3]}>
        <meshBasicMaterial color="#4a90d9" />
        <ResizeHandle meshRef={meshRef} />
      </Plane>
    </>
  )
}

export function Viewport(): React.JSX.Element {
  return (
    <Canvas frameloop="always" style={{ width: '100%', height: '100%' }}>
      <Scene />
    </Canvas>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ResizeHandle
// Uses useThreeScoped + withThreeDispose to create 4 corner handle planes
// entirely in plain Three.js (no R3F JSX).  Resources are automatically
// disposed when the component unmounts.
// ─────────────────────────────────────────────────────────────────────────────

export function ResizeHandle({ meshRef }: { meshRef: RefObject<Mesh> }): null {
  // Stable callback – useMemo with [] so it is created once and never
  // recreated, matching the stable lifetime of useThreeScoped.
  const scopedCallback = useMemo(
    () => async (state: RootState, run: (action: (delta: number) => void) => Promise<void>) => {
      const target = meshRef.current
      if (!target) return

      // ── GPU resources ─────────────────────────────────────────────────
      using geo = withThreeDispose(new PlaneGeometry(HANDLE_SIZE, HANDLE_SIZE))

      // One material per corner so we can tint them independently during
      // hover / drag.  Disposed manually before scope exits.
      const materials = CORNER_SIGNS.map(() =>
        withThreeDispose(
          new MeshBasicMaterial({
            color: 0xffffff,
            depthTest: false
          })
        )
      )

      const handles = CORNER_SIGNS.map((_, i) => {
        const mesh = new Mesh(geo, materials[i])
        mesh.renderOrder = 999
        return mesh
      })

      // Attach to the plane's parent (scene) so the plane's scale does NOT
      // propagate to the handles.  Store the parent ref for cleanup.
      const sceneParent = target.parent!
      for (const mesh of handles) sceneParent.add(mesh)

      // ── Drag state ────────────────────────────────────────────────────
      const anchorWorld = new Vector3()

      // ── Drag handler – set up once, state is available here directly ──
      const cleanupDrag = createDragHandler(state.gl.domElement, state.camera, handles, {
        onDragStart(idx) {
          // Capture world position of the OPPOSITE (anchored) corner
          // before any scale change occurs.
          const [ax, ay] = CORNER_SIGNS[(idx + 2) % 4]
          anchorWorld.set(
            target.position.x + ax * target.scale.x * 0.5,
            target.position.y + ay * target.scale.y * 0.5,
            target.position.z
          )
          materials[idx].color.set(0xffcc00)
        },

        onDrag(idx, worldPos) {
          // Clamp so the dragged corner cannot cross the anchored one
          const [sx, sy] = CORNER_SIGNS[idx]
          const newX =
            sx > 0
              ? Math.max(worldPos.x, anchorWorld.x + 0.01)
              : Math.min(worldPos.x, anchorWorld.x - 0.01)
          const newY =
            sy > 0
              ? Math.max(worldPos.y, anchorWorld.y + 0.01)
              : Math.min(worldPos.y, anchorWorld.y - 0.01)

          // New size = distance between the dragged and anchored corners
          target.scale.set(
            Math.abs(newX - anchorWorld.x),
            Math.abs(newY - anchorWorld.y),
            target.scale.z // depth unchanged
          )

          // New centre sits halfway between the two opposing corners,
          // which effectively keeps the anchored corner stationary.
          target.position.set(
            (newX + anchorWorld.x) * 0.5,
            (newY + anchorWorld.y) * 0.5,
            target.position.z
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

      // ── Frame loop ────────────────────────────────────────────────────
      try {
        await run(() => {
          console.log("ok");
          // Handles live in scene/world space, so we compute their positions
          // directly from the target's world position + scaled half-extents.
          // This way the plane's own scale never affects handle size.
          const hw = target.scale.x * 0.5
          const hh = target.scale.y * 0.5

          for (let i = 0; i < 4; i++) {
            const [sx, sy] = CORNER_SIGNS[i]
            handles[i].position.set(
              target.position.x + sx * hw,
              target.position.y + sy * hh,
              target.position.z + HANDLE_Z_OFFSET
            )
          }
        })
      } finally {
        // ── Cleanup on unmount ────────────────────────────────────────────
        cleanupDrag()
        for (const mesh of handles) sceneParent.remove(mesh)
        for (const mat of materials) mat.dispose()
      }
      // `using geo` → PlaneGeometry.dispose() called automatically here
    },
    // meshRef is a stable ref object; the dep array is intentionally empty
    // so this memo is created only once for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useThreeScoped(scopedCallback)
  return null
}
