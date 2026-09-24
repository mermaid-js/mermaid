import type { BpmnFlow, BpmnModel, BpmnNode } from '../bpmnTypes.js';
import { layoutForExport } from './layout.js';
import type { Box } from './layout.js';

const xml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const nameAttr = (label?: string): string => (label ? ` name="${xml(label)}"` : '');

const EVENT_TAG: Record<string, string> = {
  start: 'startEvent',
  intermediate: 'intermediateCatchEvent',
  end: 'endEvent',
};
const TASK_TAG: Record<string, string> = {
  abstract: 'task',
  user: 'userTask',
  service: 'serviceTask',
  script: 'scriptTask',
};
const GATEWAY_TAG: Record<string, string> = {
  exclusive: 'exclusiveGateway',
  parallel: 'parallelGateway',
  inclusive: 'inclusiveGateway',
  event: 'eventBasedGateway',
};

const processId = (poolKey: string, defaultKey: string): string =>
  poolKey === defaultKey ? 'Process_1' : `Process_${poolKey.replace(/[^\w-]/g, '_')}`;
const participantId = (poolKey: string): string => `Participant_${poolKey.replace(/[^\w-]/g, '_')}`;

/** Build a BPMN 2.0 XML string (with BPMNDI) from a validated BPMN model. */
export function bpmnModelToXml(model: BpmnModel): string {
  const layout = layoutForExport(model);
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));

  const DEFAULT = '__default__';
  const hasPools = model.pools.length > 0;

  // group nodes + sequence/association flows by owning process
  const procKeyOf = (n: BpmnNode): string => n.poolId ?? DEFAULT;
  const processKeys = [...new Set(model.nodes.map(procKeyOf))];

  const seqAndAssoc = model.flows.filter((f) => f.kind !== 'message');
  const messageFlows = model.flows.filter((f) => f.kind === 'message');

  const outByNode = new Map<string, BpmnFlow[]>();
  const inByNode = new Map<string, BpmnFlow[]>();
  for (const f of model.flows.filter((flow) => flow.kind === 'sequence')) {
    (outByNode.get(f.sourceId) ?? outByNode.set(f.sourceId, []).get(f.sourceId)!).push(f);
    (inByNode.get(f.targetId) ?? inByNode.set(f.targetId, []).get(f.targetId)!).push(f);
  }

  const isGatewaySource = (id: string): boolean => {
    const n = nodeById.get(id);
    return n?.kind === 'gateway' && (n.gateway === 'exclusive' || n.gateway === 'inclusive');
  };

  // ---- semantic (process) elements ----
  const processXml: string[] = [];
  for (const key of processKeys) {
    const nodes = model.nodes.filter((n) => procKeyOf(n) === key);
    const flows = seqAndAssoc.filter((f) => procKeyOf(nodeById.get(f.sourceId)!) === key);
    const lines: string[] = [];

    // laneSet
    const lanes = model.lanes.filter((l) => l.poolId === key);
    if (lanes.length > 0) {
      lines.push(`    <bpmn:laneSet id="LaneSet_${key.replace(/[^\w-]/g, '_')}">`);
      for (const lane of lanes) {
        lines.push(`      <bpmn:lane id="${lane.id}"${nameAttr(lane.label)}>`);
        for (const n of nodes.filter((nd) => nd.laneId === lane.id && nd.kind !== 'data')) {
          lines.push(`        <bpmn:flowNodeRef>${xml(n.id)}</bpmn:flowNodeRef>`);
        }
        lines.push(`      </bpmn:lane>`);
      }
      lines.push(`    </bpmn:laneSet>`);
    }

    // flow nodes
    for (const n of nodes) {
      const incoming = (inByNode.get(n.id) ?? []).map((f) => f.id);
      const outgoing = (outByNode.get(n.id) ?? []).map((f) => f.id);
      const io = [
        ...incoming.map((id) => `      <bpmn:incoming>${xml(id)}</bpmn:incoming>`),
        ...outgoing.map((id) => `      <bpmn:outgoing>${xml(id)}</bpmn:outgoing>`),
      ];

      if (n.kind === 'event') {
        const tag = EVENT_TAG[n.position];
        const def =
          n.trigger === 'message'
            ? `      <bpmn:messageEventDefinition id="${n.id}_def" />`
            : n.trigger === 'timer'
              ? `      <bpmn:timerEventDefinition id="${n.id}_def" />`
              : '';
        const children = [...io, def].filter(Boolean);
        lines.push(`    <bpmn:${tag} id="${n.id}"${nameAttr(n.label)}>`);
        lines.push(...children);
        lines.push(`    </bpmn:${tag}>`);
      } else if (n.kind === 'task') {
        const tag = TASK_TAG[n.subtype];
        lines.push(`    <bpmn:${tag} id="${n.id}"${nameAttr(n.label)}>`);
        lines.push(...io);
        lines.push(`    </bpmn:${tag}>`);
      } else if (n.kind === 'gateway') {
        const tag = GATEWAY_TAG[n.gateway];
        const def = (outByNode.get(n.id) ?? []).find((f) => f.isDefault);
        const defAttr = def ? ` default="${def.id}"` : '';
        lines.push(`    <bpmn:${tag} id="${n.id}"${nameAttr(n.label)}${defAttr}>`);
        lines.push(...io);
        lines.push(`    </bpmn:${tag}>`);
      } else {
        // data object
        lines.push(
          `    <bpmn:dataObjectReference id="${n.id}"${nameAttr(n.label)} dataObjectRef="DataObject_${n.id}" />`
        );
        lines.push(`    <bpmn:dataObject id="DataObject_${n.id}" />`);
      }
    }

    // sequence flows + associations
    for (const f of flows) {
      if (f.kind === 'association') {
        lines.push(
          `    <bpmn:association id="${f.id}" sourceRef="${xml(f.sourceId)}" targetRef="${xml(f.targetId)}" />`
        );
        continue;
      }
      const cond =
        f.label && isGatewaySource(f.sourceId) && !f.isDefault
          ? `\n      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${xml(f.label)}</bpmn:conditionExpression>\n    `
          : '';
      lines.push(
        `    <bpmn:sequenceFlow id="${f.id}"${nameAttr(f.label)} sourceRef="${xml(f.sourceId)}" targetRef="${xml(f.targetId)}">${cond}</bpmn:sequenceFlow>`
      );
    }

    processXml.push(
      `  <bpmn:process id="${processId(key, DEFAULT)}" isExecutable="false">\n${lines.join('\n')}\n  </bpmn:process>`
    );
  }

  // ---- collaboration (pools + message flows) ----
  let collaborationXml = '';
  const planeElement = hasPools ? 'Collaboration_1' : processId(processKeys[0] ?? DEFAULT, DEFAULT);
  if (hasPools) {
    const parts = model.pools.map(
      (p) =>
        `    <bpmn:participant id="${participantId(p.id)}"${nameAttr(p.label)} processRef="${processId(p.id, DEFAULT)}" />`
    );
    const msgs = messageFlows.map(
      (f) =>
        `    <bpmn:messageFlow id="${f.id}"${nameAttr(f.label)} sourceRef="${xml(f.sourceId)}" targetRef="${xml(f.targetId)}" />`
    );
    collaborationXml = `  <bpmn:collaboration id="Collaboration_1">\n${[...parts, ...msgs].join('\n')}\n  </bpmn:collaboration>\n`;
  }

  // ---- DI ----
  const di: string[] = [];
  const shape = (id: string, ref: string, box: Box, horizontal?: boolean): string =>
    `      <bpmndi:BPMNShape id="${id}" bpmnElement="${ref}"${horizontal ? ' isHorizontal="true"' : ''}>\n` +
    `        <dc:Bounds x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" />\n` +
    `      </bpmndi:BPMNShape>`;

  for (const [poolKey, box] of layout.pools) {
    di.push(shape(`Shape_${participantId(poolKey)}`, participantId(poolKey), box, true));
  }
  for (const [laneId, box] of layout.lanes) {
    di.push(shape(`Shape_${laneId}`, laneId, box, true));
  }
  for (const n of model.nodes) {
    const box = layout.nodes.get(n.id);
    if (box) {
      di.push(shape(`Shape_${n.id}`, n.id, box));
    }
  }

  const waypoints = (src: Box, dst: Box, vertical: boolean): string => {
    const pts = vertical
      ? [
          { x: Math.round(src.x + src.width / 2), y: src.y + src.height },
          { x: Math.round(dst.x + dst.width / 2), y: dst.y },
        ]
      : [
          { x: src.x + src.width, y: Math.round(src.y + src.height / 2) },
          { x: dst.x, y: Math.round(dst.y + dst.height / 2) },
        ];
    return pts.map((p) => `        <di:waypoint x="${p.x}" y="${p.y}" />`).join('\n');
  };

  for (const f of model.flows) {
    const src = layout.nodes.get(f.sourceId);
    const dst = layout.nodes.get(f.targetId);
    if (!src || !dst) {
      continue;
    }
    di.push(
      `      <bpmndi:BPMNEdge id="Edge_${f.id}" bpmnElement="${f.id}">\n${waypoints(src, dst, f.kind === 'message')}\n      </bpmndi:BPMNEdge>`
    );
  }

  const diXml =
    `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n` +
    `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${planeElement}">\n` +
    `${di.join('\n')}\n` +
    `    </bpmndi:BPMNPlane>\n` +
    `  </bpmndi:BPMNDiagram>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ` +
    `xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ` +
    `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ` +
    `xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ` +
    `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `id="Definitions_bpmn" targetNamespace="http://bpmn.io/schema/bpmn">\n` +
    `${collaborationXml}` +
    `${processXml.join('\n')}\n` +
    `${diXml}\n` +
    `</bpmn:definitions>\n`
  );
}
