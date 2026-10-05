const WIKI_RE = /\[\[([^\]]+)\]\]/g;

export type WikiToken =
  | { type: 'text'; value: string }
  | { type: 'char'; name: string; id: string }
  | { type: 'note'; name: string; id: string }
  | { type: 'broken'; name: string };

export function tokenizeWiki(
  text: string,
  chars: { id: string; name: string }[],
  notes: { id: string; title: string }[]
): WikiToken[] {
  if (!text) return [];
  const charMap = new Map(chars.map((c) => [c.name.toLowerCase(), c.id]));
  const noteMap = new Map(notes.map((n) => [n.title.toLowerCase(), n.id]));

  const tokens: WikiToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  WIKI_RE.lastIndex = 0;
  while ((m = WIKI_RE.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'text', value: text.slice(last, m.index) });
    }
    const name = m[1].trim();
    const key = name.toLowerCase();
    if (charMap.has(key)) {
      tokens.push({ type: 'char', name, id: charMap.get(key)! });
    } else if (noteMap.has(key)) {
      tokens.push({ type: 'note', name, id: noteMap.get(key)! });
    } else {
      tokens.push({ type: 'broken', name });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

export function stripWiki(text: string): string {
  return (text || '').replace(WIKI_RE, '$1');
}