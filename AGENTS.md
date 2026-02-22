# ShaderFrame - Agent Guidelines

AI-powered image editor built with Electron, React, React Three Fiber, MobX, and Tailwind CSS v4. Uses OpenRouter for AI shader generation. **Bun** is the package manager.

## Architecture Overview

```
src/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts            # Window creation, app lifecycle
│   └── ipc-handlers.ts     # 7 IPC handlers (files, project, API key)
├── preload/                 # Secure contextBridge
│   ├── index.ts            # electronAPI + ShaderFrameAPI exposure
│   └── index.d.ts          # TypeScript declarations for window.api
└── renderer/src/            # React app (no direct Node.js access)
    ├── App.tsx             # Root component (Home ↔ Editor routing via UIStore)
    ├── main.tsx            # React root with ThemeProvider + StoreProvider
    ├── assets/app.css      # Tailwind v4 theme (OKLCH tokens, dark mode)
    ├── types/              # Discriminated unions: Layer, ShaderComponent, Project, AI
    ├── stores/             # MobX: ThemeStore, ProjectStore, UIStore
    ├── providers/          # ThemeProvider, StoreProvider (React contexts)
    ├── services/ai/        # OpenRouter provider, shader prompt engineering
    ├── ui-library/         # 11 reusable UI components
    ├── components/         # Feature components (see below)
    └── utilities/          # R3F hooks (useThreeScoped, withThreeDispose)
```

### Key Components

- **EditorLayout** — CSS Grid shell: Toolbar (top) + LayerPanel (left) + Viewport (center) + Inspector (right) + PromptChat (bottom)
- **HomeScreen** — Welcome screen with new project, load project, API key setup
- **LayerPanel** — Layer tree with drag-and-drop reordering, image import
- **Inspector** — Layer properties + shader uniforms (Unity3D-style)
- **Viewport** — R3F Canvas with orthographic camera, pan/zoom controls
- **PromptChat** — AI shader generation with streaming, create/edit modes
- **Toolbar** — Home, New Project, Add Text, Theme Toggle

## Development Commands

### Build & Development

```bash
bun install                    # Install dependencies
bun run dev                    # Start development server (electron-vite)
bun run build                  # Build for production (includes typecheck)
bun run preview                # Preview production build
```

### Linting & Type Checking

```bash
bun run lint                  # Run ESLint
bun run lint:fix              # Fix ESLint issues automatically
bun run typecheck             # Run TypeScript type checking (node + web)
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
- Strict mode enabled in tsconfig.json
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` — use `unknown` with type guards if needed
- Prefer explicit return types on functions in libraries/shared code
- Discriminated unions for layer types (`type: 'image' | 'text' | 'group'`)

### Imports

- Use ES6 imports: `import { something } from 'module'`
- Group imports: external libs → internal modules → types
- **Path alias**: `@renderer/...` maps to `src/renderer/src/...`
- Type imports: `import type { SomeType } from 'module'`

### React Components

- Functional components only (no class components)
- MobX reactive: wrap with `observer()` from `mobx-react-lite`
- Use TypeScript interfaces for props: `interface Props { ... }`
- Memoize expensive operations with useMemo/useCallback
- Component files: `ComponentName.tsx` with barrel `index.ts`

### State Management (MobX)

- `ProjectStore` — Layer tree CRUD, shader components, serialization
- `UIStore` — Selection, panel visibility, prompt state, home screen
- `ThemeStore` — Light/dark toggle, localStorage persistence
- Access via `useProjectStore()`, `useUIStore()`, `useThemeStore()` hooks
- Never access stores directly — always through provider hooks

### File Naming

- Components: PascalCase — `EditorLayout.tsx`, `LayerPanel.tsx`
- Utilities/hooks: camelCase — `useThreeScoped.ts`, `formatImage.ts`
- Types/interfaces: camelCase files, PascalCase exports — `layers.ts` → `Layer`
- Services: camelCase — `openrouter-provider.ts`

### Tailwind CSS v4

- **No tailwind.config.js** — uses `@theme` directive in `app.css`
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *));`
- Single `@import 'tailwindcss';` replaces v3's three directives
- Design tokens: OKLCH color space (`oklch(0.6 0.18 250)`)
- Custom color scale: `surface-50..950`, `primary-400..700`, `success`, `warning`, `danger`
- Vite plugin: `@tailwindcss/vite` (must go before `@vitejs/plugin-react`)

### Electron Architecture

- Main process: `src/main/` — Node.js APIs, IPC handlers
- Renderer process: `src/renderer/` — React app, no direct Node.js access
- Preload: `src/preload/` — Secure bridge via contextBridge
- API key storage: Electron safeStorage (encrypted) with dev fallback
- IPC handlers: openImage, openImages, saveProject, loadProject, storeApiKey, retrieveApiKey, hasApiKey
- Access IPC via `window.api.*` (typed as `ShaderFrameAPI`)

### React Three Fiber

- **Always check [R3F & Drei Documentation](thirdparty/docs/AGENTS.md)** for API usage
- Use `frameloop="demand"` for static scenes
- Memoize geometries, materials, lights with useMemo
- Import from `@react-three/fiber` and `@react-three/drei`
- Dispose Three.js objects via `useThreeScoped` / `withThreeDispose`
- Orthographic camera for 2D layer editing

### AI Integration (OpenRouter)

- OpenRouter API is OpenAI-compatible: `POST https://openrouter.ai/api/v1/chat/completions`
- API keys stored in Electron safeStorage, never in env files
- SSE streaming with `data:` lines and `[DONE]` terminator
- Keep-alive comments (`: OPENROUTER PROCESSING`) must be ignored
- Retry with exponential backoff (3 attempts, 1s/2s/4s delays)
- Shader generation outputs structured JSON with GLSL + typed uniforms

### Project Format

- File extension: `.sfproj`
- Serialization: JSON via `projectStore.serializeProject()` → `toJS()`
- Contains: layers (nested tree), shaderComponents (by ID), metadata

### Security

- Never disable webSecurity in production
- CSP in index.html allows `connect-src https://openrouter.ai` and `img-src blob:`
- Sanitize all user inputs before processing
- API keys encrypted via Electron safeStorage

### Performance

- `frameloop="demand"` for R3F Canvas (only re-render on changes)
- Memoize Three.js materials and geometries
- Use Suspense boundaries for async texture loading
- Lazy loading for layer panels and image lists

### Known LSP Issue

The LSP reports errors on `Inspector/fields/index.ts` — the file is actually `index.tsx` (contains JSX). The actual file on disk is correct, and `bun run typecheck` passes clean. This is an LSP cache issue. **Ignore LSP diagnostics referencing `fields/index.ts`** (without the x).
