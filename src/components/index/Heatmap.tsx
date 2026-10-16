import type { Chapter, Character } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { cellIntensity, type PresenceMatrix } from '@/lib/presence';

export function Heatmap({ matrix }: { matrix: PresenceMatrix }) {
  const { setActiveChapter, setView } = useUIStore();
  const { characters, chapters, counts, totals, max } = matrix;

  if (characters.length === 0 || chapters.length === 0) {
    return (
      <div className="q-heatmap-empty">
        {characters.length === 0
          ? 'Add characters to see their presence across chapters.'
          : 'Add chapters to see presence across the manuscript.'}
      </div>
    );
  }

  const openChapter = (id: string) => {
    setActiveChapter(id);
    setView('manuscript');
  };

  return (
    <div className="q-heatmap-wrap">
      <div
        className="q-heatmap-grid"
        style={{
          gridTemplateColumns: `minmax(140px, max-content) repeat(${chapters.length}, 28px) 60px`,
        }}
      >
        {/* Header row */}
        <div className="q-heatmap-corner" />
        {chapters.map((c, i) => (
          <div
            key={c.id}
            className="q-heatmap-col-label"
            title={c.title || `Chapter ${i + 1}`}
          >
            <span>{i + 1}</span>
          </div>
        ))}
        <div className="q-heatmap-header-total">Total</div>

        {/* Rows */}
        {characters.map((char, ci) => (
          <Row
            key={char.id}
            character={char}
            counts={counts[ci]}
            total={totals[ci]}
            chapters={chapters}
            max={max}
            onOpenChapter={openChapter}
          />
        ))}
      </div>

      <div className="q-heatmap-legend">
        <span className="q-heatmap-legend-label">Fewer</span>
        <span className="q-heatmap-legend-swatches">
          {[0.08, 0.25, 0.45, 0.65, 0.85, 1].map((v) => (
            <span
              key={v}
              className="q-heatmap-legend-swatch"
              style={{ opacity: v }}
            />
          ))}
        </span>
        <span className="q-heatmap-legend-label">More</span>
      </div>
    </div>
  );
}

function Row({
  character,
  counts,
  total,
  chapters,
  max,
  onOpenChapter,
}: {
  character: Character;
  counts: number[];
  total: number;
  chapters: Chapter[];
  max: number;
  onOpenChapter: (id: string) => void;
}) {
  return (
    <>
      <div className="q-heatmap-row-label" title={character.name}>
        {character.name || '—'}
      </div>
      {counts.map((n, i) => {
        const intensity = cellIntensity(n, max);
        return (
          <button
            key={chapters[i].id}
            className="q-heatmap-cell"
            data-filled={n > 0 ? 'true' : 'false'}
            onClick={() => onOpenChapter(chapters[i].id)}
            title={`${character.name} — ${chapters[i].title || `Chapter ${i + 1}`} — ${n} mention${n === 1 ? '' : 's'}`}
            style={
              n > 0
                ? ({ '--q-heat-alpha': intensity } as React.CSSProperties)
                : undefined
            }
          />
        );
      })}
      <div className="q-heatmap-total">{total}</div>
    </>
  );
}