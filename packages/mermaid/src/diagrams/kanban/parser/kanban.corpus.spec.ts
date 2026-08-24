/**
 * Pins the db state the parser produces for every input in the parity corpus.
 *
 * The snapshot was generated while the legacy jison grammar was still in the tree and every entry
 * had been asserted, input by input, to produce byte-identical db state on both engines. It is
 * therefore a record of the legacy behaviour, and the reason the corpus outlives the parser it
 * was built to check.
 */
import kanbanDb from '../kanbanDb.js';
import type { KanbanNode } from '../../../rendering-util/types.js';
import { kanbanCorpus } from './kanban.corpus.js';
import { parser as kanbanParser } from './kanban.chevrotain.js';

/** The observable db state, with the fields the renderer actually reads. */
function snapshot() {
  const project = (node: KanbanNode) => ({
    id: node.id,
    parentId: node.parentId,
    label: node.label,
    level: node.level,
    isGroup: node.isGroup,
    shape: node.shape,
    icon: node.icon,
    assigned: node.assigned,
    ticket: node.ticket,
    priority: node.priority,
    cssClasses: node.cssClasses,
    cssStyles: node.cssStyles,
    width: node.width,
    padding: node.padding,
  });
  return {
    sections: kanbanDb.getSections().map(project),
    nodes: kanbanDb.getData().nodes.map(project),
  };
}

describe('kanban parser corpus', () => {
  beforeEach(() => {
    kanbanParser.yy = kanbanDb;
    kanbanDb.clear();
  });

  for (const { name, text } of kanbanCorpus) {
    it(`parses ${name}`, () => {
      let result;
      try {
        kanbanParser.parse(text);
        result = snapshot();
      } catch (error) {
        result = { rejected: (error as Error).message.split('\n')[0] };
      }
      expect({ text, result }).toMatchSnapshot();
    });
  }
});
