# @h5-kb/web

React + Vite + Tailwind frontend for the H5 Team Knowledge Base.

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Serve dist/
npm run lint         # ESLint
npm run test         # Vitest unit + integration
npm run test:e2e     # Playwright smoke (builds locally if needed)
```

Optional local LCP probe (after build): `node scripts/measure-lcp.mjs`

Base path: `/h5-knowledgebase-site/` (GitHub Pages).
