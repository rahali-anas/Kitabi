import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/db/database';
import { NoteModal } from '@/components/notes/NoteModal';
import { Plus, Pin } from 'lucide-react';

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

  return (
    <div>
      <div className="q-page-head">
        <h2 className="q-page-title">
          World Notes
          <span className="count">{notes?.length ?? 0}</span>
        </h2>
        <button className="q-btn q-btn-primary" onClick={openNew}>
          <Plus className="w-3.5 h-3.5 mr-1" /> New Note
        </button>
      </div>

      <div className="q-filters">
        <span className="q-filters-label">Filter</span>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="all">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {tagFilter !== 'all' && (
          <button className="q-filters-clear" onClick={() => setTagFilter('all')}>
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="q-file-row q-file-row-static" style={{ color: 'var(--ink-2)', fontSize: 13 }}>
          {notes?.length === 0 ? 'No notes yet.' : 'No notes match this filter.'}
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => openEdit(n)}
              className="q-file-row"
            >
              <div className="q-file-body">
                <div className="q-file-title">
                  {n.title || 'Untitled Note'}
                  {n.pinned && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center' }}>
                      <Pin className="w-3 h-3 mr-1" /> PINNED
                    </span>
                  )}
                </div>
                <div className="q-file-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                  {n.body || 'No content'}
                </div>
              </div>
              <div className="q-file-meta-right">
                {timeAgo(n.updated)}
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