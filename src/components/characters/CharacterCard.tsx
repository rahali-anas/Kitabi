import type { Character } from '@/db/database';
import { Pencil, Trash2 } from 'lucide-react';

export function CharacterCard({
  character,
  onClick,
  onEdit,
  onDelete,
}: {
  character: Character;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = character;
  const initial = (c.name || '?').charAt(0).toUpperCase();

  return (
    <div className="q-person-row" onClick={onClick}>
      <div className="q-person-portrait">
        {c.portrait ? (
          <img src={c.portrait} alt="" />
        ) : (
          initial
        )}
      </div>

      <div className="q-person-body">
        <div className="q-person-name">{c.name || '—'}</div>
        {c.title && <div className="q-person-title">{c.title}</div>}

        <div className="q-person-meta">
          {c.race && <span>{c.race}</span>}
          {c.age && (
            <>
              <span className="sep">·</span>
              <span>{c.age}</span>
            </>
          )}
          {c.sex && (
            <>
              <span className="sep">·</span>
              <span>{c.sex}</span>
            </>
          )}
        </div>

        {c.powers && c.powers.length > 0 ? (
          <div className="q-person-powers">
            {c.powers.map((p, i) => (
              <span key={i} className="q-person-power">
                {p}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="q-person-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="q-icon-btn"
          onClick={onEdit}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          className="q-icon-btn"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}