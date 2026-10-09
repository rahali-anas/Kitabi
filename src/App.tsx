import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  type Character as CharRow,
  type Note as NoteRow,
} from '@/db/database';
import { useUIStore, type View } from '@/stores/uiStore';
import { Manuscript } from '@/pages/Manuscript';
import { Characters } from '@/pages/Characters';
import { Storylines } from '@/pages/Storylines';
import { Notes } from '@/pages/Notes';
import { Dashboard } from '@/pages/Dashboard';
import { PowerSystemPage } from '@/pages/PowerSystem';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';
import { ProjectsModal } from '@/components/welcome/ProjectsModal';
import { CharacterModal } from '@/components/characters/CharacterModal';
import { NoteModal } from '@/components/notes/NoteModal';
import { StorylineModal } from '@/components/storylines/StorylineModal';
import { SearchModal } from '@/components/search/SearchModal';
import {
  Folder,
  Moon,
  Sun,
  Search as SearchIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';

const NAV: { key: View; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'manuscript', label: 'Manuscript' },
  { key: 'characters', label: 'Characters' },
  { key: 'storylines', label: 'Storylines' },
  { key: 'notes', label: 'Notes' },
  { key: 'lore', label: 'Power System' },
];

function App() {
  const {
    view,
    setView,
    activeProjectId,
    setActiveProject,
    focusMode,
    setFocusMode,
    toggleFocusMode,
  } = useUIStore();
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Seed a project on first run
  useEffect(() => {
    if (projects && projects.length === 0) {
      db.projects.add({
        id: crypto.randomUUID(),
        name: 'My First Project',
        type: 'story',
        hasPowerSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [projects]);

  // Focus mode: body class
  useEffect(() => {
    document.body.classList.toggle('focus-mode', focusMode);
  }, [focusMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        (e.key === 'f' || e.key === 'F')
      ) {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, toggleFocusMode, setFocusMode]);

  // Cross-view wiki-link / search → modal hosts
  const [wikiChar, setWikiChar] = useState<CharRow | null>(null);
  const [wikiNote, setWikiNote] = useState<NoteRow | null>(null);
  const [wikiStoryline, setWikiStoryline] = useState<any | null>(null);

  useEffect(() => {
    const onChar = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string };
      if (!detail?.id) return;
      const row = await db.characters.get(detail.id);
      if (row) setWikiChar(row);
    };
    const onNote = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string };
      if (!detail?.id) return;
      const row = await db.notes.get(detail.id);
      if (row) setWikiNote(row);
    };
    const onStoryline = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string };
      if (!detail?.id) return;
      const row = await db.storylines.get(detail.id);
      if (row) setWikiStoryline(row);
    };
    window.addEventListener('qisati:open-character', onChar);
    window.addEventListener('qisati:open-note', onNote);
    window.addEventListener('qisati:open-storyline', onStoryline);
    return () => {
      window.removeEventListener('qisati:open-character', onChar);
      window.removeEventListener('qisati:open-note', onNote);
      window.removeEventListener('qisati:open-storyline', onStoryline);
    };
  }, []);

  if (!activeProjectId) {
    return <WelcomeScreen />;
  }

  const activeProject = projects?.find((p) => p.id === activeProjectId);
  if (!activeProject) {
    if (projects === undefined) return null;
    setActiveProject(null);
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen">
      <header className="q-topbar">
        <button
          className="q-brand"
          onClick={() => setActiveProject(null)}
          title="Back to library"
        >
          <img src="./logo.png" alt="" />
          <span>
            {activeProject.type === 'diary'
              ? 'Modakirati'
              : activeProject.type === 'journal'
                ? 'Modawanati'
                : 'Qisati'}
          </span>
        </button>

        <button
          className="q-project-btn"
          onClick={() => setProjectsOpen(true)}
          title="Switch project"
        >
          <Folder className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
          <span className="name">{activeProject.name}</span>
        </button>

        <nav className="q-nav">
          {NAV.filter(
            (n) => n.key !== 'lore' || activeProject.hasPowerSystem
          ).map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={`q-nav-btn ${view === n.key ? 'active' : ''}`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="q-topbar-right">
          <button
            className="q-icon-btn"
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+F)"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
          <button
            className="q-icon-btn"
            onClick={() => alert('Calendar coming next')}
            title="Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            className="q-icon-btn"
            onClick={() => setDark((d) => !d)}
            title="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="q-page q-fade" key={view}>
        {view === 'dashboard' && <Dashboard projectId={activeProject.id} />}
        {view === 'manuscript' && <Manuscript projectId={activeProject.id} />}
        {view === 'characters' && <Characters projectId={activeProject.id} />}
        {view === 'storylines' && <Storylines projectId={activeProject.id} />}
        {view === 'notes' && <Notes projectId={activeProject.id} />}
        {view === 'lore' && <PowerSystemPage projectId={activeProject.id} />}
      </main>

      {focusMode && (
        <button
          className="q-focus-exit"
          onClick={() => setFocusMode(false)}
        >
          Exit focus — Esc
        </button>
      )}

      <ProjectsModal
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
      />

      <CharacterModal
        open={!!wikiChar}
        onClose={() => setWikiChar(null)}
        projectId={activeProject.id}
        editing={wikiChar}
      />
      <NoteModal
        open={!!wikiNote}
        onClose={() => setWikiNote(null)}
        projectId={activeProject.id}
        editing={wikiNote}
      />
      <StorylineModal
        open={!!wikiStoryline}
        onClose={() => setWikiStoryline(null)}
        projectId={activeProject.id}
        editing={wikiStoryline}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        projectId={activeProject.id}
      />
    </div>
  );
}

export default App;