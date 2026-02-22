import { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'

interface ViewportControlsProps {
  /** Minimum zoom level */
  minZoom?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Zoom speed multiplier */
  zoomSpeed?: number
  /** Pan speed multiplier */
  panSpeed?: number
}

/**
 * Custom viewport controls for pan (middle mouse / two-finger) and zoom (scroll wheel).
 * Operates on the default orthographic camera.
 */
export function ViewportControls({
  minZoom = 0.1,
  maxZoom = 50,
  zoomSpeed = 0.001,
  panSpeed = 1
}: ViewportControlsProps): null {
  const { camera, gl, invalidate } = useThree()
  const isPanningRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const ortho = camera as OrthographicCamera
      const delta = -e.deltaY * zoomSpeed
      const newZoom = Math.max(minZoom, Math.min(maxZoom, ortho.zoom * (1 + delta)))
      ortho.zoom = newZoom
      ortho.updateProjectionMatrix()
      invalidate()
    },
    [camera, zoomSpeed, minZoom, maxZoom, invalidate]
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Middle mouse button (1) or left + alt for panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault()
        isPanningRef.current = true
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        gl.domElement.setPointerCapture(e.pointerId)
        gl.domElement.style.cursor = 'grabbing'
      }
    },
    [gl]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPanningRef.current) return

      const ortho = camera as OrthographicCamera
      const dx = (e.clientX - lastPosRef.current.x) * panSpeed
      const dy = (e.clientY - lastPosRef.current.y) * panSpeed

      // Convert pixel movement to world units based on zoom
      const worldDx = -dx / ortho.zoom
      const worldDy = dy / ortho.zoom

      ortho.position.x += worldDx
      ortho.position.y += worldDy
      ortho.updateProjectionMatrix()

      lastPosRef.current = { x: e.clientX, y: e.clientY }
      invalidate()
    },
    [camera, panSpeed, invalidate]
  )

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        gl.domElement.releasePointerCapture(e.pointerId)
        gl.domElement.style.cursor = ''
      }
    },
    [gl]
  )

  useEffect(() => {
    const dom = gl.domElement
    dom.addEventListener('wheel', handleWheel, { passive: false })
    dom.addEventListener('pointerdown', handlePointerDown)
    dom.addEventListener('pointermove', handlePointerMove)
    dom.addEventListener('pointerup', handlePointerUp)
    dom.addEventListener('pointercancel', handlePointerUp)

    return () => {
      dom.removeEventListener('wheel', handleWheel)
      dom.removeEventListener('pointerdown', handlePointerDown)
      dom.removeEventListener('pointermove', handlePointerMove)
      dom.removeEventListener('pointerup', handlePointerUp)
      dom.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [gl, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp])

  return null
}
