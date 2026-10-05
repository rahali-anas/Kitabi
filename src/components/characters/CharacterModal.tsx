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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db, type Character } from '@/db/database';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  editing?: Character | null;
}

const EMPTY = {
  name: '',
  title: '',
  age: '',
  sex: '',
  race: '',
  lore: '',
  portrait: '',
};

export function CharacterModal({ open, onClose, projectId, editing }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [powers, setPowers] = useState<string[]>([]);
  const [powerInput, setPowerInput] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        title: editing.title,
        age: editing.age,
        sex: editing.sex,
        race: editing.race,
        lore: editing.lore,
        portrait: editing.portrait,
      });
      setPowers(editing.powers ?? []);
    } else {
      setForm(EMPTY);
      setPowers([]);
    }
    setPowerInput('');
  }, [open, editing]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addPower = () => {
    const v = powerInput.trim();
    if (!v || powers.includes(v)) return;
    setPowers((p) => [...p, v]);
    setPowerInput('');
  };

  const save = async () => {
    if (!form.name.trim() || !form.race.trim() || !form.sex) {
      alert('Fill Name, Race, Sex.');
      return;
    }
    const data = {
      ...form,
      name: form.name.trim(),
      race: form.race.trim(),
      powers,
      projectId,
    };
    if (editing) {
      await db.characters.update(editing.id, data);
    } else {
      await db.characters.add({
        ...data,
        id: crypto.randomUUID(),
        relations: [],
      });
    }
    onClose();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('portrait', String(ev.target?.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="italic">
            {editing ? 'Edit Character' : 'Add Character'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Portrait
            </label>
            <div className="flex gap-3 mt-1">
              <div className="w-20 h-20 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden text-xs text-muted-foreground italic">
                {form.portrait ? (
                  <img
                    src={form.portrait}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  'no image'
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    document.getElementById('char-portrait-input')?.click()
                  }
                >
                  Choose Image
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => set('portrait', '')}
                >
                  Clear
                </Button>
                <input
                  id="char-portrait-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Title / Nickname
            </label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Age
              </label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sex *
              </label>
              <Select value={form.sex} onValueChange={(v) => set('sex', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Race *
            </label>
            <Input
              value={form.race}
              onChange={(e) => set('race', e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Powers / Abilities
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                value={powerInput}
                onChange={(e) => setPowerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPower();
                  }
                }}
                placeholder="Type and press Enter"
              />
              <Button size="sm" variant="outline" onClick={addPower}>
                + Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {powers.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-[11.5px]"
                >
                  {p}
                  <button
                    onClick={() =>
                      setPowers(powers.filter((_, j) => j !== i))
                    }
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
              Lore / Background
            </label>
            <Textarea
              rows={4}
              value={form.lore}
              onChange={(e) => set('lore', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? 'Update Character' : 'Save Character'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}