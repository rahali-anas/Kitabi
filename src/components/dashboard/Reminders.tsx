import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { AlertCircle } from 'lucide-react';

interface BrokenLink {
  chapterId: string;
  chapterTitle: string;
  blockId: string | null;
  name: string;
  snippet: string;
}

function blockText(block: any): string {
  if (!block) return '';
  if (typeof block === 'string') return block;
  if (block.type === 'text' && typeof block.text === 'string') return block.text;
  if (block.type === 'wikiLink') return `[[${block.props?.target ?? ''}]]`;
  return '';
}

function inlineToText(inline: any[]): string {
  if (!Array.isArray(inline)) return '';
  return inline.map(blockText).join('');
}

function walkBlocks(blocks: any[], visit: (b: any, text: string) => void) {
  if (!Array.isArray(blocks)) return;
  for (const b of blocks) {
    const text = Array.isArray(b.content) ? inlineToText(b.content) : '';
    visit(b, text);
    if (Array.isArray(b.children)) walkBlocks(b.children, visit);
  }
}

function snippetAround(text: string, matchStart: number, matchLen: number): string {
  const pad = 32;
  const from = Math.max(0, matchStart - pad);
  const to = Math.min(text.length, matchStart + matchLen + pad);
  const before = from > 0 ? '…' : '';
  const after = to < text.length ? '…' : '';
  return before + text.slice(from, to).trim() + after;
}

export function Reminders({ projectId }: { projectId: string }) {
  const { setActiveChapter, setView } = useUIStore();

  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).toArray(),
    [projectId]
  );

  if (!chapters || !characters || !notes) return null;

  const charNames = new Set(
    characters.map((c) => (c.name || '').toLowerCase()).filter(Boolean)
  );
  const noteTitles = new Set(
    notes.map((n) => (n.title || '').toLowerCase()).filter(Boolean)
  );

  const broken: BrokenLink[] = [];
  for (const ch of chapters) {
    if (!ch.body) continue;
    let blocks: any[] = [];
    try {
      blocks = JSON.parse(ch.body);
    } catch {
      continue;
    }
    walkBlocks(blocks, (b, text) => {
      if (!text) return;
      const re = /\[\[([^\]]+)\]\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const name = m[1].trim();
        const key = name.toLowerCase();
        if (!charNames.has(key) && !noteTitles.has(key)) {
          broken.push({
            chapterId: ch.id,
            chapterTitle: ch.title || 'Untitled Chapter',
            blockId: typeof b.id === 'string' ? b.id : null,
            name,
            snippet: snippetAround(text, m.index, m[0].length),
          });
        }
      }
    });
  }

  const openChapterAt = (chapterId: string, blockId: string | null) => {
    setActiveChapter(chapterId);
    setView('manuscript');
    if (blockId) {
      // Wait a tick so ChapterEditor mounts and the editor is ready.
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('qisati:focus-block', { detail: { blockId } })
        );
      }, 80);
    }
  };

  return (
    <div className="q-files-section">
      <div className="q-files-head">
        <span className="q-files-head-label">Reminders</span>
        <span className="q-files-head-meta">
          {broken.length === 0 ? 'all clear' : `${broken.length} item${broken.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {broken.length === 0 ? (
        <div
          className="q-file-row q-file-row-static"
          style={{ color: 'var(--ink-3)', fontSize: 12.5, fontStyle: 'italic' }}
        >
          Nothing needs attention.
        </div>
      ) : (
        broken.map((b, i) => (
          <button
            key={`${b.chapterId}-${b.blockId}-${i}`}
            className="q-file-row"
            onClick={() => openChapterAt(b.chapterId, b.blockId)}
          >
            <AlertCircle className="q-file-icon" />
            <div className="q-file-body">
              <div className="q-file-title">
                <span className="q-reminder-name">[[{b.name}]]</span>{' '}
                <span className="q-reminder-where">— {b.chapterTitle}</span>
              </div>
              <div className="q-file-meta">{b.snippet}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}