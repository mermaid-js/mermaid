import stateDiagram, { parser } from './parser/stateDiagram.jison';
import { StateDB } from './stateDb.js';
import { parseStateAction } from './stateCommon.js';

describe('state diagram entry/do/exit actions (#2899)', () => {
  /** @type {StateDB} */
  let stateDb;
  beforeEach(() => {
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  const nodeFor = (id) => stateDb.getData().nodes.find((node) => node.id === id);

  it('keeps the state name as the title and lists actions below it', () => {
    parser.parse(`stateDiagram-v2
[*] --> Idle
Idle --> Running : start
Running : entry / energiseCoils
Running : do / commutate
Running : exit / deEnergise
Running --> Idle : stop`);

    const running = nodeFor('Running');
    expect(running.shape).toBe('rectWithTitle');
    // The id is preserved as the title rather than being evicted by the first action.
    expect(running.label).toBe('Running');
    // Actions render below the divider, in source order, with no duplication.
    expect(running.description).toEqual([
      'entry / energiseCoils',
      'do / commutate',
      'exit / deEnergise',
    ]);
  });

  it('exposes the actions as structured data on the node', () => {
    parser.parse(`stateDiagram-v2
Running : entry / energiseCoils
Running : do / commutate
Running : exit / deEnergise`);

    expect(nodeFor('Running').actions).toEqual([
      { kind: 'entry', body: 'energiseCoils' },
      { kind: 'do', body: 'commutate' },
      { kind: 'exit', body: 'deEnergise' },
    ]);
  });

  it('treats a single action the same way, not as a plain description', () => {
    parser.parse(`stateDiagram-v2
Active : entry / openValve`);

    const active = nodeFor('Active');
    expect(active.shape).toBe('rectWithTitle');
    expect(active.label).toBe('Active');
    expect(active.description).toEqual(['entry / openValve']);
  });

  it('keeps plain descriptions and actions distinct', () => {
    parser.parse(`stateDiagram-v2
Active : Spinning up the motor
Active : entry / energiseCoils`);

    const active = nodeFor('Active');
    // Plain descriptions occupy the title block; actions follow them, once.
    expect(active.label).toBe('Spinning up the motor');
    expect(active.description).toEqual(['entry / energiseCoils']);
  });

  it('does not choke on a quoted long name combined with a description', () => {
    // Regression: this form yields a non-string description, which the action
    // detection must ignore rather than calling string methods on it (#2899).
    expect(() => {
      parser.parse(`stateDiagram-v2
[*] --> S1
state "Some long name" as S1: The description`);
      stateDb.getData();
    }).not.toThrow();
    expect(nodeFor('S1').label).toBe('Some long name');
  });
});

describe('parseStateAction (#2899)', () => {
  it('parses each action kind and trims the body', () => {
    expect(parseStateAction('entry / turnOn')).toEqual({ kind: 'entry', body: 'turnOn' });
    expect(parseStateAction('do/run')).toEqual({ kind: 'do', body: 'run' });
    expect(parseStateAction('  exit  /  turnOff  ')).toEqual({ kind: 'exit', body: 'turnOff' });
  });

  it('is case-insensitive on the keyword', () => {
    expect(parseStateAction('ENTRY / boot')).toEqual({ kind: 'entry', body: 'boot' });
  });

  it('returns null for ordinary descriptions', () => {
    expect(parseStateAction('this is a description')).toBeNull();
    expect(parseStateAction('entrypoint / not an action')).toBeNull();
    expect(parseStateAction('entry only, no slash')).toBeNull();
  });
});
