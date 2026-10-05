import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Storyline } from '@/db/database';
import { StorylineModal } from '@/components/storylines/StorylineModal';
import { WikiText } from '@/components/WikiText';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
  const openEdit = (s: Storyline) => {
    setEditing(s);
    setModalOpen(true);
  };
  const remove = async (id: string) => {
    if (!confirm('Delete storyline?')) return;
    await db.storylines.delete(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-border">
        <h2 className="text-xl font-semibold italic flex items-center gap-2">
          Storylines
          <span className="text-xs font-medium bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full not-italic">
            {storylines?.length ?? 0}
          </span>
        </h2>
        <Button onClick={openNew}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Storyline
        </Button>
      </div>

      {storylines && storylines.length === 0 && (
        <div className="text-center py-16 text-muted-foreground italic text-sm">
          No storylines yet. Add your first one.
        </div>
      )}

      {storylines && storylines.length > 0 && (
        <div className="relative pl-10">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary to-transparent" />
          {storylines.map((s) => {
            const expanded = expandedId === s.id;
            return (
              <div
                key={s.id}
                className="relative mb-3 group"
              >
                <div className="absolute -left-[27px] top-[18px] w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                <div
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                  className="bg-card border border-border border-l-4 border-l-primary rounded-md px-4 py-3 cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="text-[10.5px] font-bold uppercase tracking-widest text-primary">
                    {s.year || '--'}
                  </div>
                  <div className="text-base font-semibold italic mt-0.5">
                    {s.title || 'Untitled'}
                  </div>
                  {expanded && s.description && (
                    <div className="text-[12.5px] text-muted-foreground mt-2 leading-relaxed">
                      <WikiText text={s.description} projectId={projectId} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 hidden group-hover:flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(s.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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