import { useEffect, useState } from 'react';
import { MODULES, type Module } from './BookCard';

export function BookOpenOverlay({
  module,
  onDone,
}: {
  module: Module;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<'enter' | 'opening' | 'exit'>('enter');
  const meta = MODULES.find((m) => m.key === module);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('opening'), 150);
    const t2 = window.setTimeout(() => setPhase('exit'), 470);
    const t3 = window.setTimeout(onDone, 620);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="q-book-open">
      <div
        className={`q-book-open-stage ${phase}`}
      >
        <div className="q-book-open-book">
          <div className="q-book-open-spine" />
          <div className="q-book-open-cover">
            <div className="q-book-open-cover-face">
              <div className="q-book-open-title">{meta?.name}</div>
              <div className="q-book-open-sub">{meta?.subtitle}</div>
            </div>
            <div className="q-book-open-cover-back">
              <div className="q-book-open-back-text">
                <div className="q-book-open-title">{meta?.name}</div>
              </div>
            </div>
          </div>
          <div className="q-book-open-page">
            <div className="q-book-open-page-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}