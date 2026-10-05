import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

type Props =
  | { kind: 'char'; id: string; label: string }
  | { kind: 'note'; id: string; label: string }
  | { kind: 'broken'; label: string };

export function WikiLink(props: Props) {
  const [hover, setHover] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {props.kind === 'broken' ? (
        <span className="italic text-[var(--text-2)] border-b border-dotted border-[var(--text-3)] cursor-help">
          {props.label}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('qisati:open-wiki', {
                detail: { kind: props.kind, id: props.id },
              })
            );
          }}
          className="italic font-medium text-[var(--accent-1)] border-b border-dotted border-[var(--accent-1)] hover:opacity-80"
        >
          {props.label}
        </button>
      )}

      {hover && props.kind === 'char' && <CharPreview id={props.id} />}
      {hover && props.kind === 'note' && <NotePreview id={props.id} />}
      {hover && props.kind === 'broken' && (
        <span className="absolute left-0 top-full mt-1 z-[60] whitespace-nowrap rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2.5 py-1.5 text-[12px] italic text-[var(--text-2)] shadow-lg">
          {props.label}
        </span>
      )}
    </span>
  );
}

function CharPreview({ id }: { id: string }) {
  const c = useLiveQuery(() => db.characters.get(id), [id]);
  if (!c) return null;
  return (
    <span className="absolute left-0 top-full mt-1 z-[60] block w-60 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] p-2.5 shadow-xl">
      <span className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--line)] bg-[var(--bg-3)] text-[var(--accent-1)] font-semibold italic">
          {c.portrait ? (
            <img src={c.portrait} alt="" className="h-full w-full object-cover" />
          ) : (
            (c.name || '?').charAt(0).toUpperCase()
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold italic">
            {c.name || '—'}
          </span>
          {c.title && (
            <span className="block truncate text-[10.5px] italic text-[var(--text-2)]">
              {c.title}
            </span>
          )}
        </span>
      </span>
      <span className="mt-1.5 block text-[11px] italic text-[var(--text-1)]">
        {c.race || '—'}
        {c.age ? ` · ${c.age}` : ''}
        {c.sex ? ` · ${c.sex}` : ''}
      </span>
    </span>
  );
}

function NotePreview({ id }: { id: string }) {
  const n = useLiveQuery(() => db.notes.get(id), [id]);
  if (!n) return null;
  return (
    <span className="absolute left-0 top-full mt-1 z-[60] block w-60 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] p-2.5 shadow-xl">
      <span className="block text-[13px] font-semibold italic">{n.title || '—'}</span>
      {(n.tags || []).length > 0 && (
        <span className="mt-1 block text-[10.5px] italic text-[var(--text-2)]">
          {n.tags.join(', ')}
        </span>
      )}
    </span>
  );
}