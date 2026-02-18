import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Layer } from './Layer'
import { FrameHandle } from './FrameHandle'

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    // Camera setup - orthographic facing forward
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
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
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // Create a Layer positioned at center
    const layer = new Layer()
    layer.size.set(2, 2)
    layer.setScene(scene)
    layer.setRenderer(renderer)
    layer.setCamera(camera)

    // Layer position in world space
    const layerPosition = new THREE.Vector3(0, 0, 0)

    // Create a FrameHandle for layer
    const frameHandle = new FrameHandle(layer)
    layer.handles.push(frameHandle)

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
    let enteredAbortController: AbortController | null = null
    let exitedAbortController: AbortController | null = null

    // Handle mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const worldMouse = mouseToWorld(mouseX, mouseY)
      const wasOverLayer = isMouseOverLayer
      isMouseOverLayer = isPointInLayerBounds(worldMouse)

      // Trigger handle when entering layer
      if (!wasOverLayer && isMouseOverLayer) {
        enteredAbortController = new AbortController()
        frameHandle.triggerBoundsEntered(enteredAbortController.signal)
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
        frameHandle.triggerBoundsExited(exitedAbortController.signal)
      }
    }

    renderer.domElement.addEventListener('mousemove', handleMouseMove)

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
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
      enteredAbortController?.abort()
      exitedAbortController?.abort()
      containerRef.current?.removeChild(renderer.domElement)
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
