import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { blockNoteToText } from '@/lib/search';

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
``
interface HealthData {
  emptyChapters: number;
  unusedCharacters: number;
  brokenLinks: number;
}

export function HealthLine({ projectId }: { projectId: string }) {
  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  const health = useMemo<HealthData | null>(() => {
    if (!chapters || !characters || !notes) return null;

    let emptyChapters = 0;
    for (const c of chapters) {
      if (c.title === '__journal__') continue;
      const text = blockNoteToText(c.body);
      if (countWords(text) === 0) emptyChapters++;
    }

    const names = new Set(
      characters.map((c) => (c.name || '').toLowerCase()).filter(Boolean)
    );
    const titles = new Set(
      notes.map((n) => (n.title || '').toLowerCase()).filter(Boolean)
    );

    let unusedCharacters = 0;
    for (const c of characters) {
      const name = (c.name || '').trim();
      if (!name) continue;
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        `(^|[^\\p{L}\\p{N}_])${esc}(?=$|[^\\p{L}\\p{N}_])`,
        'iu'
      );
      let found = false;
      for (const ch of chapters) {
        if (ch.title === '__journal__') continue;
        const text = blockNoteToText(ch.body);
        if (re.test(text)) {
          found = true;
          break;
        }
      }
      if (!found) unusedCharacters++;
    }

    let brokenLinks = 0;
    const seen = new Set<string>();
    for (const ch of chapters) {
      if (ch.title === '__journal__') continue;
      const text = blockNoteToText(ch.body);
      const re = /\[\[([^\]]+)\]\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const key = m[1].trim().toLowerCase();
        if (!key) continue;
        if (!names.has(key) && !titles.has(key)) {
          const dedupe = `${ch.id}::${key}`;
          if (!seen.has(dedupe)) {
            seen.add(dedupe);
            brokenLinks++;
          }
        }
      }
    }

    return { emptyChapters, unusedCharacters, brokenLinks };
  }, [chapters, characters, notes]);

  if (!health) return null;

  const allClear =
    health.emptyChapters === 0 &&
    health.unusedCharacters === 0 &&
    health.brokenLinks === 0;

  return (
    <div className="q-health">
      {allClear ? (
        <span className="q-health-clear">All clear.</span>
      ) : (
        <>
          <Stat
            n={health.emptyChapters}
            label={`empty chapter${health.emptyChapters === 1 ? '' : 's'}`}
          />
          
          <Stat
            n={health.brokenLinks}
            label={`broken link${health.brokenLinks === 1 ? '' : 's'}`}
          />
        </>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="q-health-stat">
      <span className="q-health-num">{n}</span>{' '}
      <span className="q-health-lbl">{label}</span>
    </span>
  );
}