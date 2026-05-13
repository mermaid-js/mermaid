/**
 * Box-drawing pre-processor for treeView diagrams.
 *
 * Converts box-drawing character input (├──, └──, │) to indent-based input
 * before Langium parsing. Supports both standard and heavy Unicode variants.
 */

// Character class regexes
const ALL_BOX_CHARS = /[─━│┃└┗├┣]/;
const BRANCH_CHAR = /[└┗├┣]/;
const DASH_CHAR = /[─━]/;
const DECORATION_ONLY = /^[\s│┃]+$/;
const METADATA_LINE = /^\s*(title[\t ]|accTitle[\t ]*:|accDescr[\t ]*[:{])/;
const COMMENT_LINE = /^\s*%%/;

const INDENT_UNIT = '    '; // 4 spaces per depth level in output

export interface PreprocessResult {
  /** The (possibly transformed) input text */
  text: string;
  /** Maps output line numbers (1-based) → original line numbers (1-based). Empty if no transformation. */
  lineMap: Map<number, number>;
}

/**
 * Detects whether any of the given lines contain box-drawing characters.
 */
export function isBoxDrawingFormat(lines: string[]): boolean {
  return lines.some((line) => ALL_BOX_CHARS.test(line));
}

/**
 * Infers the segment width (chars per depth level) by finding the first
 * branch character (├/└/┣/┗) at a column position \> 0.
 * Falls back to 4 if all branches are at column 0 or none exist.
 */
function inferSegmentWidth(contentLines: string[]): number {
  for (const line of contentLines) {
    const match = BRANCH_CHAR.exec(line);
    if (match?.index && match.index > 0) {
      return match.index;
    }
  }
  return 4;
}

/**
 * Remaps line numbers in an error message from output line numbers to original line numbers.
 */
export function remapErrorLines(message: string, lineMap: Map<number, number>): string {
  return message.replace(/\bline\s+(\d+)\b/gi, (match, lineStr: string) => {
    const line = parseInt(lineStr, 10);
    const original = lineMap.get(line);
    return original ? `line ${original}` : match;
  });
}

/**
 * Pre-processes box-drawing formatted treeView input into indent-based format.
 *
 * If the input uses box-drawing characters (├── └── │ or heavy variants ┣━━ ┗━━ ┃),
 * it is converted to indentation-based format that Langium can parse directly.
 * If the input is already indent-based, it is returned unchanged.
 *
 * @returns The transformed text and a line mapping for error remapping.
 */
export function preprocessBoxDrawing(input: string): PreprocessResult {
  const lines = input.split('\n');
  const lineMap = new Map<number, number>();

  // Find keyword line
  let keywordIdx = -1;
  for (const [i, line] of lines.entries()) {
    if (line.trim() === 'treeView-beta') {
      keywordIdx = i;
      break;
    }
  }

  if (keywordIdx === -1) {
    // No keyword found — return as-is (let Langium handle the error)
    return { text: input, lineMap };
  }

  // Collect content line texts for format detection (skip blanks, comments, metadata, decoration)
  const contentLineTexts: string[] = [];
  for (let i = keywordIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '' || COMMENT_LINE.test(line) || METADATA_LINE.test(line)) {
      continue;
    }
    if (DECORATION_ONLY.test(line)) {
      continue;
    }
    // Normalize tabs early so segment-width inference uses consistent column positions
    contentLineTexts.push(line.replace(/\t/g, '    '));
  }

  // If no box-drawing characters found → return unchanged
  if (!isBoxDrawingFormat(contentLineTexts)) {
    return { text: input, lineMap };
  }

  // Infer segment width
  const segmentWidth = inferSegmentWidth(contentLineTexts);

  // Build output
  const outputLines: string[] = [];
  let outLineNo = 0;

  // Pass through all lines up to and including keyword
  for (let i = 0; i <= keywordIdx; i++) {
    outputLines.push(lines[i]);
    outLineNo++;
    lineMap.set(outLineNo, i + 1);
  }

  // Process lines after keyword
  for (let i = keywordIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const origLineNo = i + 1;

    // Blank lines → pass through
    if (trimmed === '') {
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
      continue;
    }

    // Comments → pass through
    if (COMMENT_LINE.test(line)) {
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
      continue;
    }

    // Metadata (title, accTitle, accDescr) → pass through
    if (METADATA_LINE.test(line)) {
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
      continue;
    }

    // Decoration-only lines (│ + whitespace, no actual content) → skip
    if (DECORATION_ONLY.test(line)) {
      continue;
    }

    // Normalize tabs to spaces for consistent column-position math
    const normalized = line.replace(/\t/g, '    ');

    // Find branch character (├, └, ┣, ┗)
    const branchMatch = BRANCH_CHAR.exec(normalized);

    if (branchMatch?.index !== undefined) {
      // Has branch char → compute depth from column position
      const branchCol = branchMatch.index;
      const depth = Math.round(branchCol / segmentWidth) + 1;

      // Extract content: skip branch char, then dashes, then spaces
      let pos = branchCol + 1;
      while (pos < normalized.length && DASH_CHAR.test(normalized[pos])) {
        pos++;
      }
      while (pos < normalized.length && normalized[pos] === ' ') {
        pos++;
      }
      const content = normalized.slice(pos).trimEnd();

      if (!content) {
        throw new Error(
          `Line ${origLineNo}: Empty node — expected a filename or directory name after the box-drawing prefix`
        );
      }

      const indent = INDENT_UNIT.repeat(depth);
      outputLines.push(indent + content);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    } else if (/^[\s─━│┃└┗├┣]+$/.test(normalized)) {
      // Entire line is box-drawing decoration and whitespace — skip
      continue;
    } else if (ALL_BOX_CHARS.test(normalized)) {
      // Has box chars but no branch char — likely content containing a box char (e.g. "Section ─ A.txt")
      // Treat as root-level item
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    } else if (/^\s+/.test(normalized)) {
      // Leading whitespace without box chars in box mode → likely mixed format
      throw new Error(
        `Line ${origLineNo}: Unexpected indentation without box-drawing characters. ` +
          `In box-drawing format, use ├── or └── prefixes for indented nodes.`
      );
    } else {
      // No box chars, no leading whitespace → root-level item (depth 0)
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    }
  }

  return { text: outputLines.join('\n'), lineMap };
}
