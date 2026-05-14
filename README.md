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

## Items without photos (hidden for now)

The catalog only shows rows where `photos[0]` is set (`OMIT_ITEMS_WITHOUT_FEATURED_PHOTO` in `src/App.jsx`). Items missing a featured photo stay in `items.json` but do not render until you turn that off.

**To show no-photo items again (placeholder cards):** set `OMIT_ITEMS_WITHOUT_FEATURED_PHOTO` to `false` in `src/App.jsx`.

**To restore the temporary “No photo” toolbar pill** (lists only items missing `photos[0]` across categories):

1. Add `{ value: "noPhoto", label: "No photo (temp)" }` to the `FILTERS` array in `src/App.jsx`.
2. In `visibleSections`, include `activeFilter === "noPhoto"` wherever `"available"` or `"reserved"` selects every category (`cats`).
3. When building each category’s `catItems`, branch first on `activeFilter === "noPhoto"` (keep only `!itemHasFeaturedPhoto(i)`), otherwise apply `OMIT_ITEMS_WITHOUT_FEATURED_PHOTO` as today (`itemHasFeaturedPhoto(i)` only). That way the pill still works while the main catalog hides no-photo rows.

Details also live in `.cursor/notes.md`.

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
