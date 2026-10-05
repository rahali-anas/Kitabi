import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  type PowerSystem,
  type PowerCategory,
  type PowerEntry,
} from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

const DEFAULT_COLOR = '#7d2734';

const emptySystem = (projectId: string): PowerSystem => ({
  id: crypto.randomUUID(),
  projectId,
  systemName: '',
  systemDesc: '',
  categories: [],
  notes: [],
  updated: Date.now(),
});

export function PowerSystemPage({ projectId }: { projectId: string }) {
  const existing = useLiveQuery(
  async () => {
    const row = await db.powerSystems.where('projectId').equals(projectId).first();
    return row ?? null;
  },
  [projectId]
);

const [sys, setSys] = useState<PowerSystem | null>(null);
const [editorOpen, setEditorOpen] = useState(false);

useEffect(() => {
  if (existing === undefined) return; // still loading
  setSys(existing ?? emptySystem(projectId));
}, [existing, projectId]);

  if (!sys) {
    return (
      <div className="text-center py-16 italic text-sm text-[var(--text-2)]">
        Loading...
      </div>
    );
  }

  const isEmpty = !sys.systemName && sys.categories.length === 0;

  const save = async (next: PowerSystem) => {
    next.updated = Date.now();
    await db.powerSystems.put(next);
    setSys(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-[var(--line)]">
        <h2 className="text-xl font-semibold italic">Power System</h2>
      </div>

      {isEmpty ? (
        <div className="text-center py-20 px-5 border border-dashed border-[var(--line-2)] rounded-lg bg-[var(--bg-2)]">
          <Sparkles className="w-11 h-11 mx-auto mb-4 text-[var(--accent-1)]" />
          <h3 className="text-xl font-semibold italic mb-2">Power System</h3>
          <p className="italic text-[var(--text-2)] mb-5">—</p>
          <Button onClick={() => setEditorOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Power System Editor
          </Button>
        </div>
      ) : (
        <>
          <div
            className="flex items-start justify-between gap-4 flex-wrap mb-5 p-4 rounded-md bg-[var(--bg-2)] border border-[var(--line)]"
            style={{ borderLeft: '3px solid var(--accent-1)' }}
          >
            <div className="flex-1 min-w-[200px]">
              <div className="text-[22px] font-semibold italic mb-1">
                {sys.systemName || '—'}
                <span className="text-[var(--accent-1)]">.</span>
              </div>
              <div className="text-[12.5px] text-[var(--text-1)] leading-relaxed whitespace-pre-wrap">
                {sys.systemDesc}
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditorOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {sys.categories.map((cat) => (
            <CategoryView key={cat.id} cat={cat} />
          ))}

          {sys.notes.filter((n) => n && n.trim()).length > 0 && (
            <div className="mt-5 p-5 rounded-md bg-[var(--bg-2)] border border-[var(--line)]">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] mb-3">
                Rules / Notes
              </div>
              <ul>
                {sys.notes.filter((n) => n && n.trim()).map((n, i) => (
                  <li
                    key={i}
                    className="italic text-[12px] text-[var(--text-1)] leading-relaxed py-2 border-b border-[var(--line)] last:border-b-0 relative pl-5"
                  >
                    <span className="absolute left-0 top-2 text-[var(--accent-1)]">§</span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <PowerEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        projectId={projectId}
        initial={sys}
        onSave={(next) => {
          void save(next);
          setEditorOpen(false);
        }}
      />
    </div>
  );
}

function CategoryView({ cat }: { cat: PowerCategory }) {
  const color = cat.color || DEFAULT_COLOR;
  const entries = cat.entries || [];

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2.5 flex-wrap border-b border-[var(--line)] pb-1.5 mb-3">
        <span style={{ color }} className="text-[15px] font-semibold italic">
          {cat.name || '—'}
        </span>
        {cat.description && (
          <span className="text-[12px] text-[var(--text-2)] italic">
            — {cat.description}
          </span>
        )}
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
      >
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} color={color} />
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, color }: { entry: PowerEntry; color: string }) {
  const subs = (entry.subEntries || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div
      className="rounded-md bg-[var(--bg-2)] border border-[var(--line)] p-3.5 shadow-sm"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="text-[14px] font-semibold italic">{entry.name || '—'}</div>
      {entry.subtitle && (
        <div className="text-[11px] text-[var(--text-2)] italic mt-0.5">
          {entry.subtitle}
        </div>
      )}
      {entry.description && (
        <div className="text-[11.5px] text-[var(--text-1)] leading-relaxed mt-1.5">
          {entry.description}
        </div>
      )}
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--line)]">
          {subs.map((s, i) => (
            <span
              key={i}
              className="italic text-[10px] bg-[var(--bg-4)] px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Editor modal
// ────────────────────────────────────────────────────────────

function PowerEditorModal({
  open,
  onClose,
  projectId,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initial: PowerSystem;
  onSave: (next: PowerSystem) => void;
}) {
  const [temp, setTemp] = useState<PowerSystem>(initial);

  useEffect(() => {
    if (open) setTemp(JSON.parse(JSON.stringify(initial)));
  }, [open, initial]);

  const addCategory = () => {
    const cat: PowerCategory = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      color: DEFAULT_COLOR,
      entries: [],
    };
    setTemp((t) => ({ ...t, categories: [...t.categories, cat] }));
  };

  const removeCategory = (id: string) => {
    if (!confirm('Delete?')) return;
    setTemp((t) => ({ ...t, categories: t.categories.filter((c) => c.id !== id) }));
  };

  const updateCategory = (id: string, patch: Partial<PowerCategory>) => {
    setTemp((t) => ({
      ...t,
      categories: t.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const addEntry = (catId: string) => {
    const e: PowerEntry = {
      id: crypto.randomUUID(),
      name: '',
      subtitle: '',
      description: '',
      subEntries: '',
    };
    setTemp((t) => ({
      ...t,
      categories: t.categories.map((c) =>
        c.id === catId ? { ...c, entries: [...c.entries, e] } : c
      ),
    }));
  };

  const removeEntry = (catId: string, entryId: string) => {
    setTemp((t) => ({
      ...t,
      categories: t.categories.map((c) =>
        c.id === catId ? { ...c, entries: c.entries.filter((e) => e.id !== entryId) } : c
      ),
    }));
  };

  const updateEntry = (catId: string, entryId: string, patch: Partial<PowerEntry>) => {
    setTemp((t) => ({
      ...t,
      categories: t.categories.map((c) =>
        c.id === catId
          ? { ...c, entries: c.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) }
          : c
      ),
    }));
  };

  const save = () => {
    const clean: PowerSystem = {
      ...temp,
      systemName: temp.systemName.trim(),
      systemDesc: temp.systemDesc.trim(),
      notes: temp.notes,
      updated: Date.now(),
      projectId,
    };
    if (!clean.systemName) {
      alert('System name required.');
      return;
    }
    onSave(clean);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="italic">Power System Editor</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
              System Name *
            </label>
            <Input
              value={temp.systemName}
              onChange={(e) => setTemp((t) => ({ ...t, systemName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
              Description
            </label>
            <textarea
              className="w-full min-h-[70px] rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2 text-[12.5px] text-[var(--text-0)] focus:outline-none focus:border-[var(--accent-2)]"
              rows={3}
              value={temp.systemDesc}
              onChange={(e) => setTemp((t) => ({ ...t, systemDesc: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between mt-5 mb-3">
            <div className="text-[13px] font-bold uppercase tracking-wider">
              Categories
            </div>
            <Button size="sm" onClick={addCategory}>
              + Add Category
            </Button>
          </div>

          {temp.categories.length === 0 ? (
            <div className="text-center py-5 italic text-[12.5px] bg-[var(--bg-3)] border border-dashed border-[var(--line)] rounded-md text-[var(--text-2)]">
              —
            </div>
          ) : (
            temp.categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-md border border-[var(--line)] bg-[var(--bg-3)] p-3.5 mb-3"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider">
                    Category
                  </div>
                  <Button size="sm" variant="outline" onClick={() => removeCategory(cat.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                      Name
                    </label>
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                      Description
                    </label>
                    <Input
                      value={cat.description}
                      onChange={(e) => updateCategory(cat.id, { description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                    Accent
                  </label>
                  <div>
                    <input
                      type="color"
                      className="w-9 h-8 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                      value={cat.color || DEFAULT_COLOR}
                      onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                    ({cat.entries.length})
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => addEntry(cat.id)}>
                    + Add
                  </Button>
                </div>

                {cat.entries.length === 0 ? (
                  <div className="italic text-[12px] text-[var(--text-3)] py-1.5">—</div>
                ) : (
                  cat.entries.map((ent, i) => (
                    <div
                      key={ent.id}
                      className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3 mb-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
                          {i + 1}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeEntry(cat.id, ent.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                            Name
                          </label>
                          <Input
                            value={ent.name}
                            onChange={(e) => updateEntry(cat.id, ent.id, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                            Subtitle
                          </label>
                          <Input
                            value={ent.subtitle}
                            onChange={(e) =>
                              updateEntry(cat.id, ent.id, { subtitle: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                          Description
                        </label>
                        <Input
                          value={ent.description}
                          onChange={(e) =>
                            updateEntry(cat.id, ent.id, { description: e.target.value })
                          }
                        />
                      </div>
                      <div className="mt-2.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
                          Sub-entries (comma-separated)
                        </label>
                        <Input
                          value={ent.subEntries}
                          onChange={(e) =>
                            updateEntry(cat.id, ent.id, { subEntries: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))
          )}

          <div className="flex items-center justify-between mt-6 mb-3">
            <div className="text-[13px] font-bold uppercase tracking-wider">
              Rules / Notes
            </div>
            <Button
              size="sm"
              onClick={() => setTemp((t) => ({ ...t, notes: [...t.notes, ''] }))}
            >
              + Add Note
            </Button>
          </div>
          {temp.notes.length === 0 ? (
            <div className="text-center py-3.5 italic text-[12px] bg-[var(--bg-3)] border border-dashed border-[var(--line)] rounded-md text-[var(--text-2)]">
              —
            </div>
          ) : (
            temp.notes.map((n, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <Input
                  value={n}
                  onChange={(e) =>
                    setTemp((t) => ({
                      ...t,
                      notes: t.notes.map((x, j) => (j === i ? e.target.value : x)),
                    }))
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setTemp((t) => ({
                      ...t,
                      notes: t.notes.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-4 mt-4 border-t border-[var(--line)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!confirm('Clear System?')) return;
              onSave(emptySystem(projectId));
            }}
          >
            Clear System
          </Button>
          <Button onClick={save}>Save System</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}