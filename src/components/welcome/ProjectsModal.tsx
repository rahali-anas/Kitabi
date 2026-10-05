import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { NewProjectModal } from './NewProjectModal';

export function ProjectsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const [newOpen, setNewOpen] = useState(false);

  const sorted = (projects ?? []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const canDelete = sorted.length > 1;

  const switchTo = (id: string) => {
    setActiveProject(id);
    onClose();
  };

  const rename = async (p: Project) => {
    const next = window.prompt('Project name:', p.name);
    if (!next || !next.trim()) return;
    await db.projects.update(p.id, { name: next.trim(), updatedAt: Date.now() });
  };

  const remove = async (p: Project) => {
    if (!canDelete) {
      alert('Cannot delete the last project.');
      return;
    }
    if (!confirm(`Delete "${p.name}"?`)) return;
    await db.transaction('rw', db.projects, db.chapters, db.characters, db.storylines, db.notes, db.powerSystems, async () => {
      await db.chapters.where('projectId').equals(p.id).delete();
      await db.characters.where('projectId').equals(p.id).delete();
      await db.storylines.where('projectId').equals(p.id).delete();
      await db.notes.where('projectId').equals(p.id).delete();
      await db.powerSystems.where('projectId').equals(p.id).delete();
      await db.projects.delete(p.id);
    });
    if (activeProjectId === p.id) {
      const remaining = sorted.filter((x) => x.id !== p.id);
      setActiveProject(remaining[0]?.id ?? null);
    }
  };

  const togglePowerSystem = async (p: Project, on: boolean) => {
    await db.projects.update(p.id, { hasPowerSystem: on, updatedAt: Date.now() });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="italic">Projects</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto mb-3">
            {sorted.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-md border bg-[var(--bg-3)] ${
                    isActive ? 'border-[var(--accent-1)] bg-[var(--bg-4)]' : 'border-[var(--line)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] italic font-semibold truncate">{p.name}</div>
                    <label className="flex items-center gap-1.5 mt-1 text-[11px] italic text-[var(--text-2)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.hasPowerSystem}
                        onChange={(e) => void togglePowerSystem(p, e.target.checked)}
                        className="w-3.5 h-3.5 accent-[var(--accent-1)]"
                      />
                      Power System
                    </label>
                  </div>
                  {isActive && (
                    <span className="text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ">
                      Active
                    </span>
                  )}
                  <div className="flex gap-1">
                    {!isActive && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => switchTo(p.id)}
                        title="Switch to"
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => void rename(p)}
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => void remove(p)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            className="w-full justify-center"
            onClick={() => {
              onClose();
              setNewOpen(true);
            }}
          >
            + New Project
          </Button>
        </DialogContent>
      </Dialog>

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false);
          setActiveProject(id);
        }}
      />
    </>
  );
}