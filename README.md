# Kitabi

Your personal writing station with three modules/Books:

- **Qisati** — stories: manuscripts, characters, storylines, world notes, power systems, index view that maps character presence across your chapters
- **Modakirati** — diary. *(in development)*
- **Modawanati** — journal. single endless page to fill with your thoughts top to bottom, entries separated by a date stamp automatically the first time you write on a new day.

**Live app:** https://rahali-anas.github.io/Kitabi/

## What it does

Kitabi is an offline-first writing app. Everything you write is stored locally in
your browser (IndexedDB) — nothing is sent to a server. You can work offline.

Inside the Qisati module *(So Far)*:

- **Manuscript** — chapters with a block editor, autosave, drag-to-reorder.
- **Characters** — cards with portrait, title, race, age, relations, and powers.
- **Storylines** — a timeline with year-sorted events.
- **Notes** — tagged notes, pinnable, filterable.
- **Power System** — categories, entries, sub-entries, rules *(can be disabled)*.
- **Index** — presence heatmap showing where each character appears across chapters. Manuscript stats. Cast summary Health checks (empty chapters, unused characters, broken wiki links).
- **Wiki links** — `[[Name]]` inside the editor. Autocomplete on typing, click to open.
- **Search** — Ctrl+F, unified search across chapters, characters, storylines, notes.
- **Focus mode** — Ctrl+Shift+F, hides chrome and centers the editor.
- **Reminders** — broken wiki links surface on the dashboard until resolved.

## Running locally

```bash
git clone https://github.com/rahali-anas/Kitabi.git
cd Kitabi
npm install
npm run dev