---
source: Official Docs (tailwindcss.com)
library: Tailwind CSS
package: tailwindcss
version: v4.2 (latest)
topic: CSS Custom Properties Integration
fetched: 2026-02-22T00:00:00Z
official_docs: https://tailwindcss.com/docs/theme
---

# Tailwind CSS v4 - CSS Custom Properties Integration

## All Theme Values Are CSS Variables

In v4, ALL design tokens defined in `@theme` are automatically exposed as native CSS custom properties on `:root`:

```css
/* Your config */
@theme {
  --font-display: 'Satoshi', 'sans-serif';
  --color-brand-500: oklch(0.84 0.18 117.33);
}

/* Generated output */
:root {
  --font-display: 'Satoshi', 'sans-serif';
  --color-brand-500: oklch(0.84 0.18 117.33);
}
```

## Using in Custom CSS

Reference theme variables directly:

```css
@layer components {
  .typography {
    p {
      font-size: var(--text-base);
      color: var(--color-gray-700);
    }
    h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-950);
    }
  }
}
```

## Using in Inline Styles

```html
<div style="background-color: var(--color-mint-500)">
  <!-- Uses your theme color -->
</div>
```

## Using in Arbitrary Values

```html
<div class="relative rounded-xl">
  <div class="absolute inset-px rounded-[calc(var(--radius-xl)-1px)]">
    <!-- Concentric border radius -->
  </div>
</div>
```

## Using in JavaScript

```jsx
// Direct CSS variable references work in animation libraries
;<motion.div animate={{ backgroundColor: 'var(--color-blue-500)' }} />

// Get resolved value
let styles = getComputedStyle(document.documentElement)
let shadow = styles.getPropertyValue('--shadow-xl')
```

## Variable Shorthand in Utility Classes (v4 Change)

In v4, use parentheses instead of square brackets for CSS variable shorthand:

```html
<!-- v3 syntax (deprecated) -->
<div class="bg-[--brand-color]"></div>

<!-- v4 syntax -->
<div class="bg-(--brand-color)"></div>
```

## Using `:root` for Non-Theme Variables

For CSS variables that should NOT generate utility classes, use `:root` instead of `@theme`:

```css
:root {
  --sidebar-width: 280px;
  --header-height: 64px;
}
```

These won't create Tailwind utilities but are still accessible via `var()`.

## Registered Custom Properties with `@property`

v4 uses the CSS `@property` rule internally for registered custom properties, enabling:

- Gradient animations
- Better performance on large pages
- Type-safe custom properties

## `color-mix()` for Opacity

v4 uses `color-mix()` instead of internal opacity handling:

```css
/* v4 compiled output for bg-blue-500/50 */
.bg-blue-500\/50 {
  background-color: color-mix(in oklab, var(--color-blue-500) 50%, transparent);
}
```

This means opacity modifiers work with ANY color value, including CSS variables and `currentColor`.

## Native CSS Nesting

v4 supports native CSS nesting (processed via Lightning CSS):

```css
.typography {
  p {
    font-size: var(--text-base);
  }
  img {
    border-radius: var(--radius-lg);
  }
}
```

## Built-in `@import` Support

No need for `postcss-import`. Tailwind handles `@import` natively:

```css
@import 'tailwindcss';
@import './typography.css';
```
