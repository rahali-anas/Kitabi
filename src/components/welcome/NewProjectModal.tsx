import { useEffect, useState } from 'react';
import { Modal, ModalField } from '@/components/ui-q/Modal';
import { db } from '@/db/database';
import type { Module } from './BookCard';

const MODULE_TITLES: Record<Module, string> = {
  story: 'New Story',
  diary: 'New Diary',
  journal: 'New Journal',
};

export function NewProjectModal({
  open,
  onClose,
  onCreated,
  module = 'story',
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  module?: Module;
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
      type: module,
      hasPowerSystem: module === 'story' ? powerSystem : false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onCreated(id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={MODULE_TITLES[module]}
      maxWidth={480}
      footer={
        <>
          <button className="q-btn q-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="q-btn q-btn-primary" onClick={create}>
            Create
          </button>
        </>
      }
    >
      <ModalField label="Project name *">
        <input
          className="q-input"
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
      </ModalField>

      {module === 'story' && (
        <ModalField label="Features">
          <label className="q-check-row">
            <input
              type="checkbox"
              checked={powerSystem}
              onChange={(e) => setPowerSystem(e.target.checked)}
            />
            <span>Enable Power System</span>
          </label>
          <p className="q-field-hint">
            You can change this later from the Projects menu.
          </p>
        </ModalField>
      )}
    </Modal>
  );
}