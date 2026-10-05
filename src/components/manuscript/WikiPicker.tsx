import { useEffect, useMemo, useRef, useState } from 'react';
import type { BlockNoteEditor } from '@blocknote/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

interface Item {
  type: 'char' | 'note';
  id: string;
  label: string;
  sub: string;
}

export interface WikiPickerState {
  open: boolean;
  items: Item[];
  selectedIndex: number;
  query: string;
  // insertion info
  rangeStart: number | null;
  rangeEnd: number | null;
}

export function WikiPicker({
  editor,
  projectId,
  state,
  onPick,
  onClose,
  onSelectionChange,
}: {
  editor: BlockNoteEditor<any, any, any>;
  projectId: string;
  state: WikiPickerState;
  onPick: (item: Item) => void;
  onClose: () => void;
  onSelectionChange: (idx: number) => void;
}) {
  const chars = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  const all = useMemo<Item[]>(() => {
    const c = (chars ?? []).map<Item>((x) => ({
      type: 'char',
      id: x.id,
      label: x.name || '—',
      sub: x.title || x.race || 'character',
    }));
    const n = (notes ?? []).map<Item>((x) => ({
      type: 'note',
      id: x.id,
      label: x.title || '—',
      sub: 'note',
    }));
    return [...c, ...n];
  }, [chars, notes]);

  const filtered = useMemo(() => {
    const q = state.query.toLowerCase();
    if (!q) return all.slice(0, 12);
    return all
      .filter((i) => i.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [all, state.query]);

  const listRef = useRef<HTMLDivElement>(null);

  // Position: near cursor
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!state.open) return;
    try {
      const view = editor.prosemirrorView;
      const from = editor.prosemirrorState.selection.from;
      const coords = view.coordsAtPos(from);
      setPos({ left: coords.left, top: coords.bottom + 6 });
    } catch {
      setPos({ left: window.innerWidth / 2 - 120, top: 200 });
    }
  }, [state.open, state.query, editor]);

  // Keep selected item in view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${state.selectedIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [state.selectedIndex, state.open]);

  // Global key handler while open
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        onSelectionChange(Math.min(state.selectedIndex + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        onSelectionChange(Math.max(state.selectedIndex - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const item = filtered[state.selectedIndex];
        if (item) onPick(item);
        else onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [state.open, state.selectedIndex, filtered, onPick, onClose, onSelectionChange]);
  if (!state.open || !pos) return null;

  // If empty query and no matches, still allow "add broken" option below
  const showAddBroken = state.query.trim().length > 0 && filtered.length === 0;

  return (
    <div
      className="q-wiki-popup"
      style={{ left: pos.left, top: pos.top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {filtered.length === 0 && !showAddBroken && (
        <div className="q-wiki-popup-empty">Type a name…</div>
      )}

      {filtered.length > 0 && (
        <div className="q-wiki-popup-list" ref={listRef}>
          {filtered.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              data-idx={i}
              className={`q-wiki-popup-item ${
                i === state.selectedIndex ? 'selected' : ''
              }`}
              onMouseEnter={() => onSelectionChange(i)}
              onClick={() => onPick(item)}
            >
              <span className="q-wiki-popup-label">{item.label}</span>
              <span className="q-wiki-popup-sub">{item.sub}</span>
            </button>
          ))}
        </div>
      )}

      {showAddBroken && (
        <button
          className={`q-wiki-popup-item ${
            state.selectedIndex === 0 ? 'selected' : ''
          }`}
          onMouseEnter={() => onSelectionChange(0)}
          onClick={() =>
            onPick({
              type: 'char',
              id: '',
              label: state.query.trim(),
              sub: 'add as new',
            })
          }
        >
          <span className="q-wiki-popup-label">[[{state.query.trim()}]]</span>
          <span className="q-wiki-popup-sub">add placeholder</span>
        </button>
      )}
    </div>
  );
}

export type { Item as WikiPickerItem };