import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db, type Note } from '@/db/database';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  editing?: Note | null;
}

const EMPTY = { title: '', body: '' };

export function NoteModal({ open, onClose, projectId, editing }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({ title: editing.title, body: editing.body });
      setTags(editing.tags ?? []);
    } else {
      setForm(EMPTY);
      setTags([]);
    }
    setTagInput('');
  }, [open, editing]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (!v || tags.includes(v)) return;
    setTags((t) => [...t, v]);
    setTagInput('');
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert('Title required.');
      return;
    }
    const now = Date.now();
    const data = {
      title: form.title.trim(),
      body: form.body,
      tags,
      projectId,
    };
    if (editing) {
      await db.notes.update(editing.id, { ...data, updated: now });
    } else {
      await db.notes.add({
        ...data,
        id: crypto.randomUUID(),
        pinned: false,
        created: now,
        updated: now,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="italic">
            {editing ? 'Edit Note' : 'New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tags
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type and press Enter"
              />
              <Button size="sm" variant="outline" onClick={addTag}>
                + Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-[11.5px]"
                >
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    className="text-primary hover:text-destructive ml-0.5"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Content
            </label>
            <Textarea
              rows={10}
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? 'Update Note' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}