# Editor Component Architecture

This document describes the architecture and patterns for the Editor component system in ShaderFrame.

## Overview

The Editor is a 2D image editor built with:
- **React** for UI components (Inspector, Viewport container)
- **Plain Three.js** for rendering (NOT React Three Fiber)
- **Layer-based architecture** for managing compositional elements
- **Handle system** for overlays, selections, and interactive controls

## Core Architecture

### Component Hierarchy

```
EditorTestBed (route)
├── Viewport (Three.js canvas)
└── Inspector (React UI panel)
```

### Data Flow

```
Layers (data model)
  ↓
Three.js Scene (rendering)
  ↓
Viewport (display)
```

## Layer System

### Layer Class

The `Layer` class represents a compositional element in the editor.

**Properties:**
- `handles: Handle[]` - Interactive overlays attached to this layer
- `size: Vector2` - Dimensions of the layer (width, height)

**Animation Frame Management:**
- `requestAnimationFrame(signal: AbortSignal, callback: () => void): number` - Request an animation frame, returns a layer-specific handle
- `drawHandle(handle: Handle, state: Handle["state"]): void` - Set handle state and trigger redraw

**Usage Pattern:**
```typescript
const layer = new Layer();
layer.size.set(200, 100);

// Request animation frames through the layer
const abortController = new AbortController();
layer.requestAnimationFrame(abortController.signal, () => {
  // Animation logic
});

// Layer handles state and drawing
layer.drawHandle(handle, "entering");
```

## Handle System

Handles are interactive overlays and controls that attach to Layers.

### Handle (Abstract Base)

Abstract class for all handle types.

**Properties:**
- `layer: Layer` - Reference to parent layer
- `state: "entering" | "default" | "exiting"` - Current state of the handle

**Methods:**
- `triggerBoundsEntered(signal: AbortSignal): Promise<void>` - Public entry point for bounds entered event
- `triggerBoundsExited(signal: AbortSignal): Promise<void>` - Public entry point for bounds exited event
- `draw(): void` - Public method to draw the handle
- `onBoundsEntered(signal: AbortSignal): Promise<void>` - Called when mouse enters handle bounds (abstract)
- `onBoundsExited(signal: AbortSignal): Promise<void>` - Called when mouse exits handle bounds (abstract)
- `onDraw(): void` - Draw the handle (abstract)

### FrameHandle

A handle that draws a frame/selection box around a layer.

**Features:**
- Draws green wireframe box around layer bounds
- Animate appearance (ease-in alpha fade on enter)
- Animate disappearance (ease-out alpha fade on exit)
- Uses AbortSignal for cancellable animations

**State Transitions:**
- `"default"` → `"entering"` → `"default"` (fade in when entering)
- `"default"` → `"exiting"` → `"default"` (fade out when exiting)

**Usage Pattern:**
```typescript
const layer = new Layer();
const frameHandle = new FrameHandle(layer);
layer.handles.push(frameHandle);

// Trigger animations via Layer's drawHandle method
layer.drawHandle(frameHandle, "entering"); // Starts fade-in
layer.drawHandle(frameHandle, "exiting"); // Starts fade-out
```

## Three.js Integration

### Viewport Component

The Viewport uses plain Three.js (no React Three Fiber).

**Setup Pattern:**
```typescript
useEffect(() => {
  // 1. Create scene, camera, renderer
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(...);
  const renderer = new THREE.WebGLRenderer(...);

  // 2. Add objects to scene
  scene.add(mesh);

  // 3. Start animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();

  // 4. Cleanup on unmount
  return () => {
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}, []);
```

**Camera Setup:**
- Uses `OrthographicCamera` for 2D image editing
- Positioned at `z=5` facing forward (no perspective)
- No camera controls at this time (static view)

**Important:** Layers and handles should integrate with this rendering system. Future work will:
- Connect Layer objects to Three.js scene graph
- Use Layer's `requestAnimationFrame` to trigger renders when needed
- Draw handles as 3D objects in the scene (wireframes, controls)

## Coordinate System

### 2D Space (Primary)

The editor works in 2D screen space:
- Layer `size` is in pixels (width, height)
- Positions are 2D coordinates
- Orthographic camera maps 1:1 to pixels (with proper scaling)

### 3D Space (Underlying)

Three.js uses 3D coordinates:
- Z-axis is depth (all layers at z=0 for flat composition)
- Y-axis points up, X-axis points right
- Camera at z=5 looking at origin (0, 0, 0)

## Patterns and Conventions

### TypeScript

- Use interfaces for object shapes, types for unions/primitives
- Explicit return types on public methods
- Avoid `any` - use `unknown` with type guards if needed
- Import types separately: `import type { SomeType }`

### React Components

- Functional components only
- Use `useRef` for Three.js objects
- Use `useEffect` for setup/cleanup
- Proper cleanup in useEffect return function

### Three.js Object Lifecycle

**Always dispose:**
1. Renderer on unmount
2. Geometries when no longer needed
3. Materials when no longer needed
4. Textures when no longer needed

**Pattern:**
```typescript
// In useEffect cleanup
return () => {
  renderer.dispose();
  geometry.dispose();
  material.dispose();
  texture?.dispose();
};
```

### Animation Patterns

**For continuous animations (60fps):**
```typescript
const animate = () => {
  // Update state
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();
```

**For event-driven rendering (preferred):**
```typescript
// Only render when state changes
const render = () => {
  renderer.render(scene, camera);
};

// Call render() when something changes
object.position.x += 10;
render();
```

**Layer-based animation:**
```typescript
// Use Layer's requestAnimationFrame for handle animations
const abortController = new AbortController();
layer.requestAnimationFrame(abortController.signal, () => {
  // Update handle visual each frame
  // Animation automatically aborts when signal triggers
});

// Set handle state and trigger draw
layer.drawHandle(handle, "entering");
```

## Extension Points

### Adding New Handle Types

1. Extend `Handle` abstract class
2. Implement `onBoundsEntered()` for hover behavior
3. Implement `onDraw()` for rendering
4. Add to `layer.handles` array

Example:
```typescript
export class ResizeHandle extends Handle {
  protected async onBoundsEntered(signal: AbortSignal): Promise<void> {
    // Hover animation
  }

  protected onDraw(): void {
    // Draw resize control at corner
  }
}
```

### Adding New Layer Types

Currently `Layer` is a base class. Future work may include:
- `ImageLayer` - for bitmap images
- `TextLayer` - for text elements
- `ShapeLayer` - for vector shapes
- `EffectLayer` - for filters and effects

### Integrating with Three.js Scene

Future architecture will connect Layers to the Three.js scene:
```typescript
class Layer {
  // Each Layer adds/removes objects from scene
  addToScene(scene: THREE.Scene): void;
  removeFromScene(scene: THREE.Scene): void;

  // Handles draw themselves as 3D objects
  drawHandles(scene: THREE.Scene): void;
}
```

## File Structure

```
Editor/
├── Handle.ts           # Abstract Handle class
├── FrameHandle.ts      # FrameHandle implementation with wireframe and animations
├── Layer.ts            # Layer class with animation frame management
├── Viewport.tsx        # Three.js rendering component
├── Inspector.tsx       # React UI for properties
└── AGENTS.md           # This file - architecture documentation
```

## Development Guidelines

### When Adding Features

1. **Start with data model** - Define Layer properties first
2. **Create Handle** - If UI interaction is needed
3. **Integrate with Viewport** - Add Three.js rendering
4. **Update Inspector** - Add UI controls if applicable

### When Modifying Three.js Code

1. Always test cleanup (no memory leaks)
2. Use React's `useRef` to persist Three.js objects
3. Handle window resize properly
4. Test with multiple layers

### When Working with Animation

1. Prefer event-driven rendering over continuous loops
2. Use Layer's `requestAnimationFrame` for handle animations
3. Cancel animation frames when components unmount
4. Use `AbortSignal` for cancellable async operations

## Future Roadmap

1. **Three.js Scene Integration**
   - Connect Layers to scene graph
   - Implement Layer.render() method
   - Add/remove objects dynamically

2. **Handle Rendering**
   - Draw wireframes as LineSegments
   - Implement corner resize controls
   - Add rotation handles

3. **Hit Detection**
   - Raycasting for selection
   - Coordinate conversion (screen ↔ world)
   - Handle priority (top layer first)

4. **Inspector Integration**
   - Bind to selected Layer properties
   - Live updates to Layer state
   - Two-way data binding

5. **Layer Types**
   - Image loading and display
   - Text rendering
   - Vector shapes

6. **Performance**
   - Lazy rendering (only dirty layers)
   - Object pooling for handles
   - Virtual scrolling for layer lists
