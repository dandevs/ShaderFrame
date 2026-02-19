# React Three Fiber & Drei Documentation

This directory contains official documentation for **React Three Fiber** and **@react-three/drei**. The documentation is organized by library, with detailed guides, API references, and examples.

## React Three Fiber (@react-three/fiber)

A React renderer for Three.js that allows you to build 3D scenes declaratively with React components.

### Getting Started
- **[Introduction](r3f/getting-started/introduction.mdx)** - Overview of React Three Fiber, installation instructions, and basic concepts
- **[Installation](r3f/getting-started/installation.mdx)** - Detailed installation guides for Vite.js, Next.js, CDN, and React Native
- **[Examples](r3f/getting-started/examples.mdx)** - Pre-built examples to get you started quickly
- **[Community Components](r3f/getting-started/community-r3f-components.mdx)** - Community-maintained components and libraries

### API Reference
- **[Canvas](r3f/API/canvas.mdx)** - The main Canvas component and its properties, defaults, and configuration
- **[Objects](r3f/API/objects.mdx)** - Three.js object components (mesh, geometry, materials, lights, etc.)
- **[Hooks](r3f/API/hooks.mdx)** - React hooks for accessing the Three.js state and API
- **[Events](r3f/API/events.mdx)** - Event handling and raycasting configuration
- **[TypeScript](r3f/API/typescript.mdx)** - TypeScript support and type definitions
- **[Testing](r3f/API/testing.mdx)** - Testing utilities for React Three Fiber
- **[Additional Exports](r3f/API/additional-exports.mdx)** - Additional exports and utilities

### Advanced Topics
- **[Scaling Performance](r3f/advanced/scaling-performance.mdx)** - Performance optimization techniques including on-demand rendering, instancing, level of detail, and performance monitoring
- **[Pitfalls](r3f/advanced/pitfalls.mdx)** - Common issues and best practices to avoid

### Tutorials
- **[How It Works](r3f/tutorials/how-it-works.mdx)** - Deep dive into the internal workings of React Three Fiber
- **[Events and Interaction](r3f/tutorials/events-and-interaction.mdx)** - Guide to handling user interactions and events
- **[Loading Textures](r3f/tutorials/loading-textures.mdx)** - How to load and work with textures
- **[Loading Models](r3f/tutorials/loading-models.mdx)** - GLTF/GLB model loading and management
- **[Basic Animations](r3f/tutorials/basic-animations.mdx)** - Animations using useFrame and animation libraries
- **[v9 Migration Guide](r3f/tutorials/v9-migration-guide.mdx)** - Migration guide for React Three Fiber v9

## @react-three/drei

A collection of useful helpers and abstractions for React Three Fiber.

### Staging
- **[Stage](drei/staging/stage.mdx)** - Create professional studio lighting setups with proper camera adjustments and shadows
- **[Environment](drei/staging/environment.mdx)** - Environment mapping for realistic reflections
- **[Stars](drei/staging/stars.mdx)** - Create starfield backgrounds
- **[Sky](drei/staging/sky.mdx)** - Sky dome with atmospheric effects
- **[Shadows](drei/staging/shadow.mdx)** - Shadow configuration and management
- **[Contact Shadows](drei/staging/contact-shadows.mdx)** - Contact shadows for realistic floor shadows
- **[Accumulative Shadows](drei/staging/accumulative-shadows.mdx)** - Improved shadow accumulation
- **[Shadow Alpha](drei/staging/shadow-alpha.mdx)** - Shadow transparency effects
- **[Spot Light](drei/staging/spot-light.mdx)** - Spotlight setup and configuration
- **[Spot Light Shadow](drei/staging/spot-light-shadow.mdx)** - Detailed spotlight shadow configuration
- **[Randomized Light](drei/staging/randomized-light.mdx)** - Randomized lighting for natural effects
- **[LightFormer](drei/staging/lightformer.mdx)** - Light shaping with volumetric effects
- **[Float](drei/staging/float.mdx)** - Floating animations for objects
- **[Center](drei/staging/center.mdx)** - Object centering and bounds management
- **[Resize](drei/staging/resize.mdx)** - Responsive resize handlers
- **[Bounds](drei/staging/bounds.mdx)** - Component bounds calculation
- **[BB Anchor](drei/staging/bb-anchor.mdx)** - Billboard anchor utilities
- **[Backdrop](drei/staging/backdrop.mdx)** - Background and backdrop management
- **[Caustics](drei/staging/caustics.mdx)** - Caustic lighting effects
- **[Cloud](drei/staging/cloud.mdx)** - Cloud and atmospheric effects
- **[Use Environment](drei/staging/use-environment.mdx)** - Dynamic environment management

### Shapes
- **[Screen Quad](drei/shapes/screen-quad.mdx)** - Full-screen quad rendering
- **[Rounded Box](drei/shapes/rounded-box.mdx)** - Rounded corner box geometry
- **[Mesh](drei/shapes/mesh.mdx)** - Base mesh component
- **[Line](drei/shapes/line.mdx)** - Line rendering
- **[Cubic Bezier Line](drei/shapes/cubic-bezier-line.mdx)** - Cubic Bezier curve lines
- **[Quadratic Bezier Line](drei/shapes/quadratic-bezier-line.mdx)** - Quadratic Bezier curve lines
- **[Catmull Rom Line](drei/shapes/catmull-rom-line.mdx)** - Catmull-Rom spline lines
- **[Facemesh](drei/shapes/facemesh.mdx)** - Face mesh rendering

### Miscellaneous
- **[Use Intersect](drei/misc/use-intersect.mdx)** - Frustum culling for visibility detection
- **[Use Cursor](drei/misc/use-cursor.mdx)** - Cursor tracking and interaction
- **[Use Depth Buffer](drei/misc/use-depth-buffer.mdx)** - Depth buffer access
- **[Use Cursor Bridge](drei/misc/use-context-bridge.mdx)** - Context bridge utilities
- **[Use Camera](drei/misc/use-camera.mdx)** - Camera control utilities
- **[Use Box Projected Env](drei/misc/use-box-projected-env.mdx)** - Box projected environment mapping
- **[Use Aspect](drei/misc/use-aspect.mdx)** - Aspect ratio handling
- **[Trail](drei/misc/trail-use-trail.mdx)** - Trail rendering and effects
- **[Stats](drei/misc/stats.mdx)** - Performance monitoring
- **[Stats GL](drei/misc/stats-gl.mdx)** - WebGL-specific statistics
- **[Sprite Animator](drei/misc/sprite-animator.mdx)** - Animated sprite handling
- **[Select](drei/misc/select.mdx)** - Selection utilities
- **[HTML](drei/misc/html.mdx)** - HTML overlay in 3D space
- **[FBO](drei/misc/fbo-use-fbo.mdx)** - Frame buffer object handling
- **[Face Landmarker](drei/misc/face-landmarker.mdx)** - Face tracking and landmark detection
- **[Example](drei/misc/example.mdx)** - Example utilities
- **[Detect GPU](drei/misc/detect-gpu-use-detect-gpu.mdx)** - GPU detection
- **[Cycle Raycast](drei/misc/cycle-raycast.mdx)** - Raycasting cycle management
- **[Cube Camera](drei/misc/cube-camera-use-cube-camera.mdx)** - Cube camera setup

### Cameras
- **[Perspective Camera](drei/cameras/perspective-camera.mdx)** - Perspective camera component
- **[Orthographic Camera](drei/cameras/orthographic-camera.mdx)** - Orthographic camera component
- **[Cube Camera](drei/cameras/cube-camera.mdx)** - Cube camera for reflection/environment mapping

### Abstractions
- **[Text](drei/abstractions/text.mdx)** - 3D text rendering
- **[Text3D](drei/abstractions/text3d.mdx)** - Advanced 3D text with geometry
- **[Image](drei/abstractions/image.mdx)** - Image texture components
- **[Gradient Texture](drei/abstractions/gradient-texture.mdx)** - Gradient texture generation
- **[Effects](drei/abstractions/effects.mdx)** - Post-processing effects
- **[Edges](drei/abstractions/edges.mdx)** - Edge highlighting
- **[Decal](drei/abstractions/decal.mdx)** - Decal rendering
- **[Computed Attribute](drei/abstractions/computed-attribute.mdx)** - Computed vertex attributes
- **[Clone](drei/abstractions/clone.mdx)** - Object cloning
- **[Billboard](drei/abstractions/billboard.mdx)** - Billboard (face camera) component
- **[Ascii Renderer](drei/abstractions/ascii-renderer.mdx)** - ASCII art renderer
- **[Positional Audio](drei/abstractions/positional-audio.mdx)** - 3D audio positioning
- **[Marching Cubes](drei/abstractions/marching-cubes.mdx)** - Marching cubes surface generation
- **[Sampler](drei/abstractions/sampler.mdx)** - Texture sampling utilities
- **[Screen Space](drei/abstractions/screen-space.mdx)** - Screen space effects
- **[Screen Sizer](drei/abstractions/screen-sizer.mdx)** - Screen size management
- **[Trail](drei/abstractions/trail.mdx)** - Trail abstractions
- **[Use Animations](drei/abstractions/use-animations.mdx)** - Animation utilities
- **[SVG](drei/abstractions/svg.mdx)** - SVG to 3D conversion
- **[Splat](drei/abstractions/splat.mdx)** - 3D Gaussian splatting

## Related Libraries

- **[React Native](r3f/getting-started/installation.mdx#react-native)** - React Native support
- **[Three.js](https://threejs.org/docs)** - Core Three.js documentation
- **[Three-Stdlib](https://github.com/pmndrs/three-stdlib)** - Standalone Three.js examples and utilities
