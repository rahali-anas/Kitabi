export { cn } from "cn"
export function blocksToPlainText(body: string): string {
  try {
    const blocks = JSON.parse(body);
    if (!Array.isArray(blocks)) return '';
    return blocks
      .map((b: any) =>
        Array.isArray(b?.content)
          ? b.content.map((c: any) => c?.text ?? '').join('')
          : '',
      )
      .filter(Boolean)
      .join('\n');
  } catch {
    return '';
  }
}