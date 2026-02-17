# ShaderFrame

An AI-powered image editor built with Electron, React, and React Three Fiber.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)

### Installation

```bash
bun install
```

### Development

To start the development server:

```bash
bun run dev
```

### Building

To build the application for production:

```bash
bun run build
```

## Project Structure

- `src/main`: Electron main process
- `src/preload`: Electron preload scripts
- `src/renderer`: React application (renderer process)
  - `components`: Reusable UI components
  - `store`: Zustand state management
  - `types`: TypeScript type definitions
  - `utils`: Utility functions

## Features

- 3D rendering with React Three Fiber
- AI integration via OpenAI
