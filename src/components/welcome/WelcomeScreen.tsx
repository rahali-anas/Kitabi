import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui-q/Modal';
import { BookCard, MODULES, type Module } from './BookCard';
import { NewProjectModal } from './NewProjectModal';

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
  journal: 'Modawanati is under construction. Come back soon.',
};

export function WelcomeScreen() {
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const [openModule, setOpenModule] = useState<Module | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newModule, setNewModule] = useState<Module>('story');
  const [comingSoon, setComingSoon] = useState<Module | null>(null);

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

  return (
    <div className="q-welcome">
      <div className="q-welcome-head">
        <div className="q-welcome-brand">
          <img src="./logo1.png" alt="" />
          <span>Kitabi</span>
        </div>
        <p className="q-welcome-sub">
          A writing station for stories, diaries, and journals.
        </p>
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
                <button
                  key={p.id}
                  className="q-module-row"
                  onClick={() => setActiveProject(p.id)}
                >
                  <div className="q-module-row-name">{p.name}</div>
                  <div className="q-module-row-meta">
                    updated {timeAgo(p.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-1)',
            lineHeight: 1.6,
          }}
        >
          {comingSoon && COMING_SOON[comingSoon]}
        </p>
      </Modal>
    </div>
  );
}