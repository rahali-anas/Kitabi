import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { blocksToPlainText } from '@/lib/utils';

interface Props {
  projectId: string;
}

export function ContinueWriting({ projectId }: Props) {
  const setView = useUIStore((s) => s.setView);
  const setActiveChapter = useUIStore((s) => s.setActiveChapter);

  const chapter = useLiveQuery(
    () =>
      db.chapters
        .where('projectId')
        .equals(projectId)
        .sortBy('updated')
        .then((rows) => rows[rows.length - 1]),
    [projectId],
  );

  if (!chapter) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-start gap-3">
          <span className="text-xs italic tracking-wide text-[var(--text-2)]">
            Continue writing
          </span>
          <p className="text-lg text-[var(--text-1)]">
            No chapters yet. Start your first one.
          </p>
          <Button
            onClick={() => setView('manuscript')}
            className="mt-1"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Open Manuscript
          </Button>
        </div>
      </Card>
    );
  }

  const preview = chapter.body
    ? blocksToPlainText(chapter.body).slice(0, 220)
    : '';
  const words = chapter.body ? blocksToPlainText(chapter.body).split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3">
        <span className="text-xs italic tracking-wide text-[var(--text-2)]">
          Continue writing
        </span>
        <h2 className="text-2xl leading-snug text-[var(--text-0)]">
          {chapter.title || 'Untitled chapter'}
        </h2>
        {preview && (
          <p className="line-clamp-3 text-sm italic leading-relaxed text-[var(--text-2)]">
            {preview}
          </p>
        )}
        <div className="flex items-center gap-4 pt-1">
          <Button
            onClick={() => {
              setActiveChapter(chapter.id);
              setView('manuscript');
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Resume
          </Button>
          <span className="text-xs italic text-[var(--text-3)]">
            {words.toLocaleString()} words
          </span>
        </div>
      </div>
    </Card>
  );
}