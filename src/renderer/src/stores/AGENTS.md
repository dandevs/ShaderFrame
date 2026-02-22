# Stores — Agent Guidelines

MobX stores for application state. All stores use `makeAutoObservable` and are accessed via React context hooks from `providers/`.

## Stores

### ThemeStore (`ThemeStore.ts`)

- Manages `theme: 'light' | 'dark'`
- Persists to `localStorage` under key `shaderframe-theme`
- Default: `dark`
- Access: `useThemeStore()` from `providers/ThemeProvider`
- Actions: `setTheme()`, `toggleTheme()`
- Computed: `isDark`

### ProjectStore (`ProjectStore.ts`)

- Manages the entire project: layer tree + shader components
- Layer tree is a recursive structure: `Layer[]` where `GroupLayer.children: Layer[]`
- Shader components stored in a flat map by ID (`project.shaderComponents`)
- Group layers reference shader component IDs via `shaderComponents: string[]`
- Access: `useProjectStore()` from `providers/StoreProvider`
- Key actions:
  - `newProject()`, `loadProject()`, `closeProject()`, `serializeProject()`
  - `addLayer()`, `removeLayer()`, `updateLayer()`, `moveLayer()`
  - `createImageLayer()`, `createTextLayer()`, `createGroupLayer()`
  - `addShaderComponent()`, `removeShaderComponent()`, `updateShaderComponent()`
  - `updateShaderUniform()` — updates a single uniform value
- Key queries: `findLayer()`, `findParent()`, `getShaderComponent()`

### UIStore (`UIStore.ts`)

- Manages UI state: selection, panel visibility, prompt state
- `selectedLayerId: LayerId | null`
- `panels: Record<'layers' | 'inspector' | 'prompt', boolean>`
- `showHomeScreen: boolean` — controls Home vs Editor view
- `editingShaderComponentId` + `promptEditMode` — controls prompt chat behavior
- Access: `useUIStore()` from `providers/StoreProvider`

## Patterns

```tsx
// Always use observer() on components that read from stores
const MyComponent = observer(function MyComponent() {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  // ...reactive to changes
})
```

## Rules

- Stores are singletons created inside providers — never instantiate directly
- Always wrap reactive components with `observer()` from `mobx-react-lite`
- Use `toJS()` for serialization (strips MobX proxies)
- Type-safe layer discrimination: use `isGroupLayer()`, `isImageLayer()`, `isTextLayer()` guards
- Shader uniform values use a type assertion pattern (caller is responsible for type correctness)
