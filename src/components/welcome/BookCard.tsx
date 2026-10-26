import { Feather, BookOpen, PenTool } from 'lucide-react';

export type Module = 'story' | 'diary' | 'journal';

export const MODULES: {
  key: Module;
  name: string;
  subtitle: string;
  newLabel: string;
  icon: typeof Feather;
}[] = [
  {
    key: 'story',
    name: 'Qisati',
    subtitle: 'YOUR STORIES',
    newLabel: 'New Story',
    icon: Feather,
  },
  {
    key: 'diary',
    name: 'Modakirati',
    subtitle: 'YOUR DIARY',
    newLabel: 'New Diary',
    icon: BookOpen,
  },
  {
    key: 'journal',
    name: 'Difttari',
    subtitle: 'YOUR JOURNAL',
    newLabel: 'New Journal',
    icon: PenTool,
  },
];

export function BookCard({
  module,
  count,
  onOpen,
  onNew,
}: {
  module: (typeof MODULES)[number];
  count: number;
  onOpen: () => void;
  onNew: () => void;
}) {
  const Icon = module.icon;

  return (
    <div className="q-book" onClick={onOpen} role="button" tabIndex={0}>
      <div className="q-book-shape">
        <div className="q-book-spine" />
        <div className="q-book-content">
          <div className="q-book-icon">
            <Icon className="w-8 h-8" strokeWidth={1} />
          </div>
          
          <div className="q-book-title">{module.name}</div>
          <div className="q-book-rule" />
          <div className="q-book-subtitle">{module.subtitle}</div>
          <div className="q-book-count">
            {count} {count === 1 ? 'PROJECT' : 'PROJECTS'}
          </div>
        </div>
      </div>
      <button
        className="q-book-new"
        onClick={(e) => {
          e.stopPropagation();
          onNew();
        }}
      >
        + {module.newLabel}
      </button>
    </div>
  );
}