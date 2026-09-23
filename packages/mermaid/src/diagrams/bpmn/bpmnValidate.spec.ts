import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './parser/bpmn.chevrotain.js';
import { db } from './bpmnDb.js';

const expectError = async (src: string, fragment: string) => {
  await expect(parser.parse(src)).rejects.toThrow(fragment);
};

describe('bpmn semantic validation — self-correcting error catalogue', () => {
  beforeEach(() => db.clear());

  it('rule 1: node with no path to an end event', async () => {
    await expectError(
      `bpmn
        start s1
        task t1 "Orphan"
        end e1
        s1 --> e1`,
      `node 't1' has no path to an end event`
    );
  });

  it('rule 2: node unreachable from a start', async () => {
    await expectError(
      `bpmn
        start s1
        task t1 "Island"
        end e1
        s1 --> e1
        t1 --> e1`,
      `node 't1' is unreachable — no start event leads to it`
    );
  });

  it('rule 3: start event with an incoming flow', async () => {
    await expectError(
      `bpmn
        start s1
        task t1
        end e1
        t1 --> s1
        s1 --> e1`,
      `start event 's1' has an incoming sequence flow`
    );
  });

  it('rule 3: end event with an outgoing flow', async () => {
    await expectError(
      `bpmn
        start s1
        end e1
        task t1
        s1 --> e1
        e1 --> t1`,
      `end event 'e1' has an outgoing sequence flow`
    );
  });

  it('rule 4: diverging exclusive gateway with a single branch', async () => {
    await expectError(
      `bpmn
        start s1
        xor g1 "?"
        end e1
        s1 --> g1 --> e1`,
      `exclusive gateway 'g1' has 1 outgoing flow`
    );
  });

  it('rule 4: parallel gateway with a condition', async () => {
    await expectError(
      `bpmn
        start s1
        and g1
        task t1
        task t2
        end e1
        s1 --> g1
        g1 -- yes --> t1
        g1 --> t2
        t1 --> e1
        t2 --> e1`,
      `parallel gateway 'g1' has a condition`
    );
  });

  it('rule 6: more than one default flow', async () => {
    await expectError(
      `bpmn
        start s1
        xor g1 "?"
        end e1
        end e2
        s1 --> g1
        g1 -->|default| e1
        g1 -->|default| e2`,
      `has 2 default flows`
    );
  });

  it('rule 7: message flow within the same pool', async () => {
    await expectError(
      `bpmn
        pool "P"
          start s1
          task t1
          end e1
        s1 --> t1 --> e1
        s1 ==> t1`,
      `connects two nodes in the same pool`
    );
  });

  it('rule 8: lane declared outside a pool', async () => {
    await expectError(
      `bpmn
        lane "Sales"
          start s1
          end e1
        s1 --> e1`,
      `lane 'Sales' is declared outside any pool`
    );
  });

  it('rule 9: unknown node reference with a suggestion', async () => {
    await expectError(
      `bpmn
        start s1
        end e1
        s1 --> e2`,
      `flow references unknown node 'e2'`
    );
  });

  it('rule 9: duplicate id', async () => {
    await expectError(
      `bpmn
        start s1
        task s1 "dup"
        end e1
        s1 --> e1`,
      `duplicate id 's1'`
    );
  });
});
