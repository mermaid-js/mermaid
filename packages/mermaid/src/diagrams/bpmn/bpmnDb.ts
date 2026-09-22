import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import {
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';
import type { LayoutData, Node, NonClusterNode, Edge } from '../../rendering-util/types.js';
import { parseBpmn } from './parser/bpmn.parser.js';
import type { ParsedDiagram, ParsedFlow, ParsedNode } from './parser/bpmn.parser.js';

type BpmnShape = NonNullable<NonClusterNode['shape']>;

const EVENT_SHAPES: Record<string, BpmnShape> = {
  start: 'bpmn-start',
  intermediate: 'bpmn-intermediate',
  boundary: 'bpmn-boundary',
  end: 'bpmn-end',
  throw: 'bpmn-intermediate',
};

const GATEWAY_GLYPHS: Record<string, string> = {
  xor: 'bpmn:exclusive',
  and: 'bpmn:parallel-gateway',
  or: 'bpmn:inclusive',
  'event-gateway': 'bpmn:event-based',
  complex: 'bpmn:complex',
};

const EDGE_PATTERNS: Record<ParsedFlow['kind'], Edge['pattern']> = {
  sequence: 'solid',
  message: 'dashed',
  association: 'dotted',
};

const ARTIFACT_KINDS = new Set<ParsedNode['kind']>(['data', 'store', 'annotation']);

const ARTIFACT_CLEARANCE = 18;

interface Drawn {
  shape: BpmnShape;
  icon?: string;
}

const drawnAs = (node: ParsedNode): Drawn => {
  const qualifier = node.qualifier && node.qualifier !== 'none' ? node.qualifier : undefined;
  switch (node.kind) {
    case 'event':
      return {
        shape: EVENT_SHAPES[node.keyword] ?? 'bpmn-start',
        ...(qualifier ? { icon: `bpmn:${qualifier}` } : {}),
      };
    case 'gateway':
      return { shape: 'bpmn-gateway', icon: GATEWAY_GLYPHS[node.keyword] ?? 'bpmn:exclusive' };
    case 'activity':
      if (node.keyword === 'subprocess') {
        return { shape: 'bpmn-activity', icon: 'bpmn:subprocess' };
      }
      return { shape: 'bpmn-activity', ...(qualifier ? { icon: `bpmn:${qualifier}` } : {}) };
    case 'data':
      return { shape: 'bpmn-data' };
    case 'store':
      return { shape: 'bpmn-data-store' };
    case 'annotation':
      return { shape: 'bpmn-annotation' };
    default:
      return { shape: 'bpmn-activity' };
  }
};

export class BpmnDb {
  private parsed: ParsedDiagram = { direction: 'LR', nodes: [], flows: [] };
  private diagramId = '';

  public clear() {
    this.parsed = { direction: 'LR', nodes: [], flows: [] };
    commonClear();
  }

  public parse(input: string) {
    this.parsed = parseBpmn(input);
    if (this.parsed.title) {
      setDiagramTitle(this.parsed.title);
    }
    if (this.parsed.accTitle) {
      setAccTitle(this.parsed.accTitle);
    }
    if (this.parsed.accDescr) {
      setAccDescription(this.parsed.accDescr);
    }
  }

  public setDiagramId(id: string) {
    this.diagramId = id;
  }

  public getDirection() {
    return this.parsed.direction;
  }

  public getClasses() {
    return new Map<string, unknown>();
  }

  public getConfig() {
    return getGlobalConfig().bpmn ?? {};
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;

  private artifactHosts(): Map<string, string> {
    const artifacts = new Set(
      this.parsed.nodes.filter((node) => ARTIFACT_KINDS.has(node.kind)).map((node) => node.id)
    );
    const hosts = new Map<string, string>();
    for (const flow of this.parsed.flows) {
      if (flow.kind !== 'association') {
        continue;
      }
      for (const [self, other] of [
        [flow.from, flow.to],
        [flow.to, flow.from],
      ]) {
        if (artifacts.has(self) && !artifacts.has(other) && !hosts.has(self)) {
          hosts.set(self, other);
        }
      }
    }
    return hosts;
  }

  public getData(): LayoutData {
    const config = getGlobalConfig();
    const look = config.look ?? 'classic';
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let laneIndex = 0;
    const artifactHosts = this.artifactHosts();
    for (const parsed of this.parsed.nodes) {
      const artifactHost = artifactHosts.get(parsed.id);
      const besideHost =
        parsed.kind === 'annotation' &&
        artifactHost !== undefined &&
        this.parsed.nodes.find((n) => n.id === artifactHost)?.kind === 'gateway';
      const isBand = parsed.kind === 'pool' || parsed.kind === 'lane';
      const isGroup = isBand || parsed.kind === 'group';
      const { shape, icon } = drawnAs(parsed);
      const shared = {
        id: parsed.id,
        label: parsed.label,
        labelType: 'string' as const,
        parentId: parsed.parentId,
        metadata: {
          ...(isBand ? { laneRole: parsed.kind, laneIndex: laneIndex++ } : {}),
          ...(parsed.keyword === 'boundary' && parsed.parentId
            ? { anchorTo: { hostId: parsed.parentId } }
            : {}),
          ...(artifactHost
            ? {
                anchorTo: {
                  hostId: artifactHost,
                  gap: ARTIFACT_CLEARANCE,
                  ...(besideHost ? { side: 'left' as const } : {}),
                },
              }
            : {}),
          ...(parsed.qualifier === 'input' || parsed.qualifier === 'output'
            ? { dataDirection: parsed.qualifier }
            : {}),
          ...(parsed.qualifier === 'collection' ? { isCollection: true } : {}),
          ...(parsed.kind === 'annotation' ? { attachFace: besideHost ? 'right' : 'left' } : {}),
        },
        cssClasses: [
          ...(isGroup ? [`bpmn-${parsed.kind}`] : []),
          ...(parsed.keyword === 'end' || parsed.keyword === 'throw' ? ['bpmn-throw'] : []),
          ...(parsed.keyword === 'call' ? ['bpmn-call'] : []),
        ].join(' '),
        cssStyles: [],
        padding: parsed.kind === 'group' ? 56 : 20,
        look,
      };
      if (isGroup) {
        nodes.push({ ...shared, isGroup: true, shape: isBand ? 'rect' : 'roundedWithTitle' });
      } else {
        nodes.push({ ...shared, isGroup: false, shape, ...(icon ? { icon } : {}) });
      }
    }

    for (const [index, flow] of this.parsed.flows.entries()) {
      edges.push({
        id: `bpmn-edge-${index}`,
        start: flow.from,
        end: flow.to,
        type: 'normal',
        label: flow.label ?? '',
        labelType: 'string',
        labelpos: 'c',
        thickness: 'normal',
        pattern: EDGE_PATTERNS[flow.kind],
        arrowTypeEnd:
          flow.kind === 'sequence'
            ? 'arrow_point'
            : flow.kind === 'message' || flow.directed
              ? 'arrow_open'
              : 'none',
        arrowTypeStart: flow.kind === 'message' ? 'arrow_hollow_circle' : 'none',
        style: [],
        labelStyle: [],
        classes: `bpmn-flow bpmn-flow-${flow.kind}`,
        look,
      } satisfies Edge);
    }

    return {
      nodes,
      edges,
      config,
      direction: this.parsed.direction,
      layoutAlgorithm: 'swimlane',
      laneLayering: 'branches',
      diagramId: this.diagramId,
      markers: ['point', 'circle', 'cross', 'openArrow', 'hollowCircle'],
      type: 'bpmn',
    } satisfies LayoutData;
  }
}

export const db = new BpmnDb();
export default db;
