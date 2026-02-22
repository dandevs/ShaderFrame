---
source: Official Docs (tailwindcss.com)
library: Tailwind CSS
package: tailwindcss
version: v4.2 (latest)
topic: Installation with Vite
fetched: 2026-02-22T00:00:00Z
official_docs: https://tailwindcss.com/docs/installation
---

# Tailwind CSS v4 - Installation with Vite

## Using the `@tailwindcss/vite` Plugin (Recommended for Vite Projects)

The Vite plugin gives better performance than PostCSS integration.

### Step 1: Install packages

```bash
npm install tailwindcss @tailwindcss/vite
```

### Step 2: Configure Vite plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()]
})
```

### Step 3: Import Tailwind in your CSS

```css
/* app.css / style.css */
@import 'tailwindcss';
```

That's it. Just ONE line. No `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` directives.

### Step 4: Start dev server

```bash
npm run dev
```

### Step 5: Use in HTML

```html
<h1 class="text-3xl font-bold underline">Hello world!</h1>
```

## Using PostCSS (Alternative)

If not using Vite directly:

```bash
npm install tailwindcss @tailwindcss/postcss
```

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

**Key v4 changes from v3 installation:**

- `postcss-import` is NO LONGER NEEDED (Tailwind handles imports natively)
- `autoprefixer` is NO LONGER NEEDED (vendor prefixing is built-in via Lightning CSS)
- No `tailwind.config.js` needed (CSS-first configuration)
- No `content` array needed (automatic content detection via .gitignore heuristics)
- Single `@import "tailwindcss"` replaces the three `@tailwind` directives

## Automatic Content Detection

v4 automatically finds your template files. No `content` config needed. It:

- Ignores files in `.gitignore` (node_modules, build output, etc.)
- Ignores binary file extensions
- If needed, use `@source` directive to add explicit sources:

```css
@import 'tailwindcss';
@source "../node_modules/@my-company/ui-lib";
```
