# Task Context: ShaderFrame AI-Powered Image Editor

Session ID: 2026-02-22-shaderframe-editor
Created: 2026-02-22T00:00:00Z
Status: in_progress

## Current Request

Build a full AI-powered image editor with:

- Professional clean UI with light/dark theme toggle
- Reusable UI component library in `src/renderer/src/ui-library/`
- Layer-based architecture: everything is a "Layer" (resizable panel), layers can nest children
- Drag-and-drop images into layers
- AI shader generation: click a layer, type a prompt (e.g. "Transition blend between images"), and an AI generates a GLSL shader with typed uniform variables
- Unity3D-style inspector panel for shader variables (float, vec2, vec3, vec4, color, bool, enum, etc.)
- Shader component "edit" button re-opens the prompt for modification
- OpenRouter API for AI (with provider abstraction for extensibility)
- Home button, New Project button
- Built-in Text tool (layer with 3D text via three.js)
- Serializable project format (JSON save/load)
- Keep AGENTS.md files up to date

## Context Files (Standards to Follow)

- C:\Users\Dan\.opencode\context\core\standards\code-quality.md
- C:\Users\Dan\.opencode\context\ui\web\react-patterns.md
- C:\Users\Dan\.opencode\context\ui\web\ui-styling-standards.md
- C:\Users\Dan\.opencode\context\ui\web\design-systems.md
- C:\Users\Dan\.opencode\context\core\workflows\component-planning.md

## Reference Files (Source Material to Look At)

- package.json — Dependencies: React 19, R3F 9, Drei 10, MobX 6, Three.js 0.183, Tailwind v4.2
- electron.vite.config.ts — Vite config with @tailwindcss/vite plugin and @renderer alias
- tsconfig.web.json — Path alias @renderer/_ -> src/renderer/src/_
- src/renderer/src/App.tsx — Current app entry (starter template, to be replaced)
- src/renderer/src/main.tsx — React root mount
- src/renderer/src/assets/base.css — Current CSS variables (to be replaced with Tailwind v4 @theme)
- src/renderer/src/components/EditorTestBed/ — Reference implementation for viewport, resize handles, drag system
- src/renderer/src/utilities/hooks.ts — useThreeScoped + withThreeDispose utilities (keep these)
- src/main/index.ts — Electron main process (needs IPC handlers added)
- src/preload/index.ts — Preload bridge (needs API additions)
- src/renderer/index.html — HTML entry, CSP updated for OpenRouter

## External Docs Fetched

- Tailwind CSS v4.2: CSS-first config via @theme, @custom-variant dark, @tailwindcss/vite plugin, auto content detection
  - Files: .tmp/external-context/tailwindcss/v4-\*.md
- OpenRouter API: Base URL https://openrouter.ai/api/v1, Bearer auth, OpenAI-compatible, SSE streaming, model format provider/model-name
  - Files: .tmp/external-context/openrouter/\*.md

## Tech Stack

- **Runtime**: Electron 39 + electron-vite 5
- **Frontend**: React 19 + TypeScript 5.9
- **3D**: React Three Fiber 9 + Drei 10 + Three.js 0.183
- **State**: MobX 6 + mobx-react-lite 4
- **Styling**: Tailwind CSS v4.2 (CSS-first, @theme directive, @custom-variant dark)
- **AI**: OpenRouter API (fetch-based, no SDK dependency)
- **Package Manager**: Bun

## Components

### 1. Theme System

- Tailwind v4 @theme directive for design tokens
- @custom-variant dark (&:where(.dark, .dark \*)) for class-based dark mode toggle
- ThemeProvider React context + MobX store for theme state
- CSS custom properties for colors, spacing, typography

### 2. UI Library (src/renderer/src/ui-library/)

Reusable primitives with Tailwind classes + dark: variants:

- Button, IconButton
- Input, TextArea, Select, Checkbox
- Slider, ColorPicker
- Panel, ScrollArea
- Tooltip
- All support light/dark theming automatically

### 3. Project & Serialization System

- MobX stores: ProjectStore (project metadata, layers tree), UIStore (panels, selection, theme)
- JSON-serializable project format
- Layer tree data model with typed nodes (ImageLayer, TextLayer, GroupLayer)
- Shader component data model with uniforms

### 4. Layer System

- Hierarchical layer tree (MobX observable)
- Layer types: Group, Image, Text
- Drag-and-drop: images from filesystem, layer reordering
- Selection, visibility toggle, rename

### 5. Viewport (R3F Canvas)

- Orthographic camera, pan/zoom
- Renders layer tree as Three.js scene graph
- Image layers: textured planes
- Text layers: drei Text or troika-three-text
- Shader layers: custom ShaderMaterial on group planes
- Resize handles (existing implementation to adapt)

### 6. Inspector Panel

- Unity3D-style property inspector
- Renders based on shader component variable definitions
- Variable type renderers: FloatField, Vec2Field, Vec3Field, Vec4Field, ColorField, BoolField, EnumField, TextureField
- Bound to MobX observables for live updates
- Shader component header with "Edit" button

### 7. Shader Component System

- Data model: ShaderComponent { id, prompt, glslCode, uniforms: ShaderUniform[] }
- ShaderUniform: { name, type, value, min?, max?, options? }
- Applied to layer groups, affects children rendering
- Compiled into Three.js ShaderMaterial

### 8. AI Service Layer

- Provider abstraction: AIProvider interface { generateShader(prompt, context): Promise<ShaderResult> }
- OpenRouterProvider: implements AIProvider using fetch + SSE
- Shader generation prompt engineering (system prompt for GLSL output)
- Streaming response handling
- API key management via Electron IPC (main process stores key)

### 9. Layer Panel (Sidebar)

- Tree view of layers
- Drag-and-drop reordering
- Add/remove layers
- Visibility toggle, rename inline
- Selection highlights

### 10. Toolbar

- Home button (navigate to home/welcome screen)
- New Project button
- Text Tool (creates text layer)
- Theme toggle (light/dark)

### 11. Prompt Chat

- Inline prompt input on selected layer
- Submit generates shader via AI service
- Edit mode: re-opens with existing prompt for modification
- Shows generation status (loading, error, success)

### 12. Main Process / IPC

- File dialog for image import
- API key storage (electron safeStorage)
- Project save/load (filesystem)

### 13. AGENTS.md Updates

- Update root AGENTS.md
- Create AGENTS.md in ui-library/, stores/, services/, components/ subdirectories

## Constraints

- Electron contextIsolation: all Node.js APIs via IPC
- Tailwind v4 CSS-first: no tailwind.config.js, use @theme in CSS
- MobX for state (already a dependency, no Redux/Zustand)
- No additional CSS framework — Tailwind only
- OpenRouter API via raw fetch (no SDK dependency for lighter bundle)
- Keep existing utilities/hooks.ts (useThreeScoped, withThreeDispose)
- TypeScript strict mode
- Functional components only
- Path alias: @renderer/\* for imports

## Exit Criteria

- [ ] Light/dark theme toggle works
- [ ] UI library components render correctly in both themes
- [ ] Layer tree with nesting, drag-and-drop images
- [ ] Viewport renders image and text layers
- [ ] AI shader generation from prompt produces working GLSL
- [ ] Inspector shows and controls shader uniforms
- [ ] Edit button re-opens prompt for shader modification
- [ ] Home and New Project buttons functional
- [ ] Text tool creates text layers
- [ ] Project serialization (save/load to JSON)
- [ ] TypeScript typecheck passes
- [ ] Build succeeds
- [ ] AGENTS.md files updated
