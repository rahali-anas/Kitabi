import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { NewProjectModal } from './NewProjectModal';

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function WelcomeScreen() {
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const [newOpen, setNewOpen] = useState(false);

  const sorted = (projects ?? [])
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <div className="q-welcome">
      <div className="q-welcome-head">
        <div className="q-welcome-brand">
          <img src="./logo.png" alt="" />
          <span>
            <span >Qisati</span>
          </span>
        </div>
        <p className="q-welcome-sub">
          A writing station for stories, journals, and everything in between.
        </p>
      </div>

      {sorted.length > 0 && (
        <div className="q-welcome-grid q-stagger">
          {sorted.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEnter={() => setActiveProject(p.id)}
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="q-page-sub" style={{ marginBottom: 24, textAlign: 'center' }}>
          No projects yet. Begin one below.
        </div>
      )}

      <button className="q-welcome-new" onClick={() => setNewOpen(true)}>
        <Plus className="w-4 h-4" /> New Project
      </button>

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false);
          setActiveProject(id);
        }}
      />
    </div>
  );
}

function ProjectCard({
  project,
  onEnter,
}: {
  project: Project;
  onEnter: () => void;
}) {
  const counts = useLiveQuery(async () => {
    const [chapters, characters, storylines, notes] = await Promise.all([
      db.chapters.where('projectId').equals(project.id).count(),
      db.characters.where('projectId').equals(project.id).count(),
      db.storylines.where('projectId').equals(project.id).count(),
      db.notes.where('projectId').equals(project.id).count(),
    ]);
    return { chapters, characters, storylines, notes };
  }, [project.id]);

  const total = counts
    ? counts.chapters + counts.characters + counts.storylines + counts.notes
    : 0;

  return (
    <button className="q-welcome-card" onClick={onEnter}>
      <div className="name">{project.name}</div>
      <div className="meta">
        {total} items · {timeAgo(project.updatedAt)}
      </div>
      {project.hasPowerSystem && (
        <div className="tag">
          <span className="chip">Power System</span>
        </div>
      )}
    </button>
  );
}