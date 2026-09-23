import { describe, it, expect, beforeEach } from 'vitest';
import { BpmnModdle } from 'bpmn-moddle';
import { db } from '../bpmnDb.js';
import { toBpmnXml } from './index.js';

const SIMPLE = `bpmn LR
  start s1 "Order received"
  task:user t1 "Review order"
  xor g1 "Approved?"
  task:service t2 "Charge card"
  end e1 "Shipped"
  end e2 "Rejected"
  s1 --> t1 --> g1
  g1 -- "approved" --> t2 --> e1
  g1 -->|default| e2
`;

const COLLABORATION = `bpmn LR
  pool "Customer"
    task:user c1 "Place order"
  pool "Supplier"
    lane "Sales"
      start message s1 "Order received"
      xor g1 "In stock?"
    lane "Warehouse"
      task:service t1 "Pick items"
      end e1 "Shipped"
      end e2 "Backordered"
  s1 --> g1
  g1 -- "yes" --> t1 --> e1
  g1 -->|default| e2
  c1 ==> s1
`;

const parseModdle = (xml: string) => {
  const moddle = new BpmnModdle();
  return moddle.fromXML(xml);
};

describe('bpmn export — BPMN 2.0 XML (bpmn-moddle validation)', () => {
  beforeEach(() => db.clear());

  it('exports a single-process diagram that bpmn-moddle parses with zero warnings', async () => {
    const xml = await toBpmnXml(SIMPLE);
    const { rootElement, warnings, elementsById } = await parseModdle(xml);
    expect(warnings).toHaveLength(0);
    expect(rootElement.$type).toBe('bpmn:Definitions');
    // semantic elements
    expect(elementsById.s1.$type).toBe('bpmn:StartEvent');
    expect(elementsById.t1.$type).toBe('bpmn:UserTask');
    expect(elementsById.t2.$type).toBe('bpmn:ServiceTask');
    expect(elementsById.g1.$type).toBe('bpmn:ExclusiveGateway');
    expect(elementsById.e1.$type).toBe('bpmn:EndEvent');
    // BPMNDI present with real bounds
    const diagram = rootElement.diagrams?.[0];
    expect(diagram?.$type).toBe('bpmndi:BPMNDiagram');
    const planeChildren = diagram.plane.planeElement;
    const shapes = planeChildren.filter((c: any) => c.$type === 'bpmndi:BPMNShape');
    const edges = planeChildren.filter((c: any) => c.$type === 'bpmndi:BPMNEdge');
    expect(shapes.length).toBe(6); // 6 flow nodes
    expect(edges.length).toBe(5); // 5 sequence flows
    for (const s of shapes) {
      expect(s.bounds.width).toBeGreaterThan(0);
      expect(s.bounds.height).toBeGreaterThan(0);
    }
  });

  it('exports pools/lanes + message flow as a collaboration that parses with zero warnings', async () => {
    const xml = await toBpmnXml(COLLABORATION);
    const { rootElement, warnings, elementsById } = await parseModdle(xml);
    expect(warnings).toHaveLength(0);
    // collaboration with two participants and a message flow
    const collab = rootElement.rootElements.find((e: any) => e.$type === 'bpmn:Collaboration');
    expect(collab).toBeDefined();
    expect(collab.participants).toHaveLength(2);
    const msgFlows = collab.messageFlows ?? [];
    expect(msgFlows).toHaveLength(1);
    expect(msgFlows[0].sourceRef.id).toBe('c1');
    expect(msgFlows[0].targetRef.id).toBe('s1');
    // lanes materialized as a laneSet
    const supplier = rootElement.rootElements.find(
      (e: any) => e.$type === 'bpmn:Process' && (e.laneSets?.length ?? 0) > 0
    );
    expect(supplier.laneSets[0].lanes.length).toBe(2);
    // message start event carries a message event definition
    expect(elementsById.s1.eventDefinitions?.[0].$type).toBe('bpmn:MessageEventDefinition');
    // DI has a shape for each participant (pool)
    const plane = rootElement.diagrams[0].plane.planeElement;
    const poolShapes = plane.filter(
      (c: any) => c.$type === 'bpmndi:BPMNShape' && c.isHorizontal === true
    );
    expect(poolShapes.length).toBeGreaterThanOrEqual(2);
  });
});
