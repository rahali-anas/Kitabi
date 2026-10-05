import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/db/database';
import { NoteModal } from '@/components/notes/NoteModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pin, Trash2 } from 'lucide-react';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Notes({ projectId }: { projectId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [tagFilter, setTagFilter] = useState('all');

  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  const allTags = Array.from(
    new Set((notes ?? []).flatMap((n) => n.tags ?? []))
  ).sort();

  const filtered = (notes ?? [])
    .filter((n) => tagFilter === 'all' || (n.tags ?? []).includes(tagFilter))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updated - a.updated;
    });

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    setModalOpen(true);
  };
  const togglePin = async (n: Note) => {
    await db.notes.update(n.id, { pinned: !n.pinned });
  };
  const remove = async (id: string) => {
    if (!confirm('Delete note?')) return;
    await db.notes.delete(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-border">
        <h2 className="text-xl font-semibold italic flex items-center gap-2">
          World Notes
          <span className="text-xs font-medium bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full not-italic">
            {notes?.length ?? 0}
          </span>
        </h2>
        <Button onClick={openNew}>
          <Plus className="w-3.5 h-3.5 mr-1" /> New Note
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card border border-border border-l-4 border-l-primary rounded-md px-4 py-2.5 mb-4 text-xs">
        <span className="font-semibold text-foreground">Filter:</span>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tagFilter !== 'all' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTagFilter('all')}
          >
            Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground italic text-sm">
          {notes?.length === 0
            ? 'No notes yet.'
            : 'No notes match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => openEdit(n)}
              className={`bg-card border rounded-md p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg group relative flex flex-col min-h-[130px] ${
                n.pinned ? 'border-primary' : 'border-border'
              }`}
            >
              {n.pinned && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 flex items-center justify-center text-primary">
                  <Pin className="w-3 h-3" />
                </div>
              )}
              <div className="text-[13.5px] font-semibold italic mb-1.5 pr-6">
                {n.title || 'Untitled Note'}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap flex-1">
                {n.body || ''}
              </div>
              {(n.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {n.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-[9.5px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full italic"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-[10.5px] text-muted-foreground italic mt-2.5 pt-2 border-t border-border">
                <span>{timeAgo(n.updated)}</span>
                <span>{n.body.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <div className="absolute top-2.5 right-2.5 hidden group-hover:flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(n);
                  }}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(n.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        editing={editing}
      />
    </div>
  );
}