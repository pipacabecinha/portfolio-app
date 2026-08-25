# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A pure visual showcase of Filipa Cabecinha's paintings — a mobile-first grid + detail-view catalog, no e-commerce, no auth, no database. It is intentionally minimal: no search, no descriptions/story text, no pricing. See the original spec this was built from, if present, for the full rationale (it was a one-time `build_instructions.md` handed to Claude Code and is not stored in this repo).

Deployed on **Netlify** (not Vercel, despite the default `create-next-app` README/config) — connected to `github.com/pipacabecinha/portfolio-app`, auto-deploys on push to `main`.

## Commands

```bash
npm run dev     # Turbopack dev server, http://localhost:3000
npm run build   # production build; also statically generates every /painting/[id] page
npm run lint    # eslint
```

There is no test suite configured.

## Content-as-data architecture

The entire catalog is driven by two things that live outside `src/`, so paintings can be added without touching code:

- `data/paintings.csv` — single source of truth. Columns: `collection, title, medium, dimensions_cm, year, image_filename`. Blank `title`/`medium`/`dimensions_cm`/`year` are intentional (untitled pieces, minimal collections) — never invent values for them; the rendering code omits blank fields rather than showing empty slots.
- `public/images/paintings/` — a **flat** directory (no per-collection subfolders). Every `image_filename` in the CSV must be unique across the *entire* catalog, not just within its collection, since this is how images are looked up.

To add a painting: append a CSV row + drop the matching image file into that folder, matching `collection` exactly to one of the strings in `src/lib/collections.ts`. No code changes needed.

### `src/lib/collections.ts` vs `src/lib/paintings.ts`

`COLLECTIONS_ORDER` (the fixed, non-alphabetical display order for the 5 collections) lives in its own file, separate from `paintings.ts`, on purpose: `paintings.ts` imports `fs`/`path` and does file I/O, and is imported by the client component `Gallery.tsx` for the collection list. If `Gallery.tsx` imported `COLLECTIONS_ORDER` from `paintings.ts` directly, Next would try to bundle the `fs`-based module into client JS and the build fails (`Module not found: Can't resolve 'fs'`). Keep this split if you touch either file.

### `src/lib/paintings.ts`

- Hand-rolled quoted-CSV parser (no dependency) — fine since the schema is small and controlled.
- Reads real image pixel dimensions via `image-size` at build/request time (so `next/image` can render at intrinsic size without cropping — paintings are shown uncropped, no `object-fit: cover`).
- Derives each painting's route id by slugifying `image_filename` (strip extension, strip accents, lowercase, dashes) and de-dupes on collision — this is why filenames must be unique.
- `getPaintings()` caches its result in a module-level variable for the process lifetime.
- `getSortedPaintings()` is the canonical display order (by `COLLECTIONS_ORDER`, otherwise stable) — used by both the home grid and `getPaintingNavigation()`, so ordering is consistent everywhere.
- `getPaintingNavigation(id)` returns `{ prev, next }` with wrap-around, used by the detail-page arrows.

### Routing

- `/` (`src/app/page.tsx`) — server component, statically prerendered, fetches all paintings and passes them to `Gallery` (`src/components/Gallery.tsx`), a client component. Collection filtering is pure client-side state (no URL params, no server round-trip) for instant taps on mobile.
- `/painting/[id]` (`src/app/painting/[id]/page.tsx`) — fully static via `generateStaticParams` (one page per painting). Renders the facts line (`factsLine()` in `paintings.ts`, which joins medium/dimensions/year with " · " and drops blanks) and the prev/next arrow overlay from `getPaintingNavigation`.
- `BackButton` (`src/components/BackButton.tsx`) is a server component that always links to `/` (not `router.back()`) — prev/next arrows on the detail page push new history entries, so after navigating between paintings a history-based back button would step through visited paintings instead of returning to the grid.

### Visual direction

Colors/fonts are theme tokens in `src/app/globals.css` (Tailwind v4 `@theme inline`): `bone`/`ink`/`muted`/`line`. Serif is a system stack (Georgia) for titles/wordmark, not `next/font`/Google Fonts — deliberate, for fast mobile load with no web-font flash. Filter chips are underlined text, not filled pills; images have sharp corners, no shadows/card backgrounds.
