/**
 * The edge joining a state to its note is dashed. That used to be expressed only as CSS --
 * `.note-edge { stroke-dasharray: 5 }` in `state/styles.js` -- which is enough under the
 * `classic` look and not enough under `neo`.
 *
 * Under `neo`, `insertEdge` writes an *inline* `stroke-dasharray` on every edge, computed
 * from the path length: for a solid edge, one long run trimmed at both ends so the arrow
 * markers have their gaps. An inline style outranks a stylesheet rule, so the note edge
 * came out solid with the `.note-edge` rule still present and simply losing. `neo` became
 * the default look, which is what made a long-standing quirk everyone's problem.
 *
 * `insertEdge` chooses between the two dash generators on `edge.pattern`, so that is where
 * the dashing has to be declared. This pins it there.
 */
// @ts-expect-error No types available for JISON
import stateDiagram, { parser } from './parser/stateDiagram.jison';
import { beforeEach, describe, expect, it } from 'vitest';
import { StateDB } from './stateDb.js';

describe('state note edges', () => {
  let stateDb: StateDB;

  beforeEach(() => {
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  const edges = (diagram: string) => {
    parser.parse(diagram);
    return stateDb.getData().edges;
  };

  const diagram = `stateDiagram-v2
    [*] --> Active
    Active --> Idle
    note right of Active
      A note
    end note
  `;

  it('declares the note edge as dashed on the edge, not only in CSS', () => {
    const noteEdge = edges(diagram).find((edge) => edge.classes.includes('note-edge'));
    expect(noteEdge).toBeDefined();
    // `insertEdge` reads this to pick its dash generator under the neo look. Without it the
    // edge takes the solid generator and the inline result hides `.note-edge`.
    expect(noteEdge?.pattern).toBe('dashed');
  });

  it('leaves ordinary transitions solid', () => {
    // The fix must not dash every edge: `pattern` is absent on transitions, which is what
    // sends them down the solid branch.
    const transitions = edges(diagram).filter((edge) => !edge.classes.includes('note-edge'));
    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions.every((edge) => edge.pattern === undefined)).toBe(true);
  });

  it('keeps the note-edge class, which is what the classic look still styles', () => {
    // `classic` writes no inline dasharray, so it is the `.note-edge` rule that dashes the
    // line there -- and that rule beats `edge-pattern-dashed` on source order. Dropping the
    // class in favour of the pattern alone would change the classic look's dash length.
    const noteEdge = edges(diagram).find((edge) => edge.classes.includes('note-edge'));
    expect(noteEdge?.classes).toContain('note-edge');
  });
});
