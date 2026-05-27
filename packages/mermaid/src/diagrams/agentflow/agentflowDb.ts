import { select } from 'd3';
import * as yaml from 'js-yaml';
import { getConfig, defaultConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { isValidShape, type ShapeID } from '../../rendering-util/rendering-elements/shapes.js';
import type { ClusterShapeID } from '../../rendering-util/rendering-elements/clusters.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import type { EdgeMetaData, NodeMetaData } from '../../types.js';
import utils, { getEdgeId } from '../../utils.js';
import common from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { createTooltip } from '../common/svgDrawCommon.js';
import type {
  AgentflowElementMapping,
  AgentflowSemanticModel,
  AgentflowStatementType,
  EdgeSemantic,
  ElementPosition,
  FlowClass,
  FlowEdge,
  FlowLink,
  FlowSubGraph,
  FlowText,
  FlowVertex,
  FlowVertexTypeParam,
  SemanticConnector,
  SemanticEdge,
  SemanticSubGraph,
  SemanticVertex,
} from './types.js';
import type {
  AgentflowDiagnostic,
  AgentflowDiagnosticContext,
  AgentflowWarningId,
} from './diagnostics.js';

/**
 * Raw JISON `@$` location object. Produced by the jison-generated parser
 * when location tracking is enabled (default). Only the line/column/range
 * fields are used.
 */
interface JisonLocation {
  first_line: number;
  first_column: number;
  last_line: number;
  last_column: number;
  range?: [number, number];
}
import DOMPurify from 'dompurify';
interface LinkData {
  id: string;
}

const MERMAID_DOM_ID_PREFIX = 'agentflow-';

/**
 * Metadata keys that are presentation-only per `AGENTFLOW-SYNTAX.md` §11 and
 * therefore stripped from the semantic model projection. Everything else
 * in `@{...}` metadata carries semantic weight and flows through.
 */
const SEMANTIC_METADATA_SKIP_KEYS = new Set([
  'shape',
  'view',
  'icon',
  'img',
  'w',
  'h',
  'class',
  'style',
  'labelType',
]);

/**
 * Shape ids that mark a node as a tool definition per `AGENTFLOW-SYNTAX.md`
 * §7: the canonical name plus the accepted aliases. v0.8.1 adds `tool` as
 * an alias. Membership in this set is the source of truth for
 * `isToolDefinition()`.
 */
const SUBROUTINE_ALIASES = new Set<string>([
  'subroutine',
  'subprocess',
  'subproc',
  'framed-rectangle',
  'tool',
]);

/**
 * Metadata keys that are valid on **any** authored element per
 * `AGENTFLOW-SYNTAX.md` §10.1 (cross-cutting) plus the structural and
 * presentation controls tracked by the DB. These never surface a
 * `METADATA_KEY_MISAPPLIED` warning regardless of element kind.
 */
const UNIVERSAL_METADATA_KEYS = new Set<string>([
  // §10.1 cross-cutting (valid on any authored element except edges)
  'description',
  'instruction',
  // Structural wiring exposed via metadata
  'shape',
  'label',
  'labelType',
  // Presentation (§11) — never carry semantic meaning
  'view',
  'icon',
  'img',
  'w',
  'h',
  'class',
  'style',
]);

/**
 * The element kinds the §10 applicability table addresses. Plain
 * unclassified vertices are unrestricted and never reach this lookup.
 */
type MetadataApplicabilityKind =
  | 'flow'
  | 'task'
  | 'tool'
  | 'action'
  | 'connector'
  | 'input'
  | 'refdoc'
  | 'edge';

/**
 * §10 Metadata Applicability (v0.8.1) — the normative allowed-key set per
 * element kind. `description` and universal keys are handled separately
 * via `UNIVERSAL_METADATA_KEYS`, so they do not appear here.
 */
const METADATA_APPLICABILITY: Readonly<Record<MetadataApplicabilityKind, ReadonlySet<string>>> = {
  flow: new Set(['model', 'memory', 'params', 'returns']),
  task: new Set(['execution', 'params', 'returns']),
  tool: new Set([
    'params',
    'returns',
    'retry',
    'cache',
    'validate',
    'handler',
    'output',
    'transport',
    'command',
    'connectorRef',
  ]),
  action: new Set(['params', 'returns', 'connectorRef']),
  connector: new Set(['protocol', 'endpoint', 'transport', 'command', 'auth', 'token_required']),
  input: new Set(['type', 'value']),
  refdoc: new Set([]),
  // Edges accept only the cross-cutting `instruction` (see
  // `UNIVERSAL_METADATA_KEYS`); no element-specific keys.
  edge: new Set([]),
};

/**
 * Union of every key that appears in any row of the applicability
 * table. Used to distinguish "known domain key on the wrong element"
 * (warn) from "unknown key" (preserved silently). Computed once at
 * module load.
 */
const ALL_APPLICABILITY_KEYS: ReadonlySet<string> = new Set(
  Object.values(METADATA_APPLICABILITY).flatMap((s) => [...s])
);

/**
 * Synthetic IDs reserved by the renderer per `AGENTFLOW-SYNTAX.md` §9.
 * Authors who declare a vertex or container with one of these ids get a
 * `RESERVED_SYNTHETIC_ID` warning. v0.8.1 keeps `connectors` reserved
 * for forward compat even though the synthesised group is gone.
 */
const RESERVED_SYNTHETIC_IDS = new Set<string>(['connectors']);

/**
 * Child kinds recognised by the §3.3 containment matrix (v0.8.1).
 * `node` is the catch-all for any plain vertex.
 */
type ContainmentChildKind = 'flow' | 'tool' | 'action' | 'node';

/** Parent kinds the §3.3 matrix constrains. v0.8.1: only `flow`. */
type ContainmentParentKind = 'flow';

/**
 * §3.3 Containment Rules (v0.8.1) — only `flow` is a container, and it
 * accepts nested `flow`, `tool`, `action`, or plain nodes.
 */
const CONTAINMENT_ALLOWED_CHILDREN: Readonly<
  Record<ContainmentParentKind, ReadonlySet<ContainmentChildKind>>
> = {
  flow: new Set(['flow', 'tool', 'action', 'node']),
};

/** Maps subgraph container types to their cluster shape IDs. */
const SUBGRAPH_TYPE_TO_SHAPE: Record<NonNullable<FlowSubGraph['type']>, ClusterShapeID> = {
  flow: 'flowGroup',
};

/**
 * v0.8.1 shape aliases (§4.3.2). Author-friendly names map to canonical
 * Mermaid shape IDs.
 */
const SHAPE_ALIASES: ReadonlyMap<string, string> = new Map([
  ['task', 'roundedRect'],
  ['tool', 'subroutine'],
  ['input', 'lean-right'],
  ['decision', 'diamond'],
  ['refdoc', 'lin-doc'],
  ['action', 'hexagon'],
  // Forgiving: `round` is an alias of `rect` (legacy).
  ['round', 'rect'],
]);

/**
 * v0.8.1 removed shapes (§4.3.3). Authoring one of these emits
 * `SHAPE_REMOVED` (error tier).
 */
const REMOVED_SHAPES = new Set<string>([
  'doc',
  'stadium',
  'terminal',
  'circle',
  'trapezoid',
  'inv_trapezoid',
  'inv-trapezoid',
  'doublecircle',
  'double-circle',
  'typeDeclaration',
  'procs',
  'lean_left',
  'lean-left',
  'in-out',
  'cylinder',
  'ellipse',
  'odd',
  'tag-rect',
  'tagged-rectangle',
  'delay',
  'half-rounded-rectangle',
  'lin-rect',
  'lined-rectangle',
  'win-pane',
  'window-pane',
  'curv-trap',
  'curved-trapezoid',
]);

/**
 * Resolve a v0.8.1 shape name (alias or canonical) to its canonical
 * Mermaid shape ID. Returns the input unchanged when no alias matches
 * (so existing canonical names are preserved).
 */
function resolveShapeAlias(shape: string | undefined): string | undefined {
  if (!shape) {
    return shape;
  }
  return SHAPE_ALIASES.get(shape) ?? shape;
}

// We are using arrow functions assigned to class instance fields instead of methods as they are required by JISON
export class AgentFlowDB implements DiagramDB {
  private vertexCounter = 0;
  private config = getConfig();
  private vertices = new Map<string, FlowVertex>();
  private edges: FlowEdge[] & { defaultInterpolate?: string; defaultStyle?: string[] } = [];
  private classes = new Map<string, FlowClass>();
  private subGraphs: FlowSubGraph[] = [];
  private subGraphLookup = new Map<string, FlowSubGraph>();
  private connectors = new Map<string, FlowVertex>();
  private seenConnectorIds = new Set<string>();

  // ── Identifier-resolution tracking (§9) ──────────────────────────────
  // IDs that have received a **declarative** call. Implicit vertices
  // created by edge resolution (e.g. the `a` in `a --> b`) are excluded;
  // only named vertex declarations with label, shape, or container
  // keyword register here. Duplicate detection emits DUPLICATE_ID_NODE
  // and RESERVED_SYNTHETIC_ID for authorial claims on renderer-reserved
  // ids.
  private seenDeclaredNodeIds = new Set<string>();
  private tooltips = new Map<string, string>();
  private subCount = 0;
  private firstGraphFlag = true;
  private direction: string | undefined;
  private version: string | undefined; // As in graph
  private secCount = -1;
  private posCrossRef: number[] = [];

  // ── Element-mapping infrastructure (PR 2a) ───────────────────────────
  // `setSourceText` is the signal Diagram.ts duck-types on to decide whether
  // the DB opts into inline-position capture. `setFrontmatterLineOffset`
  // receives the offset computed by `preprocessDiagram` so that captured
  // JISON `@$` positions are reported in original-source space (including
  // any YAML frontmatter the parser never saw).
  private sourceText: string | undefined;
  private frontmatterLineOffset = 0;
  private elementMappings: AgentflowElementMapping[] = [];

  // ── Diagnostic layer (PR 2b) ──────────────────────────────────────────
  // Structured warnings/errors emitted during parse, post-parse validation,
  // and rendering. Consumed by conformance fixtures (issue #13) and by any
  // downstream tooling that wants programmatic access to problems the DB
  // found. `emitWarning` always also writes to `log.warn` so humans see
  // warnings in the console; tests assert against `getDiagnostics()`.
  private diagnostics: AgentflowDiagnostic[] = [];

  /**
   * Post-parse validators that emit diagnostics run at most once per parse
   * (idempotent `getData()` calls). Resettable via `clear()`.
   */
  private postParseValidationRun = false;

  // Functions to be run after graph rendering
  private funs: ((element: Element) => void)[] = []; // cspell:ignore funs

  constructor() {
    this.funs.push(this.setupToolTips.bind(this));

    // Needed for JISON since it only supports direct properties
    this.addVertex = this.addVertex.bind(this);
    this.firstGraph = this.firstGraph.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.addSubGraph = this.addSubGraph.bind(this);
    this.addConnector = this.addConnector.bind(this);
    this.addConnectorMapping = this.addConnectorMapping.bind(this);
    this.addLink = this.addLink.bind(this);
    this.setLink = this.setLink.bind(this);
    this.updateLink = this.updateLink.bind(this);
    this.addClass = this.addClass.bind(this);
    this.setClass = this.setClass.bind(this);
    this.destructLink = this.destructLink.bind(this);
    this.setClickEvent = this.setClickEvent.bind(this);
    this.setTooltip = this.setTooltip.bind(this);
    this.updateLinkInterpolate = this.updateLinkInterpolate.bind(this);
    this.setClickFun = this.setClickFun.bind(this);
    this.bindFunctions = this.bindFunctions.bind(this);

    // Element-mapping hooks (see ./types.ts ElementPosition / AgentflowElementMapping)
    this.setSourceText = this.setSourceText.bind(this);
    this.setFrontmatterLineOffset = this.setFrontmatterLineOffset.bind(this);
    this.addVertexMapping = this.addVertexMapping.bind(this);
    this.addEdgeMapping = this.addEdgeMapping.bind(this);
    this.addSubgraphMapping = this.addSubgraphMapping.bind(this);

    // Diagnostic hooks (see ./diagnostics.ts)
    this.emitWarning = this.emitWarning.bind(this);
    this.emitError = this.emitError.bind(this);
    this.getDiagnostics = this.getDiagnostics.bind(this);

    this.lex = {
      firstGraph: this.firstGraph.bind(this),
    };

    this.clear();
    this.setGen('gen-2');
  }

  private sanitizeText(txt: string) {
    return common.sanitizeText(txt, this.config);
  }

  private sanitizeNodeLabelType(labelType?: string) {
    switch (labelType) {
      case 'markdown':
      case 'string':
      case 'text':
        return labelType;
      default:
        return 'markdown';
    }
  }

  /**
   * Function to lookup domId from id in the graph definition.
   *
   * @param id - id of the node
   */
  public lookUpDomId(id: string) {
    for (const vertex of this.vertices.values()) {
      if (vertex.id === id) {
        return vertex.domId;
      }
    }
    return id;
  }

  /**
   * Function called by parser when a node definition has been found
   */
  public addVertex(
    id: string,
    textObj: FlowText,
    type: FlowVertexTypeParam,
    style: string[],
    classes: string[],
    dir: string,
    props = {},
    metadata: any
  ) {
    if (!id || id.trim().length === 0) {
      return;
    }
    // Extract the metadata from the shapeData, the syntax for adding metadata for nodes and edges is the same
    // so at this point we don't know if it's a node or an edge, but we can still extract the metadata
    let doc;
    if (metadata !== undefined) {
      let yamlData;
      // detect if shapeData contains a newline character
      if (!metadata.includes('\n')) {
        yamlData = '{\n' + metadata + '\n}';
      } else {
        yamlData = metadata + '\n';
      }
      doc = yaml.load(yamlData, { schema: yaml.JSON_SCHEMA }) as NodeMetaData;
    }

    // v0.8.1 §10.1 legacy: `prompt` was renamed to `instruction`. Accept
    // `prompt` as an alias during the pre-1.0 window and warn the author.
    if (doc && (doc as unknown as Record<string, unknown>).prompt !== undefined) {
      const docRec = doc as unknown as Record<string, unknown>;
      this.emitWarning(
        'METADATA_KEY_LEGACY_PROMPT',
        `metadata key "prompt" on "${id}" is renamed to "instruction" in v0.8.1 (see AGENTFLOW-SYNTAX.md §10.1)`,
        { nodeId: id }
      );
      if (docRec.instruction === undefined) {
        docRec.instruction = docRec.prompt;
      }
      delete docRec.prompt;
    }

    // Resolve shape alias (§4.3.2) before any other shape handling.
    if (doc && typeof (doc as unknown as Record<string, unknown>).shape === 'string') {
      const docRec = doc as unknown as Record<string, unknown>;
      const resolved = resolveShapeAlias(docRec.shape as string);
      if (resolved && resolved !== docRec.shape) {
        docRec.shape = resolved;
      }
    }

    // Check if this is a subgraph (e.g. my_flow@{ view: "collapsed" })
    const subGraph = this.subGraphLookup.get(id);
    if (subGraph && doc) {
      subGraph.metadata = { ...subGraph.metadata, ...(doc as unknown as Record<string, unknown>) };
      return;
    }

    // Check if this is a connector declared via the `connector` keyword
    // — attach metadata to the connector record so applicability rules
    // (§10) apply on the connector kind.
    const connector = this.connectors.get(id);
    if (connector && doc) {
      connector.metadata = {
        ...connector.metadata,
        ...(doc as unknown as Record<string, unknown>),
      };
      return;
    }

    // Identifier-resolution tracking (§9) — a "declarative" call is one
    // where the author wrote a label or an inline shape keyword. Pure
    // metadata attachments (`id@{ ... }`) and implicit vertices created
    // by edge resolution (`a --> b`) do NOT count as declarations.
    const isDeclarative = textObj !== undefined || type !== undefined;
    if (isDeclarative && id) {
      this.recordDeclaredNodeId(id);
    }

    // Reserve 'connectors' as a declaration group ID for forward compat
    // (the synthesised connectors group was removed in v0.8.1, but the
    // id stays reserved). The subgraph branch above runs first, so a
    // user-declared `flow connectors[...]` still owns the id.
    if (id === 'connectors') {
      return;
    }

    // Check if this is an edge — route metadata to the edge instead of
    // creating a placeholder vertex. v0.8.1: only `instruction` (plus
    // the cross-cutting `description`) is allowed on an edge; anything
    // else emits METADATA_KEY_MISAPPLIED.
    const edge = this.edges.find((e) => e.id === id);
    if (edge) {
      const edgeDoc = doc as unknown as EdgeMetaData & Record<string, unknown>;
      if (edgeDoc?.animate !== undefined) {
        edge.animate = edgeDoc.animate;
      }
      if (edgeDoc?.animation !== undefined) {
        edge.animation = edgeDoc.animation;
      }
      if (edgeDoc?.curve !== undefined) {
        edge.interpolate = edgeDoc.curve;
      }
      if (doc) {
        const docRec = doc as unknown as Record<string, unknown>;
        for (const key of Object.keys(docRec)) {
          // Per §10.1, edges accept only `instruction` in v0.8.1. The
          // cross-cutting `description` rule applies to every authored
          // element *except* edges (spec §10.1 explicit carve-out).
          if (key === 'instruction') {
            continue;
          }
          // Allow purely presentational/structural keys to pass through
          // silently (animate/animation/curve are edge presentation; the
          // structural keys come in via UNIVERSAL_METADATA_KEYS).
          if (key === 'animate' || key === 'animation' || key === 'curve') {
            continue;
          }
          if (key === 'label' || key === 'labelType' || key === 'class' || key === 'style') {
            continue;
          }
          this.emitWarning(
            'METADATA_KEY_MISAPPLIED',
            `metadata key "${key}" is not valid on edge "${id}" — edges accept only "instruction" in v0.8.1 (see AGENTFLOW-SYNTAX.md §10.1)`,
            { edgeId: id }
          );
        }
        const edgeMeta: Record<string, unknown> = { ...(edge.metadata ?? {}) };
        if (docRec.instruction !== undefined) {
          edgeMeta.instruction = docRec.instruction;
        }
        if (Object.keys(edgeMeta).length > 0) {
          edge.metadata = edgeMeta;
        }
      }
      return;
    }

    let txt;

    let vertex = this.vertices.get(id);
    if (vertex === undefined) {
      vertex = {
        id,
        labelType: 'text',
        domId: MERMAID_DOM_ID_PREFIX + id + '-' + this.vertexCounter,
        styles: [],
        classes: [],
      };
      this.vertices.set(id, vertex);
    }
    this.vertexCounter++;

    if (textObj !== undefined) {
      this.config = getConfig();
      txt = this.sanitizeText(textObj.text.trim());
      vertex.labelType = textObj.type;
      // strip quotes if string starts and ends with a quote
      if (txt.startsWith('"') && txt.endsWith('"')) {
        txt = txt.substring(1, txt.length - 1);
      }
      vertex.text = txt;
    } else {
      if (vertex.text === undefined) {
        vertex.text = id;
      }
    }
    if (type !== undefined) {
      vertex.type = type;
    }
    if (style !== undefined && style !== null) {
      style.forEach((s) => {
        vertex.styles.push(s);
      });
    }
    if (classes !== undefined && classes !== null) {
      classes.forEach((s) => {
        vertex.classes.push(s);
      });
    }
    if (dir !== undefined) {
      vertex.dir = dir;
    }
    if (vertex.props === undefined) {
      vertex.props = props;
    } else if (props !== undefined) {
      Object.assign(vertex.props, props);
    }

    if (doc !== undefined) {
      vertex.metadata = { ...vertex.metadata, ...(doc as unknown as Record<string, unknown>) };
      if (doc.shape) {
        if (doc.shape !== doc.shape.toLowerCase() || doc.shape.includes('_')) {
          throw new Error(`No such shape: ${doc.shape}. Shape names should be lowercase.`);
        } else if (!isValidShape(doc.shape)) {
          throw new Error(`No such shape: ${doc.shape}.`);
        }
        vertex.type = doc?.shape;
      }

      if (doc?.label) {
        vertex.text = doc?.label;
        vertex.labelType = this.sanitizeNodeLabelType(doc?.labelType);
      }
      if (doc?.icon) {
        vertex.icon = doc?.icon;
        if (!doc.label?.trim() && vertex.text === id) {
          vertex.text = '';
        }
      }
      if (doc?.form) {
        vertex.form = doc?.form;
      }
      if (doc?.pos) {
        vertex.pos = doc?.pos;
      }
      if (doc?.img) {
        vertex.img = doc?.img;
        if (!doc.label?.trim() && vertex.text === id) {
          vertex.text = '';
        }
      }
      if (doc.w) {
        vertex.assetWidth = Number(doc.w);
      }
      if (doc.h) {
        vertex.assetHeight = Number(doc.h);
      }
    }
  }

  /**
   * Function called by parser when a link/edge definition has been found
   *
   */
  public addSingleLink(_start: string, _end: string, type: any, id?: string) {
    const start = _start;
    const end = _end;

    const edge: FlowEdge = {
      start: start,
      end: end,
      type: undefined,
      text: '',
      labelType: 'text',
      classes: [],
      isUserDefinedId: false,
      interpolate: this.edges.defaultInterpolate,
    };
    log.info('abc78 Got edge...', edge);
    const linkTextObj = type.text;

    if (linkTextObj !== undefined) {
      edge.text = this.sanitizeText(linkTextObj.text.trim());

      // strip quotes if string starts and ends with a quote
      if (edge.text.startsWith('"') && edge.text.endsWith('"')) {
        edge.text = edge.text.substring(1, edge.text.length - 1);
      }
      edge.labelType = this.sanitizeNodeLabelType(linkTextObj.type);
    }

    if (type !== undefined) {
      edge.type = type.type;
      edge.stroke = type.stroke;
      edge.length = type.length > 10 ? 10 : type.length;
      if (type.edgeSemantic) {
        edge.edgeSemantic = type.edgeSemantic;
      }
    }
    if (id && !this.edges.some((e) => e.id === id)) {
      edge.id = id;
      edge.isUserDefinedId = true;
    } else {
      const existingLinks = this.edges.filter((e) => e.start === edge.start && e.end === edge.end);
      if (existingLinks.length === 0) {
        edge.id = getEdgeId(edge.start, edge.end, { counter: 0, prefix: 'L' });
      } else {
        edge.id = getEdgeId(edge.start, edge.end, {
          counter: existingLinks.length + 1,
          prefix: 'L',
        });
      }
    }

    if (this.edges.length < (this.config.maxEdges ?? 500)) {
      log.info('Pushing edge...');
      this.edges.push(edge);
    } else {
      throw new Error(
        `Edge limit exceeded. ${this.edges.length} edges found, but the limit is ${this.config.maxEdges}.

Initialize mermaid with maxEdges set to a higher number to allow more edges.
You cannot set this config via configuration inside the diagram as it is a secure config.
You have to call mermaid.initialize.`
      );
    }
  }

  private isLinkData(value: unknown): value is LinkData {
    return (
      value !== null &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as LinkData).id === 'string'
    );
  }

  public addLink(_start: string[], _end: string[], linkData: unknown) {
    const id = this.isLinkData(linkData) ? linkData.id.replace('@', '') : undefined;

    log.info('addLink', _start, _end, id);

    // for a group syntax like A e1@--> B & C, only the first edge should have a userDefined id
    // the rest of the edges should have auto generated ids
    for (const start of _start) {
      for (const end of _end) {
        //use the id only for last node in _start and first node in _end
        const isLastStart = start === _start[_start.length - 1];
        const isFirstEnd = end === _end[0];
        if (isLastStart && isFirstEnd) {
          this.addSingleLink(start, end, linkData, id);
        } else {
          this.addSingleLink(start, end, linkData, undefined);
        }
      }
    }
  }

  /**
   * Updates a link's line interpolation algorithm
   */
  public updateLinkInterpolate(positions: ('default' | number)[], interpolate: string) {
    positions.forEach((pos) => {
      if (pos === 'default') {
        this.edges.defaultInterpolate = interpolate;
      } else {
        this.edges[pos].interpolate = interpolate;
      }
    });
  }

  /**
   * Updates a link with a style
   *
   */
  public updateLink(positions: ('default' | number)[], style: string[]) {
    positions.forEach((pos) => {
      if (typeof pos === 'number' && pos >= this.edges.length) {
        throw new Error(
          `The index ${pos} for linkStyle is out of bounds. Valid indices for linkStyle are between 0 and ${
            this.edges.length - 1
          }. (Help: Ensure that the index is within the range of existing edges.)`
        );
      }
      if (pos === 'default') {
        this.edges.defaultStyle = style;
      } else {
        this.edges[pos].style = style;
        // if edges[pos].style does have fill not set, set it to none
        if (
          (this.edges[pos]?.style?.length ?? 0) > 0 &&
          !this.edges[pos]?.style?.some((s) => s?.startsWith('fill'))
        ) {
          this.edges[pos]?.style?.push('fill:none');
        }
      }
    });
  }

  public addClass(ids: string, _style: string[]) {
    const style = _style
      .join()
      .replace(/\\,/g, '§§§')
      .replace(/,/g, ';')
      .replace(/§§§/g, ',')
      .split(';');
    ids.split(',').forEach((id) => {
      let classNode = this.classes.get(id);
      if (classNode === undefined) {
        classNode = { id, styles: [], textStyles: [] };
        this.classes.set(id, classNode);
      }

      if (style !== undefined && style !== null) {
        style.forEach((s) => {
          if (/color/.exec(s)) {
            const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
            classNode.textStyles.push(newStyle);
          }
          classNode.styles.push(s);
        });
      }
    });
  }

  /**
   * Called by parser when a graph definition is found, stores the direction of the chart.
   *
   */
  public setDirection(dir: string) {
    this.direction = dir.trim();

    if (/.*</.exec(this.direction)) {
      this.direction = 'RL';
    }
    if (/.*\^/.exec(this.direction)) {
      this.direction = 'BT';
    }
    if (/.*>/.exec(this.direction)) {
      this.direction = 'LR';
    }
    if (/.*v/.exec(this.direction)) {
      this.direction = 'TB';
    }
    if (this.direction === 'TD') {
      this.direction = 'TB';
    }
  }

  /**
   * Called by parser when a special node is found, e.g. a clickable element.
   *
   * @param ids - Comma separated list of ids
   * @param className - Class to add
   */
  public setClass(ids: string, className: string) {
    for (const id of ids.split(',')) {
      const vertex = this.vertices.get(id);
      if (vertex) {
        vertex.classes.push(className);
      }
      const edge = this.edges.find((e) => e.id === id);
      if (edge) {
        edge.classes.push(className);
      }
      const subGraph = this.subGraphLookup.get(id);
      if (subGraph) {
        subGraph.classes.push(className);
      }
    }
  }

  public setTooltip(ids: string, tooltip: string) {
    if (tooltip === undefined) {
      return;
    }
    tooltip = this.sanitizeText(tooltip);
    for (const id of ids.split(',')) {
      this.tooltips.set(this.version === 'gen-1' ? this.lookUpDomId(id) : id, tooltip);
    }
  }

  private setClickFun(id: string, functionName: string, functionArgs: string) {
    const domId = this.lookUpDomId(id);
    // if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (getConfig().securityLevel !== 'loose') {
      return;
    }
    if (functionName === undefined) {
      return;
    }
    let argList: string[] = [];
    if (typeof functionArgs === 'string') {
      /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
      argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      for (let i = 0; i < argList.length; i++) {
        let item = argList[i].trim();
        /* Removes all double quotes at the start and end of an argument */
        /* This preserves all starting and ending whitespace inside */
        if (item.startsWith('"') && item.endsWith('"')) {
          item = item.substr(1, item.length - 2);
        }
        argList[i] = item;
      }
    }

    /* if no arguments passed into callback, default to passing in id */
    if (argList.length === 0) {
      argList.push(id);
    }

    const vertex = this.vertices.get(id);
    if (vertex) {
      vertex.haveCallback = true;
      this.funs.push(() => {
        const elem = document.querySelector(`[id="${domId}"]`);
        if (elem !== null) {
          elem.addEventListener(
            'click',
            () => {
              utils.runFunc(functionName, ...argList);
            },
            false
          );
        }
      });
    }
  }

  /**
   * Called by parser when a link is found. Adds the URL to the vertex data.
   *
   * @param ids - Comma separated list of ids
   * @param linkStr - URL to create a link for
   * @param target - Target attribute for the link
   */
  public setLink(ids: string, linkStr: string, target: string) {
    ids.split(',').forEach((id) => {
      const vertex = this.vertices.get(id);
      if (vertex !== undefined) {
        vertex.link = utils.formatUrl(linkStr, this.config);
        vertex.linkTarget = target;
      }
    });
    this.setClass(ids, 'clickable');
  }

  public getTooltip(id: string) {
    return this.tooltips.get(id);
  }

  /**
   * Called by parser when a click definition is found. Registers an event handler.
   *
   * @param ids - Comma separated list of ids
   * @param functionName - Function to be called on click
   * @param functionArgs - Arguments to be passed to the function
   */
  public setClickEvent(ids: string, functionName: string, functionArgs: string) {
    ids.split(',').forEach((id) => {
      this.setClickFun(id, functionName, functionArgs);
    });
    this.setClass(ids, 'clickable');
  }

  public bindFunctions(element: Element) {
    this.funs.forEach((fun) => {
      fun(element);
    });
  }
  public getDirection() {
    return this.direction?.trim();
  }
  /**
   * Retrieval function for fetching the found nodes after parsing has completed.
   *
   */
  public getVertices() {
    return this.vertices;
  }

  /**
   * Retrieval function for fetching the found links after parsing has completed.
   *
   */
  public getEdges() {
    return this.edges;
  }

  /**
   * Returns true when `vertex` is a **tool definition** per
   * `AGENTFLOW-SYNTAX.md` §8 — its resolved shape is `subroutine` or one
   * of the accepted aliases (`subprocess`, `subproc`, `framed-rectangle`).
   *
   * This is the source of truth for "is this a tool?" — there is no
   * separate kind tag stored on the vertex; tool-ness is derived from
   * shape on every check. Downstream consumers reading the semantic model
   * see this surfaced as `vertexKind: 'tool'` (see `getSemanticModel`).
   */
  public isToolDefinition(vertex: FlowVertex): boolean {
    return SUBROUTINE_ALIASES.has(vertex.type as string);
  }

  /**
   * Returns every vertex that is a tool definition (per `isToolDefinition`).
   * Derived view; not cached.
   */
  public getTools(): FlowVertex[] {
    const tools: FlowVertex[] = [];
    for (const vertex of this.vertices.values()) {
      if (this.isToolDefinition(vertex)) {
        tools.push(vertex);
      }
    }
    return tools;
  }

  /**
   * Retrieval function for fetching the found class definitions after parsing has completed.
   *
   */
  public getClasses() {
    return this.classes;
  }

  private setupToolTips(element: Element) {
    const tooltipElem = createTooltip();

    const svg = select(element).select('svg');

    const nodes = svg.selectAll('g.node');
    nodes
      .on('mouseover', (e: MouseEvent) => {
        const el = select(e.currentTarget as Element);
        const title = el.attr('title');

        // Don't try to draw a tooltip if no data is provided
        if (title === null) {
          return;
        }
        const rect = (e.currentTarget as Element)?.getBoundingClientRect();

        tooltipElem.transition().duration(200).style('opacity', '.9');
        tooltipElem
          .text(el.attr('title'))
          .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
          .style('top', window.scrollY + rect.bottom + 'px');
        tooltipElem.html(DOMPurify.sanitize(title));
        el.classed('hover', true);
      })
      .on('mouseout', (e: MouseEvent) => {
        tooltipElem.transition().duration(500).style('opacity', 0);
        const el = select(e.currentTarget as Element);
        el.classed('hover', false);
      });
  }

  /**
   * Clears the internal graph db so that a new graph can be parsed.
   *
   */
  public clear(ver = 'gen-2') {
    this.vertices = new Map();
    this.classes = new Map();
    this.edges = [];
    this.funs = [this.setupToolTips.bind(this)];
    this.subGraphs = [];
    this.subGraphLookup = new Map();
    this.connectors = new Map();
    this.seenConnectorIds = new Set();
    this.subCount = 0;
    this.tooltips = new Map();
    this.firstGraphFlag = true;
    this.version = ver;
    this.config = getConfig();
    this.sourceText = undefined;
    this.frontmatterLineOffset = 0;
    this.elementMappings = [];
    this.diagnostics = [];
    this.postParseValidationRun = false;
    this.seenDeclaredNodeIds = new Set();
    commonClear();
  }

  public setGen(ver: string) {
    this.version = ver || 'gen-2';
  }

  public defaultStyle() {
    return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
  }

  public addSubGraph(
    _id: { text: string },
    list: string[],
    _title: { text: string; type: string },
    type?: 'flow'
  ) {
    let id: string | undefined = _id?.text?.trim();
    let title = _title?.text;
    if (_id === _title && _title?.text && /\s/.exec(_title.text)) {
      id = undefined;
    }

    const uniq = (a: any[]) => {
      const prims: any = { boolean: {}, number: {}, string: {} };
      const objs: any[] = [];

      let dir: string | undefined;

      const nodeList = a.filter(function (item) {
        const type = typeof item;
        if (item.stmt && item.stmt === 'dir') {
          dir = item.value;
          return false;
        }
        if (item.trim() === '') {
          return false;
        }
        if (type in prims) {
          return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        } else {
          return objs.includes(item) ? false : objs.push(item);
        }
      });
      return { nodeList, dir };
    };

    const result = uniq(list.flat());
    const nodeList = result.nodeList;
    let dir = result.dir;
    const flowchartConfig = getConfig().flowchart ?? {};
    dir =
      dir ??
      (flowchartConfig.inheritDir
        ? (this.getDirection() ?? (getConfig() as any).direction ?? undefined)
        : undefined);

    if (this.version === 'gen-1') {
      for (let i = 0; i < nodeList.length; i++) {
        nodeList[i] = this.lookUpDomId(nodeList[i]);
      }
    }

    id = id ?? 'subGraph' + this.subCount;
    title = title || '';
    title = this.sanitizeText(title);
    this.subCount = this.subCount + 1;

    const subGraph: FlowSubGraph = {
      id: id,
      nodes: nodeList,
      title: title.trim(),
      classes: [],
      dir,
      labelType: this.sanitizeNodeLabelType(_title?.type),
      type: type ?? 'flow',
    };

    log.info('Adding', subGraph.id, subGraph.nodes, subGraph.dir);

    // Remove the members in the new subgraph if they already belong to another subgraph
    subGraph.nodes = this.makeUniq(subGraph, this.subGraphs).nodes;

    // Identifier-resolution tracking (§10) — record this container's id
    // in the shared node-or-container namespace. Collisions with a prior
    // declared vertex emit DUPLICATE_ID_NODE. Subgraph-subgraph "merge"
    // collisions remain silent to preserve the wave-1 re-declaration
    // pattern in existing documents.
    const existingPos = this.getPosForId(id);
    if (existingPos === -1) {
      this.recordDeclaredNodeId(id);
    }
    if (existingPos !== -1) {
      // Duplicate subgraph ID — merge children into the existing entry.
      // First occurrence wins for hierarchy position.
      const existing = this.subGraphs[existingPos];
      for (const nodeId of subGraph.nodes) {
        if (!existing.nodes.includes(nodeId)) {
          existing.nodes.push(nodeId);
        }
      }
      // Last occurrence wins for properties
      if (subGraph.title) {
        existing.title = subGraph.title;
      }
      if (subGraph.dir) {
        existing.dir = subGraph.dir;
      }
      if (subGraph.type) {
        existing.type = subGraph.type;
      }
      this.subGraphLookup.set(id, existing);
    } else {
      this.subGraphs.push(subGraph);
      this.subGraphLookup.set(id, subGraph);
    }
    return id;
  }

  private getPosForId(id: string) {
    for (const [i, subGraph] of this.subGraphs.entries()) {
      if (subGraph.id === id) {
        return i;
      }
    }
    return -1;
  }

  private indexNodes2(id: string, pos: number): { result: boolean; count: number } {
    const nodes = this.subGraphs[pos].nodes;
    this.secCount = this.secCount + 1;
    if (this.secCount > 2000) {
      return {
        result: false,
        count: 0,
      };
    }
    this.posCrossRef[this.secCount] = pos;
    // Check if match
    if (this.subGraphs[pos].id === id) {
      return {
        result: true,
        count: 0,
      };
    }

    let count = 0;
    let posCount = 1;
    while (count < nodes.length) {
      const childPos = this.getPosForId(nodes[count]);
      // Ignore regular nodes (pos will be -1)
      if (childPos >= 0) {
        const res = this.indexNodes2(id, childPos);
        if (res.result) {
          return {
            result: true,
            count: posCount + res.count,
          };
        } else {
          posCount = posCount + res.count;
        }
      }
      count = count + 1;
    }

    return {
      result: false,
      count: posCount,
    };
  }

  public getDepthFirstPos(pos: number) {
    return this.posCrossRef[pos];
  }
  public indexNodes() {
    this.secCount = -1;
    if (this.subGraphs.length > 0) {
      this.indexNodes2('none', this.subGraphs.length - 1);
    }
  }

  /**
   * Called by parser when a `connector <id>["Title"]` declaration is
   * encountered (§8). Stores the connector as a FlowVertex with
   * `isConnector: true` so the connector flows through the renderer
   * alongside vertices, while keeping a separate index for connector-
   * specific lookups (e.g. `connectorRef` resolution).
   */
  public addConnector(textObj: FlowText, titleObj?: FlowText): string {
    const id = textObj?.text?.trim();
    if (!id) {
      return '';
    }
    if (RESERVED_SYNTHETIC_IDS.has(id)) {
      this.emitWarning(
        'RESERVED_SYNTHETIC_ID',
        `identifier "${id}" is reserved for renderer synthetics (see AGENTFLOW-SYNTAX.md §9)`,
        { nodeId: id }
      );
    }
    if (this.seenConnectorIds.has(id) || this.seenDeclaredNodeIds.has(id)) {
      this.emitWarning(
        'DUPLICATE_ID_NODE',
        `duplicate declaration for id "${id}" in the node-or-container namespace (see AGENTFLOW-SYNTAX.md §9)`,
        { nodeId: id }
      );
    }
    this.seenConnectorIds.add(id);
    this.seenDeclaredNodeIds.add(id);

    const title = titleObj?.text?.trim() ?? '';
    const resolvedTitle = title.length > 0 ? this.sanitizeText(title) : id;

    let connector = this.connectors.get(id);
    if (!connector) {
      connector = {
        id,
        labelType: 'text',
        domId: MERMAID_DOM_ID_PREFIX + id + '-' + this.vertexCounter,
        styles: [],
        classes: [],
        isConnector: true,
        text: resolvedTitle,
      };
      this.connectors.set(id, connector);
      this.vertices.set(id, connector);
      this.vertexCounter++;
    } else if (title.length > 0) {
      connector.text = resolvedTitle;
    }
    return id;
  }

  public getSubGraphs() {
    return this.subGraphs;
  }

  /** Returns connectors declared via the `connector` keyword (§8). */
  public getConnectors(): FlowVertex[] {
    return [...this.connectors.values()];
  }

  public firstGraph() {
    if (this.firstGraphFlag) {
      this.firstGraphFlag = false;
      return true;
    }
    return false;
  }

  /**
   * Maps the post-`destructLink` `(type, stroke)` pair onto the canonical
   * `edgeSemantic` value defined by `AGENTFLOW-SYNTAX.md` §5.1 (v0.8.1).
   * The three-way table:
   *   - `-->` → arrow_point + normal → sequence
   *   - `-.-` → arrow_open  + dotted → reference
   *   - `--x` → arrow_cross + normal → failure
   * Returns `undefined` for combinations the spec no longer permits.
   */
  private computeEdgeSemantic(
    type: string | undefined,
    stroke: 'normal' | 'thick' | 'invisible' | 'dotted' | undefined
  ): EdgeSemantic | undefined {
    if (type === 'arrow_point' && stroke === 'normal') {
      return 'sequence';
    }
    if (type === 'arrow_cross' && stroke === 'normal') {
      return 'failure';
    }
    if (type === 'arrow_open' && stroke === 'dotted') {
      return 'reference';
    }
    return undefined;
  }

  private destructStartLink(_str: string): FlowLink {
    const str = _str.trim();
    // v0.8.1: only `-->`, `-.-`, `--x` are valid. Start-link forms (the
    // first half of a split arrow `a -- xyz -->`) only carry stroke/dot
    // information; the type comes from the end-link.
    let type = 'arrow_open';

    let stroke = 'normal';
    if (str.includes('.')) {
      stroke = 'dotted';
    }

    return { type, stroke };
  }

  private countChar(char: string, str: string) {
    const length = str.length;
    let count = 0;
    for (let i = 0; i < length; ++i) {
      if (str[i] === char) {
        ++count;
      }
    }
    return count;
  }

  private destructEndLink(_str: string) {
    const str = _str.trim();
    let line = str.slice(0, -1);
    let type = 'arrow_open';

    switch (str.slice(-1)) {
      case 'x':
        type = 'arrow_cross';
        break;
      case '>':
        type = 'arrow_point';
        break;
      case '-':
      case '.':
        // `-.-` form: the trailing character is `-` (or `.`), the operator
        // is non-directional. Keep `arrow_open` so the renderer draws no
        // arrowhead and we route to the reference semantic.
        type = 'arrow_open';
        line = str;
        break;
    }

    let stroke: 'normal' | 'thick' | 'invisible' | 'dotted' = 'normal';
    let length = line.length - 1;

    const dots = this.countChar('.', line);
    if (dots > 0) {
      stroke = 'dotted';
      length = dots;
    }

    return { type, stroke, length };
  }

  public destructLink(_str: string, _startStr: string) {
    const info = this.destructEndLink(_str);
    let startInfo;
    if (_startStr) {
      startInfo = this.destructStartLink(_startStr);

      if (startInfo.stroke !== info.stroke) {
        return { type: 'INVALID', stroke: 'INVALID' };
      }

      // -- xyz -->  - take arrow type from ending
      startInfo.type = info.type;
      startInfo.length = info.length;
      return {
        ...startInfo,
        edgeSemantic: this.computeEdgeSemantic(
          startInfo.type,
          startInfo.stroke as 'normal' | 'thick' | 'invisible' | 'dotted'
        ),
      };
    }

    return {
      ...info,
      edgeSemantic: this.computeEdgeSemantic(info.type, info.stroke),
    };
  }

  // Todo optimizer this by caching existing nodes
  public exists(allSgs: FlowSubGraph[], _id: string) {
    for (const sg of allSgs) {
      if (sg.nodes.includes(_id)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Deletes an id from all subgraphs
   *
   */
  public makeUniq(sg: FlowSubGraph, allSubgraphs: FlowSubGraph[]) {
    const res: string[] = [];
    sg.nodes.forEach((_id, pos) => {
      if (!this.exists(allSubgraphs, _id)) {
        res.push(sg.nodes[pos]);
      }
    });
    return { nodes: res };
  }

  public lex: { firstGraph: typeof AgentFlowDB.prototype.firstGraph };

  private getTypeFromVertex(vertex: FlowVertex): ShapeID {
    if (vertex.img) {
      return 'imageSquare';
    }
    if (vertex.icon) {
      if (vertex.form === 'circle') {
        return 'iconCircle';
      }
      if (vertex.form === 'square') {
        return 'iconSquare';
      }
      if (vertex.form === 'rounded') {
        return 'iconRounded';
      }
      return 'icon';
    }
    // Resolve v0.8.1 alias (e.g. `task` → `roundedRect`, `action` → `hexagon`)
    // before mapping to the canonical Mermaid shape id.
    const resolved =
      typeof vertex.type === 'string' ? resolveShapeAlias(vertex.type) : vertex.type;
    switch (resolved) {
      case 'square':
      case undefined:
        return 'squareRect';
      case 'round':
        return 'roundedRect';
      case 'ellipse':
        // @ts-expect-error -- Ellipses are broken, see https://github.com/mermaid-js/mermaid/issues/5976
        return 'ellipse';
      default:
        return resolved as ShapeID;
    }
  }

  private findNode(nodes: Node[], id: string) {
    return nodes.find((node) => node.id === id);
  }
  private destructEdgeType(type: string | undefined) {
    let arrowTypeStart = 'none';
    let arrowTypeEnd = 'arrow_point';
    switch (type) {
      case 'arrow_point':
      case 'arrow_circle':
      case 'arrow_cross':
      case 'arrow_hierarchy':
        arrowTypeEnd = type;
        break;

      case 'double_arrow_point':
      case 'double_arrow_circle':
      case 'double_arrow_cross':
        arrowTypeStart = type.replace('double_', '');
        arrowTypeEnd = arrowTypeStart;
        break;
    }
    return { arrowTypeStart, arrowTypeEnd };
  }

  private addNodeFromVertex(
    vertex: FlowVertex,
    nodes: Node[],
    parentDB: Map<string, string>,
    subGraphDB: Map<string, boolean>,
    config: any,
    look: string
  ) {
    const parentId = parentDB.get(vertex.id);
    const isGroup = subGraphDB.get(vertex.id) ?? false;

    const node = this.findNode(nodes, vertex.id);
    if (node) {
      node.cssStyles = vertex.styles;
      node.cssCompiledStyles = this.getCompiledStyles(vertex.classes);
      node.cssClasses = vertex.classes.join(' ');
    } else {
      const baseNode = {
        id: vertex.id,
        label: vertex.text,
        labelType: vertex.labelType,
        labelStyle: '',
        parentId,
        padding: config.flowchart?.padding || 8,
        cssStyles: vertex.styles,
        cssCompiledStyles: this.getCompiledStyles(['default', 'node', ...vertex.classes]),
        cssClasses: 'default ' + vertex.classes.join(' '),
        dir: vertex.dir,
        domId: vertex.domId,
        look,
        link: vertex.link,
        linkTarget: vertex.linkTarget,
        tooltip: this.getTooltip(vertex.id),
        icon: vertex.icon,
        pos: vertex.pos,
        img: vertex.img,
        assetWidth: vertex.assetWidth,
        assetHeight: vertex.assetHeight,
        metadata: vertex.metadata,
      };
      if (isGroup) {
        nodes.push({
          ...baseNode,
          isGroup: true,
          shape: 'rect',
        });
      } else {
        nodes.push({
          ...baseNode,
          isGroup: false,
          shape: this.getTypeFromVertex(vertex),
        });
      }
    }
  }

  private getCompiledStyles(classDefs: string[]) {
    let compiledStyles: string[] = [];
    for (const customClass of classDefs) {
      const cssClass = this.classes.get(customClass);
      if (cssClass?.styles) {
        compiledStyles = [...compiledStyles, ...(cssClass.styles ?? [])].map((s) => s.trim());
      }
      if (cssClass?.textStyles) {
        compiledStyles = [...compiledStyles, ...(cssClass.textStyles ?? [])].map((s) => s.trim());
      }
    }
    return compiledStyles;
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §8.1: a `connectorRef` value either points
   * at the connector id directly (`"github"`) or at a dotted form
   * (`"github.create_issue"` — the prefix is the connector id). Resolve
   * against `this.connectors`; emit `CONNECTOR_REF_UNRESOLVED` when the
   * prefix doesn't match a declared connector, or
   * `CONNECTOR_REF_NOT_A_CONNECTOR` when the id exists but as a vertex
   * or subgraph instead.
   */
  private validateConnectorReferences(): void {
    for (const [id, vertex] of this.vertices) {
      // Skip connectors themselves.
      if (vertex.isConnector) {
        continue;
      }
      const ref = vertex.metadata?.connectorRef;
      if (typeof ref !== 'string' || ref.length === 0) {
        continue;
      }
      // Split on first dot for the dotted form. The prefix is the
      // connector id; everything after the dot is opaque.
      const connectorId = ref.includes('.') ? ref.slice(0, ref.indexOf('.')) : ref;
      if (this.connectors.has(connectorId)) {
        continue;
      }
      // Id exists in another namespace?
      if (this.vertices.has(connectorId) || this.subGraphLookup.has(connectorId)) {
        this.emitWarning(
          'CONNECTOR_REF_NOT_A_CONNECTOR',
          `connectorRef "${ref}" on node "${id}" resolves to id "${connectorId}" but it is not declared with the connector keyword (see AGENTFLOW-SYNTAX.md §8.1)`,
          { nodeId: id }
        );
        continue;
      }
      this.emitWarning(
        'CONNECTOR_REF_UNRESOLVED',
        `connectorRef "${ref}" on node "${id}" does not match any declared connector (see AGENTFLOW-SYNTAX.md §8.1)`,
        { nodeId: id }
      );
    }
  }

  /**
   * Classify a vertex against the §10 applicability rows (v0.8.1).
   * Returns the kind name; `task` is the default for plain rounded
   * rectangles. Connectors are detected via the `isConnector` flag set
   * by `addConnector()`.
   */
  private classifyVertexForApplicability(vertex: FlowVertex): MetadataApplicabilityKind {
    if (vertex.isConnector) {
      return 'connector';
    }
    if (this.isToolDefinition(vertex)) {
      return 'tool';
    }
    const resolved =
      typeof vertex.type === 'string' ? resolveShapeAlias(vertex.type) : vertex.type;
    if (resolved === 'hexagon' || resolved === 'hex') {
      return 'action';
    }
    if (resolved === 'lean-right' || resolved === 'lean_right') {
      return 'input';
    }
    if (resolved === 'lin-doc' || resolved === 'lined-document') {
      return 'refdoc';
    }
    return 'task';
  }

  /**
   * Classify a subgraph against the §10 applicability rows. v0.8.1: the
   * only container kind is `flow`.
   */
  private classifySubGraphForApplicability(sg: FlowSubGraph): MetadataApplicabilityKind | null {
    return sg.type === 'flow' ? 'flow' : null;
  }

  /**
   * Classify a subgraph's `type` as a containment-parent kind. v0.8.1:
   * only `flow` is a container.
   */
  private classifyContainmentParent(sg: FlowSubGraph): ContainmentParentKind | null {
    return sg.type === 'flow' ? 'flow' : null;
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §13: for every classifiable element,
   * check each metadata key against the applicability table. A key
   * that is known (appears in any row) but not in this element's row
   * — and isn't universal / cross-cutting — emits
   * `METADATA_KEY_MISAPPLIED`. Unknown keys are preserved on the raw
   * metadata without a warning; that follow-up diagnostic is out of
   * scope for this PR.
   */
  private validateMetadataApplicability(): void {
    const check = (
      id: string,
      metadata: Record<string, unknown>,
      kind: MetadataApplicabilityKind
    ) => {
      const allowed = METADATA_APPLICABILITY[kind];
      for (const key of Object.keys(metadata)) {
        if (UNIVERSAL_METADATA_KEYS.has(key)) {
          continue;
        }
        if (allowed.has(key)) {
          continue;
        }
        if (!ALL_APPLICABILITY_KEYS.has(key)) {
          // Unknown key — preserved, no warning in this PR.
          continue;
        }
        this.emitWarning(
          'METADATA_KEY_MISAPPLIED',
          `metadata key "${key}" is not valid on ${kind} "${id}" (see AGENTFLOW-SYNTAX.md §10)`,
          { nodeId: id }
        );
      }
    };

    const subGraphIds = new Set(this.subGraphs.map((sg) => sg.id));
    for (const [id, vertex] of this.vertices) {
      if (subGraphIds.has(id)) {
        // Container metadata lives on the subgraph entry; the vertex
        // record is a metadata-attachment placeholder — skip.
        continue;
      }
      if (!vertex.metadata) {
        continue;
      }
      const kind = this.classifyVertexForApplicability(vertex);
      check(id, vertex.metadata, kind);
    }
    for (const sg of this.subGraphs) {
      if (!sg.metadata) {
        continue;
      }
      const kind = this.classifySubGraphForApplicability(sg);
      if (kind === null) {
        continue;
      }
      check(sg.id, sg.metadata, kind);
    }
  }

  /**
   * Record a declarative claim on an id in the shared node-or-container
   * namespace (§10). Emits `RESERVED_SYNTHETIC_ID` when the id is one of
   * the renderer-reserved synthetics, and `DUPLICATE_ID_NODE` when an
   * earlier declarative call already registered the same id.
   */
  private recordDeclaredNodeId(id: string): void {
    if (!id) {
      return;
    }
    if (RESERVED_SYNTHETIC_IDS.has(id)) {
      this.emitWarning(
        'RESERVED_SYNTHETIC_ID',
        `identifier "${id}" is reserved for renderer synthetics (see AGENTFLOW-SYNTAX.md §9)`,
        { nodeId: id }
      );
      return;
    }
    if (this.seenDeclaredNodeIds.has(id)) {
      this.emitWarning(
        'DUPLICATE_ID_NODE',
        `duplicate declaration for id "${id}" in the node-or-container namespace (see AGENTFLOW-SYNTAX.md §9)`,
        { nodeId: id }
      );
      return;
    }
    this.seenDeclaredNodeIds.add(id);
  }

  /**
   * v0.8.1 §8.1: only `connectorRef` is a semantic reference. Resolve
   * each value (or dotted-form prefix) against the connector namespace
   * and emit diagnostics as appropriate. Delegates to
   * `validateConnectorReferences()`.
   */
  private resolveReferences(): void {
    this.validateConnectorReferences();
  }

  /**
   * Classify a child id for the v0.8.1 §3.3 containment-matrix lookup.
   * Subgraph children project `flow`; vertex children project `tool`
   * for tool definitions, `action` for hexagon-shaped nodes, or `node`
   * otherwise.
   */
  private classifyContainmentChild(childId: string): ContainmentChildKind | null {
    const childSub = this.subGraphLookup.get(childId);
    if (childSub) {
      return 'flow';
    }
    const childVertex = this.vertices.get(childId);
    if (!childVertex) {
      return null;
    }
    if (this.isToolDefinition(childVertex)) {
      return 'tool';
    }
    const resolved =
      typeof childVertex.type === 'string'
        ? resolveShapeAlias(childVertex.type)
        : childVertex.type;
    if (resolved === 'hexagon' || resolved === 'hex') {
      return 'action';
    }
    return 'node';
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §3.3: every typed container has a fixed
   * allowed-children set. Violations emit `CONTAINMENT_VIOLATION` with
   * the offending child's id. Legacy `subgraph` and `group` parents are
   * unrestricted escape hatches and are skipped.
   */
  private validateContainment(): void {
    for (const sg of this.subGraphs) {
      const parentKind = this.classifyContainmentParent(sg);
      if (parentKind === null) {
        continue;
      }
      const allowed = CONTAINMENT_ALLOWED_CHILDREN[parentKind];
      for (const childId of sg.nodes) {
        const childKind = this.classifyContainmentChild(childId);
        if (childKind === null) {
          continue;
        }
        if (!allowed.has(childKind)) {
          this.emitWarning(
            'CONTAINMENT_VIOLATION',
            `${parentKind} "${sg.id}" cannot contain ${childKind} "${childId}" (see AGENTFLOW-SYNTAX.md §3.3)`,
            { nodeId: childId }
          );
        }
      }
    }
  }

  /**
   * Returns true when an edge endpoint id refers to a `flow` subgraph.
   * Used by the failure-edge check.
   */
  private isFlowEndpoint(id: string): boolean {
    const sg = this.subGraphLookup.get(id);
    return sg !== undefined && sg.type === 'flow';
  }

  /**
   * Returns true when an edge endpoint id refers to a reference-doc
   * node — a vertex whose resolved shape is `lin-doc` (alias `refdoc`).
   * Used by the reference-edge check.
   */
  private isReferenceEndpoint(id: string): boolean {
    const vertex = this.vertices.get(id);
    if (!vertex) {
      return false;
    }
    const resolved =
      typeof vertex.type === 'string' ? resolveShapeAlias(vertex.type) : vertex.type;
    return resolved === 'lin-doc' || resolved === 'lined-document';
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §5.1 (v0.8.1): every edge operator has a
   * primary semantic. When the semantic contradicts the endpoint kinds,
   * emit `EDGE_SEMANTIC_CONTRADICTION`. Two specific rules:
   *   - reference (`-.-`) — at least one endpoint should be a `refdoc`.
   *   - failure   (`--x`) — source should be a `flow`.
   *
   * Reference edges are also non-directional and carry no label — labels
   * are rejected with `REFERENCE_EDGE_LABEL_REJECTED` and cleared.
   */
  private validateEdgeEndpointKinds(): void {
    for (const edge of this.edges) {
      const semantic = edge.edgeSemantic;
      if (semantic === undefined) {
        continue;
      }
      if (semantic === 'reference') {
        // Labels not permitted on reference edges (§5.2).
        if (typeof edge.text === 'string' && edge.text.trim().length > 0) {
          this.emitWarning(
            'REFERENCE_EDGE_LABEL_REJECTED',
            `reference edge "${edge.id ?? `${edge.start}-${edge.end}`}" carries a label; reference edges have no parameter/channel meaning (see AGENTFLOW-SYNTAX.md §5.2)`,
            { edgeId: edge.id }
          );
          edge.text = '';
        }
        const startIsRef = this.isReferenceEndpoint(edge.start);
        const endIsRef = this.isReferenceEndpoint(edge.end);
        if (!startIsRef && !endIsRef) {
          this.emitWarning(
            'EDGE_SEMANTIC_CONTRADICTION',
            `reference edge between "${edge.start}" and "${edge.end}" has no refdoc endpoint (see AGENTFLOW-SYNTAX.md §16.2)`,
            { edgeId: edge.id }
          );
        }
        continue;
      }
      if (semantic === 'failure' && !this.isFlowEndpoint(edge.start)) {
        this.emitWarning(
          'EDGE_SEMANTIC_CONTRADICTION',
          `failure edge source "${edge.start}" is not a flow (see AGENTFLOW-SYNTAX.md §5.1)`,
          { edgeId: edge.id }
        );
        continue;
      }
    }
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §10.2: every `flow` container (including
   * the implicit top-level flow) must declare its required inputs as
   * `lean-right`-shaped nodes (alias `input`). A flow that contains no
   * input node anywhere in its descendant tree gets `FLOW_NO_INPUT`.
   */
  private validateFlowInput(): void {
    const isInputNode = (id: string): boolean => {
      const vertex = this.vertices.get(id);
      if (!vertex) {
        return false;
      }
      const resolved =
        typeof vertex.type === 'string' ? resolveShapeAlias(vertex.type) : vertex.type;
      return resolved === 'lean-right' || resolved === 'lean_right';
    };

    const collectDescendants = (sgId: string, acc: Set<string>): void => {
      const sg = this.subGraphLookup.get(sgId);
      if (!sg) {
        return;
      }
      for (const childId of sg.nodes) {
        if (acc.has(childId)) {
          continue;
        }
        acc.add(childId);
        if (this.subGraphLookup.has(childId)) {
          collectDescendants(childId, acc);
        }
      }
    };

    // Identify *outermost* flow subgraphs — those not nested inside another
    // flow. Inner flows inherit inputs from the ancestor that owns the
    // user-supplied data, so per §10.2 the diagnostic only fires at the
    // authoring boundary (the outermost flow). A child flow may carry no
    // input of its own; that's expected — its inputs travel through the
    // implicit shared state from its parent's upstream steps.
    const nestedFlowIds = new Set<string>();
    for (const sg of this.subGraphs) {
      if (sg.type !== 'flow') {
        continue;
      }
      for (const childId of sg.nodes) {
        if (this.subGraphLookup.has(childId)) {
          nestedFlowIds.add(childId);
        }
      }
    }
    for (const sg of this.subGraphs) {
      if (sg.type !== 'flow' || nestedFlowIds.has(sg.id)) {
        continue;
      }
      const descendants = new Set<string>();
      collectDescendants(sg.id, descendants);
      let found = false;
      for (const childId of descendants) {
        if (isInputNode(childId)) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.emitWarning(
          'FLOW_NO_INPUT',
          `flow "${sg.id}" declares no input node (see AGENTFLOW-SYNTAX.md §10.2)`,
          { nodeId: sg.id }
        );
      }
    }

    // Top-level *implicit* flow: any non-connector vertex when no explicit
    // `flow` container is declared. With an explicit flow the input lives
    // inside it; implicit vertices reached through edges (e.g. the target
    // of `a --x b` when `b` is never explicitly declared inside the flow)
    // are not authoring intent and don't move the input-check needle.
    const hasAnyFlow = this.subGraphs.some((sg) => sg.type === 'flow');
    if (hasAnyFlow) {
      return;
    }
    let topLevelHasInput = false;
    let topLevelHasContent = false;
    for (const [id, vertex] of this.vertices) {
      if (vertex.isConnector) {
        continue;
      }
      topLevelHasContent = true;
      if (isInputNode(id)) {
        topLevelHasInput = true;
        break;
      }
    }
    if (topLevelHasContent && !topLevelHasInput) {
      this.emitWarning(
        'FLOW_NO_INPUT',
        `top-level flow declares no input node (see AGENTFLOW-SYNTAX.md §10.2)`
      );
    }
  }

  /** Run every post-parse diagnostic validator once per parse. */
  private runPostParseValidators(): void {
    if (this.postParseValidationRun) {
      return;
    }
    this.postParseValidationRun = true;
    this.resolveReferences();
    this.validateMetadataApplicability();
    this.validateContainment();
    this.validateEdgeEndpointKinds();
    this.validateFlowInput();
  }

  public getData() {
    this.runPostParseValidators();
    const config = getConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const subGraphs = this.getSubGraphs();
    const parentDB = new Map<string, string>();
    const subGraphDB = new Map<string, boolean>();

    // Collect IDs hidden by collapsed subgraphs (the subgraph's descendants).
    // `collapsedAncestorMap` records the *outermost* collapsed ancestor for
    // each hidden id so that cross-boundary edges can be redirected to the
    // visible collapsed node (issue #53). Nested collapses resolve to the
    // outermost ancestor because we process collapsed subgraphs in
    // declaration order (outer first) and the ancestor parameter is held
    // constant during recursion.
    const hiddenIds = new Set<string>();
    const collapsedAncestorMap = new Map<string, string>();
    const collectDescendants = (sgId: string, ancestor: string) => {
      const sg = this.subGraphLookup.get(sgId);
      if (!sg) {
        return;
      }
      for (const childId of sg.nodes) {
        hiddenIds.add(childId);
        collapsedAncestorMap.set(childId, ancestor);
        // Recurse into child subgraphs
        collectDescendants(childId, ancestor);
      }
    };
    for (const sg of subGraphs) {
      if (sg.metadata?.view === 'collapsed' && !hiddenIds.has(sg.id)) {
        collectDescendants(sg.id, sg.id);
      }
    }

    // Setup the subgraph data for adding nodes
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const subGraph = subGraphs[i];
      if (hiddenIds.has(subGraph.id)) {
        continue;
      }
      if (subGraph.nodes.length > 0) {
        subGraphDB.set(subGraph.id, true);
      }
      for (const id of subGraph.nodes) {
        parentDB.set(id, subGraph.id);
      }
    }

    // Data is setup, add the nodes
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const subGraph = subGraphs[i];
      if (hiddenIds.has(subGraph.id)) {
        continue;
      }

      const isCollapsed = subGraph.metadata?.view === 'collapsed';

      if (isCollapsed) {
        // Collapsed: render as a compact node with container-type styling and collapse indicator
        const collapsedMetadata = {
          ...subGraph.metadata,
          containerType: subGraph.type,
        };
        nodes.push({
          id: subGraph.id,
          label: subGraph.title,
          labelStyle: '',
          labelType: subGraph.labelType,
          parentId: parentDB.get(subGraph.id),
          padding: 8,
          cssCompiledStyles: this.getCompiledStyles(subGraph.classes),
          cssClasses: subGraph.classes.join(' '),
          shape: 'collapsedGroup',
          dir: subGraph.dir,
          isGroup: false,
          look: config.look,
          metadata: collapsedMetadata,
        });
      } else {
        nodes.push({
          id: subGraph.id,
          label: subGraph.title,
          labelStyle: '',
          labelType: subGraph.labelType,
          parentId: parentDB.get(subGraph.id),
          padding: 8,
          cssCompiledStyles: this.getCompiledStyles(subGraph.classes),
          cssClasses: subGraph.classes.join(' '),
          shape: SUBGRAPH_TYPE_TO_SHAPE[subGraph.type ?? 'flow'],
          dir: subGraph.dir,
          isGroup: true,
          look: config.look,
          metadata: subGraph.metadata,
        });
      }
    }

    const n = this.getVertices();
    n.forEach((vertex) => {
      // Skip vertices hidden by collapsed subgraphs
      if (hiddenIds.has(vertex.id)) {
        return;
      }
      this.addNodeFromVertex(vertex, nodes, parentDB, subGraphDB, config, config.look || 'classic');
    });

    const e = this.getEdges();
    e.forEach((rawEdge, index) => {
      // Redirect cross-boundary edges to the outermost visible collapsed
      // ancestor (issue #53). When both endpoints collapse to the same
      // ancestor the edge would be a self-loop on the collapsed node and
      // is dropped instead.
      const startId = collapsedAncestorMap.get(rawEdge.start) ?? rawEdge.start;
      const endId = collapsedAncestorMap.get(rawEdge.end) ?? rawEdge.end;
      if (startId === endId) {
        return;
      }
      const { arrowTypeStart, arrowTypeEnd } = this.destructEdgeType(rawEdge.type);
      const styles = [...(e.defaultStyle ?? [])];

      if (rawEdge.style) {
        styles.push(...rawEdge.style);
      }
      const edge: Edge = {
        id: getEdgeId(startId, endId, { counter: index, prefix: 'L' }, rawEdge.id),
        isUserDefinedId: rawEdge.isUserDefinedId,
        start: startId,
        end: endId,
        type: rawEdge.type ?? 'normal',
        label: rawEdge.text,
        labelType: rawEdge.labelType,
        labelpos: 'c',
        thickness: rawEdge.stroke,
        minlen: rawEdge.length,
        classes:
          rawEdge?.stroke === 'invisible'
            ? ''
            : 'edge-thickness-normal edge-pattern-solid flowchart-link',
        arrowTypeStart:
          rawEdge?.stroke === 'invisible' || rawEdge?.type === 'arrow_open'
            ? 'none'
            : arrowTypeStart,
        arrowTypeEnd:
          rawEdge?.stroke === 'invisible' || rawEdge?.type === 'arrow_open' ? 'none' : arrowTypeEnd,
        arrowheadStyle: 'fill: #333',
        cssCompiledStyles: this.getCompiledStyles(rawEdge.classes),
        labelStyle: styles,
        style: styles,
        pattern: rawEdge.stroke,
        look: config.look,
        animate: rawEdge.animate,
        animation: rawEdge.animation,
        curve: rawEdge.interpolate || this.edges.defaultInterpolate || config.flowchart?.curve,
      };

      edges.push(edge);
    });

    return {
      nodes,
      edges,
      other: {},
      config,
      connectors: this.getConnectors(),
    };
  }

  public defaultConfig() {
    return defaultConfig.flowchart;
  }

  // ── Semantic-model projection (PR 3) ─────────────────────────────────
  //
  // `getSemanticModel()` returns a presentation-stripped view of the
  // diagram state for downstream tooling. Per AGENTFLOW-SYNTAX.md §13
  // `view`, `classDef` / `class` / `style` / `linkStyle`, `icon`, `img`,
  // `w`, `h`, collapsed/expanded state, element mappings, and interactivity
  // bindings are presentation-only and MUST NOT influence semantic
  // interpretation — so none of them appear in the returned model. Fields
  // that carry meaning (ids, labels, shape, domain metadata, edge
  // arrow/stroke/label, subgraph membership, type/template declarations,
  // diagnostics) are kept.

  public getSemanticModel(): AgentflowSemanticModel {
    // Run the post-parse validators so that the semantic export includes
    // up-to-date diagnostics.
    this.runPostParseValidators();
    // Subgraph ids sometimes also appear in `this.vertices` when metadata
    // (`@{...}`) is attached to a container id — the metadata-attachment
    // path creates a placeholder vertex record. Those are NOT semantic
    // vertices; they're container descriptors and the semantic model
    // exposes them via `subGraphs` instead.
    const subGraphIds = new Set(this.subGraphs.map((sg) => sg.id));
    const vertices: SemanticVertex[] = [];
    const connectors: SemanticConnector[] = [];
    for (const [id, v] of this.vertices) {
      if (subGraphIds.has(id)) {
        continue;
      }
      if (v.isConnector) {
        const connector: SemanticConnector = { id };
        if (v.text !== undefined && v.text !== id) {
          connector.title = v.text;
        }
        if (v.metadata && Object.keys(v.metadata).length > 0) {
          const meta: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(v.metadata)) {
            if (SEMANTIC_METADATA_SKIP_KEYS.has(key)) {
              continue;
            }
            meta[key] = value;
          }
          if (Object.keys(meta).length > 0) {
            connector.metadata = meta;
          }
        }
        connectors.push(connector);
        continue;
      }
      const vertex: SemanticVertex = { id };
      if (v.text !== undefined) {
        vertex.label = v.text;
      }
      const resolvedShape =
        typeof v.type === 'string' ? resolveShapeAlias(v.type) : v.type;
      if (resolvedShape !== undefined) {
        vertex.shape = resolvedShape;
      }
      // Derived vertex kind per v0.8.1 §4.
      if (this.isToolDefinition(v)) {
        vertex.vertexKind = 'tool';
      } else if (resolvedShape === 'hexagon' || resolvedShape === 'hex') {
        vertex.vertexKind = 'action';
      } else if (resolvedShape === 'lean-right' || resolvedShape === 'lean_right') {
        vertex.vertexKind = 'input';
      } else if (resolvedShape === 'lin-doc' || resolvedShape === 'lined-document') {
        vertex.vertexKind = 'refdoc';
      } else if (resolvedShape === 'diamond') {
        vertex.vertexKind = 'decision';
      } else {
        vertex.vertexKind = 'task';
      }
      if (v.metadata && Object.keys(v.metadata).length > 0) {
        // Strip presentation-only keys from metadata passthrough.
        const meta: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(v.metadata)) {
          if (SEMANTIC_METADATA_SKIP_KEYS.has(key)) {
            continue;
          }
          meta[key] = value;
        }
        if (Object.keys(meta).length > 0) {
          vertex.metadata = meta;
        }
      }
      vertices.push(vertex);
    }

    const edges: SemanticEdge[] = this.edges.map((e) => {
      const edge: SemanticEdge = { start: e.start, end: e.end };
      if (e.id !== undefined) {
        edge.id = e.id;
      }
      if (typeof e.text === 'string' && e.text.length > 0) {
        edge.label = e.text;
      }
      if (e.type !== undefined) {
        edge.type = e.type;
      }
      if (e.stroke !== undefined) {
        edge.stroke = e.stroke;
      }
      if (e.edgeSemantic !== undefined) {
        edge.edgeSemantic = e.edgeSemantic;
      }
      if (e.length !== undefined) {
        edge.length = e.length;
      }
      if (e.metadata && Object.keys(e.metadata).length > 0) {
        edge.metadata = { ...e.metadata };
      }
      return edge;
    });

    const subGraphs: SemanticSubGraph[] = this.subGraphs.map((sg) => {
      const out: SemanticSubGraph = {
        id: sg.id,
        nodes: [...sg.nodes],
      };
      if (sg.type !== undefined) {
        out.type = sg.type;
      }
      if (sg.title !== undefined) {
        out.title = sg.title;
      }
      if (sg.dir !== undefined) {
        out.direction = sg.dir;
      }
      if (sg.metadata && Object.keys(sg.metadata).length > 0) {
        const meta: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(sg.metadata)) {
          if (SEMANTIC_METADATA_SKIP_KEYS.has(key)) {
            continue;
          }
          meta[key] = value;
        }
        if (Object.keys(meta).length > 0) {
          out.metadata = meta;
        }
      }
      return out;
    });

    const model: AgentflowSemanticModel = {
      vertices,
      edges,
      subGraphs,
      connectors,
      diagnostics: this.diagnostics,
    };
    if (this.direction !== undefined) {
      model.direction = this.direction;
    }
    return model;
  }

  // ── Element-mapping infrastructure (PR 2a) ────────────────────────────
  //
  // JISON action blocks call the `add*Mapping` methods alongside the
  // structural `add*` methods; see `agentflow.jison`. When a diagram DB
  // does not expose these methods the JISON guard `if (yy.addVertexMapping)`
  // simply skips them, so the mapping layer is opt-in and has no effect on
  // diagrams that don't consume positions.
  //
  // `setSourceText` is both the presence signal Diagram.ts uses for inline-
  // position capture AND a place for downstream tooling to read back the
  // original source for render-to-source lookups.

  public setSourceText(text: string): void {
    this.sourceText = text;
  }

  public setFrontmatterLineOffset(offset: number): void {
    this.frontmatterLineOffset = offset ?? 0;
  }

  private toElementPosition(loc: JisonLocation | undefined): ElementPosition {
    // JISON always passes a location object when location tracking is
    // enabled, but defend against a missing loc to keep the parser robust
    // in the face of future grammar rules that forget `@$`.
    const first_line = loc?.first_line ?? 0;
    const first_column = loc?.first_column ?? 0;
    const last_line = loc?.last_line ?? first_line;
    const last_column = loc?.last_column ?? first_column;
    const [startIndex, endIndex] = loc?.range ?? [0, 0];
    return {
      startLine: first_line + this.frontmatterLineOffset,
      startColumn: first_column,
      endLine: last_line + this.frontmatterLineOffset,
      endColumn: last_column,
      startIndex,
      endIndex,
    };
  }

  private pushMapping(id: string, type: AgentflowStatementType, loc: JisonLocation | undefined) {
    if (!id) {
      return;
    }
    this.elementMappings.push({
      id,
      type,
      position: this.toElementPosition(loc),
    });
  }

  public addVertexMapping(
    id: string,
    _text: unknown,
    _shape: unknown,
    loc: JisonLocation | undefined
  ): void {
    this.pushMapping(id, 'vertex', loc);
  }

  public addEdgeMapping(
    _fromStmt: unknown,
    toNodes: unknown,
    _link: unknown,
    loc: JisonLocation | undefined
  ): void {
    // JISON hands the edge's right-hand-side node list in; derive a stable
    // identifier from the destination node IDs joined by `>`. This matches
    // the fan-out shape (`A --> B & C` resolves to one edge statement with
    // two destinations) and keeps the mapping lookup intuitive.
    const ids = Array.isArray(toNodes)
      ? toNodes.map((n) => (typeof n === 'string' ? n : (n?.id ?? ''))).filter(Boolean)
      : [];
    const edgeId = ids.length > 0 ? ids.join('>') : 'edge';
    this.pushMapping(edgeId, 'edge', loc);
  }

  public addSubgraphMapping(
    _id: unknown,
    _title: unknown,
    startLoc: JisonLocation | undefined,
    endLoc: JisonLocation | undefined
  ): void {
    const id = (typeof _id === 'string' ? _id : (_id as { text?: string } | undefined)?.text) ?? '';
    const start = this.toElementPosition(startLoc);
    const end = endLoc ? this.toElementPosition(endLoc) : start;
    if (!id) {
      return;
    }
    this.elementMappings.push({
      id,
      type: 'subgraph',
      // Range spans from the container keyword to its `end` — startLine from
      // the opener, endLine from the closer.
      position: {
        startLine: start.startLine,
        startColumn: start.startColumn,
        endLine: end.endLine,
        endColumn: end.endColumn,
        startIndex: start.startIndex,
        endIndex: end.endIndex,
      },
    });
  }

  public addConnectorMapping(
    textObj: FlowText | undefined,
    _titleObj: FlowText | undefined,
    startLoc: JisonLocation | undefined,
    endLoc: JisonLocation | undefined
  ): void {
    const id = textObj?.text?.trim() ?? '';
    if (!id) {
      return;
    }
    const start = this.toElementPosition(startLoc);
    const end = endLoc ? this.toElementPosition(endLoc) : start;
    this.elementMappings.push({
      id,
      type: 'connector',
      position: {
        startLine: start.startLine,
        startColumn: start.startColumn,
        endLine: end.endLine,
        endColumn: end.endColumn,
        startIndex: start.startIndex,
        endIndex: end.endIndex,
      },
    });
  }

  public getElementMappings(): readonly AgentflowElementMapping[] {
    return this.elementMappings;
  }

  public getElementById(id: string): AgentflowElementMapping | undefined {
    return this.elementMappings.find((m) => m.id === id);
  }

  public getElementsOnLine(line: number): AgentflowElementMapping[] {
    return this.elementMappings.filter(
      (m) => line >= m.position.startLine && line <= m.position.endLine
    );
  }

  public getElementAtPosition(line: number, column: number): AgentflowElementMapping | undefined {
    // Return the innermost (smallest span) match so nested subgraphs resolve
    // to the deepest container that contains the point rather than the
    // outermost one.
    const candidates = this.elementMappings.filter((m) => {
      const { startLine, startColumn, endLine, endColumn } = m.position;
      if (line < startLine || line > endLine) {
        return false;
      }
      if (line === startLine && column < startColumn) {
        return false;
      }
      if (line === endLine && column > endColumn) {
        return false;
      }
      return true;
    });
    if (candidates.length === 0) {
      return undefined;
    }
    return candidates.reduce((smallest, cur) => {
      const smallSpan =
        (smallest.position.endLine - smallest.position.startLine) * 1000 +
        (smallest.position.endColumn - smallest.position.startColumn);
      const curSpan =
        (cur.position.endLine - cur.position.startLine) * 1000 +
        (cur.position.endColumn - cur.position.startColumn);
      return curSpan < smallSpan ? cur : smallest;
    });
  }

  public getMappingStats(): {
    vertices: number;
    edges: number;
    subgraphs: number;
    connectors: number;
    totalElements: number;
  } {
    let vertices = 0;
    let edges = 0;
    let subgraphs = 0;
    let connectors = 0;
    for (const m of this.elementMappings) {
      if (m.type === 'vertex') {
        vertices++;
      } else if (m.type === 'edge') {
        edges++;
      } else if (m.type === 'subgraph') {
        subgraphs++;
      } else if (m.type === 'connector') {
        connectors++;
      }
    }
    return {
      vertices,
      edges,
      subgraphs,
      connectors,
      totalElements: this.elementMappings.length,
    };
  }

  // ── Diagnostics (PR 2b) ────────────────────────────────────────────────
  //
  // `emitWarning` (and its error-severity counterpart `emitError`) record a
  // structured diagnostic and also fire `log.warn` so humans see the
  // message in the console. When the caller supplies a `nodeId` or
  // `edgeId`, the position is looked up through the element-mapping layer
  // added in PR 2a — so the diagnostic carries enough context for an
  // editor to highlight the offending element.

  private emitDiagnostic(
    id: AgentflowWarningId,
    severity: 'warning' | 'error',
    message: string,
    ctx?: AgentflowDiagnosticContext
  ): void {
    const anchorId = ctx?.nodeId ?? ctx?.edgeId;
    const mapping = anchorId ? this.getElementById(anchorId) : undefined;
    const diagnostic: AgentflowDiagnostic = {
      id,
      severity,
      message,
      ...(ctx?.nodeId ? { nodeId: ctx.nodeId } : {}),
      ...(ctx?.edgeId && !ctx?.nodeId ? { edgeId: ctx.edgeId } : {}),
      ...(mapping ? { position: mapping.position } : {}),
    };
    this.diagnostics.push(diagnostic);
    const formatted = `agentflow[${id}]: ${message}`;
    if (severity === 'error') {
      log.error(formatted);
    } else {
      log.warn(formatted);
    }
  }

  public emitWarning(
    id: AgentflowWarningId,
    message: string,
    ctx?: AgentflowDiagnosticContext
  ): void {
    this.emitDiagnostic(id, 'warning', message, ctx);
  }

  public emitError(
    id: AgentflowWarningId,
    message: string,
    ctx?: AgentflowDiagnosticContext
  ): void {
    this.emitDiagnostic(id, 'error', message, ctx);
  }

  public getDiagnostics(): readonly AgentflowDiagnostic[] {
    return this.diagnostics;
  }

  public setAccTitle = setAccTitle;
  public setAccDescription = setAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getAccTitle = getAccTitle;
  public getAccDescription = getAccDescription;
  public getDiagramTitle = getDiagramTitle;
}
