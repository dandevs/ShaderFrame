# ShaderFrame - Agent Guidelines

This project is an AI-powered image editor built with Electron, React, React Three Fiber, and cloud APIs (OpenAI). All development uses Bun as the package manager.

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
bun run lint                  # Run ESLint
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
- Avoid prop drilling - use MobX for global state
- Memoize expensive operations with useMemo/useCallback
- Component files: `ComponentName.tsx`
- Use TanStack ecosystem (Router, Query, etc.) for React hooks and data management

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
