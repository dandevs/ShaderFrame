# ImageEditorAI - Agent Guidelines

This project is an AI-powered image editor built with Electron, React, React Three Fiber, Fabric.js, and cloud APIs (OpenAI). All development uses Bun as the package manager.

## Development Commands

### Build & Development
```bash
bun install                    # Install dependencies
bun run dev                    # Start development server (electron-vite)
bun run build                  # Build for production
bun run preview                # Preview production build
```

### Linting & Type Checking
```bash
bun run lint                   # Run ESLint
bun run lint:fix              # Fix ESLint issues automatically
bun run typecheck             # Run TypeScript type checking
```

### Testing
```bash
bun run test                  # Run all tests
bun run test:watch            # Run tests in watch mode
bun run test:coverage         # Generate coverage report
bun run test:unit <pattern>   # Run single test file matching pattern
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all files (.ts, .tsx)
- Enable strict mode in tsconfig.json
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` with type guards if needed
- Prefer explicit return types on functions in libraries/shared code

### Imports
- Use ES6 imports: `import { something } from 'module'`
- Group imports: external libs → internal modules → types
- Absolute imports for internal code: `@/components/Editor/CanvasEditor`
- Type imports: `import type { SomeType } from 'module'`

### React Components
- Functional components only (no class components)
- Use TypeScript interfaces for props: `interface Props { ... }`
- Use React hooks for state and effects
- Avoid prop drilling - use Context or Zustand for global state
- Memoize expensive operations with useMemo/useCallback
- Component files: `ComponentName.tsx`

### File Naming
- Components: PascalCase - `CanvasEditor.tsx`, `LayersPanel.tsx`
- Utilities/hooks: camelCase - `useImageLoader.ts`, `formatImage.ts`
- Types/interfaces: PascalCase - `LayerTypes.ts`, `ShaderLibrary.ts`
- Constants: UPPER_SNAKE_CASE - `API_ENDPOINTS.ts`
- Services: camelCase - `imageOptimizer.ts`, `openAIClient.ts`

### Electron Architecture
- Main process: `src/main/` - Node.js APIs, IPC handlers
- Renderer process: `src/renderer/` - React app, no direct Node.js access
- Preload: `src/preload/` - Secure bridge via contextBridge
- Always use contextIsolation in browser window config
- Expose minimal API via contextBridge: `electronAPI.openFile()`

### IPC Communication
- Use ipcMain.handle/ipcRenderer.invoke for async operations
- Type IPC channels as constants: `IPC_CHANNELS.ts`
- Validate all inputs in main process before processing
- Return structured errors: `{ success: false, error: string }`
- Never send sensitive data (API keys) to renderer

### Error Handling
- Use try/catch for async operations with proper error logging
- Create custom error types: `class AIError extends Error { ... }`
- Display user-friendly errors in UI, log details to console/electron-log
- Wrap external API calls with error boundaries
- Use Sentry or similar for error tracking in production

### Fabric.js Canvas
- Wrap Fabric.js in React component with refs
- Use Fabric.js object events for interaction handling
- Serialize canvas state to JSON for save/load
- Keep canvas and React state synced when needed
- Dispose canvas objects when components unmount

### React Three Fiber
- Use `frameloop="demand"` for static scenes to save resources
- Memoize geometries, materials, lights with useMemo
- Use `useFrame` for animations, mutating values directly
- Import from `@react-three/fiber` and `@react-three/drei`
- Dispose Three.js objects manually when unmounting if needed

### API Integration (OpenAI)
- Store API keys in Electron safeStorage, never in env files or renderer
- Implement rate limiting and retry logic with exponential backoff
- Cache responses where appropriate (shader library)
- Use streaming responses for long-running operations
- Handle API errors gracefully with user-friendly messages

### Security
- Never disable webSecurity in production
- Use custom protocols (`app-assets://`) for local file access
- Sanitize all user inputs before processing
- Validate IPC messages with zod or similar
- Keep dependencies updated regularly

### Git Workflow
- Feature branches: `feature/ai-shader-generation`
- Commit messages: conventional commits - `feat: add shader chat UI`
- PR descriptions must include testing performed
- All PRs must pass lint, typecheck, and tests before merge

### Performance
- Generate thumbnails for large images
- Use Web Workers for heavy image processing
- Implement lazy loading for layer panels and image lists
- Optimize images on import (Sharp for compression)
- Profile memory usage in devtools before shipping features
