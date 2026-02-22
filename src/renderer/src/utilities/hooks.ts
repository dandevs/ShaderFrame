import { RootState, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'

/**
 * Enhances any Three.js object that has a `.dispose()` method with
 * `Symbol.dispose` support, enabling use of the `using` keyword for
 * automatic cleanup when the resource goes out of scope.
 *
 * Works with any Three.js type that is disposable: `BufferGeometry`,
 * `Material`, `Texture`, `RenderTarget`, `WebGLRenderer`, etc.
 *
 * @param obj - Any Three.js object with a `dispose()` method
 * @returns The same object with `Symbol.dispose` added
 *
 * @example
 * ```tsx
 * useThreeScoped(async (run) => {
 *   using geometry = withThreeDispose(new BoxGeometry(1, 1, 1))
 *   using material = withThreeDispose(new MeshBasicMaterial())
 *   // Both are disposed automatically when the scope exits
 *
 *   await run((state, delta) => {
 *     geometry.rotateY(delta * 0.5)
 *   })
 * })
 * ```
 */
export function withThreeDispose<T extends { dispose(): void }>(obj: T): T & Disposable {
  const disposable = obj as T & Disposable
  const prevDispose = obj[Symbol.dispose]

  disposable[Symbol.dispose] = () => {
    if (prevDispose != null) prevDispose()
    obj.dispose()
  }
  return disposable
}

/**
 * A hook for running scoped Three.js frame effects with automatic cleanup.
 *
 * This hook provides a way to define frame-based animations or effects that can
 * be aborted and cleaned up automatically when the component unmounts. It integrates
 * with React Three Fiber's useFrame loop while offering better control over
 * disposable Three.js resources.
 *
 * @param callback - An async function that receives a `run` function to register
 *   frame callbacks. The callback can use `using` keyword with disposable resources
 *   (via `withThreeDispose`) for automatic cleanup.
 *
 * @example
 * ```tsx
 * useThreeScoped(async (state, run) => {
 *   using geometry = withThreeDispose(new BoxGeometry(1, 1, 1))
 *   // state.gl, state.camera etc. are available here immediately
 *
 *   await run((delta) => {
 *     geometry.rotateY(delta * 0.5)
 *   })
 * })
 * ```
 */
export function useThreeScoped(
  callback: (
    state: RootState,
    run: (action: (delta: number) => void) => Promise<void>
  ) => void | Promise<void>
): void {
  const frameActionRef = useRef<((delta: number) => void) | null>(null)
  const resolveRunRef = useRef<(() => void) | null>(null)
  const startedRef = useRef(false)

  // Cleanup on unmount: stop frame action and resolve the pending run()
  // promise so the callback's finally block runs as a microtask.
  useEffect(() => {
    return () => {
      startedRef.current = false
      frameActionRef.current = null
      resolveRunRef.current?.()
      resolveRunRef.current = null
    }
  }, [])

  // useFrame provides fresh RootState on every tick – the camera is always
  // the current default, even after <OrthographicCamera makeDefault />.
  useFrame((state, delta) => {
    // Start the callback exactly once, on the first frame after mount,
    // so `state` is guaranteed to reflect the fully committed scene.
    if (!startedRef.current) {
      startedRef.current = true
      const run = (action: (delta: number) => void): Promise<void> => {
        frameActionRef.current = action
        return new Promise<void>((resolve) => {
          resolveRunRef.current = resolve
        })
      }
      callback(state, run)
    }

    frameActionRef.current?.(delta)
  })
}
