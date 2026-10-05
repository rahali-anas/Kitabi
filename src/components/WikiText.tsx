import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { tokenizeWiki } from '@/lib/wiki';
import { WikiLink } from '@/components/WikiLink';

export function WikiText({
  text,
  projectId,
}: {
  text: string;
  projectId: string;
}) {
  const chars = useLiveQuery(
    () =>
      db.characters.where('projectId').equals(projectId).toArray().then((rows) =>
        rows.map((c) => ({ id: c.id, name: c.name }))
      ),
    [projectId]
  );
  const notes = useLiveQuery(
    () =>
      db.notes.where('projectId').equals(projectId).toArray().then((rows) =>
        rows.map((n) => ({ id: n.id, title: n.title }))
      ),
    [projectId]
  );

  if (chars === undefined || notes === undefined) {
    return <>{text}</>;
  }

  const tokens = tokenizeWiki(text, chars, notes);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === 'text') return <span key={i}>{tok.value}</span>;
        if (tok.type === 'char')
          return <WikiLink key={i} kind="char" id={tok.id} label={tok.name} />;
        if (tok.type === 'note')
          return <WikiLink key={i} kind="note" id={tok.id} label={tok.name} />;
        return <WikiLink key={i} kind="broken" label={tok.name} />;
      })}
    </>
  );
}