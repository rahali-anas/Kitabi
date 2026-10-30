import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Modal } from '@/components/ui-q/Modal';
import { Pencil, Trash2 } from 'lucide-react';
import type { Module } from './BookCard';
import { toast } from '@/lib/toast';
import { confirmManager } from '@/lib/confirm';

const MODULE_NAMES: Record<Module, string> = {
  story: 'Qisati',
  diary: 'Modakirati',
  journal: 'Modawanati',
};

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
  
  // Renaming state
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const sorted = (projects ?? [])
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  
  const canDelete = sorted.length > 1;

  const switchTo = async (id: string) => {
    // Update timestamp so it floats to the top next time
    await db.projects.update(id, { updatedAt: Date.now() });
    setActiveProject(id);
    onClose();
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await db.projects.update(renameTarget.id, { 
      name: renameValue.trim(), 
      updatedAt: Date.now() 
    });
    setRenameTarget(null);
  };

  const remove = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    if (!canDelete) {
      toast('Cannot delete the last project.', 'error');
      return;
    }
    const ok = await confirmManager.confirm({
      title: 'Delete Project',
      message: `Delete "${p.name}" and all its contents?`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    await db.chapters.where('projectId').equals(p.id).delete();
    await db.characters.where('projectId').equals(p.id).delete();
    await db.storylines.where('projectId').equals(p.id).delete();
    await db.notes.where('projectId').equals(p.id).delete();
    await db.powerSystems.where('projectId').equals(p.id).delete();
    await db.journalEntries.where('projectId').equals(p.id).delete();
    await db.projects.delete(p.id);

    if (activeProjectId === p.id) {
      setActiveProject(null);
      onClose();
    }
  };

  const togglePowerSystem = async (e: React.ChangeEvent<HTMLInputElement>, p: Project) => {
    e.stopPropagation();
    await db.projects.update(p.id, { hasPowerSystem: e.target.checked, updatedAt: Date.now() });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Projects"
        maxWidth={520}
      >
        <div className="q-project-list">
          {sorted.map((p) => {
            const isActive = p.id === activeProjectId;
            const moduleName = MODULE_NAMES[(p.type || 'story') as Module];
            const isStory = (p.type || 'story') === 'story';
            
            return (
              <div 
                key={p.id} 
                className={`q-project-item ${isActive ? 'active' : ''}`}
                onClick={() => !isActive && switchTo(p.id)}
              >
                <div className="q-project-info">
                  <div className="q-project-name">
                    {p.name}
                    {isActive && <span className="q-project-badge">Active</span>}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <div className="q-project-toggle">
                      {moduleName}
                    </div>
                    
                    {isStory && (
                      <label className="q-project-toggle cursor-pointer hover:text-[var(--ink-0)]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={p.hasPowerSystem}
                          onChange={(e) => togglePowerSystem(e, p)}
                          className="accent-[var(--ink-0)]"
                        />
                        <span>Power System</span>
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="q-project-actions">
                  <button
                    className="q-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget(p);
                      setRenameValue(p.name);
                    }}
                    title="Rename"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      className="q-icon-btn text-destructive"
                      onClick={(e) => remove(e, p)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Project"
        maxWidth={400}
        footer={
          <>
            <button className="q-btn q-btn-ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </button>
            <button className="q-btn q-btn-primary" onClick={handleRename}>
              Save
            </button>
          </>
        }
      >
        <div className="q-field">
          <label className="q-field-label">Project Name</label>
          <input
            className="q-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}