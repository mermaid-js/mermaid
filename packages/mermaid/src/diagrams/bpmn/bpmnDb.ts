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

/** The line each kind of connection is drawn with. */
const EDGE_PATTERNS: Record<ParsedFlow['kind'], Edge['pattern']> = {
  sequence: 'solid',
  message: 'dashed',
  association: 'dotted',
};

/** The kinds that annotate a flow rather than take part in it. */
const ARTIFACT_KINDS = new Set<ParsedNode['kind']>(['data', 'store', 'annotation']);

/** Clearance between an activity's border and the artifact hanging off it. */
const ARTIFACT_CLEARANCE = 18;

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
  /**
   * The element each artifact hangs from.
   *
   * An association carries no order, so an artifact takes its place from what it
   * annotates rather than from a rank of its own. Resolving the host here is what lets
   * the layout leave the artifact out of the flow entirely.
   */
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
        // The first association wins, so an artifact shared between two elements sits by
        // the one it was joined to first and reaches the other along its own line.
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

    // Every container is numbered as it is declared, pools included, so the layout does
    // not have to infer an order from where a container sits in this array. A pool with
    // no lanes is drawn as a lane, and the order is honoured only when all of them carry
    // a number, so numbering pools too is what keeps that condition satisfiable.
    let laneIndex = 0;
    const artifactHosts = this.artifactHosts();
    for (const parsed of this.parsed.nodes) {
      const artifactHost = artifactHosts.get(parsed.id);
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
          // An artifact stands beside its host rather than on its border, which is the
          // difference between annotating an activity and interrupting one.
          ...(artifactHost ? { anchorTo: { hostId: artifactHost, gap: ARTIFACT_CLEARANCE } } : {}),
          // A data object's corner marker says whether the activity it is associated with
          // reads it or writes it, and whether it stands for one item or a set.
          ...(parsed.qualifier === 'input' || parsed.qualifier === 'output'
            ? { dataDirection: parsed.qualifier }
            : {}),
          ...(parsed.qualifier === 'collection' ? { isCollection: true } : {}),
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
        // A sequence flow is solid with a filled head, a message flow is dashed with an
        // open head at the target and a hollow ring at the source, and an association is
        // dotted, taking an open head only when it points somewhere.
        pattern: EDGE_PATTERNS[flow.kind],
        arrowTypeEnd:
          flow.kind === 'sequence'
            ? 'arrow_point'
            : flow.kind === 'message' || flow.directed
              ? 'arrow_open'
              : 'none',
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
      // Two flows out of a gateway are concurrent. Laying them end to end would read as
      // one after the other, so the lane holds them side by side and grows instead.
      laneLayering: 'branches',
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
