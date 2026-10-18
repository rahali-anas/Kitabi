import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { ChapterEditor } from '@/components/manuscript/ChapterEditor';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Tab Item
function SortableTab({ c, isActive, onClick }: { c: any; isActive: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`q-ms-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="q-ms-tab-title">{c.title || 'Untitled'}</span>
    </button>
  );
}

export function Manuscript({ projectId }: { projectId: string }) {
  const { activeChapterId, setActiveChapter } = useUIStore();
  const [creating, setCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [thumbStyle, setThumbStyle] = useState({ left: 0, width: 0 });
  const [isScrollable, setIsScrollable] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).sortBy('order'),
    [projectId]
  );

  const current = useMemo(() => {
    if (!chapters) return null;
    return chapters.find((c) => c.id === activeChapterId) ?? chapters[0] ?? null;
  }, [chapters, activeChapterId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Auto scroll active tab into view
  useEffect(() => {
    if (!activeChapterId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-id="${activeChapterId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeChapterId]);

  const updateScrollbar = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    if (scrollWidth <= clientWidth) {
      setIsScrollable(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    
    setIsScrollable(true);
    const thumbWidth = (clientWidth / scrollWidth) * clientWidth;
    const thumbLeft = (scrollLeft / scrollWidth) * clientWidth;
    
    setThumbStyle({ left: thumbLeft, width: thumbWidth });
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    updateScrollbar();
    el.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);
    const observer = new ResizeObserver(updateScrollbar);
    observer.observe(el);
    
    return () => {
      el.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      observer.disconnect();
    };
  }, [chapters]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !chapters) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(chapters, oldIndex, newIndex);

    // Optimistically update the DB order
    await db.transaction('rw', db.chapters, async () => {
      for (let i = 0; i < newOrder.length; i++) {
        await db.chapters.update(newOrder[i].id, { order: i });
      }
    });
  };

  const newChapter = async () => {
    setCreating(true);
    try {
      const id = crypto.randomUUID();
      const count = chapters?.length ?? 0;
      await db.chapters.add({
        id,
        projectId,
        title: `Chapter ${count + 1}`,
        body: '',
        order: count + 1,
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

  if (!chapters) return null;

  if (chapters.length === 0) {
    return (
      <div className="q-ms-page">
        <div className="q-ms-empty-stack">
          <p style={{ marginBottom: 16 }}>No chapters yet. Begin your manuscript.</p>
          <button className="q-btn q-btn-primary" onClick={newChapter} disabled={creating}>
            <Plus className="w-4 h-4 mr-1" /> New Chapter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="q-ms-page">
      <div className="q-ms-drawer">
        {isScrollable && (
          <div className="q-ms-scrollbar-track">
            <div 
              className="q-ms-scrollbar-thumb" 
              style={{ left: `${thumbStyle.left}px`, width: `${thumbStyle.width}px` }} 
            />
          </div>
        )}
        <div className={`q-ms-tabs-wrap ${canScrollLeft ? 'can-scroll-left' : ''} ${canScrollRight ? 'can-scroll-right' : ''}`}>
          <div ref={scrollRef} className="q-ms-tabs-row">
            
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={chapters.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                {chapters.map((c) => (
                  <SortableTab
                    key={c.id}
                    c={c}
                    isActive={current?.id === c.id}
                    onClick={() => setActiveChapter(c.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              className="q-ms-tab-new"
              onClick={newChapter}
              disabled={creating}
              title="New Chapter"
            >
              + New
            </button>
          </div>
        </div>

        

        {current && (
          <div className="q-ms-sheet">
            <ChapterEditor key={current.id} chapterId={current.id} />
          </div>
        )}
      </div>
    </div>
  );
}