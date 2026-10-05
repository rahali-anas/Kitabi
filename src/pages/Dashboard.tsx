import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Reminders } from '@/components/dashboard/Reminders';
import {
  BookOpen,
  User,
  GitBranch,
  FileText,
  ArrowRight,
} from 'lucide-react';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function wordCount(text: string) {
  if (!text) return 0;
  try {
    const blocks = JSON.parse(text);
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
    // plain text fallback
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number) {
  const m = Math.max(1, Math.ceil(words / 200));
  return `~${m} min`;
}

export function Dashboard({ projectId }: { projectId: string }) {
  const { setView, setActiveChapter } = useUIStore();

  const chapters = useLiveQuery(
    () => db.chapters.where('projectId').equals(projectId).toArray(),
    [projectId]
  );
  const characters = useLiveQuery(
    () => db.characters.where('projectId').equals(projectId).count(),
    [projectId]
  );
  const storylines = useLiveQuery(
    () => db.storylines.where('projectId').equals(projectId).count(),
    [projectId]
  );
  const notes = useLiveQuery(
    () => db.notes.where('projectId').equals(projectId).count(),
    [projectId]
  );

  const sorted = (chapters ?? []).slice().sort((a, b) => b.updated - a.updated);
  const latest = sorted[0];
  const recent = sorted.slice(0, 6);

  const totalWords = (chapters ?? []).reduce(
    (sum, c) => sum + wordCount(c.body),
    0
  );

  const openChapter = (id: string) => {
    setActiveChapter(id);
    setView('manuscript');
  };

  const continueWriting = async () => {
    if (latest) return openChapter(latest.id);
    const id = crypto.randomUUID();
    await db.chapters.add({
      id,
      projectId,
      title: 'Chapter 1',
      body: '',
      order: 1,
      status: 'draft',
      mentionedChars: [],
      snapshots: [],
      created: Date.now(),
      updated: Date.now(),
    });
    openChapter(id);
  };

  return (
    <div>
      {/* ── Continue Writing ────────────────────────── */}
      <div className="q-files-section">
        <div className="q-files-head">
          <span className="q-files-head-label">Continue Writing</span>
        </div>
        <div className="q-continue">
          <div className="q-continue-info">
            {latest ? (
              <>
                <div className="q-continue-title">
                  {latest.title || 'Untitled Chapter'}
                </div>
                <div className="q-continue-meta">
                  {wordCount(latest.body)} words · {readingTime(wordCount(latest.body))} read · {timeAgo(latest.updated)}
                </div>
              </>
            ) : (
              <>
                <div className="q-continue-title">No chapters yet</div>
                <div className="q-continue-meta">
                  Create your first chapter to begin.
                </div>
              </>
            )}
          </div>
          <Button onClick={continueWriting}>
            {latest ? 'Continue' : 'Start'}{' '}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
     {/* ── Reminders ───────────────────────────────── */}
      <Reminders projectId={projectId} />

      {/* ── Stats ───────────────────────────────────── */}
      <div className="q-files-section">
        <div className="q-files-head">
          <span className="q-files-head-label">Overview</span>
        </div>
        <div className="q-stats">
          <div
            className="q-stat q-stat-clickable"
            onClick={() => setView('manuscript')}
          >
            <div className="q-stat-label">
              <BookOpen className="w-3 h-3" /> Chapters
            </div>
            <div className="q-stat-value">{chapters?.length ?? 0}</div>
          </div>
          <div className="q-stat">
            <div className="q-stat-label">
              <FileText className="w-3 h-3" /> Words
            </div>
            <div className="q-stat-value">{totalWords.toLocaleString()}</div>
            <div className="q-stat-value-sub">{readingTime(totalWords)} read</div>
          </div>
          <div
            className="q-stat q-stat-clickable"
            onClick={() => setView('characters')}
          >
            <div className="q-stat-label">
              <User className="w-3 h-3" /> Characters
            </div>
            <div className="q-stat-value">{characters ?? 0}</div>
          </div>
          <div
            className="q-stat q-stat-clickable"
            onClick={() => setView('storylines')}
          >
            <div className="q-stat-label">
              <GitBranch className="w-3 h-3" /> Storylines
            </div>
            <div className="q-stat-value">{storylines ?? 0}</div>
          </div>
        </div>
      </div>

      {/* ── Recent Chapters ─────────────────────────── */}
      <div className="q-files-section">
        <div className="q-files-head">
          <span className="q-files-head-label">Recent Chapters</span>
          <button
            onClick={() => setView('manuscript')}
            className="q-files-head-meta"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            View all →
          </button>
        </div>
        {recent.length === 0 ? (
          <div
            className="q-file-row q-file-row-static"
            style={{ color: 'var(--ink-2)', fontSize: 13 }}
          >
            No chapters yet.
          </div>
        ) : (
          recent.map((c) => {
            const w = wordCount(c.body);
            return (
              <button
                key={c.id}
                className="q-file-row"
                onClick={() => openChapter(c.id)}
              >
                <BookOpen className="q-file-icon" />
                <div className="q-file-body">
                  <div className="q-file-title">
                    {c.title || 'Untitled Chapter'}
                  </div>
                  <div className="q-file-meta">
                    {timeAgo(c.updated)} · {readingTime(w)} read
                  </div>
                </div>
                <span className="q-file-meta-right">
                  {w.toLocaleString()} words
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* ── Quick Jump ──────────────────────────────── */}
      <div className="q-files-section">
        <div className="q-files-head">
          <span className="q-files-head-label">Quick Jump</span>
        </div>
        <JumpRow
          icon={<BookOpen className="q-file-icon" />}
          label="Manuscript"
          count={chapters?.length ?? 0}
          onClick={() => setView('manuscript')}
        />
        <JumpRow
          icon={<User className="q-file-icon" />}
          label="Characters"
          count={characters ?? 0}
          onClick={() => setView('characters')}
        />
        <JumpRow
          icon={<GitBranch className="q-file-icon" />}
          label="Storylines"
          count={storylines ?? 0}
          onClick={() => setView('storylines')}
        />
        <JumpRow
          icon={<FileText className="q-file-icon" />}
          label="Notes"
          count={notes ?? 0}
          onClick={() => setView('notes')}
        />
      </div>
    </div>
  );
}

function JumpRow({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button className="q-file-row" onClick={onClick}>
      {icon}
      <div className="q-file-body">
        <div className="q-file-title">{label}</div>
      </div>
      <span className="q-file-count">{count}</span>
    </button>
  );
}