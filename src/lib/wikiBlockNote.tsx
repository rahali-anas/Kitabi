import { createReactInlineContentSpec } from '@blocknote/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

function WikiLinkRender(props: {
  target: string;
  kind: string;
}) {
  const { target, kind } = props;

  // Live check: does a character or note with this exact name/title exist?
  const resolved = useLiveQuery(async () => {
    if (!target) return 'broken';
    const lower = target.toLowerCase();

    const charHit = await db.characters
      .filter((c) => (c.name || '').toLowerCase() === lower)
      .first();
    if (charHit) return 'char';

    const noteHit = await db.notes
      .filter((n) => (n.title || '').toLowerCase() === lower)
      .first();
    if (noteHit) return 'note';

    return 'broken';
  }, [target]);

  // Until the query resolves, render using the stored kind so there's no flash.
  const kindNow =
    resolved === undefined
      ? kind === 'broken' || kind === 'char' || kind === 'note'
        ? kind
        : 'broken'
      : resolved;

  const isBroken = kindNow === 'broken';

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBroken) return;
    window.dispatchEvent(
      new CustomEvent('qisati:open-wiki', {
        detail: { kind: kindNow, id: target },
      })
    );
  };

  if (isBroken) {
    return <span className="q-wiki-broken">[[{target}]]</span>;
  }

  return (
    <span className="q-wiki-link" onClick={onClick}>
      [[{target}]]
    </span>
  );
}

export const WikiLinkInline = createReactInlineContentSpec(
  {
    type: 'wikiLink' as const,
    propSchema: {
      target: { default: '' },
      kind: { default: 'char' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const target = props.inlineContent.props.target;
      const kind = props.inlineContent.props.kind;
      return <WikiLinkRender target={target} kind={kind} />;
    },
  }
);