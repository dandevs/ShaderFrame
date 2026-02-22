---
source: Official Docs (tailwindcss.com)
library: Tailwind CSS
package: tailwindcss
version: v4.2 (latest)
topic: CSS-based Configuration (replaces tailwind.config.js)
fetched: 2026-02-22T00:00:00Z
official_docs: https://tailwindcss.com/docs/theme
---

# Tailwind CSS v4 - CSS-First Configuration

## CRITICAL: No More `tailwind.config.js`

In v4, configuration is done **entirely in CSS** using the `@theme` directive.
The JavaScript config file is deprecated (still supported via `@config` for backwards compat).

## The `@theme` Directive

Theme variables are special CSS variables defined using `@theme` that control which utility classes exist.

```css
@import 'tailwindcss';

@theme {
  --color-mint-500: oklch(0.72 0.11 178);
  --font-display: 'Satoshi', 'sans-serif';
  --breakpoint-3xl: 1920px;
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}
```

This creates:

- `bg-mint-500`, `text-mint-500`, etc. utility classes
- `font-display` utility class
- `3xl:*` responsive variant
- `ease-fluid` timing function utility
- All values also become CSS custom properties accessible via `var(--color-mint-500)` etc.

## Why `@theme` Instead of `:root`?

- `@theme` creates utility classes AND CSS variables
- `:root` only creates CSS variables (no utilities generated)
- Use `@theme` for design tokens that map to utilities
- Use `:root` for regular CSS variables without utility class generation

## Theme Variable Namespaces

Each namespace maps to specific utility classes:

| Namespace          | Utility Classes                            |
| ------------------ | ------------------------------------------ |
| `--color-*`        | `bg-*`, `text-*`, `border-*`, etc.         |
| `--font-*`         | `font-sans`, `font-mono`, etc.             |
| `--text-*`         | `text-xl`, `text-sm`, etc. (font sizes)    |
| `--font-weight-*`  | `font-bold`, `font-medium`, etc.           |
| `--tracking-*`     | `tracking-wide`, etc.                      |
| `--leading-*`      | `leading-tight`, etc.                      |
| `--breakpoint-*`   | `sm:*`, `md:*`, etc. (responsive variants) |
| `--container-*`    | `@sm:*`, `max-w-md`, etc.                  |
| `--spacing-*`      | `px-4`, `mt-8`, `w-16`, etc.               |
| `--radius-*`       | `rounded-sm`, `rounded-lg`, etc.           |
| `--shadow-*`       | `shadow-md`, `shadow-lg`, etc.             |
| `--inset-shadow-*` | `inset-shadow-xs`, etc.                    |
| `--drop-shadow-*`  | `drop-shadow-md`, etc.                     |
| `--blur-*`         | `blur-md`, etc.                            |
| `--perspective-*`  | `perspective-near`, etc.                   |
| `--aspect-*`       | `aspect-video`, etc.                       |
| `--ease-*`         | `ease-out`, etc.                           |
| `--animate-*`      | `animate-spin`, etc.                       |

## Extending the Default Theme

Just add new variables:

```css
@import 'tailwindcss';

@theme {
  --font-poppins: Poppins, sans-serif;
  --color-brand: oklch(0.72 0.11 221.19);
}
```

## Overriding Default Theme Values

Redefine a variable to override:

```css
@theme {
  --breakpoint-sm: 30rem; /* Override default 40rem */
}
```

## Replacing an Entire Namespace

Use `--namespace-*: initial` to clear all defaults, then define your own:

```css
@theme {
  --color-*: initial; /* Remove ALL default colors */
  --color-white: #fff;
  --color-primary: #3f3cbb;
  --color-accent: #3ab7bf;
}
```

## Completely Custom Theme (No Defaults)

```css
@theme {
  --*: initial; /* Remove ALL defaults */
  --spacing: 4px;
  --font-body: Inter, sans-serif;
  --color-brand: oklch(0.72 0.11 221.19);
}
```

## Dynamic Spacing Scale

v4 uses a single `--spacing` variable. Spacing utilities are derived dynamically:

```css
@theme {
  --spacing: 0.25rem; /* default */
}
```

This means `mt-8` = `calc(var(--spacing) * 8)` = `2rem`. ANY number works out of the box.
No need to extend config for values like `w-17` or `pr-29`.

## Defining Animation Keyframes

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out;

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
}
```

## Referencing Other Variables with `inline`

```css
@theme inline {
  --font-sans: var(--font-inter);
}
```

The `inline` option uses the variable value directly instead of referencing the theme variable.

## Generating All CSS Variables with `static`

By default, only used CSS variables are output. Use `static` to always generate all:

```css
@theme static {
  --color-primary: var(--color-red-500);
  --color-secondary: var(--color-blue-500);
}
```

## Sharing Themes Across Projects

Put theme in a CSS file and import it:

```css
/* packages/brand/theme.css */
@theme {
  --color-brand: oklch(0.72 0.11 221.19);
  --font-body: Inter, sans-serif;
}
```

```css
/* packages/admin/app.css */
@import 'tailwindcss';
@import '../brand/theme.css';
```

## Using Theme Variables in Custom CSS

```css
@layer components {
  .typography h1 {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-gray-950);
  }
}
```

## Using Theme Variables in JavaScript

```jsx
// Motion library example
;<motion.div animate={{ backgroundColor: 'var(--color-blue-500)' }} />

// Get computed value
let styles = getComputedStyle(document.documentElement)
let shadow = styles.getPropertyValue('--shadow-xl')
```

## Custom Utilities (Replaces `@layer utilities`)

```css
/* v3 way (no longer works) */
@layer utilities {
  .tab-4 {
    tab-size: 4;
  }
}

/* v4 way */
@utility tab-4 {
  tab-size: 4;
}
```

## Custom Variants

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Legacy JS Config Support

If you must use a JavaScript config, load it explicitly:

```css
@config "../../tailwind.config.js";
```

But this is for backward compatibility only. CSS-first is the recommended approach.
