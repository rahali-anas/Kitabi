import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Chapter } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { GripVertical } from 'lucide-react';

function wordCount(text: string) {
  if (!text) return 0;
  try {
    const blocks = JSON.parse(text);
    if (Array.isArray(blocks)) {
      const extract = (nodes: any[]): string =>
        nodes
          .map((n) => {
            const own = n.content
              ? Array.isArray(n.content)
                ? n.content.map((c: any) => c.text ?? '').join('')
                : ''
              : '';
            const kids = n.children ? extract(n.children) : '';
            return own + ' ' + kids;
          })
          .join(' ');
      return extract(blocks).trim().split(/\s+/).filter(Boolean).length;
    }
  } catch {
    // plain text
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function ChapterList({ projectId }: { projectId: string }) {
  const { activeChapterId, setActiveChapter } = useUIStore();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).sortBy('order'),
    [projectId]
  );

  if (!chapters) return null;
  if (chapters.length === 0) {
    return <div className="q-ms-empty">No chapters yet.</div>;
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingId && draggingId !== id) {
      setDragOverId(id);
    }
  };

  const onDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const list = [...chapters];
    const fromIdx = list.findIndex((c) => c.id === sourceId);
    const toIdx = list.findIndex((c) => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    await db.transaction('rw', db.chapters, async () => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].order !== i) {
          await db.chapters.update(list[i].id, { order: i });
        }
      }
    });
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div>
      {chapters.map((c: Chapter) => {
        const active = activeChapterId === c.id;
        const w = wordCount(c.body);
        const isDragging = draggingId === c.id;
        const isDragOver = dragOverId === c.id;
        return (
          <div
            key={c.id}
            draggable
            onDragStart={(e) => onDragStart(e, c.id)}
            onDragOver={(e) => onDragOver(e, c.id)}
            onDragLeave={() => {
              if (dragOverId === c.id) setDragOverId(null);
            }}
            onDrop={(e) => void onDrop(e, c.id)}
            onDragEnd={onDragEnd}
            onClick={() => setActiveChapter(c.id)}
            className={`q-ms-item ${active ? 'active' : ''} ${
              isDragging ? 'dragging' : ''
            } ${isDragOver ? 'drag-over' : ''}`}
          >
            <GripVertical className="q-ms-item-grip" />
            <div className="q-ms-item-content">
              <div className="q-ms-item-title">
                {c.title || 'Untitled Chapter'}
              </div>
              <div className="q-ms-item-meta">
                <span>{w.toLocaleString()}</span>
                <span
                  className={`q-ms-item-status q-ms-item-status-${
                    c.status || 'draft'
                  }`}
                >
                  {c.status || 'draft'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}