import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Storyline } from '@/db/database';
import { StorylineModal } from '@/components/storylines/StorylineModal';
import { WikiText } from '@/components/WikiText';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { confirmManager } from '@/lib/confirm';

export function Storylines({ projectId }: { projectId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Storyline | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind: 'char' | 'note'; id: string };
      if (detail.kind === 'char') {
        window.dispatchEvent(new CustomEvent('qisati:open-character', { detail }));
      } else if (detail.kind === 'note') {
        window.dispatchEvent(new CustomEvent('qisati:open-note', { detail }));
      }
    };
    window.addEventListener('qisati:open-wiki', handler);
    return () => window.removeEventListener('qisati:open-wiki', handler);
  }, []);

  const storylines = useLiveQuery(
    async () => {
      const rows = await db.storylines.where('projectId').equals(projectId).toArray();
      return rows.sort((a, b) => (b.year || 0) - (a.year || 0));
    },
    [projectId]
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirmManager.confirm({
      title: 'Delete Storyline',
      message: 'Are you sure you want to delete this storyline? This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await db.storylines.delete(id);
  };

  return (
    <div className="q-page">
      <div className="q-page-head">
        <h2 className="q-page-title">
          Storylines
          <span className="count">{storylines?.length ?? 0}</span>
        </h2>
        <button className="q-btn q-btn-primary" onClick={openNew}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Storyline
        </button>
      </div>

      {storylines && storylines.length === 0 && (
        <div className="q-file-row q-file-row-static" style={{ color: 'var(--ink-2)', fontSize: 13 }}>
          No storylines yet. Add your first one.
        </div>
      )}

      {storylines && storylines.length > 0 && (
        <div className="flex flex-col">
          {storylines.map((s) => {
            const expanded = expandedId === s.id;
            return (
              <div
                key={s.id}
                className="q-file-row group"
                style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }}
                onClick={() => setExpandedId(expanded ? null : s.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-baseline gap-4">
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.1em', minWidth: 40 }}>
                      {s.year || '----'}
                    </span>
                    <div className="q-file-title">{s.title || 'Untitled'}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      className="q-icon-btn text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => remove(e, s.id)}
                      title="Delete Storyline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="q-file-meta" style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
                
                {expanded && s.description && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.6 }}>
                    <WikiText text={s.description} projectId={projectId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <StorylineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        editing={editing}
      />
    </div>
  );
}