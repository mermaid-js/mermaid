import stateDiagram, { parser } from './parser/stateDiagram.jison';
import { StateDB } from './stateDb.js';

/**
 * A note is a leaf placed inside a note group, never a container. It used to
 * inherit `type`/`isGroup` from the state it annotates, so annotating a
 * composite state marked the note as a group. The shared paint path then looked
 * for a `note` *cluster* shape, which does not exist, and the whole diagram
 * failed to render. dagre only reads `isGroup` for edge hints, so this stayed
 * hidden until ELK became the default for state diagrams.
 */
describe('state diagram note nodes', function () {
  const src = `
  stateDiagram-v2
  state Composite {
    A --> B
  }
  note right of Composite : hello
  `;

  /** @type {StateDB} */
  let stateDb;
  let nodes;

  beforeEach(function () {
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
    parser.parse(src);
    nodes = stateDb.getData().nodes;
  });

  it('does not mark a note on a composite state as a group', function () {
    const note = nodes.find((n) => n.shape === 'note');
    expect(note, 'a note node should be produced').toBeDefined();
    expect(note.isGroup).toBe(false);
  });

  it('still produces the note group that contains the note', function () {
    const noteGroup = nodes.find((n) => n.shape === 'noteGroup');
    expect(noteGroup, 'a noteGroup should still wrap the note').toBeDefined();
    expect(noteGroup.isGroup).toBe(true);
  });
});
