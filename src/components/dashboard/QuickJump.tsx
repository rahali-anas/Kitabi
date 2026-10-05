import { useUIStore } from '@/stores/uiStore';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Users,
  GitBranch,
  StickyNote,
  Sparkles,
} from 'lucide-react';

const items = [
  { view: 'manuscript' as const, label: 'Manuscript', icon: BookOpen },
  { view: 'characters' as const, label: 'Characters', icon: Users },
  { view: 'storylines' as const, label: 'Storylines', icon: GitBranch },
  { view: 'notes' as const, label: 'Notes', icon: StickyNote },
  { view: 'lore' as const, label: 'Power System', icon: Sparkles },
];

interface Props {
  hasPowerSystem: boolean;
}

export function QuickJump({ hasPowerSystem }: Props) {
  const setView = useUIStore((s) => s.setView);
  const list = hasPowerSystem
    ? items
    : items.filter((i) => i.view !== 'lore');

  return (
    <Card className="p-5">
      <div className="mb-3 text-xs italic tracking-wide text-[var(--text-2)]">
        Quick jump
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2 text-left text-sm text-[var(--text-1)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}