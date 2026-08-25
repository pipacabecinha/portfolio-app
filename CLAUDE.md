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

The entire catalog is driven by data files that live outside `src/`, so paintings and collections can be added without touching code — either by hand or through the CMS at `/admin` (see below):

- `data/paintings/*.json` — one file per painting, filename arbitrary (the CMS names them). Shape: `{ collection, title?, medium?, dimensions_cm?, year?, image }`, where `image` is the public path to the file, e.g. `/images/paintings/Novos caminhos.jpg`. Blank/omitted `title`/`medium`/`dimensions_cm`/`year` are intentional (untitled pieces, minimal collections) — never invent values for them; the rendering code omits blank fields rather than showing empty slots.
- `data/collections/*.json` — one file per collection. Shape: `{ name, order? }`. `order` controls display/tab order (lower first, ties break alphabetically, missing `order` sorts last); this is the dynamic replacement for the old hardcoded `COLLECTIONS_ORDER` array.
- `public/images/paintings/` — a **flat** directory (no per-collection subfolders). Every image filename must be unique across the *entire* catalog, not just within its collection, since this is how images are looked up.

To add a painting by hand: create a JSON file in `data/paintings/`, matching `collection` exactly to a `name` in `data/collections/`, and drop the image into `public/images/paintings/`. To add a collection: create a JSON file in `data/collections/`. No code changes needed either way — or just use `/admin`.

### `/admin` — Decap CMS

`public/admin/index.html` + `public/admin/config.yml` set up [Decap CMS](https://decapcms.org/) (loaded from a CDN, not an npm dependency) as a mobile-friendly editor for the two collections above, authenticated via Netlify Identity + Git Gateway (so edits commit straight to `main` and Netlify auto-deploys, without the user needing a GitHub account). `next.config.ts` has a `rewrites()` entry so `/admin` resolves to the static `public/admin/index.html` — Next doesn't serve directory-index files from `public/` on its own. The root layout (`src/app/layout.tsx`) loads the Netlify Identity widget script sitewide so invite/login links that land on `/` work correctly.

In the CMS: paintings' `collection` field is a `relation` widget pointing at the `collections` collection (so you pick from existing names) — to start a new collection, create it under **Collections** first (name + optional order), then it appears as an option when adding paintings.

Enabling this requires one-time manual setup in the Netlify dashboard (not doable from the repo): Site settings → Identity → Enable Identity, then Identity → Services → Git Gateway → Enable Git Gateway, then invite the user's email as an Identity user.

### `src/lib/collections.ts` vs `src/lib/paintings.ts`

Both now do `fs` file I/O (reading `data/collections/*.json` and `data/paintings/*.json` respectively) and must only ever be imported from server code. The client component `Gallery.tsx` does **not** import either module — it receives `paintings` and `collections` as props from the server component `src/app/page.tsx`. If `Gallery.tsx` imported either module directly, Next would try to bundle `fs` into client JS and the build fails (`Module not found: Can't resolve 'fs'`). Keep this prop-passing split if you touch any of these files.

### `src/lib/paintings.ts`

- Reads real image pixel dimensions via `image-size` at build/request time (so `next/image` can render at intrinsic size without cropping — paintings are shown uncropped, no `object-fit: cover`).
- Derives each painting's route id by slugifying the `image` filename (strip extension, strip accents, lowercase, dashes) and de-dupes on collision — this is why filenames must be unique.
- `getPaintings()` caches its result in a module-level variable for the process lifetime.
- `getSortedPaintings()` is the canonical display order (by `data/collections/*.json` order, otherwise stable) — used by both the home grid and `getPaintingNavigation()`, so ordering is consistent everywhere.
- `getPaintingNavigation(id)` returns `{ prev, next }` with wrap-around, used by the detail-page arrows.

### Routing

- `/` (`src/app/page.tsx`) — server component, statically prerendered, fetches all paintings and passes them to `Gallery` (`src/components/Gallery.tsx`), a client component. Collection filtering is pure client-side state (no URL params, no server round-trip) for instant taps on mobile.
- `/painting/[id]` (`src/app/painting/[id]/page.tsx`) — fully static via `generateStaticParams` (one page per painting). Renders the facts line (`factsLine()` in `paintings.ts`, which joins medium/dimensions/year with " · " and drops blanks) and the prev/next arrow overlay from `getPaintingNavigation`.
- `BackButton` (`src/components/BackButton.tsx`) is a server component that always links to `/` (not `router.back()`) — prev/next arrows on the detail page push new history entries, so after navigating between paintings a history-based back button would step through visited paintings instead of returning to the grid.

### Visual direction

Colors/fonts are theme tokens in `src/app/globals.css` (Tailwind v4 `@theme inline`): `bone`/`ink`/`muted`/`line`. Serif is a system stack (Georgia) for titles/wordmark, not `next/font`/Google Fonts — deliberate, for fast mobile load with no web-font flash. Filter chips are underlined text, not filled pills; images have sharp corners, no shadows/card backgrounds.
