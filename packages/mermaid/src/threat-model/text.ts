/** Wrap measured SVG text, including long URLs and Unicode, without inserting markup. */
export function wrapText(text: string, width: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = '';
    for (const token of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${token}` : token;
      if (measure(candidate) <= width) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
        current = '';
      }
      let remaining = [...token];
      while (remaining.length && measure(remaining.join('')) > width) {
        let low = 1;
        let high = remaining.length;
        while (low < high) {
          const middle = Math.ceil((low + high) / 2);
          if (measure(remaining.slice(0, middle).join('')) <= width) {
            low = middle;
          } else {
            high = middle - 1;
          }
        }
        lines.push(remaining.slice(0, low).join(''));
        remaining = remaining.slice(low);
      }
      current = remaining.join('');
    }
    if (current || !paragraph.trim()) {
      lines.push(current);
    }
  }
  return lines;
}
