import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Character } from '@/db/database';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { CharacterModal } from '@/components/characters/CharacterModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function Characters({ projectId }: { projectId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [filterSex, setFilterSex] = useState('all');
  const [filterRace, setFilterRace] = useState('all');

  const characters = useLiveQuery(
    () =>
      db.characters
        .where('projectId')
        .equals(projectId)
        .toArray()
        .then((rows) => rows.sort((a, b) => a.name.localeCompare(b.name))),
    [projectId]
  );

  const allRaces = useMemo(() => {
    const set = new Set<string>();
    (characters ?? []).forEach((c) => {
      if (c.race && c.race.trim()) set.add(c.race.trim());
    });
    return Array.from(set).sort();
  }, [characters]);

  const filtered = (characters ?? []).filter((c) => {
    if (filterSex !== 'all' && c.sex !== filterSex) return false;
    if (filterRace !== 'all' && c.race !== filterRace) return false;
    return true;
  });

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (c: Character) => {
    setEditing(c);
    setModalOpen(true);
  };
  const remove = async (id: string) => {
    if (!confirm('Delete character?')) return;
    await db.characters.delete(id);
  };

  const clearFilters = () => {
    setFilterSex('all');
    setFilterRace('all');
  };

  const filtersActive = filterSex !== 'all' || filterRace !== 'all';

  return (
    <div>
      <div className="q-page-head">
        <h2 className="q-page-title">
          Characters
          <span className="count">{characters?.length ?? 0}</span>
        </h2>
        <Button onClick={openNew}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Character
        </Button>
      </div>

      <div className="q-filters">
        <span className="q-filters-label">Filter</span>
        <select
          value={filterSex}
          onChange={(e) => setFilterSex(e.target.value)}
        >
          <option value="all">All sexes</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select
          value={filterRace}
          onChange={(e) => setFilterRace(e.target.value)}
        >
          <option value="all">All races</option>
          {allRaces.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button className="q-filters-clear" onClick={clearFilters}>
            Clear
          </button>
        )}
        {filtersActive && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--ink-2)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {filtered.length} of {characters?.length ?? 0}
          </span>
        )}
      </div>

      {characters && characters.length === 0 ? (
        <div
          className="q-file-row q-file-row-static"
          style={{ color: 'var(--ink-2)', fontSize: 13 }}
        >
          No characters yet. Add your first one.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="q-file-row q-file-row-static"
          style={{ color: 'var(--ink-2)', fontSize: 13 }}
        >
          No characters match this filter.
        </div>
      ) : (
        filtered.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            onClick={() => openEdit(c)}
            onEdit={() => openEdit(c)}
            onDelete={() => remove(c.id)}
          />
        ))
      )}

      <CharacterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        editing={editing}
      />
    </div>
  );
}