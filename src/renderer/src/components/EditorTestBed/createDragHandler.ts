import { Camera, Mesh, Plane as ThreePlane, Raycaster, Vector2, Vector3 } from 'three'

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
  /**
   * Optional – return the CSS cursor string for a given handle index.
   * Called on hover-enter and during an active drag.
   * Defaults to `'pointer'` when omitted.
   */
  getCursorForHandle?: (handleIndex: number) => string
}

/**
 * Attaches pointer event listeners to `domElement` and translates them into
 * world-space {@link DragCallbacks} for the supplied `handles` meshes.
 *
 * @returns A cleanup function that removes all listeners.
 */
export function createDragHandler(
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

  function getCursor(idx: number): string {
    return callbacks.getCursorForHandle?.(idx) ?? 'pointer'
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
    domElement.style.cursor = getCursor(idx)
  }

  function onPointerMove(e: PointerEvent): void {
    // ── Active drag ──────────────────────────────────────────────────────
    if (activeIndex >= 0) {
      const worldZ = handles[activeIndex].getWorldPosition(new Vector3()).z
      const world = toWorldPos(e, worldZ)
      const delta = world.clone().sub(prevWorld)
      callbacks.onDrag(activeIndex, world, delta)
      prevWorld = world
      domElement.style.cursor = getCursor(activeIndex)
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
          domElement.style.cursor = getCursor(idx)
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
