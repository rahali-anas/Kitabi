import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
import { db } from '@/db/database';
import { WikiLinkInline } from '@/lib/wikiBlockNote';

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikiLink: WikiLinkInline,
  },
});

const JOURNAL_TITLE = '__journal__';

export function Journal({ projectId }: { projectId: string }) {
  const editor = useCreateBlockNote({ schema });
  const [rowId, setRowId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const row = useLiveQuery(
    async () => {
      const found = await db.chapters
        .where('projectId')
        .equals(projectId)
        .filter((c) => c.title === JOURNAL_TITLE)
        .first();
      return found ?? null;
    },
    [projectId]
  );

  useEffect(() => {
    if (row === undefined) return;
    if (row) {
      setRowId(row.id);
      return;
    }
    const id = crypto.randomUUID();
    db.chapters.add({
      id,
      projectId,
      title: JOURNAL_TITLE,
      body: '',
      order: 0,
      status: 'draft',
      mentionedChars: [],
      snapshots: [],
      created: Date.now(),
      updated: Date.now(),
    });
    setRowId(id);
  }, [row, projectId]);

  const chapter = useLiveQuery(
    () => (rowId ? db.chapters.get(rowId) : undefined),
    [rowId]
  );

  useEffect(() => {
    if (!chapter || loaded) return;
    try {
      if (chapter.body) {
        const blocks = JSON.parse(chapter.body);
        editor.replaceBlocks(editor.document, blocks);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [chapter, editor, loaded]);

  const scheduleSave = () => {
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      if (!rowId) return;
      const body = JSON.stringify(editor.document);
      await db.chapters.update(rowId, { body, updated: Date.now() });
      setSaving(false);
    }, 600);
  };

  return (
    <div className="q-journal">
      <div className="q-journal-bar">
        <span className={`q-journal-status ${saving ? 'saving' : ''}`}>
          {saving ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <div className="q-journal-body">
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={scheduleSave}
          sideMenu={false}
        />
      </div>
    </div>
  );
}