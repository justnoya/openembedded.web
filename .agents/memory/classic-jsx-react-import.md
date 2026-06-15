---
name: Classic JSX transform — no explicit React default import
description: This project uses the Classic JSX transform. Vite's React plugin auto-injects `import React from 'react'` at the top of every JSX/TSX file. An explicit `import React, { ... } from 'react'` creates a duplicate `const React` declaration that silently crashes the entire module (blank white page, no console errors).
---

## Rule
Never write `import React, { ... } from 'react'` in new `.tsx` files.
Only import named exports: `import { useState, useEffect } from 'react'`.

**Why:** The Vite React plugin (Classic JSX runtime mode) prepends `import __vite__cjsImport0_react ...; const React = ...` automatically. A second `const React = ...` from the explicit default import causes a duplicate identifier SyntaxError that prevents the module — and the entire React app — from mounting. The page renders as a completely blank white screen with no JS errors visible in the console.

**How to apply:** Any new `.tsx` file in `frontend/src/` (or subdirectories like `frontend/src/v2/`) that uses JSX must only import named React hooks/utilities. The `React` namespace for JSX is provided automatically.
