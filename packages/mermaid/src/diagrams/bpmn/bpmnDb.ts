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
import type { ParsedDiagram, ParsedNode } from './parser/bpmn.parser.js';

/**
 * A registered element shape, so a typo in the tables below fails to compile. Bands and
 * groups are clusters and take their shape from the cluster set instead.
 */
type BpmnShape = NonNullable<NonClusterNode['shape']>;

/** The shape that draws each event position. The ring weight is what the name selects. */
const EVENT_SHAPES: Record<string, BpmnShape> = {
  start: 'bpmn-start',
  intermediate: 'bpmn-intermediate',
  boundary: 'bpmn-boundary',
  end: 'bpmn-end',
  // A throwing intermediate event carries the same double ring as a catching one; what
  // separates them is that its marker is filled.
  throw: 'bpmn-intermediate',
};

/** The glyph that says which kind of gateway a diamond is. */
const GATEWAY_GLYPHS: Record<string, string> = {
  xor: 'bpmn:exclusive',
  and: 'bpmn:parallel-gateway',
  or: 'bpmn:inclusive',
  'event-gateway': 'bpmn:event-based',
  complex: 'bpmn:complex',
};

interface Drawn {
  shape: BpmnShape;
  icon?: string;
}

/**
 * Maps a parsed element onto a shape and a glyph.
 *
 * The two are independent: the shape carries the element's outline and, for an event,
 * its ring weight, while the glyph carries the trigger or task type. That is what lets
 * every grammatical combination draw correctly without a shape per combination.
 */
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

  /**
   * Builds the layout input.
   *
   * The layout algorithm is named here rather than read from config: the swimlane engine
   * is the only one that treats lane membership as a placement constraint, which is what
   * makes a pooled process lay out like a process rather than like a flowchart.
   */
  public getData(): LayoutData {
    const config = getGlobalConfig();
    const look = config.look ?? 'classic';
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Every container is numbered as it is declared, pools included, so the layout does
    // not have to infer an order from where a container sits in this array. A pool with
    // no lanes is drawn as a lane, and the order is honoured only when all of them carry
    // a number, so numbering pools too is what keeps that condition satisfiable.
    let laneIndex = 0;
    for (const parsed of this.parsed.nodes) {
      // A band is a pool or a lane, which the swimlane engine places. A group is drawn
      // around its members and carries no execution semantics, so it is a container
      // without being a band: it gets no lane role and constrains no placement.
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
          // A boundary event is drawn on the border of the activity it interrupts, which
          // the layout does by pinning it rather than by placing it.
          ...(parsed.keyword === 'boundary' && parsed.parentId
            ? { anchorTo: { hostId: parsed.parentId } }
            : {}),
        },
        cssClasses: [
          `bpmn-${parsed.kind}`,
          // An end event and a throwing intermediate both create a result, so their
          // markers fill; everything else catches and stays an outline.
          ...(parsed.keyword === 'end' || parsed.keyword === 'throw' ? ['bpmn-throw'] : []),
          ...(parsed.keyword === 'call' ? ['bpmn-call'] : []),
        ].join(' '),
        cssStyles: [],
        // A group has to clear both its own border and its label, and the notation fixes
        // neither (Table 12.24 gives Group no BPMNShape attributes), so the headroom is
        // ours to choose. Without it the box hugs its members and the label lands on them.
        padding: parsed.kind === 'group' ? 56 : 20,
        look,
      };
      // A band and a group are clusters and an element is not, and the two halves of the
      // Node union accept different shape names, so each is built on its own.
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
        pattern: flow.kind === 'message' ? 'dashed' : 'solid',
        // A message flow is dashed, with an open head at the target and a hollow ring at
        // the source; a sequence flow is solid with a filled head.
        arrowTypeEnd: flow.kind === 'message' ? 'arrow_open' : 'arrow_point',
        arrowTypeStart: flow.kind === 'message' ? 'arrow_hollow_circle' : 'none',
        // `edges.js` reduces these into a style string, and an absent one reduces to the
        // literal text "undefined" on every path.
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
      diagramId: this.diagramId,
      // `insertMarkers` only emits the markers named here, so a message flow's open head
      // and hollow source ring have to be requested or its marker reference points at a
      // definition that was never put in `<defs>`.
      markers: ['point', 'circle', 'cross', 'openArrow', 'hollowCircle'],
      type: 'bpmn',
    } satisfies LayoutData;
  }
}

export const db = new BpmnDb();
export default db;
