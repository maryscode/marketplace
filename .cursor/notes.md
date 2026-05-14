# To Sell — agent notes

## Items without photos disabled (May 2026)

- **`src/App.jsx`:** `OMIT_ITEMS_WITHOUT_FEATURED_PHOTO === true` drops any item where `photos[0]` is missing before rendering sections.
- **Toolbar:** The former **No photo (temp)** pill was removed from `FILTERS` because those listings are hidden.

**Re-enable placeholders:** set `OMIT_ITEMS_WITHOUT_FEATURED_PHOTO` to `false`.

**Re-enable the “No photo only” pill:** see README (`FILTERS` entry + `visibleSections`: expand `cats` for `noPhoto`, then prefer `activeFilter === "noPhoto"` → `!itemHasFeaturedPhoto` before applying omit-for-catalog).
