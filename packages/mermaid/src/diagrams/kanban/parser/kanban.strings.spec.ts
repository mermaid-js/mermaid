/**
 * Description strings: the three forms a node label can take, and what each one lets through.
 *
 * These are the reason the lexer has `string` and `markdown_string` modes at all — inside them the
 * shape's own delimiters stop being delimiters, so a label can contain `[`, `]`, `(` and `)`. The
 * modes are also the only place a label may span lines. Everything here is behaviour inherited
 * from the JISON grammar; nothing about it is new.
 */
import kanbanDb from '../kanbanDb.js';
import { parser as kanbanParser } from './kanban.chevrotain.js';

function labelOf(text: string): string | undefined {
  kanbanParser.yy = kanbanDb;
  kanbanDb.clear();
  kanbanParser.parse(text);
  return kanbanDb.getSections()[0]?.label;
}

function idOf(text: string): string | undefined {
  kanbanParser.yy = kanbanDb;
  kanbanDb.clear();
  kanbanParser.parse(text);
  return kanbanDb.getSections()[0]?.id;
}

describe('kanban description strings', () => {
  describe('markdown strings', () => {
    it.each([
      ['in a rect', 'kanban\n  docs["`**Create** Documentation`"]\n'],
      ['in a rounded shape', 'kanban\n  docs("`**Create** Documentation`")\n'],
      ['in a circle', 'kanban\n  docs(("`**Create** Documentation`"))\n'],
    ])('keeps the markup verbatim %s', (_name, text) => {
      expect(labelOf(text)).toBe('**Create** Documentation');
    });

    it('uses the markup as the id when the shape has none', () => {
      // `["`…`"]` with no id in front: the db falls back to the description, markup included.
      const text = 'kanban\n  ["`**Create** Documentation`"]\n';
      expect(idOf(text)).toBe('**Create** Documentation');
      expect(labelOf(text)).toBe('**Create** Documentation');
    });

    it('lets the label contain the shape delimiters', () => {
      // The point of the mode: inside it, `]` does not close the shape.
      expect(labelOf('kanban\n  docs["`a [b] (c) d`"]\n')).toBe('a [b] (c) d');
    });

    it('lets the label span lines', () => {
      expect(labelOf('kanban\n  docs["`line one\n  line two`"]\n')).toBe('line one\n  line two');
    });

    it('rejects an empty markdown string', () => {
      // Opening and closing with nothing between emits no description token, and the grammar
      // requires exactly one — as the JISON grammar did.
      expect(() => labelOf('kanban\n  docs["``"]\n')).toThrow(/Error parsing kanban diagram/);
    });

    it('rejects an unterminated markdown string', () => {
      expect(() => labelOf('kanban\n  docs["`never closed\n')).toThrow(
        'Error parsing kanban diagram at line 2, column 7: "[" is never closed'
      );
    });
  });

  describe('quoted strings', () => {
    it('keeps the text verbatim, without treating it as markdown', () => {
      expect(labelOf('kanban\n  docs["**Create** Documentation"]\n')).toBe(
        '**Create** Documentation'
      );
    });

    it('lets the label contain the shape delimiters', () => {
      expect(labelOf('kanban\n  root["String containing []"]\n')).toBe('String containing []');
      expect(labelOf('kanban\n  root["String containing ()"]\n')).toBe('String containing ()');
    });

    it('rejects a second description after the closing quote', () => {
      // `["x" y]` lexes as two description tokens, and the grammar takes exactly one.
      expect(() => labelOf('kanban\n  a["x" y]\n')).toThrow(/Error parsing kanban diagram/);
    });
  });

  describe('unquoted descriptions', () => {
    it('keeps an apostrophe', () => {
      expect(labelOf("kanban\n  id12[Can't reproduce]\n")).toBe("Can't reproduce");
    });

    it('stops at the closing delimiter', () => {
      expect(labelOf('kanban\n  a(rounded)\n')).toBe('rounded');
    });
  });
});
