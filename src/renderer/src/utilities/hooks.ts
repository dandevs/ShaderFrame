import { RootState, useFrame } from '@react-three/fiber'
import { useMemo, useEffect } from 'react'
import { BufferGeometry } from 'three'

/**
 * Enhances a Three.js object with disposable resource management support.
 *
 * This function adds a `Symbol.dispose` method to Three.js buffer geometries,
 * enabling them to be used with JavaScript's `using` keyword for automatic
 * cleanup. When the resource goes out of scope, the object's `dispose()` method
 * is called to free GPU memory and other resources.
 *
 * @param obj - The Three.js BufferGeometry to make disposable
 * @returns The same object with disposable capabilities added
 *
 * @example
 * ```tsx
 * useThreeScoped(async (run) => {
 *   using geometry = withThreeDispose(new BoxGeometry(1, 1, 1))
 *   // geometry.dispose() will be called automatically when scope exits
 *
 *   await run((state, delta) => {
 *     geometry.rotateY(delta * 0.5)
 *   })
 * })
 * ```
 */
export function withThreeDispose<T extends BufferGeometry>(obj: T): T & Disposable {
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
 * useThreeScoped(async (run) => {
 *   using geometry = withThreeDispose(new BoxGeometry(1, 1, 1))
 *
 *   await run((state, delta) => {
 *     geometry.rotateY(delta * 0.5)
 *   })
 * })
 * ```
 */
export function useThreeScoped(
  callback: (
    run: (action: (state: RootState, delta: number) => void) => Promise<void>
  ) => void | Promise<void>
): void {
  const controller = useMemo(() => new AbortController(), [])

  const behavior = useMemo(
    () => (run: (action: (state: RootState, delta: number) => void) => Promise<void>) => {
      return callback(run)
    },
    [callback]
  )

  const runner = useMemo(() => {
    let useFrameFunc: (state: RootState, delta: number) => void = null!

    behavior((run) => {
      return new Promise((resolve) => {
        useFrameFunc = (state, delta) => {
          if (!controller.signal.aborted) run(state, delta)
          else resolve()
        }
      })
    })

    return useFrameFunc
  }, [behavior, controller])

  useEffect(() => () => controller.abort(), [controller])
  useFrame(runner)
}
