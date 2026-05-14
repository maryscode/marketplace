# Moving Sale

Vite + React app for the family-first moving sale list.

## Develop

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

## Edit the items

All item data lives in `src/data/items.json`. Add, remove, or re-price items
there — no JSX changes needed. Category order and labels are in the
`categories` array in the same file.

## Build

```bash
npm run build      # outputs static site to dist/
npm run preview    # serves the built site locally
```

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub / GitLab / Bitbucket).
2. In Vercel, click **Add New → Project** and import the repo.
3. Vercel auto-detects Vite. Defaults are correct:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. Every push to `main` redeploys automatically.

Or from the CLI:

```bash
npm i -g vercel
vercel              # first deploy (preview)
vercel --prod       # production deploy
```

## Project layout

```
index.html              Vite entry
vite.config.js
src/
  main.jsx              React bootstrap
  App.jsx               UI + state (filter, search, claimed)
  styles.css
  data/items.json       Item list + category order
```
