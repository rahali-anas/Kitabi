import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  projectId: string;
}

const statusVariant: Record<string, string> = {
  draft: 'bg-[var(--bg-4)] text-[var(--text-1)]',
  revising: 'bg-[#a86a1c]/15 text-[#a86a1c]',
  done: 'bg-[#2f6b3f]/15 text-[#2f6b3f]',
};

export function RecentChapters({ projectId }: Props) {
  const setView = useUIStore((s) => s.setView);
  const setActiveChapter = useUIStore((s) => s.setActiveChapter);

  const chapters = useLiveQuery(
    () =>
      db.chapters
        .where('projectId')
        .equals(projectId)
        .sortBy('updated')
        .then((rows) => rows.slice().reverse().slice(0, 5)),
    [projectId],
  );

  if (!chapters || chapters.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 text-xs italic tracking-wide text-[var(--text-2)]">
        Recent chapters
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <button
              onClick={() => {
                setActiveChapter(ch.id);
                setView('manuscript');
              }}
              className="flex w-full items-center justify-between gap-4 py-2 text-left transition-colors hover:bg-[var(--bg-3)]"
            >
              <span className="truncate text-sm text-[var(--text-0)]">
                {ch.title || 'Untitled chapter'}
              </span>
              <Badge
                variant="outline"
                className={`shrink-0 border-none text-[10px] italic ${statusVariant[ch.status] ?? ''}`}
              >
                {ch.status}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}