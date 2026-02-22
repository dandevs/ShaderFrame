import { RootState, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useEffect } from 'react'

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
  const state = useThree()
  const controller = useMemo(() => new AbortController(), [])

  const behavior = useMemo(
    () => (run: (action: (delta: number) => void) => Promise<void>) => {
      return callback(state, run)
    },
    // state is a stable store reference from useThree – safe to dep on
    [callback, state]
  )

  const runner = useMemo(() => {
    let useFrameFunc: (_state: RootState, delta: number) => void = null!

    behavior((run) => {
      return new Promise((resolve) => {
        useFrameFunc = (_state, delta) => {
          if (!controller.signal.aborted) run(delta)
          else resolve()
        }
      })
    })

    return useFrameFunc
  }, [behavior, controller])

  useEffect(() => () => controller.abort(), [controller])
  useFrame(runner)
}
