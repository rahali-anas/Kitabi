import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/db/database';

export function NewProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [powerSystem, setPowerSystem] = useState(true);

  useEffect(() => {
    if (open) {
      setName('');
      setPowerSystem(true);
    }
  }, [open]);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Project name required.');
      return;
    }
    const id = crypto.randomUUID();
    await db.projects.add({
      id,
      name: trimmed,
      type: 'story',
      hasPowerSystem: powerSystem,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onCreated(id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="italic">New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
              Project name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void create();
                }
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-1)]">
              Features
            </label>
            <label className="flex items-center gap-2.5 mt-1.5 px-3 py-2.5 rounded-md border border-[var(--line)] bg-[var(--bg-3)] cursor-pointer">
              <input
                type="checkbox"
                checked={powerSystem}
                onChange={(e) => setPowerSystem(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent-1)]"
              />
              <span className="text-[12.5px] italic font-semibold">
                Enable Power System
              </span>
            </label>
            <p className="text-[11px] italic text-[var(--text-2)] mt-1.5">
              You can change this later from the Projects menu.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}