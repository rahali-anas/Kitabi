import { useMemo } from 'react';
import type { Character } from '@/db/database';
import type { PresenceMatrix } from '@/lib/presence';

export function CastSummary({ matrix }: { matrix: PresenceMatrix }) {
  const summary = useMemo(() => {
    const { characters, totals } = matrix;
    if (characters.length === 0) {
      return { total: 0, most: null, least: null, unused: [] as Character[] };
    }

    let mostIdx = 0;
    let leastIdx = 0;
    for (let i = 1; i < characters.length; i++) {
      if (totals[i] > totals[mostIdx]) mostIdx = i;
      if (totals[i] < totals[leastIdx]) leastIdx = i;
    }

    const unused: Character[] = [];
    for (let i = 0; i < characters.length; i++) {
      if (totals[i] === 0) unused.push(characters[i]);
    }

    return {
      total: characters.length,
      most: { name: characters[mostIdx].name || '—', count: totals[mostIdx] },
      least: { name: characters[leastIdx].name || '—', count: totals[leastIdx] },
      unused,
    };
  }, [matrix]);

  if (summary.total === 0) {
    return (
      <div className="q-heatmap-empty">
        No characters yet. Add characters to see the cast summary.
      </div>
    );
  }

  return (
    <div className="q-cast">
      <div className="q-cast-row">
        <span className="q-cast-label">Total</span>
        <span className="q-cast-value">{summary.total}</span>
      </div>
      <div className="q-cast-row">
        <span className="q-cast-label">Most mentioned</span>
        <span className="q-cast-value">
          {summary.most?.name}
          <span className="q-cast-sub"> · {summary.most?.count}</span>
        </span>
      </div>
      <div className="q-cast-row">
        <span className="q-cast-label">Least mentioned</span>
        <span className="q-cast-value">
          {summary.least?.name}
          <span className="q-cast-sub"> · {summary.least?.count}</span>
        </span>
      </div>
      {summary.unused.length > 0 && (
        <div className="q-cast-row q-cast-row-block">
          <span className="q-cast-label">
            Unused ({summary.unused.length})
          </span>
          <span className="q-cast-value q-cast-unused">
            {summary.unused.map((c, i) => (
              <span key={c.id}>
                {c.name || '—'}
                {i < summary.unused.length - 1 && (
                  <span className="q-cast-sep"> · </span>
                )}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}