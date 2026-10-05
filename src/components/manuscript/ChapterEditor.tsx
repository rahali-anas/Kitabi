import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core';
import { db } from '@/db/database';
import { WikiLinkInline } from '@/lib/wikiBlockNote';
import { useUIStore } from '@/stores/uiStore';
import {
  WikiPicker,
  type WikiPickerState,
  type WikiPickerItem,
} from './WikiPicker';

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikiLink: WikiLinkInline,
  },
});

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

function wordCount(json: string) {
  if (!json) return 0;
  try {
    const blocks = JSON.parse(json);
    if (Array.isArray(blocks)) {
      const extract = (nodes: any[]): string =>
        nodes
          .map((n) => {
            const own = n.content
              ? Array.isArray(n.content)
                ? n.content.map((c: any) => c.text ?? '').join('')
                : ''
              : '';
            const kids = n.children ? extract(n.children) : '';
            return own + ' ' + kids;
          })
          .join(' ');
      return extract(blocks).trim().split(/\s+/).filter(Boolean).length;
    }
  } catch {
    // plain text
  }
  return json.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number) {
  const m = Math.max(1, Math.ceil(words / 200));
  return `~${m} min read`;
}

const EMPTY_PICKER: WikiPickerState = {
  open: false,
  items: [],
  selectedIndex: 0,
  query: '',
  rangeStart: null,
  rangeEnd: null,
};

export function ChapterEditor({ chapterId }: { chapterId: string }) {
  const chapter = useLiveQuery(() => db.chapters.get(chapterId), [chapterId]);
  const editor = useCreateBlockNote({ schema });
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const [title, setTitle] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<WikiPickerState>(EMPTY_PICKER);
  const saveTimer = useRef<number | null>(null);
  const titleRef = useRef('');

  useEffect(() => {
    if (!chapter || loaded) return;
    setTitle(chapter.title);
    titleRef.current = chapter.title;
    if (chapter.body) {
      try {
        const blocks = JSON.parse(chapter.body);
        editor.replaceBlocks(editor.document, migrateBlocks(blocks));
      } catch {
        // plain text — leave empty
      }
    }
    setLoaded(true);
  }, [chapter, editor, loaded]);


  // Wiki link click → resolve name → id → dispatch open event
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        kind: 'char' | 'note';
        id: string;
      };
      if (!detail?.id) return;
      const name = detail.id.toLowerCase();
      if (detail.kind === 'char') {
        const all = await db.characters
          .where('projectId')
          .equals(chapter?.projectId ?? '')
          .toArray();
        const match = all.find((c) => (c.name || '').toLowerCase() === name);
        if (match) {
          window.dispatchEvent(
            new CustomEvent('qisati:open-character', {
              detail: { id: match.id },
            })
          );
        }
        return;
      }
      if (detail.kind === 'note') {
        const all = await db.notes
          .where('projectId')
          .equals(chapter?.projectId ?? '')
          .toArray();
        const match = all.find((n) => (n.title || '').toLowerCase() === name);
        if (match) {
          window.dispatchEvent(
            new CustomEvent('qisati:open-note', { detail: { id: match.id } })
          );
        }
      }
    };
    window.addEventListener('qisati:open-wiki', handler);
    return () => window.removeEventListener('qisati:open-wiki', handler);
  }, [chapter?.projectId]);
  // Focus a specific block when requested (e.g. from Reminders)
    useEffect(() => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail as { blockId: string };
        if (!detail?.blockId) return;
        try {
          editor.setTextCursorPosition(detail.blockId, 'start');
          editor.focus();
        } catch {
          // block no longer exists — ignore
        }
      };
      window.addEventListener('qisati:focus-block', handler);
      return () => window.removeEventListener('qisati:focus-block', handler);
    }, [editor]);
    
  // ── Wiki picker: watch for [[ ─────────────────────────────
  useEffect(() => {
    const check = () => {
      const state = editorRef.current.prosemirrorState;
      const sel = state.selection;
      if (!sel.empty) {
        setPicker((p) => (p.open ? { ...p, open: false } : p));
        return;
      }
      const pos = sel.from;
      const $pos = state.doc.resolve(pos);
      const parent = $pos.parent;
      if (!parent.isTextblock) {
        setPicker((p) => (p.open ? { ...p, open: false } : p));
        return;
      }
      // Text of the current text block up to the cursor
      const start = $pos.start();
      const textBefore = state.doc.textBetween(start, pos, '\n', '\0');
      const idx = textBefore.lastIndexOf('[[');
      if (idx === -1) {
        setPicker((p) => (p.open ? { ...p, open: false } : p));
        return;
      }
      const query = textBefore.slice(idx + 2);
      console.log('CHECK query =', JSON.stringify(query));
      // bails
      if (query.length > 40 || query.includes(']') || query.includes('\n') || query.includes('[')) {
        setPicker((p) => (p.open ? { ...p, open: false } : p));
        return;
      }
      const rangeStart = start + idx;
      const rangeEnd = pos;
      setPicker({
        open: true,
        items: [],
        selectedIndex: 0,
        query,
        rangeStart,
        rangeEnd,
      });
    };

    const offChange = editor.onChange(check);
    const offSel = editor.onSelectionChange(check);
    return () => {
      offChange();
      offSel();
    };
  }, [editor]);

  // Intercept keys while picker open
  useEffect(() => {
    if (!picker.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)
      ) {
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [picker.open]);

  const pickItem = (item: WikiPickerItem) => {
    const ed = editorRef.current;
    const rs = picker.rangeStart;
    const re = picker.rangeEnd;
    if (rs == null || re == null) return;

    // Delete the typed "[[query"
    try {
      ed.transact((tr) => {
        tr.delete(rs, re);
      });
    } catch {
      // ignore
    }

    // Insert the wikiLink node
    ed.insertInlineContent(
      [
        {
          type: 'wikiLink',
          props: {
            target: item.label,
            kind: item.type === 'char' && !item.id ? 'broken' : item.type,
          },
        },
      ],
      { updateSelection: true }
    );

    ed.focus();
    setPicker(EMPTY_PICKER);
    scheduleSave();
  };

  const scheduleSave = (overrideTitle?: string) => {
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const body = JSON.stringify(editor.document);
      const t = overrideTitle !== undefined ? overrideTitle : titleRef.current;
      await db.chapters.update(chapterId, {
        title: t || 'Untitled Chapter',
        body,
        updated: Date.now(),
      });
      setSaving(false);
    }, 600);
  };

  const onTitleChange = (v: string) => {
    setTitle(v);
    titleRef.current = v;
    scheduleSave(v);
  };

  if (!chapter) return null;

  const words = wordCount(JSON.stringify(editor.document));

  return (
    <div className="q-ms-editor">
      <div className="q-ms-toolbar">
        <select
          className="q-ms-toolbar-select"
          value={chapter.status || 'draft'}
          onChange={async (e) => {
            await db.chapters.update(chapterId, {
              status: e.target.value as any,
            });
          }}
        >
          <option value="draft">Draft</option>
          <option value="revising">Revising</option>
          <option value="done">Done</option>
        </select>
        <button
          className="q-ms-toolbar-btn"
          onClick={() => useUIStore.getState().setFocusMode(true)}
          title="Focus mode (Ctrl+Shift+F)"
        >
          Focus
        </button>
        <span className={`q-ms-toolbar-save ${saving ? 'saving' : ''}`}>
          {saving ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <input
        className="q-ms-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled Chapter"
      />

      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => scheduleSave()}
        sideMenu={false}
      />

      <WikiPicker
        editor={editorRef.current}
        projectId={chapter.projectId}
        state={picker}
        onPick={pickItem}
        onClose={() => setPicker(EMPTY_PICKER)}
        onSelectionChange={(idx) =>
          setPicker((p) => ({ ...p, selectedIndex: idx }))
        }
      />

      <div className="q-ms-footer">
        <span />
        <span>
          {words.toLocaleString()} words · {readingTime(words)}
        </span>
      </div>
    </div>
  );
}

// helper no-op to keep the ref import used in dev
