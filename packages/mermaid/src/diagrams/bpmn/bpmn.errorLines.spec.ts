import { describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';
import { parseBpmn } from './parser/bpmn.parser.js';

const FRONT_MATTER = '---\ntitle: Orders\n---\n';
const COMMENT = '%% a note\n';
const DIRECTIVE = '%%{init: {"theme": "default"}}%%\n';

const DIAGRAM = [
  'bpmn-beta LR',
  '  pool "P"',
  '    lane "L"',
  '      start s1 "S"',
  '      end e1 "E"',
];

// Each one is a statement that fails, on the line after the diagram above.
const FAILING_STATEMENTS = [
  ['a flow to an element nobody declared', '  s1 --> ghost'],
  ['an id that is declared twice', '      end s1 "Again"'],
  ['a flow with no target', '  s1 -->'],
  ['a character the lexer does not know', '  s1 --> e1 $'],
] as const;

// What comes before the diagram, and how many source lines it takes.
const PREAMBLES = [
  ['nothing', '', 0],
  ['a front matter block', FRONT_MATTER, 3],
  ['a comment', COMMENT, 1],
  ['a directive', DIRECTIVE, 1],
  ['a front matter block and a comment', FRONT_MATTER + COMMENT, 4],
  ['a front matter block and a directive', FRONT_MATTER + DIRECTIVE, 4],
] as const;

const FAILING_LINE = DIAGRAM.length + 1;

/** The line a located error names: the last `at line N, column C` of the message. */
const reportedLine = (message: string): number | undefined => {
  const lines = [...message.matchAll(/ at line (\d+), column \d+/g)];
  const last = lines.at(-1);
  return last ? Number(last[1]) : undefined;
};

const errorOf = async (text: string): Promise<string> => {
  try {
    await mermaid.parse(text);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('the text parsed without an error');
};

describe('bpmn error locations name the line of the source as written', () => {
  describe.each(FAILING_STATEMENTS)('%s', (_name, statement) => {
    it.each(PREAMBLES)('after %s', async (_preamble, text, lines) => {
      const source = `${text}${[...DIAGRAM, statement].join('\n')}\n`;

      expect(reportedLine(await errorOf(source))).toBe(FAILING_LINE + lines);
    });

    it('after a comment between two statements', async () => {
      const source = [
        DIAGRAM[0],
        '%% between the statements',
        ...DIAGRAM.slice(1),
        statement,
        '',
      ].join('\n');

      expect(reportedLine(await errorOf(source))).toBe(FAILING_LINE + 1);
    });
  });

  it('counts a front matter block that is not followed by a comment', async () => {
    const source = `${FRONT_MATTER}${[...DIAGRAM, '  s1 --> ghost'].join('\n')}\n`;

    expect(await errorOf(source)).toContain(`at line ${FAILING_LINE + 3}, column 3`);
  });
});

describe('parseBpmn given the lines that were removed in front of its input', () => {
  // Core always ends the text with a newline, so only a direct call can end it in the middle of a statement.
  const ENDS_TOO_EARLY = 'bpmn-beta LR\n  user';
  const messageOf = (precedingLines: number): string => {
    try {
      parseBpmn(ENDS_TOO_EARLY, precedingLines);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    throw new Error('the text parsed without an error');
  };

  it('places an error at the end of the input after them', () => {
    expect(reportedLine(messageOf(3))).toBe(reportedLine(messageOf(0))! + 3);
  });
});
