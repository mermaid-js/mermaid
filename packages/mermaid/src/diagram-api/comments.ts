/**
 * Remove `%%` comments from the text.
 *
 * A comment starts with `%%` and runs to the end of the line. It is removed
 * whether it starts a line (after optional whitespace) or follows code on the
 * same line, e.g. `A --> B; %% comment` (#6401). A `%%` only starts a comment
 * when it is preceded by whitespace or the start of a line, so `50%%` inside
 * text is left alone, and when it is not inside a double-quoted string, where
 * `%%` is literal label text (e.g. `A["50%% off"]`). `%%{...}%%` directives
 * are preserved.
 *
 * A comment on its own line also takes its indentation and newline with it,
 * so no blank line is left behind; a trailing comment keeps the newline, so
 * the statements on either side stay on separate lines.
 *
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  const isWhitespace = (char: string | undefined): boolean =>
    char === ' ' || char === '\t' || char === '\n' || char === '\r';

  let out = '';
  let i = 0;
  let inString = false;

  while (i < text.length) {
    const char = text[i];

    if (inString) {
      out += char;
      if (char === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      i++;
      continue;
    }

    if (char === '%' && text[i + 1] === '%') {
      // `%%{...}%%` directive: keep it whole, including any quotes inside it.
      if (text[i + 2] === '{') {
        const end = text.indexOf('}%%', i + 3);
        if (end === -1) {
          out += text.slice(i);
          break;
        }
        out += text.slice(i, end + 3);
        i = end + 3;
        continue;
      }

      // A comment starts at the beginning of a line (only whitespace before
      // it) or after whitespace. Anything else, e.g. `50%%`, is literal text.
      const prev = i === 0 ? '\n' : text[i - 1];
      if (isWhitespace(prev)) {
        let end = text.indexOf('\n', i);
        if (end === -1) {
          end = text.length;
        }
        const lineStart = out.lastIndexOf('\n') + 1;
        if (/^[\t ]*$/.test(out.slice(lineStart))) {
          // Comment on its own line: drop the indentation and the newline too.
          out = out.slice(0, lineStart);
          i = end === text.length ? end : end + 1;
        } else {
          // Trailing comment: drop the whitespace before it, keep the newline.
          out = out.replace(/[\t ]*$/, '');
          i = end;
        }
        continue;
      }
    }

    out += char;
    i++;
  }

  return out.trimStart();
};
