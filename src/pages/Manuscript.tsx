import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { ChapterList } from '@/components/manuscript/ChapterList';
import { ChapterEditor } from '@/components/manuscript/ChapterEditor';
import { Plus } from 'lucide-react';

export function Manuscript({ projectId }: { projectId: string }) {
  const { activeChapterId, setActiveChapter } = useUIStore();
  const [creating, setCreating] = useState(false);
  const chapterCount = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).count(),
    [projectId]
  );

  const newChapter = async () => {
    setCreating(true);
    try {
      const id = crypto.randomUUID();
      await db.chapters.add({
        id,
        projectId,
        title: `Chapter ${(chapterCount ?? 0) + 1}`,
        body: '',
        order: (chapterCount ?? 0) + 1,
        status: 'draft',
        mentionedChars: [],
        snapshots: [],
        created: Date.now(),
        updated: Date.now(),
      });
      setActiveChapter(id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="q-ms">
      <aside className="q-ms-side">
        <div className="q-ms-side-head">
          <span className="q-ms-side-title">Chapters</span>
          <button
            className="q-ms-side-add"
            onClick={newChapter}
            disabled={creating}
            title="New chapter"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="q-ms-side-list">
          <ChapterList projectId={projectId} />
        </div>
      </aside>

      <div>
        {activeChapterId ? (
          <ChapterEditor key={activeChapterId} chapterId={activeChapterId} />
        ) : (
          <div className="q-ms-nochapter">
            <div>
              <p style={{ marginBottom: 16 }}>
                Select a chapter, or create a new one.
              </p>
              <button
                onClick={newChapter}
                disabled={creating}
                className="q-btn q-btn-primary"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Chapter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}