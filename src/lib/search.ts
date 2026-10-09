export function blockNoteToText(body: string): string {
  if (!body) return '';
  try {
    const blocks = JSON.parse(body);
    if (!Array.isArray(blocks)) return typeof body === 'string' ? body : '';
    const parts: string[] = [];
    const walk = (nodes: any[]) => {
      for (const n of nodes) {
        if (!n) continue;
        if (Array.isArray(n.content)) {
          for (const inline of n.content) {
            if (!inline) continue;
            if (inline.type === 'text' && typeof inline.text === 'string') {
              parts.push(inline.text);
            } else if (inline.type === 'wikiLink') {
              parts.push(`[[${inline.props?.target ?? ''}]]`);
            } else if (typeof inline.text === 'string') {
              parts.push(inline.text);
            }
          }
        }
        if (Array.isArray(n.children)) walk(n.children);
        // Block boundary = space so words don't concatenate across blocks
        parts.push(' ');
      }
    };
    walk(blocks);
    return parts.join('').replace(/\s+/g, ' ').trim();
  } catch {
    return typeof body === 'string' ? body : '';
  }
}

export function matchSnippet(
  text: string,
  query: string,
  pad = 40
): { before: string; match: string; after: string } | null {
  if (!text || !query) return null;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const from = Math.max(0, idx - pad);
  const to = Math.min(text.length, idx + query.length + pad);
  return {
    before: (from > 0 ? '… ' : '') + text.slice(from, idx),
    match: text.slice(idx, idx + query.length),
    after: text.slice(idx + query.length, to) + (to < text.length ? ' …' : ''),
  };
}