# React Three Fiber API Reference

This document provides a comprehensive guide to React Three Fiber (R3F) API for the ShaderFrame project.

## Table of Contents

- [Canvas](#canvas)
- [Objects, Properties and Constructor Arguments](#objects-properties-and-constructor-arguments)
- [Hooks](#hooks)
- [Events](#events)
- [Additional Exports](#additional-exports)
- [TypeScript](#typescript)
- [Testing](#testing)

---

## Canvas

The `Canvas` object is where you start to define your React Three Fiber Scene.

```jsx
import React from 'react'
import { Canvas } from '@react-three/fiber'

const App = () => (
  <Canvas>
    <pointLight position={[10, 10, 10]} />
    <mesh>
      <sphereGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  </Canvas>
)
```

### Properties

| Prop            | Description                                                                                                                                       | Default                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| children        | three.js JSX elements or regular components                                                                                                       |                                                            |
| fallback        | optional DOM JSX elements or regular components in case GL is not supported                                                                       |                                                            |
| gl              | Props that go into the default renderer. Accepts sync/async callback with default props `gl={defaults => new Renderer({ ...defaults })}`          | `{}`                                                       |
| camera          | Props that go into the default camera, or your own `THREE.Camera`                                                                                 | `{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }`   |
| scene           | Props that go into the default scene, or your own `THREE.Scene`                                                                                   | `{}`                                                       |
| shadows         | Props that go into `gl.shadowMap`, can be set true for `PCFsoft` or one of the following: 'basic', 'percentage', 'soft', 'variance'               | `false`                                                    |
| raycaster       | Props that go into the default raycaster                                                                                                          | `{}`                                                       |
| frameloop       | Render mode: always, demand, never                                                                                                                | `always`                                                   |
| resize          | Resize config, see react-use-measure's options                                                                                                    | `{ scroll: true, debounce: { scroll: 50, resize: 0 } }`    |
| orthographic    | Creates an orthographic camera                                                                                                                    | `false`                                                    |
| dpr             | Pixel-ratio, use `window.devicePixelRatio`, or automatic: [min, max]                                                                              | `[1, 2]`                                                   |
| legacy          | Enables THREE.ColorManagement in three r139 or later                                                                                              | `false`                                                    |
| linear          | Switch off automatic sRGB color space and gamma correction                                                                                        | `false`                                                    |
| events          | Configuration for the event manager, as a function of state                                                                                       | `import { events } from "@react-three/fiber"`              |
| eventSource     | The source where events are being subscribed to, HTMLElement                                                                                      | `React.RefObject<HTMLElement>`, `gl.domElement.parentNode` |
| eventPrefix     | The event prefix that is cast into canvas pointer x/y events                                                                                      | `offset`                                                   |
| flat            | Use `THREE.NoToneMapping` instead of `THREE.ACESFilmicToneMapping`                                                                                | `false`                                                    |
| onCreated       | Callback after the canvas has rendered (but not yet committed)                                                                                    | `(state) => {}`                                            |
| onPointerMissed | Response for pointer clicks that have missed any target                                                                                           | `(event) => {}`                                            |

### Defaults

Canvas uses [createRoot](#createroot) which will create a translucent `THREE.WebGLRenderer` with the following constructor args:

- antialias=true
- alpha=true
- powerPreference="high-performance"

and with the following properties:

- outputColorSpace = THREE.SRGBColorSpace
- toneMapping = THREE.ACESFilmicToneMapping

It will also create the following scene internals:

- A `THREE.Perspective` camera
- A `THREE.Orthographic` cam if `orthographic` is true
- A `THREE.PCFSoftShadowMap` if `shadows` is true
- A `THREE.Scene` (into which all the JSX is rendered) and a `THREE.Raycaster`

In recent versions of threejs, `THREE.ColorManagement.enabled` will be set to `true` to enable automatic conversion of colors according to the renderer's configured color space. R3F will handle texture color space conversion. For more on this topic, see [https://threejs.org/docs/#manual/en/introduction/Color-management](https://threejs.org/docs/#manual/en/introduction/Color-management).

### Errors and fallbacks

On some systems WebGL may not be supported, you can provide a fallback component that will be rendered instead of the canvas:

```jsx
<Canvas fallback={<div>Sorry no WebGL supported!</div>}>
  <mesh />
</Canvas>
```

You should also safeguard the canvas against WebGL context crashes, for instance if users have the GPU disabled or GPU drivers are faulty.

```jsx
import { useErrorBoundary } from 'use-error-boundary'

function App() {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary()
  return didCatch ? (
    <div>{error.message}</div>
  ) : (
    <ErrorBoundary>
      <Canvas>
        <mesh />
      </Canvas>
    </ErrorBoundary>
  )
}
```

> Ideally, and if possible, your fallback is a seamless, visual replacement for what the canvas would have otherwise rendered.

### WebGPU

Recent Three.js now includes a WebGPU renderer. While still a work in progress and not fully backward-compatible with all of Three's features, the renderer requires an async initialization method. R3F streamlines this by allowing the gl prop to return a promise.

```tsx
import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

export default () => (
  <Canvas
    gl={async (props) => {
      const renderer = new THREE.WebGPURenderer(props as any)
      await renderer.init()
      return renderer
    }}>
      <mesh>
        <meshBasicNodeMaterial />
        <boxGeometry />
      </mesh>
  </Canvas>
)
```

### Custom Canvas

R3F can render to a root, similar to how `react-dom` and all the other React renderers work. This allows you to shave off `react-dom` (~40kb), `react-use-measure` (~3kb) and, if you don't need them, `pointer-events` (~7kb) (you need to explicitly import `events` and add them to the config otherwise).

Roots have the same options and properties as `Canvas`, but you are responsible for resizing it. It requires an existing DOM `<canvas>` object into which it renders.

#### CreateRoot

Creates a root targeting a canvas, rendering JSX.

```jsx
import * as THREE from 'three'
import { extend, createRoot, events } from '@react-three/fiber'

// Register the THREE namespace as native JSX elements.
// See below for notes on tree-shaking
extend(THREE)

// Create a react root
const root = createRoot(document.querySelector('canvas'))

async function app() {
  // Configure the root, inject events optionally, set camera, etc
  // This *must* be called before render, and it must be awaited
  await root.configure({ events, camera: { position: [0, 0, 50] } })

  // createRoot by design is not responsive, you have to take care of resize yourself
  window.addEventListener('resize', () => {
    root.configure({ size: { width: window.innerWidth, height: window.innerHeight } })
  })

  // Trigger resize
  window.dispatchEvent(new Event('resize'))

  // Render entry point
  root.render(<App />)

  // Unmount and dispose of memory
  // root.unmount()
}

app()
```

### Tree-shaking

New with v8, the underlying reconciler no longer pulls in the THREE namespace automatically.

This enables a granular catalogue which also enables tree-shaking via the `extend` API:

```jsx
import { extend, createRoot } from '@react-three/fiber'
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three'

extend({ Mesh, BoxGeometry, MeshStandardMaterial })

createRoot(canvas).render(
  <>
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  </>,
)
```

There's an [official babel plugin](https://github.com/pmndrs/react-three-babel) which will do this for you automatically:

```jsx
// In:

import { createRoot } from '@react-three/fiber'

createRoot(canvasNode).render(
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>,
)

// Out:

import { createRoot, extend } from '@react-three/fiber'
import { Mesh as _Mesh, BoxGeometry as _BoxGeometry, MeshStandardMaterial as _MeshStandardMaterial } from 'three'

extend({
  Mesh: _Mesh,
  BoxGeometry: _BoxGeometry,
  MeshStandardMaterial: _MeshStandardMaterial,
})

createRoot(canvasNode).render(
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>,
)
```

---

## Objects, properties and constructor arguments

### Declaring objects

You can use [three.js's entire object catalogue and all properties](https://threejs.org/docs). When in doubt, always consult the docs.

❌ You could lay out an object like this:

```jsx
<mesh
  visible
  userData={{ hello: 'world' }}
  position={new THREE.Vector3(1, 2, 3)}
  rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
  geometry={new THREE.SphereGeometry(1, 16, 16)}
  material={new THREE.MeshBasicMaterial({ color: new THREE.Color('hotpink'), transparent: true })}
/>
```

✅ The problem is that all of these properties will always be re-created. Instead, you should define properties declaratively.

```jsx
<mesh visible userData={{ hello: 'world' }} position={[1, 2, 3]} rotation={[Math.PI / 2, 0, 0]}>
  <sphereGeometry args={[1, 16, 16]} />
  <meshStandardMaterial color="hotpink" transparent />
</mesh>
```

### Constructor arguments

In three.js objects are classes that are instantiated. These classes can receive one-time constructor arguments (`new THREE.SphereGeometry(1, 32)`), and properties (`someObject.visible = true`). In React Three Fiber, constructor arguments are always passed as an array via `args`. If args change later on, the object must naturally get reconstructed from scratch!

```jsx
<sphereGeometry args={[1, 32]} />
```

### Shortcuts

#### Set

All properties whose underlying object has a `.set()` method can directly receive the same arguments that `set` would otherwise take. For example [`THREE.Color.set`](https://threejs.org/docs/#api/en/math/Color.set) can take a color string, so instead of `color={new THREE.Color('hotpink')}` you can simply write `color="hotpink"`. Some `set` methods take multiple arguments, for instance [`THREE.Vector3`](https://threejs.org/docs/#api/en/math/Vector3.set), give it an array in that case `position={[100, 0, 0]}`.

```jsx
<mesh position={[1, 2, 3]} />
  <meshStandardMaterial color="hotpink" />
```

> If you do link up an existing object to a property, for instance a THREE.Vector3() to a position, be aware that this will end up copying the object in most cases as it calls .copy() on the target. This only applies to objects that expose both .set() and .copy() (Vectors, Eulers, Matrix, ...). If you link up an existing material or geometry on the other hand, it will overwrite, because more these objects do not have a .set() method.

#### SetScalar

Properties that have a `setScalar` method (for instance `Vector3`) can be set like so:

```jsx
// Translates to <mesh scale={[1, 1, 1]} />
<mesh scale={1} />
```

### Piercing into nested properties

If you want to reach into nested attributes (for instance: `mesh.rotation.x`), just use dash-case.

```jsx
<mesh rotation-x={1} material-uniforms-resolution-value={[512, 512]} />
```

### Dealing with non-scene objects

You can put non-Object3D primitives (geometries, materials, etc) into the render tree as well. They take the same properties and constructor arguments they normally would.

You might be wondering why you would want to put something in the "scene" that normally would not be part of it, in a vanilla three.js app at least. For the same reason you declare any object: it becomes managed, reactive and auto-disposes. These objects are not technically part of the scene, but they "attach" to a parent which is.

#### Attach

Use `attach` to bind objects to their parent. If you unmount the attached object it will be taken off its parent automatically.

The following attaches a material to the `material` property of a mesh and a geometry to the `geometry` property:

```jsx
<mesh>
  <meshBasicMaterial attach="material" />
  <boxGeometry attach="geometry" />
```

> All objects extending `THREE.Material` receive `attach="material"`, and all objects extending `THREE.BufferGeometry` receive `attach="geometry"`. You do not have to type it out!

```jsx
<mesh>
  <meshBasicMaterial />
  <boxGeometry />
```

You can also deeply nest attach through piercing. The following adds a buffer-attribute to `geometry.attributes.position` and then adds the buffer geometry to `mesh.geometry`.

```jsx
<mesh>
  <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[v, 3]} />
```

#### More examples

```jsx
// Attach bar to foo.a
<foo>
  <bar attach="a" />

// Attach bar to foo.a.b and foo.a.b.c (nested object attach)
<foo>
  <bar attach="a-b" />
  <bar attach="a-b-c" />

// Attach bar to foo.a[0] and foo.a[1] (array attach is just object attach)
<foo>
  <bar attach="a-0" />
  <bar attach="a-1" />

// Attach bar to foo via explicit add/remove functions
<foo>
  <bar attach={(parent, self) => {
    parent.add(self)
    return () => parent.remove(self)
  }} />

// The same as a one liner
<foo>
  <bar attach={(parent, self) => (parent.add(self), () => parent.remove(self))} />
```

#### Real-world use-cases:

Attaching to nested objects, for instance a shadow-camera:

```diff
- <directionalLight
-   castShadow
-   position={[2.5, 8, 5]}
-   shadow-mapSize={[1024, 1024]}
-   shadow-camera-far={50}
-   shadow-camera-left={-10}
-   shadow-camera-right={10}
-   shadow-camera-top={10}
-   shadow-camera-bottom={-10}
- />
+ <directionalLight castShadow position={[2.5, 8, 5]} shadow-mapSize={[1024, 1024]}>
+   <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
+ </directionalLight>
```

Arrays must have explicit order, for instance multi-materials:

```jsx
<mesh>
  {colors.map((color, index) => <meshBasicMaterial key={index} attach={`material-${index}`} color={color} />}
</mesh>
```

### Putting already existing objects into the scene-graph

You can use the `primitive` placeholder for that. You can still give it properties or attach nodes to it. Never add the same object multiple times, this is not allowed in three.js! Primitives will not dispose of the object they carry on unmount, you are responsible for disposing of it!

```jsx
const mesh = new THREE.Mesh(geometry, material)

function Component() {
  return <primitive object={mesh} position={[10, 0, 0]} />
```

> Scene objects can only ever be added once in Threejs. If you attempt to add one and the same object in two places Threejs will remove the first instance automatically. This will also happen with primitive! If you want to re-use an existing object, you must clone it first.

### Using 3rd-party objects declaratively

The `extend` function extends React Three Fiber's catalogue of JSX elements. Components added this way can then be referenced in the scene-graph using camel casing similar to other primitives.

```jsx
import { extend } from '@react-three/fiber'
import { OrbitControls, TransformControls } from 'three-stdlib'
extend({ OrbitControls, TransformControls })

// ...
return (
  <>
    <orbitControls />
    <transformControls />
```

If you're using TypeScript, you'll also need to [extend the JSX namespace](/tutorials/v9-migration-guide#threeelements).

### Disposal

Freeing resources is a [manual chore in `three.js`](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects), but React is aware of object-lifecycles, hence React Three Fiber will attempt to free resources for you by calling `object.dispose()`, if present, on all unmounted objects.

If you manage assets by yourself, globally or in a cache, this may _not_ be what you want. You can switch it off by placing `dispose={null}` onto meshes, materials, etc, or even on parent containers like groups, it is now valid for the entire tree.

```jsx
const globalGeometry = new THREE.BoxGeometry()
const globalMaterial = new THREE.MeshBasicMaterial()

function Mesh() {
  return (
    <group dispose={null}>
      <mesh geometry={globalGeometry} material={globalMaterial} />
```

---

## Hooks

Hooks allow you to tie or request specific information to your component. For instance, components that want to participate in the renderloop can use `useFrame`, components that need to be informed of three.js specifics can use `useThree` and so on. All hooks clean up after themselves once the component unmounts.

> Hooks can only be used inside the Canvas element because they rely on context!

❌ You cannot expect something like this to work:

```jsx
import { useThree } from '@react-three/fiber'

function App() {
  const { size } = useThree() // This will just crash
  return (
    <Canvas>
      <mesh>
```

✅ Do this instead:

```jsx
function Foo() {
  const { size } = useThree()
  ...
}

function App() {
  return (
    <Canvas>
      <Foo />
```

### `useThree`

This hook gives you access to the state model which contains the default renderer, the scene, your camera, and so on. It also gives you the current size of the canvas in screen and viewport coordinates.

```jsx
import { useThree } from '@react-three/fiber'

function Foo() {
  const state = useThree()
```

The hook is reactive, if you resize the browser for instance, you get fresh measurements, same applies to any of the state objects that may change.

#### `state` properties

| Prop              | Description                                                                   | Type                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gl`              | Renderer                                                                      | `THREE.WebGLRenderer`                                                                                                                                                                                          |
| `scene`           | Scene                                                                         | `THREE.Scene`                                                                                                                                                                                                  |
| `camera`          | Camera                                                                        | `THREE.PerspectiveCamera`                                                                                                                                                                                      |
| `raycaster`       | Default raycaster                                                             | `THREE.Raycaster`                                                                                                                                                                                              |
| `pointer`         | Contains updated, normalized, centric pointer coordinates                     | `THREE.Vector2`                                                                                                                                                                                                |
| `mouse`           | Note: this is deprecated, use `pointer` instead! Normalized event coordinates | `THREE.Vector2`                                                                                                                                                                                                |
| `clock`           | Running system clock                                                          | `THREE.Clock`                                                                                                                                                                                                  |
| `linear`          | True when the colorspace is linear                                            | `boolean`                                                                                                                                                                                                      |
| `flat`            | True when no tonemapping is used                                              | `boolean`                                                                                                                                                                                                      |
| `legacy`          | Disables global color management via `THREE.ColorManagement`                  | `boolean`                                                                                                                                                                                                      |
| `frameloop`       | Render mode: always, demand, never                                            | `always`, `demand`, `never`                                                                                                                                                                                    |
| `performance`     | System regression                                                             | `{ current: number, min: number, max: number, debounce: number, regress: () => void }`                                                                                                                         |
| `size`            | Canvas size in pixels                                                         | `{ width: number, height: number, top: number, left: number }`                                                                                                                                                 |
| `viewport`        | Canvas viewport size in three.js units. Note: This is different from [`gl.getViewport`](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.getViewport) which returns the drawbuffer size                                               | `{ width: number, height: number, initialDpr: number, dpr: number, factor: number, distance: number, aspect: number, getCurrentViewport: (camera?: Camera, target?: THREE.Vector3, size?: Size) => Viewport }` |
| `xr`              | XR interface, manages WebXR rendering                                         | `{ connect: () => void, disconnect: () => void }`                                                                                                                                                              |
| `set`             | Allows you to set any state property                                          | `(state: SetState<RootState>) => void`                                                                                                                                                                         |
| `get`             | Allows you to retrieve any state property non-reactively                      | `() => GetState<RootState>`                                                                                                                                                                                    |
| `invalidate`      | Request a new render, given that `frameloop === 'demand'`                     | `() => void`                                                                                                                                                                                                   |
| `advance`         | Advance one tick, given that `frameloop === 'never'`                          | `(timestamp: number, runGlobalEffects?: boolean) => void`                                                                                                                                                      |
| `setSize`         | Resize the canvas                                                             | `(width: number, height: number, top?: number, left?: number) => void`                                                                                                                                         |
| `setDpr`          | Set the pixel-ratio                                                           | `(dpr: number) => void`                                                                                                                                                                                        |
| `setFrameloop`    | Shortcut to set the current render mode                                       | `(frameloop?: 'always', 'demand', 'never') => void`                                                                                                                                                            |
| `setEvents`       | Shortcut to setting the event layer                                           | `(events: Partial<EventManager<any>>) => void`                                                                                                                                                                 |
| `onPointerMissed` | Response for pointer clicks that have missed a target                         | `() => void`                                                                                                                                                                                                   |
| `events`          | Pointer-event handling                                                        | `{ connected: TargetNode, handlers: Events, connect: (target: TargetNode) => void, disconnect: () => void }`                                                                                                   |

#### Selector

You can also select properties, this allows you to avoid needless re-render for components that are interested only in particulars. Reactivity does not include deeper three.js internals!

```jsx
// Will only trigger re-render when the default camera is exchanged
const camera = useThree((state) => state.camera)
// Will only re-render on resize changes
const viewport = useThree((state) => state.viewport)
// ❌ You cannot expect reactivity from three.js internals!
const zoom = useThree((state) => state.camera.zoom)
```

#### Reading state from outside of the component cycle

```jsx
function Foo() {
  const get = useThree((state) => state.get)
  ...
  get() // Get fresh state from anywhere you want
```

#### Exchanging defaults

```jsx
function Foo() {
  const set = useThree((state) => state.set)
  ...
  useEffect(() => {
    set({ camera: new THREE.OrthographicCamera(...) })
  }, [])
}
```

### `useFrame`

This hook allows you to execute code on every rendered frame, like running effects, updating controls, and so on. You receive the state (same as `useThree`) and a clock delta. Your callback function will be invoked just before a frame is rendered. When the component unmounts it is unsubscribed automatically from the render-loop.

```jsx
import { useFrame } from '@react-three/fiber'

function Foo() {
  useFrame((state, delta, xrFrame) => {
    // This function runs at the native refresh rate inside of a shared render-loop
  })
}
```

> Be careful about what you do inside useFrame! You should never setState in there! Your calculations should be slim and you should mind all the commonly known pitfalls when dealing with loops in general, like re-use of variables, etc.

#### Taking over the render-loop

If you need more control you may pass a numerical `renderPriority` value. This will cause React Three Fiber to disable automatic rendering altogether. It will now be your responsibility to render, which is useful when you're working with effect composers, heads-up displays, etc.

```jsx
function Render() {
  // Takes over the render-loop, the user has the responsibility to render
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera)
  }, 1)

function RenderOnTop() {
  // This will execute *after* Render's useframe
  useFrame(({ gl, ... }) => {
    gl.render(...)
  }, 2)
```

> Callbacks will be executed in order of ascending priority values (lowest first, highest last.), similar to the DOM's z-order.

#### Negative indices

Using negative indices will **not take over the render loop**, but it can be useful if you really must order the sequence of useFrames across the component tree.

```jsx
function A() {
  // This will execute first
  useFrame(() => ..., -2)

function B() {
  // This useFrame will execute *after* A's
  useFrame(() => ..., -1)
```

### `useLoader`

This hook loads assets and suspends for easier fallback- and error-handling. It can take any three.js loader as its first argument: GLTFLoader, OBJLoader, TextureLoader, FontLoader, etc. It is based on [React.Suspense](https://react.dev/reference/react/Suspense), so fallback-handling and [error-handling](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) happen at the parental level.

```jsx
import { Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

function Model() {
  const result = useLoader(GLTFLoader, '/model.glb')
  // You don't need to check for the presence of the result, when we're here
  // the result is guaranteed to be present since useLoader suspends the component
  return <primitive object={result.scene} />
}

function App() {
  return (
    <Suspense fallback={<FallbackComponent /> /* or null */}>
      <Model />
    </Suspense>
  )
}
```

> Internally, `useLoader` relies on [`suspend-react`](https://github.com/pmndrs/suspend-react).

> Assets loaded with useLoader are cached by default. The urls given serve as cache-keys. This allows you to re-use loaded data everywhere in the component tree.

> Be very careful with mutating or disposing of loaded assets, especially when you plan to re-use them. Refer to the automatic disposal section in the API.

#### Loader extensions

You can provide a callback as the third argument if you need to configure your loader:

```jsx
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

useLoader(GLTFLoader, url, (loader) => {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco-gltf/')
  loader.setDRACOLoader(dracoLoader)
})
```

#### Loading multiple assets at once

It can also make multiple requests in parallel:

```jsx
const [bumpMap, specMap, normalMap] = useLoader(TextureLoader, [url1, url2, url2])
```

#### Loading status

You can get the loading status from a callback you provide as the fourth argument. Though consider alternatives like THREE.DefaultLoadingManager or better yet, [Drei's](https://github.com/pmndrs/drei) loading helpers.

```jsx
useLoader(loader, url, extensions, (xhr) => {
  console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
})
```

#### Special treatment of GLTFLoaders and all loaders that return a scene prop

If a `result.scene` prop is found the hook will automatically create a object & material collection: `{ nodes, materials }`. This lets you build immutable scene graphs selectively. You can also specifically alter the data without having to traverse it. [GLTFJSX](https://github.com/pmndrs/gltfjsx) specifically relies on this data.

```jsx
const { nodes, materials } = useLoader(GLTFLoader, url)
```

#### Pre-loading assets

You can pre-load assets in global space so that models can be loaded in anticipation before they're mounted in the component tree.

```jsx
useLoader.preload(GLTFLoader, '/model.glb' /* extensions */)
```

### `useGraph`

Convenience hook which creates a memoized, named object/material collection from any [`Object3D`](https://threejs.org/docs/#api/en/core/Object3D).

```jsx
import { useLoader, useGraph } from '@react-three/fiber'

function Model(url) {
  const scene = useLoader(OBJLoader, url)
  const { nodes, materials } = useGraph(scene)
  return <mesh geometry={nodes.robot.geometry} material={materials.metal} />
}
```

---

## Events

`three.js` objects that implement their own `raycast` method (meshes, lines, etc) can be interacted with by declaring events on them. We support pointer events, clicks and wheel-scroll. Events contain the browser event as well as the `three.js` event data (object, point, distance, etc). You may want to [polyfill](https://github.com/jquery/PEP) them, if that's a concern.

Additionally, there's a special `onUpdate` that is called every time the object gets fresh props, which is good for things like `self => (self.verticesNeedUpdate = true)`.

Also notice the `onPointerMissed` on the canvas element, which fires on clicks that haven't hit _any_ meshes.

```jsx
<mesh
  onClick={(e) => console.log('click')}
  onContextMenu={(e) => console.log('context menu')}
  onDoubleClick={(e) => console.log('double click')}
  onWheel={(e) => console.log('wheel spins')}
  onPointerUp={(e) => console.log('up')}
  onPointerDown={(e) => console.log('down')}
  onPointerOver={(e) => console.log('over')}
  onPointerOut={(e) => console.log('out')}
  onPointerEnter={(e) => console.log('enter')} // see note 1
  onPointerLeave={(e) => console.log('leave')} // see note 1
  onPointerMove={(e) => console.log('move')}
  onPointerMissed={() => console.log('missed')}
  onUpdate={(self) => console.log('props have been updated')}
/>
```

### Event data

```jsx
({
  ...DomEvent                   // All the original event data
  ...Intersection                 // All of Three's intersection data - see note 2
  intersections: Intersection[]    // The first intersection of each intersected object
  object: Object3D              // The object that was actually hit
  eventObject: Object3D         // The object that registered the event
  unprojectedPoint: Vector3     // Camera-unprojected point
  ray: Ray                      // The ray that was used to strike the object
  camera: Camera                // The camera that was used in the raycaster
  sourceEvent: DomEvent         // A reference to the host event
  delta: number                 // Distance between mouse down and mouse up event in pixels
}) => ...
```

### How the event-system works, bubbling and capture

> - `pointerenter` and `pointerleave` events work exactly the same as pointerover and pointerout.
> - `pointerenter` and `pointerleave` semantics are not implemented.

> Some events (such as `pointerout`) happen when there is no intersection between `eventObject` and
the ray. When this happens, the event will contain intersection data from a previous event with
this object.

### Event propagation (bubbling)

Propagation works a bit differently to the DOM because objects can occlude each other in 3D. The `intersections` array in the event includes all objects intersecting the ray, not just the nearest. Only the first intersection with each object is included.
The event is first delivered to the object nearest the camera, and then bubbles up through its ancestors like in the DOM. After that, it is delivered to the next nearest object, and then its ancestors, and so on. This means objects are transparent to pointer events by default, even if the object handles the event.

`event.stopPropagation()` doesn't just stop this event from bubbling up, it also stops it from being delivered to farther objects (objects behind this one). All other objects, nearer or farther, no longer count as being hit while the pointer is over this object. If they were previously delivered pointerover events, they will immediately be delivered pointerout events. If you want an object to block pointer events from objects behind it, it needs to have an event handler as follows:

```jsx
onPointerOver={e => {
  e.stopPropagation()
  // ...
}}
```

even if you don't want this object to respond to the pointer event. If you do want to handle the event as well as using `stopPropagation()`, remember that the pointerout events will happen **during** the `stopPropagation()` call. You probably want your other event handling to happen after this.

### Pointer capture

Because events go to all intersected objects, capturing the pointer also works differently. In the DOM, the capturing object **replaces** the hit test, but in React Three Fiber, the capturing object is **added** to the hit test result: if the capturing object was not hit, then all of the hit objects (and their ancestors) get the event first, followed by the capturing object and its ancestors. The capturing object can also use `event.stopPropagation()` so that objects that really were hit get pointerout events.

Note that you can access the `setPointerCapture` and `releasePointerCapture` methods **only** via `event.target`: they don't get added to the `Object3D` instances in the scene graph.

`setPointerCapture` and `releasePointerCapture` take a `pointerId` parameter like in the DOM, but for now they don't have support for multiple active pointers. PRs are welcome!

```jsx
onPointerDown={e => {
  // Only the mesh closest to the camera will be processed
  e.stopPropagation()
  // You may optionally capture the target
  e.target.setPointerCapture(e.pointerId)
}}
onPointerUp={e => {
  e.stopPropagation()
  // Optionally release capture
  e.target.releasePointerCapture(e.pointerId)
}}
```

### Customizing the event settings

For some advanced usage it's possible to customize the setting of the event manager globally with the `events` prop on `<Canvas/>`:

```tsx
import { Canvas, events } from '@react-three/fiber'

const eventManagerFactory: Parameters<typeof Canvas>[0]['events'] = (state) => ({
  // Default configuration
  ...events(state),

  // Determines if the event layer is active
  enabled: true,

  // Event layer priority, higher prioritized layers come first and may stop(-propagate) lower layer
  priority: 1,

  // The filter can re-order or re-structure the intersections
  filter: (items: THREE.Intersection[], state: RootState) => items,

  // The compute defines how pointer events are translated into the raycaster and pointer vector2
  compute: (event: DomEvent, state: RootState, previous?: RootState) => {
    state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1)
    state.raycaster.setFromCamera(state.pointer, state.camera)
  },

  // Find more configuration default on ./packages/fiber/src/web/events.ts
  // And type definitions in ./packages/fiber/src/core/events.ts
})

function App() {
  return (
    <Canvas events={eventManagerFactory}>
}
```

### Using a different target element

There are cases in which you may want to connect the event handlers to another DOM element instead of the canvas. This is usually done to have events on a shared parent, which allows both the canvas, and dom overlays to receive events.

You can either use the event manager:

```jsx
const events => useThree(state => state.events)
useEffect(() => {
  state.events.connect(domNode)
```

Or, the `eventSource` shortcut on the canvas (DOM only), which accepts dom-nodes and React.RefObjects to dom-nodes.

```jsx
function App() {
  const target = useRef()
  return (
    <div ref={target}>
      <Canvas eventSource={target.current}>
```

### Using a different prefix (DOM only)

By default Fiber will use offsetX/offsetY to set up the raycaster. You can change this with the `eventPrefix` shortcut.

```jsx
function App() {
  return (
    <Canvas eventPrefix="client">
```

### Allow raycast without user interaction

By default Fiber will only raycast when the user is interacting with the canvas. If, for instance, the camera moves a hoverable object underneath the cursor it will not trigger a hover event. If this is wanted behaviour you can force a raycast by executing `update()`, call it whenever necessary.

```jsx
const events => useThree(state => state.events)
useEffect(() => {
  // Will trigger a onPointerMove with the last-known pointer event
  state.events.update()
```

You can abstract this into more complex logic.

```jsx
function RaycastWhenCameraMoves() {
  const matrix = new THREE.Matrix4()
  useFrame((state) => {
    // Act only when the camera has moved
    if (!matrix.equals(state.camera.matrixWorld)) {
      state.events.update()
      matrix.copy(state.camera.matrixWorld)
    }
  })
}
```

---

## Additional Exports

| export               | usage                                                          |
| -------------------- | -------------------------------------------------------------- |
| `addEffect`          | Adds a global render callback which is called each frame       |
| `addAfterEffect`     | Adds a global after-render callback which is called each frame |
| `addTail`            | Adds a global callback which is called when rendering stops    |
| `buildGraph`         | Collects nodes and materials from a THREE.Object3D             |
| `flushGlobalEffects` | Flushes global render-effects for when manually driving a loop |
| `flushSync`          | Force React to flush any updates synchronously and immediately |
| `invalidate`         | Forces view global invalidation                                |
| `advance`            | Advances the frameloop (given that it's set to 'never')        |
| `extend`             | Extends the native-object catalogue                            |
| `createPortal`       | Creates a portal (it's a React feature for re-parenting)       |
| `createRoot`         | Creates a root that can render three JSX into a canvas         |
| `events`             | Dom pointer-event system                                       |
| `applyProps`         | `applyProps(element, props)` sets element properties,          |
| `act`                | usage with react-testing                                       |
| `useInstanceHandle`  | Exposes react-internal local state from `instance.__r3f`       |

---

## TypeScript

### Typing with `useRef`

React's `useRef` won't automatically infer types despite pointing it to a typed ref.

You can type the ref yourself by passing a type through `useRef`'s generics:

```tsx
import { useRef, useEffect } from 'react'
import { Mesh } from 'three'

function Box(props) {
  const meshRef = useRef<Mesh>(null!)

  useEffect(() => {
    console.log(Boolean(meshRef.current))
  }, [])

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}
```

The exclamation mark is a non-null assertion that will let TS know that `ref.current` is defined when we access it in effects, useFrame et al. You do not need to check against null, the element is assumed to exist.

### Accessing typed three-elements

Whenever you want to spread props or type components that rely on three elements, you can use the `ThreeElements` interface to extract the mesh, group, or any other three element, including custom elements.

```tsx
import { ThreeElements } from '@react-three/fiber'

type FooProps = ThreeElements['mesh'] & { bar: boolean }

function Foo({ bar, ...props}: FooProps) {
  useEffect(() => {
    console.log(bar)
  }, [bar])
  return <mesh {...props} />
}
```

### Extend usage

react-three-fiber can also accept third-party elements and extend them into its internal catalogue.

```tsx
import { useRef, useEffect } from 'react'
import { GridHelper } from 'three'
import { extend } from '@react-three/fiber'

// Create our custom element
class CustomElement extends GridHelper {}

// Extend so the reconciler will learn about it
extend({ CustomElement })

<customElement />
```

The catalogue teaches the underlying reconciler how to create fibers for these elements and treat them within the scene.

You can then declaratively create custom elements with primitives, but TypeScript won't know about them nor their props.

```html
// error: 'customElement' does not exist on type 'JSX.IntrinsicElements'

<customElement />
```

#### Extending ThreeElements

To define our element in JSX, we'll use the `ThreeElement` interface to extend `ThreeElements`. This interface describes three.js classes that are available in the R3F catalog and can be used as native elements.

```tsx
import { useRef, useEffect } from 'react'
import { GridHelper } from 'three'
import { extend, ThreeElement } from '@react-three/fiber'

// Create our custom element
class CustomElement extends GridHelper {}

// Extend so the reconciler will learn about it
extend({ CustomElement })

// Add types to ThreeElements elements so primitives pick up on it
declare module '@react-three/fiber' {
  interface ThreeElements {
    customElement: ThreeElement<typeof CustomElement>
  }
}

// react-three-fiber will create your custom component and TypeScript will understand it
<customComponent />
```

You can shorten element definition by using the `extend` factory signature, which will automatically extend the element locally. This will also prevent namespace bleeding.

```tsx
// Create our custom element
class CustomElement extends GridHelper {}

// Extend so the reconciler will learn about it, types will be inferred
const Element = extend(CustomElement)

// react-three-fiber will create your custom component and TypeScript will understand it
<Element />
```

### Extending three default elements

If you open your own root instead of using `<Canvas>`, you can extend the default elements with `extend`. But keep in mind that the `* as THREE` namespace contains classes, functions, numbers, strings. At the moment we suggest you use `any` or `@ts-ignore` unless you extract the exact classes you need (`extend({ Mesh, Group, ... })`).

```tsx
import * as THREE from 'three'
import { extend, createRoot, events } from '@react-three/fiber'

// Register the THREE namespace as native JSX elements.
extend(THREE as any)

// Create a react root
const root = createRoot(document.querySelector('canvas'))
```

### Exported types

react-three-fiber is extensible and exports types for its internals, such as render props, canvas props, and events:

```tsx
// Event raycaster intersection
Intersection

// `useFrame` internal subscription and render callback
Subscription
RenderCallback

// `useThree`'s returned internal state
RootState
Performance
Dpr
Size
Viewport
Camera

// Canvas props
CanvasProps

// Supported events
Events

// Event manager signature (is completely modular)
EventManager

// Wraps a platform event as it's passed through the event manager
ThreeEvent
```

---

## Testing

Like with every other application testing is an important factor when it comes to releasing an application into the wild and when it comes to React Three Fiber we can use React Three Test Renderer to achieve this.

We will be testing the [sandbox](https://codesandbox.io/s/98ppy) we created in [events and interactions](events-and-interaction).

### How to test React Three Fiber

Let's start by installing the React Three Test Renderer:

```bash
npm install @react-three/test-renderer --save-dev
```

Afterwards, if you are using Create React App you can just add a file that ends in `.test.js` and start writing your code, because React Three Test Renderer is testing library agnostic, so it works with libraries such as `jest`, `jasmine` etc.

Let's create an `App.test.js` and set up all our test cases:

```jsx
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { MyRotatingBox } from './App'

test('mesh to have two children', async () => {
  const renderer = await ReactThreeTestRenderer.create(<MyRotatingBox />)
})

test('click event makes box bigger', async () => {
  const renderer = await ReactThreeTestRenderer.create(<MyRotatingBox />)
})
```

In here we created three tests and in each we made sure we created the renderer by using the `create` function.

Let's start with the first test and make sure our mesh has two children, the material and cube.

We can start by getting the scene and it's children from the test instance we just created like so:

```js
const meshChildren = renderer.scene.children
```

If you log this mesh out you can see that it returns an array of one element since that's all we have in the scene.

Using this we can make sure to get that first child and use the `allChildren` property on it like so:

```js
const meshChildren = renderer.scene.children[0].allChildren
```

There is also one property called `children` but this one is meant to be used for things like groups as this one does not return the geometry and the materials, for that we need `allChildren`.

Now to create our assertion:

```js
expect(meshChildren.length).toBe(2)
```

Our first test case looks like this:

```js
test('mesh to have two children', async () => {
  const renderer = await ReactThreeTestRenderer.create(<MyRotatingBox />)
  const mesh = renderer.scene.children[0].allChildren
  expect(mesh.length).toBe(2)
})
```

### Testing interactions

Now that we have gotten the first test out of the way we can test our interaction and make sure that when we click on the mesh it does indeed update the scale.

We can do that by utilizing the `fireEvent` method existing in a test instance.

We know we can get the mesh with:

```js
const mesh = renderer.scene.children[0]
```

Since we already have that we can fire an event in it like so:

```js
await renderer.fireEvent(mesh, 'click')
```

With that done, all that's left to do is the tree demonstration of our scene and make sure the scale prop on our mesh has updated:

```js
expect(mesh.props.scale).toBe(1.5)
```

In the end our test looks something like this:

```js
test('click event makes box bigger', async () => {
  const renderer = await ReactThreeTestRenderer.create(<MyRotatingBox />)
  const mesh = renderer.scene.children[0]
  expect(mesh.props.scale).toBe(1)
  await renderer.fireEvent(mesh, 'click')
  expect(mesh.props.scale).toBe(1.5)
})
```

If you want to learn more about React Three Test Renderer you can checkout the repo and their docs:

- [Repo](https://github.com/pmndrs/react-three-fiber/blob/master/packages/test-renderer)
- [React Three Test Renderer API](https://github.com/pmndrs/react-three-fiber/blob/master/packages/test-renderer/markdown/rttr.md#create)
- [React Three Test Instance API](https://github.com/pmndrs/react-three-fiber/blob/master/packages/test-renderer/markdown/rttr-instance.md)

### Exercises

- Check the color of the Box we created
- Check the rotation using the `advanceFrames` method.
