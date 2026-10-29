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
type NodeMetadata = Record<string, unknown>;

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

/** How edges meet each drawn shape; the layout reads these keys without knowing a BPMN shape. */
const POINTED: NodeMetadata = { endpointProfile: 'vertex' };
const FLAT_SIDED: NodeMetadata = { endpointProfile: 'flat' };

const ENDPOINT_PROFILES: Partial<Record<BpmnShape, NodeMetadata>> = {
  'bpmn-start': POINTED,
  'bpmn-intermediate': POINTED,
  'bpmn-boundary': POINTED,
  'bpmn-end': POINTED,
  'bpmn-gateway': { ...POINTED, oneLinePerVertex: true, captionBelow: true },
  'bpmn-activity': FLAT_SIDED,
  'bpmn-data': FLAT_SIDED,
  'bpmn-data-store': FLAT_SIDED,
  'bpmn-annotation': FLAT_SIDED,
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

const emptyDiagram = (): ParsedDiagram => ({ direction: 'LR', nodes: [], flows: [] });

export class BpmnDb {
  private parsed: ParsedDiagram = emptyDiagram();
  private diagramId = '';
  private frontmatterLineOffset = 0;

  /** Keeps `%%` comment lines in the text, so a line of it is a line of the source. */
  public readonly preserveCommentsWhenParsing = true;

  public setFrontmatterLineOffset(offset: number) {
    this.frontmatterLineOffset = offset;
  }

  public clear() {
    this.parsed = emptyDiagram();
    this.diagramId = '';
    commonClear();
  }

  public parse(input: string) {
    this.parsed = parseBpmn(input, this.frontmatterLineOffset);
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
          ...(isGroup ? {} : ENDPOINT_PROFILES[shape]),
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
              ? 'arrow_open_head'
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
