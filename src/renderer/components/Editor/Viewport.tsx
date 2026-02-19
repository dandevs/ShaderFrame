import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Layer } from './Layer'
import { HighlightHandle } from './HighlightHandle'
import { ResizeHandle } from './ResizeHandle'

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    // Camera setup - orthographic facing forward
    const aspect = container.clientWidth / container.clientHeight
    const frustumSize = 10
    const camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    )
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    // Create a Layer positioned at center
    const layer = new Layer()
    layer.size.set(2, 2)
    layer.setScene(scene)
    layer.setRenderer(renderer)
    layer.setCamera(camera)

    // Layer position in world space
    const layerPosition = new THREE.Vector3(0, 0, 0)

    // Create handles for layer
    const highlightHandle = new HighlightHandle(layer)
    const resizeHandle = new ResizeHandle(layer)
    layer.handles.push(highlightHandle, resizeHandle)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    // Create a box to represent the layer visually
    const boxGeometry = new THREE.BoxGeometry(2, 2, 0.1)
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 })
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
    boxMesh.position.copy(layerPosition)
    scene.add(boxMesh)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Helper function to convert mouse screen coordinates to world space
    const mouseToWorld = (mouseX: number, mouseY: number): THREE.Vector3 => {
      const width = renderer.domElement.clientWidth
      const height = renderer.domElement.clientHeight

      // Convert to normalized device coordinates (-1 to +1)
      const ndcX = (mouseX / width) * 2 - 1
      const ndcY = -(mouseY / height) * 2 + 1

      // Unproject to world space (accounts for camera position and projection)
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5)
      vec.unproject(camera)

      return vec
    }

    // Check if a world position is within layer bounds
    const isPointInLayerBounds = (worldPos: THREE.Vector3): boolean => {
      const halfWidth = layer.size.x / 2
      const halfHeight = layer.size.y / 2

      return (
        worldPos.x >= layerPosition.x - halfWidth &&
        worldPos.x <= layerPosition.x + halfWidth &&
        worldPos.y >= layerPosition.y - halfHeight &&
        worldPos.y <= layerPosition.y + halfHeight
      )
    }

    // Track mouse state and abort controllers
    let isMouseOverLayer = false
    let isDragging = false
    let enteredAbortController: AbortController | null = null
    let exitedAbortController: AbortController | null = null

    // Handle mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const worldMouse = mouseToWorld(mouseX, mouseY)

      // Update resize handle mouse position
      resizeHandle.updateMousePosition(worldMouse)

      // Handle dragging
      if (isDragging) {
        resizeHandle.onDrag(worldMouse)
        // Update box mesh to match new layer size
        boxMesh.scale.set(
          layer.size.x / 2, // Original geometry was 2x2x0.1
          layer.size.y / 2,
          1
        )
        // Redraw both handles to update their positions after resize
        highlightHandle.draw()
        return
      }

      const wasOverLayer = isMouseOverLayer
      isMouseOverLayer = isPointInLayerBounds(worldMouse)

      // Trigger handle when entering layer
      if (!wasOverLayer && isMouseOverLayer) {
        enteredAbortController = new AbortController()
        highlightHandle.triggerBoundsEntered(enteredAbortController.signal)
        // Draw resize handle initially when entering layer
        resizeHandle.draw()
      }

      // Trigger handle when exiting layer
      if (wasOverLayer && !isMouseOverLayer) {
        // Abort the entered animation
        if (enteredAbortController) {
          enteredAbortController.abort()
          enteredAbortController = null
        }

        // Start the exited animation with a new abort controller
        exitedAbortController = new AbortController()
        highlightHandle.triggerBoundsExited(exitedAbortController.signal)
      }
    }

    // Handle mouse down for drag start
    const handleMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const worldMouse = mouseToWorld(mouseX, mouseY)

      if (resizeHandle.startDrag(worldMouse)) {
        isDragging = true
      }
    }

    // Handle mouse up for drag end
    const handleMouseUp = () => {
      if (isDragging) {
        resizeHandle.endDrag()
        isDragging = false
      }
    }

    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    renderer.domElement.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('mouseleave', handleMouseUp)

    // Handle resize
    const handleResize = () => {
      if (!container) return

      const width = container.clientWidth
      const height = container.clientHeight
      const aspect = width / height

      camera.left = frustumSize * aspect / -2
      camera.right = frustumSize * aspect / 2
      camera.top = frustumSize / 2
      camera.bottom = frustumSize / -2
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
      renderer.domElement.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp)
      enteredAbortController?.abort()
      exitedAbortController?.abort()
      resizeHandle.dispose()
      container?.removeChild(renderer.domElement)
      renderer.dispose()
      boxGeometry.dispose()
      boxMaterial.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#222' }}
    />
  )
}
