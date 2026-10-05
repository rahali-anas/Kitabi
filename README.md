# Kitabi

A writing station. One app, three modules:

- **Qisati** — story workstation (manuscript, characters, storylines, notes, power system)
- **Modakirati** — diary
- **Modawanati** — journal

Local-first. No backend. Data lives in the browser (IndexedDB via Dexie). Export and import as JSON.

## Status

v0.1 — Qisati module only.

## Stack

React 19, Vite 8, TypeScript, Tailwind 4, shadcn/ui, BlockNote, Dexie, Zustand.

## Develop
npm install
npm run dev

App runs at `http://localhost:5173/story-workstation/`.

## Build
npm run build

## Layout

- `src/components/` — UI components
- `src/pages/` — one per top-level view
- `src/db/database.ts` — Dexie schema
- `src/stores/uiStore.ts` — Zustand state
- `src/lib/` — utility modules (wiki parsing, etc.)