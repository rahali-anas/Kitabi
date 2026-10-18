import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Modal } from '@/components/ui-q/Modal';
import { Pencil, Trash2 } from 'lucide-react';
import { MODULES, type Module } from './BookCard';

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

  const sorted = (projects ?? [])
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  
  const canDelete = sorted.length > 1;

  const switchTo = (id: string) => {
    setActiveProject(id);
    onClose();
  };

  const rename = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    const next = window.prompt('Project name:', p.name);
    if (!next || !next.trim()) return;
    await db.projects.update(p.id, { name: next.trim(), updatedAt: Date.now() });
  };

  const remove = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    if (!canDelete) {
      alert('Cannot delete the last project.');
      return;
    }
    if (!confirm(`Delete "${p.name}"?`)) return;

    // Perform deletion
    await db.chapters.where('projectId').equals(p.id).delete();
    await db.characters.where('projectId').equals(p.id).delete();
    await db.storylines.where('projectId').equals(p.id).delete();
    await db.notes.where('projectId').equals(p.id).delete();
    await db.powerSystems.where('projectId').equals(p.id).delete();
    await db.projects.delete(p.id);

    // If we deleted the active project, kick back to welcome (null project)
    if (activeProjectId === p.id) {
      setActiveProject(null);
      onClose();
    }
  };

  return (
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
          
          return (
            <div 
              key={p.id} 
              className={`q-project-item ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && switchTo(p.id)}
              style={{ 
                cursor: isActive ? 'default' : 'pointer',
                background: isActive ? 'var(--paper-3)' : 'transparent',
                borderBottom: '1px solid var(--line)',
                padding: '12px 16px',
              }}
            >
              <div className="q-project-info">
                <div className="q-project-name">
                  {p.name}
                  {isActive && <span className="q-project-badge">Active</span>}
                </div>
                <div className="q-project-toggle" style={{ marginTop: 4 }}>
                  {moduleName}
                </div>
              </div>
              
              <div className="q-project-actions">
                <button
                  className="q-icon-btn"
                  onClick={(e) => rename(e, p)}
                  title="Rename"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {canDelete && (
                  <button
                    className="q-icon-btn"
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
  );
}