---
source: Official Docs (tailwindcss.com)
library: Tailwind CSS
package: tailwindcss
version: v4.2 (latest)
topic: Dark Mode and Theme Setup
fetched: 2026-02-22T00:00:00Z
official_docs: https://tailwindcss.com/docs/dark-mode
---

# Tailwind CSS v4 - Dark Mode

## Default Behavior: `prefers-color-scheme`

By default, `dark:*` utilities apply based on the OS/browser `prefers-color-scheme` media query.

```html
<div class="bg-white dark:bg-gray-800">
  <h3 class="text-gray-900 dark:text-white">Title</h3>
  <p class="text-gray-500 dark:text-gray-400">Description</p>
</div>
```

## Manual Dark Mode Toggle (CSS Class)

Use `@custom-variant` to override the dark variant (replaces v3's `darkMode: 'class'` config):

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));
```

Then toggle with a CSS class:

```html
<html class="dark">
  <body>
    <div class="bg-white dark:bg-black">
      <!-- Dark mode active -->
    </div>
  </body>
</html>
```

## Using a Data Attribute Instead of Class

```css
@import 'tailwindcss';

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```html
<html data-theme="dark">
  <body>
    <div class="bg-white dark:bg-black">...</div>
  </body>
</html>
```

## Three-Way Toggle (Light / Dark / System)

JavaScript for managing the toggle:

```js
// In <head> to avoid FOUC
document.documentElement.classList.toggle(
  'dark',
  localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

// User explicitly chooses light mode
localStorage.theme = 'light'

// User explicitly chooses dark mode
localStorage.theme = 'dark'

// User chooses to respect OS preference
localStorage.removeItem('theme')
```

## Key Differences from v3

| v3                                          | v4                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `darkMode: 'class'` in `tailwind.config.js` | `@custom-variant dark (&:where(.dark, .dark *));` in CSS                |
| `darkMode: 'media'` (default)               | Default behavior (no config needed)                                     |
| `darkMode: ['class', '[data-mode="dark"]']` | `@custom-variant dark (&:where([data-mode=dark], [data-mode=dark] *));` |

## Color Scheme Utility (New in v4)

v4 adds `color-scheme` utilities to fix dark scrollbars:

```html
<html class="dark color-scheme-dark">
  <!-- Scrollbars and form controls will use dark theme -->
</html>
```
