import type { Chapter, Character } from '@/db/database';
import { blockNoteToText } from './search';

export interface PresenceMatrix {
  characters: Character[];
  chapters: Chapter[];
  counts: number[][]; // counts[charIndex][chapterIndex]
  totals: number[]; // totals[charIndex]
  max: number; // highest single count in the matrix (for normalizing darkness)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMentions(text: string, name: string): number {
  if (!text || !name) return 0;
  const trimmed = name.trim();
  if (!trimmed) return 0;
  // word-boundary, case-insensitive
  const re = new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escapeRegex(trimmed)}(?=$|[^\\p{L}\\p{N}_])`,
    'giu'
  );
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

export function computePresence(
  characters: Character[],
  chapters: Chapter[]
): PresenceMatrix {
  const sortedChars = [...characters].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const counts: number[][] = [];
  const totals: number[] = [];
  let max = 0;

  for (const c of sortedChars) {
    const row: number[] = [];
    let total = 0;
    for (const ch of sortedChapters) {
      const text = blockNoteToText(ch.body);
      const n = countMentions(text, c.name || '');
      row.push(n);
      total += n;
      if (n > max) max = n;
    }
    counts.push(row);
    totals.push(total);
  }

  return {
    characters: sortedChars,
    chapters: sortedChapters,
    counts,
    totals,
    max,
  };
}

export function cellIntensity(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  // Log scale, capped at 1.  Strong emphasis on any hit, with diminishing returns.
  const norm = Math.log(count + 1) / Math.log(max + 1);
  return Math.min(1, Math.max(0.08, norm));
}