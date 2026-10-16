import { useMemo } from 'react';
import type { Chapter } from '@/db/database';
import { blockNoteToText } from '@/lib/search';

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function StatsStrip({ chapters }: { chapters: Chapter[] }) {
  const stats = useMemo(() => {
    const total = chapters.length;
    let totalWords = 0;
    let longest: { title: string; words: number } | null = null;
    let shortest: { title: string; words: number } | null = null;
    const byStatus = { draft: 0, revising: 0, done: 0 };

    for (const c of chapters) {
      const w = countWords(blockNoteToText(c.body));
      totalWords += w;
      const title = c.title || 'Untitled Chapter';

      if (!longest || w > longest.words) longest = { title, words: w };
      if (!shortest || w < shortest.words) shortest = { title, words: w };

      const s = c.status || 'draft';
      if (s in byStatus) byStatus[s as keyof typeof byStatus]++;
    }

    const avg = total > 0 ? Math.round(totalWords / total) : 0;

    return { total, totalWords, avg, longest, shortest, byStatus };
  }, [chapters]);

  return (
    <div className="q-stats">
      <Cell label="Chapters" value={stats.total.toLocaleString()} />
      <Cell label="Words" value={stats.totalWords.toLocaleString()} />
      <Cell label="Avg / chapter" value={stats.avg.toLocaleString()} />
      <Cell
        label="Longest"
        value={stats.longest ? stats.longest.words.toLocaleString() : '—'}
        sub={stats.longest?.title}
      />
      <Cell
        label="Shortest"
        value={stats.shortest ? stats.shortest.words.toLocaleString() : '—'}
        sub={stats.shortest?.title}
      />
      <Cell
        label="Status"
        value={
          stats.total === 0
            ? '—'
            : `${stats.byStatus.draft} · ${stats.byStatus.revising} · ${stats.byStatus.done}`
        }
        sub={stats.total === 0 ? undefined : 'draft · revising · done'}
      />
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="q-stat">
      <div className="q-stat-label">{label}</div>
      <div className="q-stat-value" style={{ fontSize: 26 }}>
        {value}
      </div>
      {sub && (
        <div className="q-stat-value-sub" title={sub}>
          {sub.length > 24 ? sub.slice(0, 22) + '…' : sub}
        </div>
      )}
    </div>
  );
}