import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { ArrowLeft, Pencil, Trash2, Moon, Sun, Calendar as CalendarIcon } from 'lucide-react';
import { Modal } from '@/components/ui-q/Modal';
import { BookCard, MODULES, type Module } from './BookCard';
import { NewProjectModal } from './NewProjectModal';
import { WelcomeBackground } from './WelcomeBackground';
import { confirmManager } from '@/lib/confirm';

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const COMING_SOON: Record<Module, string | null> = {
  story: null,
  diary: 'Modakirati is under construction. Come back soon.',
  journal: null,
};

export function WelcomeScreen() {
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const { theme, toggleTheme } = useUIStore();
  
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  
  const [openModule, setOpenModule] = useState<Module | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newModule, setNewModule] = useState<Module>('story');
  const [comingSoon, setComingSoon] = useState<Module | null>(null);
  
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const byModule = useMemo(() => {
    const map: Record<Module, Project[]> = {
      story: [],
      diary: [],
      journal: [],
    };
    for (const p of projects ?? []) {
      const m = (p.type || 'story') as Module;
      if (map[m]) map[m].push(p);
    }
    for (const k of Object.keys(map) as Module[]) {
      map[k].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return map;
  }, [projects]);

  const openNew = (m: Module) => {
    if (COMING_SOON[m]) {
      setComingSoon(m);
      return;
    }
    setNewModule(m);
    setNewOpen(true);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await db.projects.update(renameTarget.id, { 
      name: renameValue.trim(), 
      updatedAt: Date.now() 
    });
    setRenameTarget(null);
  };

  const handleDelete = async (p: Project) => {
    const ok = await confirmManager.confirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
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
  };

  return (
    <div className="q-welcome">
      <WelcomeBackground />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* Top-right controls */}
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8, zIndex: 10 }}>
          <button
            className="q-icon-btn"
            onClick={() => alert('Calendar coming next')}
            title="Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            className="q-icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="q-welcome-head">
          <div className="q-welcome-brand">
            <img src="./logo.png" alt="" />
            <span className="q-brand-text">Kitabi</span>
          </div>
          <p className="q-welcome-sub">
            A writing station for stories, diaries, and journals.
          </p>
          {/* Diamond Ornament */}
          <div className="flex items-center gap-2 mt-6 opacity-30">
            <div className="h-[1px] w-12 bg-[var(--ink-0)]"></div>
            <div className="w-1.5 h-1.5 rotate-45 border border-[var(--ink-0)]"></div>
            <div className="h-[1px] w-12 bg-[var(--ink-0)]"></div>
          </div>
        </div>

        {!openModule && (
          <div className="q-book-grid">
            {MODULES.map((m) => (
              <BookCard
                key={m.key}
                module={m}
                count={byModule[m.key].length}
                onOpen={() => setOpenModule(m.key)}
                onNew={() => openNew(m.key)}
              />
            ))}
          </div>
        )}

        {openModule && (
          <div className="q-module-view">
            <div className="q-module-head">
              <button
                className="q-module-back"
                onClick={() => setOpenModule(null)}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All modules
              </button>
              <div className="q-module-title">
                {MODULES.find((m) => m.key === openModule)?.name}
              </div>
              <button
                className="q-btn q-btn-primary"
                onClick={() => openNew(openModule)}
              >
                + {MODULES.find((m) => m.key === openModule)?.newLabel}
              </button>
            </div>

            {byModule[openModule].length === 0 ? (
              <div className="q-module-empty">
                {COMING_SOON[openModule] ?? 'No projects yet. Start one above.'}
              </div>
            ) : (
              <div className="q-module-list">
                {byModule[openModule].map((p) => (
                  <div
                    key={p.id}
                    className="q-module-row"
                    onClick={() => setActiveProject(p.id)}
                  >
                    <div className="q-module-row-name">{p.name}</div>
                    <div className="flex items-center gap-4">
                      <div className="q-module-row-meta">
                        updated {timeAgo(p.updatedAt)}
                      </div>
                      <div className="q-module-actions">
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
                        <button
                          className="q-icon-btn text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(p);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        module={newModule}
        onCreated={(id) => {
          setNewOpen(false);
          setActiveProject(id);
        }}
      />

      <Modal
        open={comingSoon !== null}
        onClose={() => setComingSoon(null)}
        title="Coming soon"
        maxWidth={420}
        footer={
          <button
            className="q-btn q-btn-primary"
            onClick={() => setComingSoon(null)}
          >
            Close
          </button>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.6 }}>
          {comingSoon && COMING_SOON[comingSoon]}
        </p>
      </Modal>

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
    </div>
  );
}