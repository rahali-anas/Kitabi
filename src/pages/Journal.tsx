import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from '@blocknote/core';
import { db } from '@/db/database';
import { WikiLinkInline } from '@/lib/wikiBlockNote';
import { JournalDateBlock } from '@/lib/journalDateBlock';

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    journalDate: JournalDateBlock(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikiLink: WikiLinkInline,
  },
});

const JOURNAL_TITLE = '__journal__';

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function countWordsInDoc(blocks: any[]): number {
  let text = '';
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (!n) continue;
      if (n.type === 'journalDate') continue;
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
}

function migrateBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((b) => {
    const out: any = { ...b };
    if (Array.isArray(out.content)) out.content = migrateInline(out.content);
    if (Array.isArray(out.children)) out.children = migrateBlocks(out.children);
    return out;
  });
}

function migrateInline(nodes: any[]): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    if (
      node.type !== 'text' ||
      typeof node.text !== 'string' ||
      !node.text.includes('[[')
    ) {
      result.push(node);
      continue;
    }
    const re = /\[\[([^\]]+)\]\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(node.text)) !== null) {
      if (m.index > last) {
        result.push({
          type: 'text',
          text: node.text.slice(last, m.index),
          styles: node.styles || {},
        });
      }
      result.push({
        type: 'wikiLink',
        props: { target: m[1].trim(), kind: 'char' },
      });
      last = m.index + m[0].length;
    }
    if (last < node.text.length) {
      result.push({
        type: 'text',
        text: node.text.slice(last),
        styles: node.styles || {},
      });
    }
  }
  return result;
}

export function Journal({ projectId }: { projectId: string }) {
  const editor = useCreateBlockNote({ schema });
  const [rowId, setRowId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [findOpen, setFindOpen] = useState(false);
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
        editor.replaceBlocks(editor.document, migrateBlocks(blocks));
        setWordCount(countWordsInDoc(blocks));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [chapter, editor, loaded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        (e.key === 'f' || e.key === 'F')
      ) {
        e.preventDefault();
        e.stopPropagation();
        setFindOpen(true);
      } else if (e.key === 'Escape' && findOpen) {
        e.preventDefault();
        setFindOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [findOpen]);

  const scheduleSave = () => {
    if (chapter && rowId) {
      const tKey = todayKey();
      const doc = editor.document;
      const alreadyStamped = doc.some(
        (b: any) => b.type === 'journalDate' && b.props?.iso === tKey
      );
      if (!alreadyStamped) {
        // Find the first block with actual content
        const firstWithContent = doc.find((b: any) => {
          if (b.type === 'journalDate') return false;
          if (!Array.isArray(b.content)) return false;
          const text = b.content
            .map((c: any) => (typeof c.text === 'string' ? c.text : ''))
            .join('')
            .trim();
          return text !== '';
        });

        const blocksToInsert = [
          {
            type: 'journalDate' as const,
            props: { iso: tKey },
          },
        ];

        if (firstWithContent) {
          // Insert before the first content block
          editor.insertBlocks(blocksToInsert, firstWithContent, 'before');
        } else if (doc.length > 0) {
          // No content yet — insert at the very top
          editor.insertBlocks(blocksToInsert, doc[0], 'before');
        } else {
          // Empty document — just insert
          editor.insertBlocks(blocksToInsert, doc[doc.length - 1] ?? doc[0], 'after');
        }

        // Restore cursor to where the user was typing
        try {
          const cursor = editor.getTextCursorPosition();
          if (cursor?.block) {
            editor.setTextCursorPosition(cursor.block.id, 'end');
          }
        } catch {
          // ignore
        }

        void db.chapters.update(rowId, { journalDate: tKey });
      }
    }

    setWordCount(countWordsInDoc(editor.document));
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
      {findOpen && (
        <JournalFind editor={editor} onClose={() => setFindOpen(false)} />
      )}

      <div className="q-journal-bar">
        <span className="q-journal-count">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>
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

function JournalFind({
  editor,
  onClose,
}: {
  editor: ReturnType<typeof useCreateBlockNote>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<
    { from: number; to: number; blockId: string }[]
  >([]);
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 20);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrent(0);
      return;
    }
    const q = query.toLowerCase();
    const hits: { from: number; to: number; blockId: string }[] = [];
    editor.forEachBlock((block: any) => {
      const text = Array.isArray(block.content)
        ? block.content
            .map((c: any) => (typeof c.text === 'string' ? c.text : ''))
            .join('')
        : '';
      if (!text) return true;
      const lower = text.toLowerCase();
      let idx = lower.indexOf(q);
      while (idx !== -1) {
        hits.push({ from: idx, to: idx + q.length, blockId: block.id });
        idx = lower.indexOf(q, idx + q.length);
      }
      return true;
    });
    setMatches(hits);
    setCurrent(hits.length > 0 ? 0 : -1);
  }, [query, editor]);

  const goTo = (idx: number) => {
    if (matches.length === 0) return;
    const n = ((idx % matches.length) + matches.length) % matches.length;
    setCurrent(n);
    const hit = matches[n];
    try {
      editor.setTextCursorPosition(hit.blockId, 'start');
      editor.focus();
    } catch {
      // ignore
    }
  };

  return (
    <div className="q-find">
      <input
        ref={inputRef}
        className="q-find-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find in journal…"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            goTo(current + (e.shiftKey ? -1 : 1));
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <span className="q-find-count">
        {matches.length === 0
          ? query
            ? 'no matches'
            : ''
          : `${current + 1} / ${matches.length}`}
      </span>
      <button
        className="q-find-btn"
        onClick={() => goTo(current - 1)}
        disabled={matches.length === 0}
        title="Previous (Shift+Enter)"
      >
        ‹
      </button>
      <button
        className="q-find-btn"
        onClick={() => goTo(current + 1)}
        disabled={matches.length === 0}
        title="Next (Enter)"
      >
        ›
      </button>
      <button className="q-find-btn" onClick={onClose} title="Close (Esc)">
        ×
      </button>
    </div>
  );
}