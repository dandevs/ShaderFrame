# Components — Agent Guidelines

Feature components organized by domain. Each component directory has a barrel `index.ts` for clean imports.

## Component Map

| Directory        | Key File(s)                                                       | Purpose                                     |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `EditorLayout/`  | `EditorLayout.tsx`                                                | CSS Grid shell composing all panels         |
| `HomeScreen/`    | `HomeScreen.tsx`                                                  | Welcome screen, project creation, API key   |
| `Toolbar/`       | `Toolbar.tsx`                                                     | Horizontal toolbar (Home, New, Text, Theme) |
| `LayerPanel/`    | `LayerPanel.tsx`, `LayerTreeItem.tsx`                             | Layer tree with drag-and-drop, import       |
| `Inspector/`     | `Inspector.tsx`, `ShaderComponentHeader.tsx`, `fields/`           | Unity3D-style property inspector            |
| `PromptChat/`    | `PromptChat.tsx`                                                  | AI shader generation with streaming         |
| `Viewport/`      | `Viewport.tsx`, `*Mesh.tsx`, `*Group.tsx`, `ViewportControls.tsx` | R3F Canvas + layer rendering                |
| `EditorTestBed/` | (reference implementation)                                        | **Preserve** — reference R3F patterns       |

## Conventions

- All feature components use `observer()` from `mobx-react-lite`
- Access stores via `useProjectStore()`, `useUIStore()`, `useThemeStore()`
- Import UI primitives from `@renderer/ui-library` (Button, Input, Panel, etc.)
- Import types from `@renderer/types/`
- Each directory has a barrel `index.ts` — import from the directory, not the file

## React Three Fiber Components (Viewport/)

- `Viewport.tsx` — R3F `<Canvas>` with `frameloop="demand"`, orthographic camera
- `ImageLayerMesh.tsx` — Textured plane, loads via `useLoader(TextureLoader, src)`
- `TextLayerMesh.tsx` — drei `<Text>` component (troika SDF text)
- `ShaderLayerGroup.tsx` — Group with optional shader overlay using `<shaderMaterial>`
- `ViewportControls.tsx` — Custom pan (middle mouse/alt+click) + zoom (scroll wheel)

### R3F Rules

- Always wrap texture-loading components in `<Suspense fallback={null}>`
- Use `useMemo` for Three.js objects (geometries, materials)
- Check visibility (`layer.visible`) before rendering
- Layer z-ordering via `renderOrder` prop
- Consult `thirdparty/docs/AGENTS.md` before adding new R3F/drei features

## Inspector Fields (`Inspector/fields/`)

7 typed uniform field renderers, one per shader uniform type:

| Field      | Uniform Type | UI Component                 |
| ---------- | ------------ | ---------------------------- |
| FloatField | `float`      | Slider with min/max/step     |
| Vec2Field  | `vec2`       | 2× labeled number inputs     |
| Vec3Field  | `vec3`       | 3× labeled number inputs     |
| Vec4Field  | `vec4`       | 4× labeled number inputs     |
| ColorField | `color`      | ColorPicker wrapper          |
| BoolField  | `bool`       | Checkbox wrapper             |
| EnumField  | `enum`       | Select dropdown with options |

**Note**: The barrel file is `index.tsx` (not `.ts`) because it contains JSX. The LSP sometimes shows stale errors referencing `index.ts` — ignore these; `bun run typecheck` passes clean.

## Layout Structure (EditorLayout)

```
┌─────────────────────────────────────────┐
│              Toolbar (top)              │
├──────┬──────────────────────┬───────────┤
│      │                      │           │
│Layer │      Viewport        │ Inspector │
│Panel │      (R3F Canvas)    │           │
│240px │      (flex)          │   280px   │
│      │                      │           │
├──────┴──────────────────────┴───────────┤
│     PromptChat (bottom, collapsible)    │
└─────────────────────────────────────────┘
```

Panels toggle via `UIStore.panels` (`layers`, `inspector`, `prompt`).

## Don'ts

- Don't bypass stores — all state flows through MobX
- Don't add business logic to UI library components
- Don't import Three.js outside of `Viewport/` directory
- Don't use class components — functional + observer only
