import { create } from 'zustand';

export type View =
  | 'dashboard'
  | 'manuscript'
  | 'characters'
  | 'storylines'
  | 'notes'
  | 'lore';

interface UIState {
  view: View;
  activeChapterId: string | null;
  activeProjectId: string | null;
  focusMode: boolean;
  setView: (v: View) => void;
  setActiveChapter: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  view: 'dashboard',
  activeChapterId: null,
  activeProjectId: null,
  focusMode: false,
  setView: (view) => set({ view }),
  setActiveChapter: (activeChapterId) => set({ activeChapterId }),
  setActiveProject: (activeProjectId) =>
    set({ activeProjectId, activeChapterId: null, view: 'dashboard', focusMode: false }),
  setFocusMode: (focusMode) => set({ focusMode }),
  toggleFocusMode: () => set({ focusMode: !get().focusMode }),
}));