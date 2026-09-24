import { describe, it, expect, beforeEach } from 'vitest';
import { parser } from './parser/bpmn.chevrotain.js';
import { db } from './bpmnDb.js';

const parse = (input: string) => parser.parse(input);

describe('bpmn parser — tiered keyword-position syntax', () => {
  beforeEach(() => db.clear());

  it('parses a simple keyword-position flow', async () => {
    await parse(`bpmn
      start s1 "Start"
      task:user t1 "Review order"
      xor g1 "Approved?"
      end e1 "Done"
      end e2 "Rejected"
      s1 --> t1 --> g1
      g1 -- yes --> e1
      g1 -->|default| e2
    `);
    const model = db.getModel();
    expect(model.direction).toBe('LR');
    expect(model.nodes).toHaveLength(5);
    const t1 = model.nodes.find((n) => n.id === 't1');
    expect(t1).toMatchObject({ kind: 'task', subtype: 'user', label: 'Review order' });
    const g1 = model.nodes.find((n) => n.id === 'g1');
    expect(g1).toMatchObject({ kind: 'gateway', gateway: 'exclusive' });
    expect(model.flows).toHaveLength(4);
    const conditional = model.flows.find((f) => f.sourceId === 'g1' && f.targetId === 'e1');
    expect(conditional?.label).toBe('yes');
    const def = model.flows.find((f) => f.targetId === 'e2');
    expect(def?.isDefault).toBe(true);
  });

  it('is tolerant: case-insensitive keywords and synonyms', async () => {
    await parse(`BPMN TB
      START s1
      USERTASK t1 "Do"
      DECISION g1 "?"
      activity t2 "More"
      STOP e1
      s1 --> t1
      g1 --> t2 --> e1
      t1 --> g1
      g1 --> e1
    `);
    const model = db.getModel();
    expect(model.direction).toBe('TB');
    expect(model.nodes.find((n) => n.id === 't1')).toMatchObject({ subtype: 'user' });
    expect(model.nodes.find((n) => n.id === 'g1')).toMatchObject({ gateway: 'exclusive' });
    expect(model.nodes.find((n) => n.id === 't2')).toMatchObject({ kind: 'task' });
  });

  it('parses pools, lanes and a cross-pool message flow', async () => {
    await parse(`bpmn LR
      pool "Customer"
        task:user c1 "Place order"
      pool "Supplier"
        lane "Sales"
          start message s1 "Order received"
          task:service t1 "Ship"
        lane "Warehouse"
          end e1 "Done"
      s1 --> t1 --> e1
      c1 ==> s1
    `);
    const model = db.getModel();
    expect(model.pools).toHaveLength(2);
    expect(model.lanes).toHaveLength(2);
    const s1 = model.nodes.find((n) => n.id === 's1');
    expect(s1?.poolId).toBeDefined();
    const msg = model.flows.find((f) => f.kind === 'message');
    expect(msg).toMatchObject({ sourceId: 'c1', targetId: 's1' });
  });

  it('parses intermediate message and timer events', async () => {
    await parse(`bpmn
      start s1
      intermediate timer i1 "Wait 2 days"
      intermediate message i2 "Await reply"
      end e1
      s1 --> i1 --> i2 --> e1
    `);
    const model = db.getModel();
    expect(model.nodes.find((n) => n.id === 'i1')).toMatchObject({
      kind: 'event',
      position: 'intermediate',
      trigger: 'timer',
    });
    expect(model.nodes.find((n) => n.id === 'i2')).toMatchObject({ trigger: 'message' });
  });

  it('is deterministic: same input yields the same model', async () => {
    const src = `bpmn
      start s1
      task t1 "A"
      end e1
      s1 --> t1 --> e1
    `;
    await parse(src);
    const a = JSON.stringify(db.getModel());
    db.clear();
    await parse(src);
    const b = JSON.stringify(db.getModel());
    expect(a).toBe(b);
  });
});

describe('bpmn — getData layout', () => {
  beforeEach(() => db.clear());

  it('emits a titled cluster band per lane and lays out with dagre', async () => {
    await parse(`bpmn
      start s1
      end e1
      s1 --> e1
    `);
    expect((db.getData() as any).layoutAlgorithm).toBe('dagre');

    db.clear();
    await parse(`bpmn
      pool "P"
        lane "L"
          start s1
          end e1
      s1 --> e1
    `);
    const data = db.getData() as any;
    expect(data.layoutAlgorithm).toBe('dagre');
    const band = data.nodes.find((n: any) => n.isGroup);
    expect(band).toMatchObject({ shape: 'roundedWithTitle', cssClasses: 'bpmn-lane' });
    // both elements are parented to the lane band
    expect(data.nodes.filter((n: any) => n.parentId === band.id)).toHaveLength(2);
  });
});
