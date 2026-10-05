import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/ui/card';
import { blocksToPlainText } from '@/lib/utils';

interface Props {
  projectId: string;
}

export function StatGrid({ projectId }: Props) {
  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId],
  );
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).count(),
    [projectId],
  );
  const storylines = useLiveQuery(
    () => db.storylines.where('projectId').equals(projectId).count(),
    [projectId],
  );

  const words =
    chapters?.reduce((sum, ch) => {
      if (!ch.body) return sum;
      return sum + blocksToPlainText(ch.body).split(/\s+/).filter(Boolean).length;
    }, 0) ?? 0;

  const stats = [
    { label: 'Chapters', value: chapters?.length ?? 0 },
    { label: 'Words', value: words.toLocaleString() },
    { label: 'Characters', value: characters ?? 0 },
    { label: 'Storylines', value: storylines ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="text-xs italic tracking-wide text-[var(--text-2)]">
            {s.label}
          </div>
          <div className="mt-1 text-2xl text-[var(--text-0)]">{s.value}</div>
        </Card>
      ))}
    </div>
  );
}