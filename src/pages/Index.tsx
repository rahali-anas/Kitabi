import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { computePresence } from '@/lib/presence';
import { Heatmap } from '@/components/index/Heatmap';
import { StatsStrip } from '@/components/index/StatsStrip';
import { CastSummary } from '@/components/index/CastSummary';
import { HealthLine } from '@/components/index/HealthLine';

export function Index({ projectId }: { projectId: string }) {
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  if (!characters || !chapters) {
    return (
      <div className="q-page">
        <div className="q-page-head">
          <h2 className="q-page-title">Index</h2>
        </div>
        <div className="q-heatmap-empty">Loading…</div>
      </div>
    );
  }

  const matrix = computePresence(characters, chapters);

  return (
    <div className="q-page">
      <div className="q-page-head">
        <h2 className="q-page-title">
          Index
          <span className="count">
            {characters.length} characters · {chapters.length} chapters
          </span>
        </h2>
      </div>

      <section className="q-index-section">
        <div className="q-index-section-head">
          <span className="q-index-section-label">Manuscript Stats</span>
        </div>
        <StatsStrip chapters={chapters} />
      </section>

      <section className="q-index-section">
        <div className="q-index-section-head">
          <span className="q-index-section-label">Cast</span>
        </div>
        <CastSummary matrix={matrix} />
      </section>

      <section className="q-index-section">
        <div className="q-index-section-head">
          <span className="q-index-section-label">Health</span>
        </div>
        <HealthLine projectId={projectId} />
      </section>

      <section className="q-index-section">
        <div className="q-index-section-head">
          <span className="q-index-section-label">Character Presence</span>
        </div>
        <Heatmap matrix={matrix} />
      </section>
    </div>
  );
}