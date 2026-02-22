---
source: Official Docs (tailwindcss.com)
library: Tailwind CSS
package: tailwindcss
version: v4.2 (latest)
topic: Breaking Changes from v3 to v4
fetched: 2026-02-22T00:00:00Z
official_docs: https://tailwindcss.com/docs/upgrade-guide
---

# Tailwind CSS v4 - Breaking Changes from v3

## Automated Upgrade Tool

```bash
npx @tailwindcss/upgrade
```

Requires Node.js 20+. Run in a new branch and review the diff.

---

## Browser Requirements

- Chrome 111+ (March 2023)
- Safari 16.4+ (March 2023)
- Firefox 128+ (July 2024)

Uses modern CSS: `@property`, `color-mix()`, cascade layers, registered custom properties.

---

## Configuration Changes

### No More `tailwind.config.js` (Auto-Detected)

JS config files are no longer auto-detected. If needed:

```css
@config "../../tailwind.config.js";
```

### No More `@tailwind` Directives

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import 'tailwindcss';
```

### No More `content` Array

Automatic content detection. Use `@source` if needed:

```css
@source "../node_modules/@my-company/ui-lib";
```

### PostCSS Plugin Moved

```bash
# v3
npm install tailwindcss postcss autoprefixer

# v4
npm install tailwindcss @tailwindcss/postcss
# OR for Vite:
npm install tailwindcss @tailwindcss/vite
```

No more `postcss-import` or `autoprefixer` needed.

---

## Renamed Utilities

| v3                 | v4                 |
| ------------------ | ------------------ |
| `shadow-sm`        | `shadow-xs`        |
| `shadow`           | `shadow-sm`        |
| `drop-shadow-sm`   | `drop-shadow-xs`   |
| `drop-shadow`      | `drop-shadow-sm`   |
| `blur-sm`          | `blur-xs`          |
| `blur`             | `blur-sm`          |
| `backdrop-blur-sm` | `backdrop-blur-xs` |
| `backdrop-blur`    | `backdrop-blur-sm` |
| `rounded-sm`       | `rounded-xs`       |
| `rounded`          | `rounded-sm`       |
| `outline-none`     | `outline-hidden`   |
| `ring`             | `ring-3`           |

---

## Removed Deprecated Utilities

| Removed             | Replacement                      |
| ------------------- | -------------------------------- |
| `bg-opacity-*`      | Opacity modifiers: `bg-black/50` |
| `text-opacity-*`    | `text-black/50`                  |
| `border-opacity-*`  | `border-black/50`                |
| `flex-shrink-*`     | `shrink-*`                       |
| `flex-grow-*`       | `grow-*`                         |
| `overflow-ellipsis` | `text-ellipsis`                  |
| `decoration-slice`  | `box-decoration-slice`           |
| `decoration-clone`  | `box-decoration-clone`           |

---

## Default Behavior Changes

### Default Border Color

- v3: `gray-200`
- v4: `currentColor`

Fix: Always specify a color with border utilities, or add base style:

```css
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
```

### Default Ring Width and Color

- v3: `3px`, `blue-500`
- v4: `1px`, `currentColor`

Fix: Replace `ring` with `ring-3` and add explicit `ring-blue-500`.

### Hover on Mobile

v4 wraps hover in `@media (hover: hover)`, so touch devices won't trigger hover styles.
Override if needed:

```css
@custom-variant hover (&:hover);
```

### Buttons Use Default Cursor

Buttons now use `cursor: default` instead of `cursor: pointer`.

### Placeholder Color

- v3: `gray-400`
- v4: Current text color at 50% opacity

---

## Syntax Changes

### Important Modifier Position

```html
<!-- v3 -->
<div class="!flex !bg-red-500 hover:!bg-red-600">
  <!-- v4 (preferred) -->
  <div class="flex! bg-red-500! hover:bg-red-600!"></div>
</div>
```

### Variable Shorthand

```html
<!-- v3 -->
<div class="bg-[--brand-color]"></div>

<!-- v4 -->
<div class="bg-(--brand-color)"></div>
```

### Variant Stacking Order

v3: Right to left. v4: Left to right.

```html
<!-- v3 -->
<ul class="first:*:pt-0">
  <!-- v4 -->
  <ul class="*:first:pt-0"></ul>
</ul>
```

---

## Custom Utilities API Change

```css
/* v3 - No longer works for variant support */
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}

/* v4 */
@utility tab-4 {
  tab-size: 4;
}
```

Custom utilities via `@utility` automatically work with variants AND are sorted by property count (component-like utilities sort first).

---

## Gradient Behavior Change

In v4, gradient values are preserved across variants (not reset):

```html
<!-- May need explicit via-none to unset -->
<div
  class="bg-linear-to-r from-red-500 via-orange-400 to-yellow-400 dark:via-none dark:from-blue-500 dark:to-teal-400"
></div>
```

Also renamed: `bg-gradient-*` -> `bg-linear-*`

---

## Container Utility

No more `center`/`padding` config options. Customize via `@utility`:

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

---

## `theme()` Function Changes

Use CSS variables instead when possible:

```css
/* v3 */
.my-class {
  background-color: theme(colors.red.500);
}

/* v4 */
.my-class {
  background-color: var(--color-red-500);
}
```

For media queries (where CSS vars don't work), use CSS variable names:

```css
@media (width >= theme(--breakpoint-xl)) {
  /* ... */
}
```

---

## CSS Modules / Vue / Svelte `<style>` Blocks

Need `@reference` to access theme:

```vue
<style>
@reference "../../app.css";
h1 {
  @apply text-2xl font-bold;
}
</style>
```

Or just use CSS variables directly (better performance):

```vue
<style scoped>
h1 {
  color: var(--color-red-500);
}
</style>
```

---

## No More Sass/Less/Stylus

Tailwind v4 IS your preprocessor. Use native CSS features instead.

---

## `resolveConfig` Removed

Use CSS variables directly in JS:

```js
getComputedStyle(document.documentElement).getPropertyValue('--shadow-xl')
```

---

## Transform Utilities

`rotate-*`, `scale-*`, `translate-*` now use individual CSS properties (not `transform`).

- Use `scale-none` instead of `transform-none` to reset
- Use `transition-[opacity,scale]` instead of `transition-[opacity,transform]`

---

## Prefix Syntax Changed

```html
<!-- v3 -->
<div class="tw-flex tw-bg-red-500">
  <!-- v4 -->
  <div class="tw:flex tw:bg-red-500"></div>
</div>
```

Configure: `@import "tailwindcss" prefix(tw);`
