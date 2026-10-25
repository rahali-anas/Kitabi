import { create } from 'zustand';

export type View =
  | 'dashboard'
  | 'manuscript'
  | 'characters'
  | 'storylines'
  | 'notes'
  | 'index'
  | 'lore';

type Theme = 'light' | 'dark';

interface UIState {
  view: View;
  activeChapterId: string | null;
  activeProjectId: string | null;
  focusMode: boolean;
  theme: Theme;
  setView: (v: View) => void;
  setActiveChapter: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useUIStore = create<UIState>((set, get) => ({
  view: 'dashboard',
  activeChapterId: null,
  activeProjectId: null,
  focusMode: false,
  theme: getInitialTheme(),
  setView: (view) => set({ view }),
  setActiveChapter: (activeChapterId) => set({ activeChapterId }),
  setActiveProject: (activeProjectId) =>
    set({
      activeProjectId,
      activeChapterId: null,
      view: 'dashboard',
      focusMode: false,
    }),
  setFocusMode: (focusMode) => set({ focusMode }),
  toggleFocusMode: () => set({ focusMode: !get().focusMode }),
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },
}));