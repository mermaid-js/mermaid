/**
 * Pins what the parser produces for every fixture.
 *
 * The snapshot was generated while the legacy jison grammar was still in the tree and every entry
 * had been asserted, input by input, to produce byte-identical db state on both engines. It is
 * therefore a record of the legacy behaviour, and the reason these fixtures outlive the parser they were
 * built to check.
 *
 * Each entry is serialised as compact text rather than a nested object dump so that a diff is
 * readable: a reviewer should be able to see the board a change produced, not decode it. Fields
 * are omitted when unset, so an appearing key is a real change rather than noise.
 */
import kanbanDb from '../kanbanDb.js';
import type { KanbanNode } from '../../../rendering-util/types.js';
import { kanbanFixtures } from './kanban.fixtures.js';
import { parser as kanbanParser } from './kanban.chevrotain.js';

/** One node as `<id> [group] key=value …`, covering every field the parser controls. */
function describeNode(node: KanbanNode, indent: string): string {
  const parts = [node.id];
  if (node.isGroup) {
    parts.push('group');
  }
  const fields: [string, unknown][] = [
    ['parent', node.parentId],
    ['level', node.level],
    ['shape', node.shape],
    ['label', node.label],
    ['icon', node.icon],
    ['assigned', node.assigned],
    ['ticket', node.ticket],
    ['priority', node.priority],
    ['classes', node.cssClasses],
    ['styles', node.cssStyles?.join('; ')],
    ['width', node.width],
    ['padding', node.padding],
  ];
  for (const [key, value] of fields) {
    if (value !== undefined) {
      parts.push(`${key}=${JSON.stringify(value)}`);
    }
  }
  return indent + parts.join(' ');
}

/**
 * Both views of the db: `getSections()` is the raw parser output, `getData()` is what the renderer
 * consumes. They carry different fields, so a regression in either is worth catching.
 */
function describeDb(): string {
  const lines = ['sections:'];
  for (const section of kanbanDb.getSections()) {
    lines.push(describeNode(section, '  '));
  }
  lines.push('nodes:');
  for (const node of kanbanDb.getData().nodes) {
    lines.push(describeNode(node, node.parentId === undefined ? '  ' : '    '));
  }
  return lines.join('\n');
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => prefix + line)
    .join('\n');
}

describe('kanban parser fixtures', () => {
  beforeEach(() => {
    kanbanParser.yy = kanbanDb;
    kanbanDb.clear();
  });

  for (const { name, text } of kanbanFixtures) {
    it(`parses ${name}`, () => {
      let outcome: string;
      try {
        kanbanParser.parse(text);
        outcome = describeDb();
      } catch (error) {
        outcome = `REJECTED: ${(error as Error).message.split('\n')[0]}`;
      }
      expect(`input:\n${indent(text, '| ')}\n${outcome}`).toMatchSnapshot();
    });
  }
});
