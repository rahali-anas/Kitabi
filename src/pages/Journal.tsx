import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
import { db, type JournalEntry } from '@/db/database';
import { WikiLinkInline } from '@/lib/wikiBlockNote';

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikiLink: WikiLinkInline,
  },
});

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function countWords(json: string): number {
  if (!json) return 0;
  try {
    const blocks = JSON.parse(json);
    if (!Array.isArray(blocks)) return 0;
    let text = '';
    const walk = (nodes: any[]) => {
      for (const n of nodes) {
        if (!n) continue;
        if (Array.isArray(n.content)) {
          for (const inline of n.content) {
            if (typeof inline?.text === 'string') text += inline.text + ' ';
          }
        }
        if (Array.isArray(n.children)) walk(n.children);
        text += ' ';
      }
    };
    walk(blocks);
    return text.trim().split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

// ─── Single Entry Editor Component ──────────────────────────
function JournalEntryEditor({ entry }: { entry: JournalEntry }) {
  const editor = useCreateBlockNote({ schema });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const saveTimer = useRef<number | null>(null);

  // Load content
  useEffect(() => {
    if (loaded) return;
    if (entry.body) {
      try {
        const blocks = JSON.parse(entry.body);
        editor.replaceBlocks(editor.document, blocks);
        setWordCount(countWords(entry.body));
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, [entry, editor, loaded]);

  const scheduleSave = () => {
    setWordCount(countWords(JSON.stringify(editor.document)));
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const body = JSON.stringify(editor.document);
      await db.journalEntries.update(entry.id, { body, updated: Date.now() });
      setSaving(false);
    }, 600);
  };

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        const body = JSON.stringify(editor.document);
        void db.journalEntries.update(entry.id, { body, updated: Date.now() });
      }
    };
  }, [entry.id, editor]);

  return (
    <>
      <div className="q-journal-bar">
        <span className="q-journal-count">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className={`q-journal-status ${saving ? 'saving' : ''}`}>
          {saving ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <div className="q-journal-body">
        <div className="q-journal-date">
          <span className="q-journal-date-rule" />
          <span className="q-journal-date-label">{formatDate(entry.date)}</span>
          <span className="q-journal-date-rule" />
        </div>
        
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={scheduleSave}
          sideMenu={false}
        />
      </div>
    </>
  );
}

// ─── Main Journal Page ──────────────────────────────────────
export function Journal({ projectId }: { projectId: string }) {
  const today = todayKey();
  
  // Fetch all entries, newest first
  const entries = useLiveQuery(
    () => db.journalEntries.where('projectId').equals(projectId).reverse().sortBy('date'),
    [projectId]
  );

  // Ensure today's entry exists
  const [initializing, setInitializing] = useState(true);
  
  useEffect(() => {
    if (!entries) return;
    
    const ensureToday = async () => {
      const hasToday = entries.some((e) => e.date === today);
      if (!hasToday) {
        await db.journalEntries.add({
          id: crypto.randomUUID(),
          projectId,
          date: today,
          body: '',
          updated: Date.now(),
        });
      }
      setInitializing(false);
    };
    
    ensureToday();
  }, [entries, projectId, today]);

  if (!entries || initializing) {
    return <div className="q-journal" />;
  }

  return (
    <div className="q-journal">
      <div className="q-journal-feed">
        {entries.map((entry) => (
          <div key={entry.id} className="q-journal-entry-section">
            <JournalEntryEditor entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}