export type Module = 'story' | 'diary' | 'journal';

export const MODULES: {
  key: Module;
  name: string;
  subtitle: string;
  newLabel: string;
}[] = [
  {
    key: 'story',
    name: 'Qisati',
    subtitle: 'Stories, worlds, characters',
    newLabel: 'New Story',
  },
  {
    key: 'diary',
    name: 'Modakirati',
    subtitle: 'Daily entries, memories',
    newLabel: 'New Diary',
  },
  {
    key: 'journal',
    name: 'Modawanati',
    subtitle: 'Notes, thoughts, ideas',
    newLabel: 'New Journal',
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
  return (
    <div className="q-book" onClick={onOpen} role="button" tabIndex={0}>
      <div className="q-book-shape">
        <div className="q-book-spine" />
        <div className="q-book-pages">
          <div className="q-book-page q-book-page-left" />
          <div className="q-book-page q-book-page-right" />
        </div>
        <div className="q-book-content">
          <div className="q-book-title">{module.name}</div>
          <div className="q-book-rule" />
          <div className="q-book-subtitle">{module.subtitle}</div>
          <div className="q-book-count">
            {count} {count === 1 ? 'project' : 'projects'}
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