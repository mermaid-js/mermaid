/**
 * Remove `%%` comments from the text.
 *
 * A comment starts with `%%` and runs to the end of the line. It is removed
 * whether it starts a line (after optional whitespace) or follows code on the
 * same line, e.g. `A --> B; %% comment` (#6401). A `%%` only starts a comment
 * when it is preceded by whitespace or the start of a line, so `50%%` inside
 * text is left alone, and when it is not inside a double-quoted string, where
 * `%%` is literal label text (e.g. `A["50%% off"]`). `%%{...}%%` directives
 * are preserved, but only when the `%%{` has the same preceding boundary —
 * without one, e.g. `A[50%%{off]`, it is literal text and scanning continues
 * past it instead of swallowing the rest of the diagram.
 *
 * A double-quoted string protects `%%` only as far as its diagram type's
 * grammar lets quoted text run: in diagrams whose lexers accept newlines
 * inside a quoted string (flowchart, class, C4, block, quadrant, requirement,
 * xychart, agentflow) the protection spans lines, while in every other type
 * it ends at the line, so a stray quote such as `6"` in a sequence message
 * cannot stop comment removal on later lines. State diagrams are the one
 * exception to that split: only a state description (`state "..."`, whose
 * lexer accepts newlines) spans lines, while any other quote in a state
 * diagram is line-scoped.
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
  // Whether the string currently open may span lines. Set when the quote
  // opens; a state description is the only line-scoped-diagram string that
  // may span lines, and only when the quote opens it.
  let stringSpansLines = false;
  const multilineStrings = allowsMultilineStrings(text);
  const stateDiagram = isStateDiagram(text);

  while (i < text.length) {
    const char = text[i];

    if (inString) {
      out += char;
      if (char === '"') {
        inString = false;
      } else if (char === '\n' && !stringSpansLines) {
        // The diagram's grammar ends message text at the line, so the quote
        // does not protect anything past it.
        inString = false;
      }
      i++;
      continue;
    }

    if (char === '"') {
      inString = true;
      stringSpansLines = multilineStrings || (stateDiagram && opensStateDescription(out));
      out += char;
      i++;
      continue;
    }

    if (char === '%' && text[i + 1] === '%') {
      // A `%%` only starts a comment or a directive when it is preceded by
      // whitespace or the start of a line. Anything else, e.g. `50%%` or
      // `50%%{off]`, is literal text.
      const prev = i === 0 ? '\n' : text[i - 1];

      // `%%{...}%%` directive: keep it whole, including any quotes inside it.
      if (text[i + 2] === '{' && isWhitespace(prev)) {
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

/**
 * Diagram declarations whose grammars let a double-quoted string span lines:
 * their lexers accept any character except `"` inside a quoted string,
 * newlines included. Every other diagram type ends message text at the line.
 */
const MULTILINE_STRING_DECLARATION =
  /^(graph|flowchart|classDiagram|C4(?:Context|Container|Component|Dynamic|Deployment)|block(?:-beta)?|quadrantChart|requirement(?:Diagram)?|xychart(?:-beta)?|agentflow-beta)\b/;

const STATE_DIAGRAM_DECLARATION = /^stateDiagram(-v2)?\b/;

/**
 * The diagram's declaration line: the first line that is not blank and not
 * itself a `%%` comment or directive. '' when there is none.
 */
const getDeclarationLine = (text: string): string => {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('%%')) {
      continue;
    }
    return trimmed;
  }
  return '';
};

/**
 * Whether the diagram in `text` allows a double-quoted string to span lines,
 * decided from its declaration line.
 */
const allowsMultilineStrings = (text: string): boolean =>
  MULTILINE_STRING_DECLARATION.test(getDeclarationLine(text));

const isStateDiagram = (text: string): boolean =>
  STATE_DIAGRAM_DECLARATION.test(getDeclarationLine(text));

/**
 * Whether the quote about to open starts a state description: the text
 * already emitted on this line is just the `state` keyword (at the start of
 * the line or after a `;` separator) followed by whitespace. Any other quote
 * in a state diagram — a stray quote in a transition description, a click or
 * href string — is line-scoped.
 */
const opensStateDescription = (out: string): boolean =>
  /(^|;)\s*state\s+$/.test(out.slice(out.lastIndexOf('\n') + 1));
