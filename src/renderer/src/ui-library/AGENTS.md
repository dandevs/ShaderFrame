# UI Library — Agent Guidelines

Reusable, theme-aware UI components used throughout ShaderFrame. All components support light/dark mode via Tailwind CSS v4 design tokens.

## Components

| Component   | File              | Purpose                                                  |
| ----------- | ----------------- | -------------------------------------------------------- |
| Button      | `Button.tsx`      | 4 variants (primary, secondary, ghost, danger), 3 sizes  |
| IconButton  | `IconButton.tsx`  | Square button with `aria-label` for icon content         |
| Input       | `Input.tsx`       | Text input with optional label and error state           |
| TextArea    | `TextArea.tsx`    | Multi-line input with resize control                     |
| Select      | `Select.tsx`      | Dropdown with typed options array                        |
| Checkbox    | `Checkbox.tsx`    | Toggle with indeterminate state support                  |
| Slider      | `Slider.tsx`      | Range slider + number input combo                        |
| ColorPicker | `ColorPicker.tsx` | Color swatch + hex input                                 |
| Panel       | `Panel.tsx`       | Collapsible section with title + optional actions        |
| ScrollArea  | `ScrollArea.tsx`  | Scroll container with forwarded ref                      |
| Tooltip     | `Tooltip.tsx`     | CSS-only tooltip, 4 positions (top, bottom, left, right) |

## Conventions

- All components use `forwardRef` where appropriate
- Props use TypeScript `interface` (not `type`)
- Dark mode via Tailwind classes: `dark:bg-surface-800`
- No internal state management (controlled components)
- Import via barrel: `import { Button, Input } from '@renderer/ui-library'`
- Colors use the `surface-*`, `primary-*`, `danger-*` OKLCH token scale from `app.css`

## Patterns

```tsx
// Button variants
<Button variant="primary" size="md" onClick={handleClick}>Save</Button>
<Button variant="ghost" size="sm" disabled>Cancel</Button>

// Slider with range
<Slider label="Opacity" value={0.8} min={0} max={1} step={0.01} onChange={setValue} />

// Collapsible panel
<Panel title="Layer Properties" defaultCollapsed={false}>
  <div>...</div>
</Panel>

// Tooltip positioning
<Tooltip content="Delete layer" position="bottom">
  <IconButton label="Delete" onClick={handleDelete}>🗑</IconButton>
</Tooltip>
```

## Don'ts

- Don't add MobX `observer()` to UI library components — they are stateless
- Don't import from stores inside UI library — pass data as props
- Don't use hardcoded colors — always use design tokens (`surface-*`, `primary-*`)
