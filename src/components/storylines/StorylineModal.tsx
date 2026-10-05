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
import { db, type Storyline } from '@/db/database';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  editing?: Storyline | null;
}

const EMPTY = { title: '', year: '', description: '' };

export function StorylineModal({ open, onClose, projectId, editing }: Props) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        year: String(editing.year ?? ''),
        description: editing.description,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.year.trim()) {
      alert('Title and Year required.');
      return;
    }
    const data = {
      title: form.title.trim(),
      year: parseInt(form.year, 10) || 0,
      description: form.description.trim(),
      mentionedChars: [],
      projectId,
    };
    if (editing) {
      await db.storylines.update(editing.id, data);
    } else {
      await db.storylines.add({ ...data, id: crypto.randomUUID() });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="italic">
            {editing ? 'Edit Storyline' : 'Add Storyline'}
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
              Year *
            </label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? 'Update Storyline' : 'Save Storyline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}