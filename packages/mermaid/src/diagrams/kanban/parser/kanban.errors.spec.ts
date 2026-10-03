/**
 * Every rejection reports where it happened. The position leads the message because Chevrotain's
 * detail can run to several lines, and a line/column tacked on the end of that is easy to miss.
 */
import kanbanDb from '../kanbanDb.js';
import { parser as kanbanParser } from './kanban.chevrotain.js';

function messageFor(text: string): string {
  kanbanParser.yy = kanbanDb;
  kanbanDb.clear();
  try {
    kanbanParser.parse(text);
  } catch (error) {
    return (error as Error).message.split('\n')[0];
  }
  throw new Error(`expected ${JSON.stringify(text)} to be rejected`);
}

describe('kanban parse errors', () => {
  it.each([
    ['two statements on one line', 'kanban\n  a(x) b(y)\n', 'at line 2, column 7'],
    ['a blank line before the first column', 'kanban\n\n\n  root', 'at line 4, column 1'],
    ['a shape with two descriptions', 'kanban\n  a["x" y]\n', 'at line 2, column 8'],
    ['a diagram with no statements', 'kanban', 'at line 1, column 7'],
  ])('reports the position of %s', (_name, text, position) => {
    const message = messageFor(text);
    expect(message).toContain('Error parsing kanban diagram');
    expect(message).toContain(position);
    expect(message).not.toContain('NaN');
  });

  it.each([
    ['@{', 'kanban\n  root@{ icon: star\n', 'Error parsing kanban diagram at line 2, column 7'],
    ['[', 'kanban\n  root[unclosed\n', 'Error parsing kanban diagram at line 2, column 7'],
    [
      '::icon(',
      'kanban\n  root\n  ::icon(bomb',
      'Error parsing kanban diagram at line 3, column 3',
    ],
    [':::', 'kanban\n  root\n  :::', 'Error parsing kanban diagram at line 3, column 3'],
  ])('names the unclosed %s and where it was opened', (delimiter, text, prefix) => {
    expect(messageFor(text)).toBe(`${prefix}: "${delimiter}" is never closed`);
  });

  it('points at the outermost unclosed delimiter, not the innermost', () => {
    // The `"` opens inside the `@{`, but the block is the thing the author has to close.
    expect(messageFor('kanban\n  root@{ label: "unclosed\n')).toBe(
      'Error parsing kanban diagram at line 2, column 7: "@{" is never closed'
    );
  });
});
