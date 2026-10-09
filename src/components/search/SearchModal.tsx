import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { blockNoteToText, matchSnippet } from '@/lib/search';
import { X, Search } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function SearchModal({ open, onClose, projectId }: Props) {
  const { setView, setActiveChapter } = useUIStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const storylines = useLiveQuery(
    () => db.storylines.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;

    const chHits: {
      id: string;
      title: string;
      snippet: { before: string; match: string; after: string };
    }[] = [];
    for (const c of chapters ?? []) {
      const text = blockNoteToText(c.body);
      const snip = matchSnippet(text, q);
      if (snip) chHits.push({ id: c.id, title: c.title || 'Untitled Chapter', snippet: snip });
    }

    const charHits: {
      id: string;
      name: string;
      sub: string;
      snippet: { before: string; match: string; after: string } | null;
    }[] = [];
    for (const c of characters ?? []) {
      const hay = [
        c.name,
        c.title,
        c.race,
        c.lore,
        (c.powers ?? []).join(' '),
      ]
        .filter(Boolean)
        .join('  ');
      const snip = matchSnippet(hay, q);
      if (snip) {
        charHits.push({
          id: c.id,
          name: c.name || '—',
          sub: c.title || c.race || '',
          snippet: snip,
        });
      }
    }

    const storyHits: {
      id: string;
      title: string;
      year: number;
      snippet: { before: string; match: string; after: string } | null;
    }[] = [];
    for (const s of storylines ?? []) {
      const hay = `${s.title} ${s.description || ''}`;
      const snip = matchSnippet(hay, q);
      if (snip) {
        storyHits.push({
          id: s.id,
          title: s.title || '—',
          year: s.year,
          snippet: snip,
        });
      }
    }

    const noteHits: {
      id: string;
      title: string;
      snippet: { before: string; match: string; after: string } | null;
    }[] = [];
    for (const n of notes ?? []) {
      const hay = `${n.title} ${n.body || ''} ${(n.tags ?? []).join(' ')}`;
      const snip = matchSnippet(hay, q);
      if (snip) {
        noteHits.push({
          id: n.id,
          title: n.title || '—',
          snippet: snip,
        });
      }
    }

    return { chHits, charHits, storyHits, noteHits };
  }, [q, chapters, characters, storylines, notes]);

  const total =
    (results?.chHits.length ?? 0) +
    (results?.charHits.length ?? 0) +
    (results?.storyHits.length ?? 0) +
    (results?.noteHits.length ?? 0);

  const openChapter = (id: string) => {
    setActiveChapter(id);
    setView('manuscript');
    onClose();
  };

  const openCharacter = async (id: string) => {
    window.dispatchEvent(
      new CustomEvent('qisati:open-character', { detail: { id } })
    );
    onClose();
  };

  const openStoryline = async (id: string) => {
    window.dispatchEvent(
      new CustomEvent('qisati:open-storyline', { detail: { id } })
    );
    onClose();
  };

  const openNote = (id: string) => {
    window.dispatchEvent(
      new CustomEvent('qisati:open-note', { detail: { id } })
    );
    onClose();
  };

  if (!open) return null;

  return (
    <div className="q-search-backdrop" onClick={onClose}>
      <div className="q-search" onClick={(e) => e.stopPropagation()}>
        <div className="q-search-head">
          <Search className="q-search-icon" />
          <input
            ref={inputRef}
            className="q-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters, characters, storylines, notes…"
          />
          <button className="q-modal-close" onClick={onClose} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {q && results && (
          <div className="q-search-body">
            {total === 0 && (
              <div className="q-search-empty">No matches for “{query}”.</div>
            )}

            {results.chHits.length > 0 && (
              <SearchGroup label={`Chapters · ${results.chHits.length}`}>
                {results.chHits.map((h) => (
                  <button
                    key={h.id}
                    className="q-search-row"
                    onClick={() => openChapter(h.id)}
                  >
                    <div className="q-search-row-title">{h.title}</div>
                    <div className="q-search-row-snippet">
                      {h.snippet.before}
                      <mark>{h.snippet.match}</mark>
                      {h.snippet.after}
                    </div>
                  </button>
                ))}
              </SearchGroup>
            )}

            {results.charHits.length > 0 && (
              <SearchGroup label={`Characters · ${results.charHits.length}`}>
                {results.charHits.map((h) => (
                  <button
                    key={h.id}
                    className="q-search-row"
                    onClick={() => openCharacter(h.id)}
                  >
                    <div className="q-search-row-title">
                      {h.name}
                      {h.sub && (
                        <span className="q-search-row-sub">{h.sub}</span>
                      )}
                    </div>
                    {h.snippet && (
                      <div className="q-search-row-snippet">
                        {h.snippet.before}
                        <mark>{h.snippet.match}</mark>
                        {h.snippet.after}
                      </div>
                    )}
                  </button>
                ))}
              </SearchGroup>
            )}

            {results.storyHits.length > 0 && (
              <SearchGroup label={`Storylines · ${results.storyHits.length}`}>
                {results.storyHits.map((h) => (
                  <button
                    key={h.id}
                    className="q-search-row"
                    onClick={() => openStoryline(h.id)}
                  >
                    <div className="q-search-row-title">
                      {h.title}
                      <span className="q-search-row-sub">{h.year}</span>
                    </div>
                    {h.snippet && (
                      <div className="q-search-row-snippet">
                        {h.snippet.before}
                        <mark>{h.snippet.match}</mark>
                        {h.snippet.after}
                      </div>
                    )}
                  </button>
                ))}
              </SearchGroup>
            )}

            {results.noteHits.length > 0 && (
              <SearchGroup label={`Notes · ${results.noteHits.length}`}>
                {results.noteHits.map((h) => (
                  <button
                    key={h.id}
                    className="q-search-row"
                    onClick={() => openNote(h.id)}
                  >
                    <div className="q-search-row-title">{h.title}</div>
                    {h.snippet && (
                      <div className="q-search-row-snippet">
                        {h.snippet.before}
                        <mark>{h.snippet.match}</mark>
                        {h.snippet.after}
                      </div>
                    )}
                  </button>
                ))}
              </SearchGroup>
            )}
          </div>
        )}

        {!q && (
          <div className="q-search-hint">
            Type to search across the current project.
          </div>
        )}
      </div>
    </div>
  );
}

function SearchGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="q-search-group">
      <div className="q-search-group-label">{label}</div>
      {children}
    </div>
  );
}