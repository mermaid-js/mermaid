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
  AgentFlowTemplateDeclaration,
  AgentFlowTemplateDeclarationsByName,
  AgentFlowTemplateField,
  AgentFlowTypeDeclaration,
  AgentFlowTypeDeclarationsByName,
  AgentFlowTypeField,
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
const AGENTFLOW_TPL_VERSION = 'AGENTFLOW-TPL-V0.6.0';

/** Pre-compiled regexes for field parsing */
const RECORD_FIELD_RE = /^([A-Z_a-z]\w*)\s*:\s*(.+)$/;
const TEMPLATE_FIELD_RE = /^([A-Z_a-z]\w*)\s*:\s*(\w+)(?:\s*\*\s*(\d+))?\s*<<([^>]*)>>$/;

/**
 * Metadata keys that are presentation-only per `AGENTFLOW-SYNTAX.md` §13 and
 * therefore stripped from the semantic model projection (PR 3). Everything
 * else in `@{...}` metadata — `model`, `permits`, `requires`, `deny`,
 * `params`, `returns`, `strategy`, `protocol`, `connector`, etc. — carries
 * semantic weight and flows through.
 *
 * `shape` is listed here (since wave-2 PR 4) because shape is surfaced as
 * a first-class field on `SemanticVertex.shape`; keeping a duplicate under
 * `metadata.shape` would just be noise. The same set is also consulted when
 * merging inherited metadata on instance resolution (§11.3: shape does not
 * inherit).
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
  'form',
  'pos',
  'labelType',
  'animate',
  'animation',
  'curve',
]);

/**
 * Shape ids that mark a node as a tool definition per `AGENTFLOW-SYNTAX.md`
 * §8.2: the canonical name plus the accepted aliases. Membership in this
 * set is the source of truth for `isToolDefinition()`.
 */
const SUBROUTINE_ALIASES = new Set<string>([
  'subroutine',
  'subprocess',
  'subproc',
  'framed-rectangle',
]);

/**
 * The five instance shapes and the kind of definition each must target per
 * `AGENTFLOW-SYNTAX.md` §11.1. Each shape is listed with its canonical name
 * and the spec-explicit alias; broader shape-registry aliases (e.g.
 * `tag-proc`, `lined-process`) are deliberately not in scope until the spec
 * names them. Kind `'tool'` resolves against the vertex namespace and is
 * satisfied by `isToolDefinition()`; the four container kinds resolve
 * against the subgraph namespace and are satisfied by a `FlowSubGraph`
 * whose `type` matches.
 */
type InstanceDefKind = 'tool' | 'agent' | 'flow' | 'skill' | 'directive';
const INSTANCE_SHAPE_TO_KIND: Readonly<Record<string, InstanceDefKind>> = {
  'win-pane': 'tool',
  'window-pane': 'tool',
  'tag-rect': 'agent',
  'tagged-rectangle': 'agent',
  delay: 'flow',
  'half-rounded-rectangle': 'flow',
  'lin-rect': 'skill',
  'lined-rectangle': 'skill',
  'curv-trap': 'directive',
  'curved-trapezoid': 'directive',
};

/**
 * Metadata keys that never inherit through the def chain. `def` is
 * excluded because it is structural wiring, not domain metadata; the
 * other keys are the §13 presentation-only set reused from the semantic
 * projection.
 */
const INSTANCE_INHERITANCE_SKIP_KEYS = new Set<string>([...SEMANTIC_METADATA_SKIP_KEYS, 'def']);

/**
 * Metadata keys whose presence designates a node as a **connector** per
 * `AGENTFLOW-SYNTAX.md` §9.2. Any node carrying one or more of these
 * qualifies; the node's own id is the connector identity.
 */
const CONNECTOR_CONFIG_FIELDS = new Set<string>([
  'protocol',
  'endpoint',
  'transport',
  'command',
  'auth',
  'token_required',
]);

/**
 * Bare-id matcher for `connectorRef` weak-reference resolution per §9.1
 * and §10.1. Values that match this regex are resolved against the node
 * namespace; values that don't (dotted forms, URL-likes) are opaque.
 */
const CONNECTOR_REF_BARE_ID = /^[A-Z_a-z]\w*$/;

/**
 * Shapes that classify a node as an **artifact** per §13 applicability
 * ("artifact nodes (`doc`, etc.)"). Canonical shape ids only; the spec
 * is deliberately conservative about which shapes belong.
 */
const ARTIFACT_SHAPES = new Set<string>(['doc', 'lin-doc', 'lean-right', 'lean-left']);

/**
 * Shapes that classify a node as a **reference** per §13 applicability
 * ("reference nodes (`procs`)"). Only the canonical shape id is listed.
 */
const REFERENCE_SHAPES = new Set<string>(['procs']);

/**
 * Metadata keys that are valid on **any** authored element per
 * `AGENTFLOW-SYNTAX.md` §13.1 (cross-cutting) plus the structural and
 * presentation controls tracked by the DB. These never surface a
 * `METADATA_KEY_MISAPPLIED` warning regardless of element kind.
 */
const UNIVERSAL_METADATA_KEYS = new Set<string>([
  // §13.1 cross-cutting
  'description',
  // Structural wiring exposed via metadata
  'shape',
  'label',
  'labelType',
  'def',
  // Presentation (§14) — also excluded from inheritance in §11.3
  'view',
  'icon',
  'img',
  'w',
  'h',
  'class',
  'style',
  'form',
  'pos',
  'animate',
  'animation',
  'curve',
  'constraint',
]);

/**
 * The element kinds the §13 applicability table addresses. Plain
 * unclassified vertices and the legacy `subgraph` / `group` containers
 * are unrestricted and never reach this lookup.
 */
type MetadataApplicabilityKind =
  | 'agent'
  | 'flow'
  | 'task'
  | 'skill'
  | 'tool'
  | 'connector'
  | 'directive'
  | 'testCase'
  | 'artifact'
  | 'reference';

/**
 * §13 Metadata Applicability — the normative allowed-key set per element
 * kind. `description` and universal keys are handled separately via
 * `UNIVERSAL_METADATA_KEYS`, so they do not appear here.
 */
const METADATA_APPLICABILITY: Readonly<Record<MetadataApplicabilityKind, ReadonlySet<string>>> = {
  agent: new Set(['model', 'permits', 'memory', 'fallbacks']),
  flow: new Set(['params', 'returns']),
  task: new Set(['execution', 'params', 'returns', 'fallbacks']),
  skill: new Set(['strategy', 'params', 'returns', 'fallbacks']),
  tool: new Set([
    'params',
    'returns',
    'requires',
    'deny',
    'retry',
    'cache',
    'validate',
    'handler',
    'transport',
    'command',
    'connectorRef',
  ]),
  connector: new Set(['protocol', 'endpoint', 'transport', 'command', 'auth', 'token_required']),
  directive: new Set(['rule', 'severity', 'context', 'params']),
  testCase: new Set(['assert', 'expects']),
  // §13 separates input nodes (`lean-right`) from artifact nodes (`doc`,
  // `lin-doc`) into two rows that both accept v0.6.0 `value`/`example`.
  // ARTIFACT_SHAPES (above) currently lumps both rows under `artifact`;
  // the allowed-key set is identical so the union is correct for v0.6.0.
  // A future split into a separate `input` kind is purely additive.
  artifact: new Set(['output', 'value', 'example']),
  reference: new Set(['typeRef', 'templateRef', 'src']),
};

/**
 * Union of every key that appears in any row of the applicability
 * table. Used to distinguish "known domain key on the wrong element"
 * (warn) from "unknown key" (preserved silently in this PR). Computed
 * once at module load.
 */
const ALL_APPLICABILITY_KEYS: ReadonlySet<string> = new Set(
  Object.values(METADATA_APPLICABILITY).flatMap((s) => [...s])
);

/**
 * Synthetic IDs reserved by the renderer per `AGENTFLOW-SYNTAX.md` §10.
 * Authors who declare a vertex or container with one of these ids get a
 * `RESERVED_SYNTHETIC_ID` warning. Auto-numbered subgraph ids
 * (`subGraph0`, `subGraph1` …) are internal to the DB and never reach
 * user declarations, so they are not listed here.
 */
const RESERVED_SYNTHETIC_IDS = new Set<string>(['typesGroup', 'templatesGroup']);

/**
 * Child kinds recognised by the §3.3 containment matrix. `node` is the
 * catch-all for any plain vertex that isn't a typed container or a tool.
 */
type ContainmentChildKind =
  | 'agent'
  | 'flow'
  | 'task'
  | 'skill'
  | 'directive'
  | 'testCase'
  | 'tool'
  | 'node';

/** Parent kinds that §3.3 constrains. Legacy `subgraph` and `group` are
 *  the unrestricted escape hatches and are not listed. */
type ContainmentParentKind = 'agent' | 'flow' | 'task' | 'skill' | 'directive' | 'testCase';

/**
 * §3.3 Containment Rules — allowed children per parent container kind.
 * Tools are leaves (cannot be parents); `subgraph` and `group` are the
 * legacy escape hatches and accept anything.
 */
const CONTAINMENT_ALLOWED_CHILDREN: Readonly<
  Record<ContainmentParentKind, ReadonlySet<ContainmentChildKind>>
> = {
  agent: new Set(['flow', 'task', 'skill', 'directive', 'testCase', 'tool', 'node']),
  flow: new Set(['task', 'agent', 'skill', 'directive', 'testCase', 'tool', 'node']),
  task: new Set(['tool', 'directive', 'node']),
  skill: new Set(['tool', 'flow', 'directive', 'node']),
  directive: new Set(['node']),
  testCase: new Set(['directive', 'node']),
};

/** Maps subgraph container types to their cluster shape IDs. */
const SUBGRAPH_TYPE_TO_SHAPE: Record<NonNullable<FlowSubGraph['type']>, ClusterShapeID> = {
  agent: 'agentGroup',
  flow: 'flowGroup',
  task: 'taskGroup',
  skill: 'skillGroup',
  test: 'testGroup',
  directive: 'directiveGroup',
  group: 'groupGroup',
  types: 'typesGroup',
  templates: 'templatesGroup',
  subgraph: 'rect',
};

// We are using arrow functions assigned to class instance fields instead of methods as they are required by JISON
export class AgentFlowDB implements DiagramDB {
  private vertexCounter = 0;
  private config = getConfig();
  private vertices = new Map<string, FlowVertex>();
  private edges: FlowEdge[] & { defaultInterpolate?: string; defaultStyle?: string[] } = [];
  private classes = new Map<string, FlowClass>();
  private subGraphs: FlowSubGraph[] = [];
  private subGraphLookup = new Map<string, FlowSubGraph>();
  private typeDeclarations = new Map<string, AgentFlowTypeDeclaration>();
  private templateDeclarations = new Map<string, AgentFlowTemplateDeclaration>();
  private declarationGroupMetadata = new Map<string, Record<string, unknown>>();

  // ── Identifier-resolution tracking (wave-3 PR B, §10) ────────────────
  // Per-namespace sets of IDs that have received a **declarative** call.
  // Implicit vertices created by edge resolution (e.g. the `a` in
  // `a --> b`) are excluded; only named vertex declarations with label,
  // shape, or container keyword register here. Duplicate detection emits
  // DUPLICATE_ID_NODE / DUPLICATE_ID_TYPE / DUPLICATE_ID_TEMPLATE and
  // RESERVED_SYNTHETIC_ID for authorial claims on renderer-reserved ids.
  private seenDeclaredNodeIds = new Set<string>();
  private seenTypeNames = new Set<string>();
  private seenTemplateNames = new Set<string>();
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

  /**
   * Populated by `resolveInstances()` per AGENTFLOW-SYNTAX.md §11.3 — keyed
   * by the instance vertex id, value is the merged domain metadata (def
   * chain inherited, local overrides applied). Surfaced by
   * `getSemanticModel()` as `SemanticVertex.resolvedMetadata`. Only
   * populated for instance-shape vertices whose chain fully resolved
   * (no missing def, no cycle, no kind mismatch).
   */
  private resolvedInstanceMetadata = new Map<string, Record<string, unknown>>();

  // Functions to be run after graph rendering
  private funs: ((element: Element) => void)[] = []; // cspell:ignore funs

  constructor() {
    this.funs.push(this.setupToolTips.bind(this));

    // Needed for JISON since it only supports direct properties
    this.addVertex = this.addVertex.bind(this);
    this.firstGraph = this.firstGraph.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.addSubGraph = this.addSubGraph.bind(this);
    this.addTypeDeclaration = this.addTypeDeclaration.bind(this);
    this.addTemplateDeclaration = this.addTemplateDeclaration.bind(this);
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
    this.addTypeMapping = this.addTypeMapping.bind(this);
    this.addTemplateMapping = this.addTemplateMapping.bind(this);

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

  private parseRecordFields(body: string): AgentFlowTypeField[] {
    const trimmedBody = body.trim();
    if (trimmedBody.length === 0) {
      return [];
    }

    return trimmedBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const fieldMatch = RECORD_FIELD_RE.exec(line);
        if (!fieldMatch) {
          throw new Error(`Invalid agentflow record field declaration: ${line}`);
        }

        return {
          name: fieldMatch[1],
          type: fieldMatch[2].trim(),
        };
      });
  }

  private parseTemplateDeclaration(declaration: string): AgentFlowTemplateDeclaration {
    const trimmed = declaration.trim();
    // Match: template %name { ... } or template name { ... }
    const match = /^template\s+%?([A-Z_a-z]\w*)\s*{([\S\s]*)}$/.exec(trimmed);
    if (!match) {
      throw new Error(`Invalid agentflow template declaration: ${trimmed}`);
    }

    const [, name, body] = match;
    const fields = this.parseTemplateFields(body);
    return { name, fields };
  }

  private parseTemplateFields(body: string): AgentFlowTemplateField[] {
    const trimmedBody = body.trim();
    if (trimmedBody.length === 0) {
      return [];
    }

    return trimmedBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Check for section marker: "section NAME"
        const sectionMatch = /^section\s+(\S+.*)$/.exec(line);
        if (sectionMatch) {
          return {
            name: sectionMatch[1].trim(),
            type: 'section',
            description: '',
            kind: 'section' as const,
          };
        }

        // Match: NAME: Type [* N] <<description>>
        const fieldMatch = TEMPLATE_FIELD_RE.exec(line);
        if (!fieldMatch) {
          throw new Error(`Invalid agentflow template field: ${line}`);
        }

        const result: AgentFlowTemplateField = {
          name: fieldMatch[1],
          type: fieldMatch[2].trim(),
          description: fieldMatch[4].trim(),
        };

        if (fieldMatch[3]) {
          result.multiplicity = parseInt(fieldMatch[3], 10);
        }

        return result;
      });
  }

  private parseTypeDeclaration(declaration: string): AgentFlowTypeDeclaration {
    const trimmedDeclaration = declaration.trim();
    const opaqueMatch = /^type\s+([A-Z_a-z]\w*)$/.exec(trimmedDeclaration);
    if (opaqueMatch) {
      return {
        name: opaqueMatch[1],
        kind: 'opaque',
      };
    }

    const aliasMatch = /^type\s+([A-Z_a-z]\w*)\s*=\s*([\S\s]+)$/.exec(trimmedDeclaration);
    if (!aliasMatch) {
      throw new Error(`Invalid agentflow type declaration: ${trimmedDeclaration}`);
    }

    const [, name, expression] = aliasMatch;
    const trimmedExpression = expression.trim();
    const recordMatch = /^Record\s*{([\S\s]*)}$/.exec(trimmedExpression);

    if (recordMatch) {
      return {
        name,
        kind: 'record',
        fields: this.parseRecordFields(recordMatch[1]),
      };
    }

    return {
      name,
      kind: 'alias',
      expression: trimmedExpression,
    };
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

    // Check if this is a subgraph (e.g. my_agent@{ view: "collapsed" })
    const subGraph = this.subGraphLookup.get(id);
    if (subGraph && doc) {
      subGraph.metadata = { ...subGraph.metadata, ...(doc as unknown as Record<string, unknown>) };
      return;
    }

    // Identifier-resolution tracking (§10) — a "declarative" call is one
    // where the author wrote a label or an inline shape keyword. Pure
    // metadata attachments (`id@{ ... }`) and implicit vertices created
    // by edge resolution (`a --> b`) do NOT count as declarations.
    const isDeclarative = textObj !== undefined || type !== undefined;
    if (isDeclarative && id) {
      this.recordDeclaredNodeId(id);
    }

    // Reserve 'types', 'templates', and 'connectors' as declaration group IDs.
    // The subgraph branch above runs first, so a user-declared
    // `subgraph connectors[...]` still owns the id `connectors`; the
    // reserved-id path here only applies when no such subgraph exists.
    if (id === 'types' || id === 'templates' || id === 'connectors') {
      if (doc) {
        this.declarationGroupMetadata.set(id, doc as unknown as Record<string, unknown>);
      }
      return;
    }

    // Check if this is an individual type or template declaration
    if (doc) {
      const typeDecl = this.typeDeclarations.get(id);
      if (typeDecl) {
        typeDecl.metadata = doc as unknown as Record<string, unknown>;
        return;
      }
      const templateDecl = this.templateDeclarations.get(id);
      if (templateDecl) {
        templateDecl.metadata = doc as unknown as Record<string, unknown>;
        return;
      }
    }

    // Check if this is an edge
    const edge = this.edges.find((e) => e.id === id);
    if (edge) {
      const edgeDoc = doc as EdgeMetaData;
      if (edgeDoc?.animate !== undefined) {
        edge.animate = edgeDoc.animate;
      }
      if (edgeDoc?.animation !== undefined) {
        edge.animation = edgeDoc.animation;
      }
      if (edgeDoc?.curve !== undefined) {
        edge.interpolate = edgeDoc.curve;
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
      if (doc?.constraint) {
        vertex.constraint = doc.constraint;
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
    this.typeDeclarations = new Map();
    this.templateDeclarations = new Map();
    this.declarationGroupMetadata = new Map();
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
    this.resolvedInstanceMetadata = new Map();
    this.seenDeclaredNodeIds = new Set();
    this.seenTypeNames = new Set();
    this.seenTemplateNames = new Set();
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
    type?: 'subgraph' | 'task' | 'agent' | 'flow' | 'skill' | 'test' | 'directive'
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

    const subGraph = {
      id: id,
      nodes: nodeList,
      title: title.trim(),
      classes: [],
      dir,
      labelType: this.sanitizeNodeLabelType(_title?.type),
      type: type ?? ('subgraph' as const),
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

  public addTypeDeclaration(declaration: string) {
    const parsedDeclaration = this.parseTypeDeclaration(declaration);
    if (this.seenTypeNames.has(parsedDeclaration.name)) {
      this.emitWarning(
        'DUPLICATE_ID_TYPE',
        `duplicate type declaration "${parsedDeclaration.name}" (see AGENTFLOW-SYNTAX.md §10)`,
        { nodeId: parsedDeclaration.name }
      );
    } else {
      this.seenTypeNames.add(parsedDeclaration.name);
    }
    this.typeDeclarations.set(parsedDeclaration.name, parsedDeclaration);
    return parsedDeclaration.name;
  }

  public addTemplateDeclaration(declaration: string) {
    // eslint-disable-next-line no-console
    console.log(
      AGENTFLOW_TPL_VERSION + ': addTemplateDeclaration called',
      declaration.slice(0, 80)
    );
    const parsedDeclaration = this.parseTemplateDeclaration(declaration);
    // eslint-disable-next-line no-console
    console.log(
      AGENTFLOW_TPL_VERSION + ': parsed template',
      parsedDeclaration.name,
      parsedDeclaration.fields.length,
      'fields'
    );
    if (this.seenTemplateNames.has(parsedDeclaration.name)) {
      this.emitWarning(
        'DUPLICATE_ID_TEMPLATE',
        `duplicate template declaration "${parsedDeclaration.name}" (see AGENTFLOW-SYNTAX.md §10)`,
        { nodeId: parsedDeclaration.name }
      );
    } else {
      this.seenTemplateNames.add(parsedDeclaration.name);
    }
    this.templateDeclarations.set(parsedDeclaration.name, parsedDeclaration);
    return parsedDeclaration.name;
  }

  public getSubGraphs() {
    return this.subGraphs;
  }

  public getTypeDeclarations() {
    return [...this.typeDeclarations.values()];
  }

  public getTypeDeclarationsByName(): AgentFlowTypeDeclarationsByName {
    return Object.fromEntries(this.typeDeclarations.entries());
  }

  public getTemplateDeclarations() {
    return [...this.templateDeclarations.values()];
  }

  public getTemplateDeclarationsByName(): AgentFlowTemplateDeclarationsByName {
    return Object.fromEntries(this.templateDeclarations.entries());
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
   * `edgeSemantic` value defined by `AGENTFLOW-SYNTAX.md` §5.1. Returns
   * `undefined` for combinations not enumerated in the spec table (e.g.
   * `<-->` → `double_arrow_point`/`normal`).
   */
  private computeEdgeSemantic(
    type: string | undefined,
    stroke: string | undefined
  ): EdgeSemantic | undefined {
    if (!type || !stroke) {
      return undefined;
    }
    if (stroke === 'invisible') {
      return undefined;
    }
    switch (type) {
      case 'arrow_point':
        if (stroke === 'normal') {
          return 'control';
        }
        if (stroke === 'thick') {
          return 'data';
        }
        if (stroke === 'dotted') {
          return 'governance';
        }
        return undefined;
      case 'arrow_circle':
        return stroke === 'normal' ? 'conformance' : undefined;
      case 'arrow_hierarchy':
        return stroke === 'normal' ? 'delegation' : undefined;
      case 'arrow_cross':
        return stroke === 'normal' ? 'failure' : undefined;
      case 'arrow_open':
        return stroke === 'normal' ? 'association' : undefined;
      case 'double_arrow_circle':
        return stroke === 'normal' ? 'bidirectional' : undefined;
      default:
        return undefined;
    }
  }

  private destructStartLink(_str: string): FlowLink {
    let str = _str.trim();
    let type = 'arrow_open';

    switch (str[0]) {
      case '<':
        type = 'arrow_point';
        str = str.slice(1);
        break;
      case 'x':
        type = 'arrow_cross';
        str = str.slice(1);
        break;
      case 'o':
        type = 'arrow_circle';
        str = str.slice(1);
        break;
    }

    let stroke = 'normal';

    if (str.includes('=')) {
      stroke = 'thick';
    }

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

    // Check for double-character arrow endings first
    if (str.endsWith('>>')) {
      type = 'arrow_hierarchy';
      line = str.slice(0, -2);
    } else {
      switch (str.slice(-1)) {
        case 'x':
          type = 'arrow_cross';
          if (str.startsWith('x')) {
            type = 'double_' + type;
            line = line.slice(1);
          }
          break;
        case '>':
          type = 'arrow_point';
          if (str.startsWith('<')) {
            type = 'double_' + type;
            line = line.slice(1);
          }
          break;
        case 'o':
          type = 'arrow_circle';
          if (str.startsWith('o')) {
            type = 'double_' + type;
            line = line.slice(1);
          }
          break;
      }
    }

    let stroke = 'normal';
    let length = line.length - 1;

    if (line.startsWith('=')) {
      stroke = 'thick';
    }

    if (line.startsWith('~')) {
      stroke = 'invisible';
    }

    const dots = this.countChar('.', line);

    if (dots) {
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

      if (startInfo.type === 'arrow_open') {
        // -- xyz -->  - take arrow type from ending
        startInfo.type = info.type;
      } else {
        // x-- xyz -->  - not supported
        if (startInfo.type !== info.type) {
          return { type: 'INVALID', stroke: 'INVALID' };
        }

        startInfo.type = 'double_' + startInfo.type;
      }

      if (startInfo.type === 'double_arrow') {
        startInfo.type = 'double_arrow_point';
      }

      startInfo.length = info.length;
      return {
        ...startInfo,
        edgeSemantic: this.computeEdgeSemantic(startInfo.type, startInfo.stroke),
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
    switch (vertex.type) {
      case 'square':
      case undefined:
        return 'squareRect';
      case 'round':
        return 'roundedRect';
      case 'ellipse':
        // @ts-expect-error -- Ellipses are broken, see https://github.com/mermaid-js/mermaid/issues/5976
        return 'ellipse';
      default:
        return vertex.type;
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
        constraint: vertex.constraint,
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
   * Closes [#4](https://github.com/Mermaid-Chart/agentflow/issues/4).
   *
   * Per `AGENTFLOW-SYNTAX.md` §4.2, `diamond` is the only canonical
   * branching vertex. A `hexagon` is a condition/classification source
   * whose outgoing edges feed a branch; it is not itself the branching
   * vertex. A hexagon with two-or-more branch-labelled outgoing edges is
   * very likely a misuse, so we emit a `HEXAGON_MULTI_BRANCH` warning
   * with the hexagon's id and source position.
   *
   * "Branch-labelled" = outgoing edge whose `text` is non-empty after
   * trimming. Unlabelled outgoing edges (join-style connections) don't
   * count. Both the canonical shape id (`hexagon`) and its alias (`hex`)
   * are detected.
   */
  private validateHexagonBranching(): void {
    const hexIds = new Set<string>();
    for (const [id, v] of this.vertices) {
      if (v.type === 'hexagon' || v.type === 'hex') {
        hexIds.add(id);
      }
    }
    if (hexIds.size === 0) {
      return;
    }

    const labelledCounts = new Map<string, number>();
    for (const edge of this.edges) {
      if (!hexIds.has(edge.start)) {
        continue;
      }
      const text = typeof edge.text === 'string' ? edge.text : '';
      if (text.trim() === '') {
        continue;
      }
      labelledCounts.set(edge.start, (labelledCounts.get(edge.start) ?? 0) + 1);
    }

    for (const [id, count] of labelledCounts) {
      if (count >= 2) {
        this.emitWarning(
          'HEXAGON_MULTI_BRANCH',
          `hexagon "${id}" has ${count} branch-labelled outgoing edges; use a diamond for branching (see AGENTFLOW-SYNTAX.md §4.2)`,
          { nodeId: id }
        );
      }
    }
  }

  /**
   * Returns a vertex's domain metadata — its authored metadata with the
   * presentation-only and structural-wiring keys stripped per §11.3.
   * Used both by the inheritance merge and the instance's own local layer.
   */
  private domainMetadataOfVertex(vertex: FlowVertex): Record<string, unknown> {
    if (!vertex.metadata) {
      return {};
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(vertex.metadata)) {
      if (INSTANCE_INHERITANCE_SKIP_KEYS.has(key)) {
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  private domainMetadataOfSubGraph(sg: FlowSubGraph): Record<string, unknown> {
    if (!sg.metadata) {
      return {};
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sg.metadata)) {
      if (INSTANCE_INHERITANCE_SKIP_KEYS.has(key)) {
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §11: for every vertex carrying an instance
   * shape (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`),
   * resolve its `def` chain and:
   *
   *   1. Emit `INSTANCE_DEF_MISSING` if `def` is absent, empty, or points
   *      to an id that matches neither a vertex nor a subgraph.
   *   2. Emit `INSTANCE_DEF_CYCLE` if the chain cycles (self-loop or
   *      multi-hop). Suppresses kind and missing-def warnings for the
   *      affected instance — the cycle is the root cause.
   *   3. Emit `INSTANCE_KIND_MISMATCH` when the chain's terminal target
   *      is the wrong kind for the instance shape per §11.1.
   *   4. On clean resolution, compute the merged domain metadata
   *      (deepest def → local, local wins on collision, presentation /
   *      structural keys stripped per §11.3) and stash it under the
   *      instance id for `getSemanticModel()` to surface.
   *
   * Structure is not cloned into the instance site (§11.3) — this pass
   * touches metadata only.
   */
  private resolveInstances(): void {
    for (const [id, vertex] of this.vertices) {
      const shape = vertex.type as string | undefined;
      if (shape === undefined) {
        continue;
      }
      const expectedKind = INSTANCE_SHAPE_TO_KIND[shape];
      if (expectedKind === undefined) {
        continue;
      }

      const def = vertex.metadata?.def;
      if (typeof def !== 'string' || def.length === 0) {
        this.emitWarning(
          'INSTANCE_DEF_MISSING',
          `${shape} instance "${id}" has no def (see AGENTFLOW-SYNTAX.md §11.2)`,
          { nodeId: id }
        );
        continue;
      }

      // Walk the chain from the instance's def outward. Each step is
      // either a vertex (which may itself be another instance and carry
      // a def metadata to follow) or a subgraph (terminal — containers
      // are not instances themselves).
      //
      // `accumulated` holds the inherited metadata so far with the
      // deepest definition's domain on the bottom and each closer def
      // layered on top; we apply the instance's local layer last.
      const visited = new Set<string>([id]);
      const chainMetadata: Record<string, unknown>[] = [];
      let cursor: string = def;
      let cycleDetected = false;
      let missingDetected = false;
      let terminalKind: InstanceDefKind | null = null;

      while (true) {
        if (visited.has(cursor)) {
          this.emitWarning(
            'INSTANCE_DEF_CYCLE',
            `${shape} instance "${id}" has a cyclic def chain (see AGENTFLOW-SYNTAX.md §11.2)`,
            { nodeId: id }
          );
          cycleDetected = true;
          break;
        }
        visited.add(cursor);

        const targetVertex = this.vertices.get(cursor);
        const targetSub = this.subGraphLookup.get(cursor);

        if (targetSub) {
          // Containers are terminal — resolve kind against the subgraph type.
          chainMetadata.push(this.domainMetadataOfSubGraph(targetSub));
          const sgType = targetSub.type;
          if (
            sgType === 'agent' ||
            sgType === 'flow' ||
            sgType === 'skill' ||
            sgType === 'directive'
          ) {
            terminalKind = sgType;
          }
          break;
        }

        if (!targetVertex) {
          this.emitWarning(
            'INSTANCE_DEF_MISSING',
            `${shape} instance "${id}" references def "${cursor}" which does not match any vertex or container (see AGENTFLOW-SYNTAX.md §11.2)`,
            { nodeId: id }
          );
          missingDetected = true;
          break;
        }

        chainMetadata.push(this.domainMetadataOfVertex(targetVertex));

        const nextDef = targetVertex.metadata?.def;
        if (typeof nextDef === 'string' && nextDef.length > 0) {
          // Intermediate instance — follow the chain.
          cursor = nextDef;
          continue;
        }

        // Leaf vertex — terminal. Resolve kind from the vertex.
        if (this.isToolDefinition(targetVertex)) {
          terminalKind = 'tool';
        }
        break;
      }

      if (cycleDetected || missingDetected) {
        continue;
      }

      if (terminalKind !== expectedKind) {
        this.emitWarning(
          'INSTANCE_KIND_MISMATCH',
          `${shape} instance "${id}" has def "${def}" which does not resolve to a ${expectedKind} definition (see AGENTFLOW-SYNTAX.md §11.1)`,
          { nodeId: id }
        );
        continue;
      }

      // Merge: deepest def's domain metadata on the bottom, each closer
      // def on top, the instance's own local domain last.
      const merged: Record<string, unknown> = {};
      for (let i = chainMetadata.length - 1; i >= 0; i--) {
        Object.assign(merged, chainMetadata[i]);
      }
      Object.assign(merged, this.domainMetadataOfVertex(vertex));
      this.resolvedInstanceMetadata.set(id, merged);
    }
  }

  /**
   * Returns true when `vertex` is a **connector-designated node** per
   * `AGENTFLOW-SYNTAX.md` §9.2 — its metadata carries one or more of
   * the connector configuration fields. Used by
   * `validateConnectorReferences()` for the not-a-connector check.
   */
  private isConnectorDesignated(vertex: FlowVertex): boolean {
    if (!vertex.metadata) {
      return false;
    }
    for (const key of Object.keys(vertex.metadata)) {
      if (CONNECTOR_CONFIG_FIELDS.has(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns all connector-designated vertices in declaration order. Used
   * by the synthesized `agentflow-connectors-group` rendering path so the
   * agentflow-editor can expand/collapse the connectors group with a
   * stable id (parallel to `agentflow-types-group` /
   * `agentflow-templates-group`).
   */
  public getConnectorDesignatedVertices(): FlowVertex[] {
    const out: FlowVertex[] = [];
    for (const vertex of this.vertices.values()) {
      if (this.isConnectorDesignated(vertex)) {
        out.push(vertex);
      }
    }
    return out;
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §9.1 (revision 8): for every node tagged
   * `@{ connectorRef: "<value>" }`, classify the value:
   *   - bare id matching `[A-Za-z_]\w*` → resolve against node namespace:
   *       - no node                     → CONNECTOR_REF_UNRESOLVED
   *       - node not connector-designated → CONNECTOR_REF_NOT_A_CONNECTOR
   *       - connector-designated node   → no diagnostic
   *   - dotted form / URL-like / anything else → opaque, no diagnostic
   */
  private validateConnectorReferences(): void {
    for (const [id, vertex] of this.vertices) {
      const ref = vertex.metadata?.connectorRef;
      if (typeof ref !== 'string' || ref.length === 0) {
        continue;
      }
      if (!CONNECTOR_REF_BARE_ID.test(ref)) {
        // Dotted form, URL-like, or other non-bare value — opaque.
        continue;
      }
      const target = this.vertices.get(ref);
      if (!target) {
        this.emitWarning(
          'CONNECTOR_REF_UNRESOLVED',
          `connectorRef "${ref}" on node "${id}" does not match any node in the diagram (see AGENTFLOW-SYNTAX.md §9.1)`,
          { nodeId: id }
        );
        continue;
      }
      if (!this.isConnectorDesignated(target)) {
        this.emitWarning(
          'CONNECTOR_REF_NOT_A_CONNECTOR',
          `connectorRef "${ref}" on node "${id}" resolves to node "${ref}" but it carries none of the connector configuration fields (protocol/endpoint/transport/command/auth/token_required) — see AGENTFLOW-SYNTAX.md §9.2`,
          { nodeId: id }
        );
      }
    }
  }

  /**
   * Classify a vertex against the §13 applicability rows. Returns
   * `null` for unclassified / plain vertices — those have no
   * applicability restrictions and are skipped by the validator.
   *
   * Classification priority matters when a vertex could match multiple
   * rows: a tool (shape: subroutine) that also carries connector
   * configuration fields uses the tool row, not the connector row.
   * The spec's tool row already lists `transport` and `command`, so
   * this priority preserves the tool's richer allowed set.
   */
  private classifyVertexForApplicability(vertex: FlowVertex): MetadataApplicabilityKind | null {
    if (this.isToolDefinition(vertex)) {
      return 'tool';
    }
    if (this.isConnectorDesignated(vertex)) {
      return 'connector';
    }
    const shape = vertex.type as string | undefined;
    if (shape !== undefined) {
      if (REFERENCE_SHAPES.has(shape)) {
        return 'reference';
      }
      if (ARTIFACT_SHAPES.has(shape)) {
        return 'artifact';
      }
    }
    return null;
  }

  /**
   * Classify a subgraph against the §13 applicability rows. Returns
   * `null` for the legacy unrestricted containers (`subgraph`, `group`)
   * and for the synthetic declaration groups (`types`, `templates`).
   */
  private classifySubGraphForApplicability(sg: FlowSubGraph): MetadataApplicabilityKind | null {
    switch (sg.type) {
      case 'agent':
        return 'agent';
      case 'flow':
        return 'flow';
      case 'task':
        return 'task';
      case 'skill':
        return 'skill';
      case 'directive':
        return 'directive';
      case 'test':
        return 'testCase';
      default:
        return null;
    }
  }

  /**
   * Classify a subgraph's `type` as a containment-parent kind. Returns
   * `null` for `subgraph` / `group` (legacy unrestricted escape hatch)
   * and for the synthetic declaration groups (`types`, `templates`).
   */
  private classifyContainmentParent(sg: FlowSubGraph): ContainmentParentKind | null {
    switch (sg.type) {
      case 'agent':
        return 'agent';
      case 'flow':
        return 'flow';
      case 'task':
        return 'task';
      case 'skill':
        return 'skill';
      case 'directive':
        return 'directive';
      case 'test':
        return 'testCase';
      default:
        return null;
    }
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
          `metadata key "${key}" is not valid on ${kind} "${id}" (see AGENTFLOW-SYNTAX.md §13)`,
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
      if (kind === null) {
        continue;
      }
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
        `identifier "${id}" is reserved for renderer synthetics (see AGENTFLOW-SYNTAX.md §10)`,
        { nodeId: id }
      );
      return;
    }
    if (this.seenDeclaredNodeIds.has(id)) {
      this.emitWarning(
        'DUPLICATE_ID_NODE',
        `duplicate declaration for id "${id}" in the node-or-container namespace (see AGENTFLOW-SYNTAX.md §10)`,
        { nodeId: id }
      );
      return;
    }
    this.seenDeclaredNodeIds.add(id);
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §10.1: semantic references must resolve in
   * their namespace. This pass handles `typeRef` and `templateRef`;
   * `def` is covered by `resolveInstances()` with `INSTANCE_DEF_MISSING`
   * so we skip it here to avoid double-firing. `src`, `click`, and
   * `href` are hygiene-only — not validated for existence.
   */
  private resolveReferences(): void {
    for (const [id, vertex] of this.vertices) {
      const typeRef = vertex.metadata?.typeRef;
      if (
        typeof typeRef === 'string' &&
        typeRef.length > 0 &&
        !this.typeDeclarations.has(typeRef)
      ) {
        this.emitWarning(
          'REFERENCE_UNRESOLVED',
          `typeRef "${typeRef}" on node "${id}" does not match any declared type (see AGENTFLOW-SYNTAX.md §10.1)`,
          { nodeId: id }
        );
      }
      const templateRef = vertex.metadata?.templateRef;
      if (
        typeof templateRef === 'string' &&
        templateRef.length > 0 &&
        !this.templateDeclarations.has(templateRef)
      ) {
        this.emitWarning(
          'REFERENCE_UNRESOLVED',
          `templateRef "${templateRef}" on node "${id}" does not match any declared template (see AGENTFLOW-SYNTAX.md §10.1)`,
          { nodeId: id }
        );
      }
    }
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §10.2: a `procs` reference node must carry
   * at most one of `typeRef` / `templateRef` / `src`; multiple values
   * emit `REF_KIND_CONFLICT`. The legacy `type` key is accepted with a
   * deprecation warning and resolved through the three-case rule.
   *
   * The rule is scoped to the `procs` shape — `type` on a non-procs
   * node is not a reference key and is not affected.
   */
  private validateReferenceKinds(): void {
    for (const [id, vertex] of this.vertices) {
      if (vertex.type !== 'procs') {
        continue;
      }
      const metadata = vertex.metadata ?? {};
      const hasTypeRef = typeof metadata.typeRef === 'string' && metadata.typeRef.length > 0;
      const hasTemplateRef =
        typeof metadata.templateRef === 'string' && metadata.templateRef.length > 0;
      const hasSrc = typeof metadata.src === 'string' && metadata.src.length > 0;
      const modernCount = Number(hasTypeRef) + Number(hasTemplateRef) + Number(hasSrc);
      if (modernCount >= 2) {
        this.emitWarning(
          'REF_KIND_CONFLICT',
          `reference node "${id}" has multiple of typeRef / templateRef / src set — pick exactly one (see AGENTFLOW-SYNTAX.md §10.2)`,
          { nodeId: id }
        );
      }

      const legacy = metadata.type;
      if (typeof legacy !== 'string' || legacy.length === 0) {
        continue;
      }
      this.emitWarning(
        'REF_KIND_LEGACY_DEPRECATED',
        `reference node "${id}" uses the legacy \`type\` key — use \`typeRef\` or \`templateRef\` instead (see AGENTFLOW-SYNTAX.md §10.2)`,
        { nodeId: id }
      );

      // Trichotomy resolution only applies when the author has NOT also
      // written a modern key — the modern key is authoritative.
      if (modernCount > 0) {
        continue;
      }
      const matchesType = this.typeDeclarations.has(legacy);
      const matchesTemplate = this.templateDeclarations.has(legacy);
      if (matchesType && matchesTemplate) {
        this.emitWarning(
          'REF_KIND_LEGACY_AMBIGUOUS',
          `legacy \`type: "${legacy}"\` on "${id}" matches both a type and a template — use typeRef or templateRef to disambiguate (see AGENTFLOW-SYNTAX.md §10.2)`,
          { nodeId: id }
        );
      } else if (!matchesType && !matchesTemplate) {
        this.emitWarning(
          'REF_KIND_LEGACY_UNRESOLVED',
          `legacy \`type: "${legacy}"\` on "${id}" does not match any declared type or template (see AGENTFLOW-SYNTAX.md §10.2)`,
          { nodeId: id }
        );
      }
    }
  }

  /**
   * Classify a child id for containment-matrix lookup. Subgraph children
   * project their container kind; vertex children project `tool` when
   * they meet `isToolDefinition()` or `node` otherwise.
   */
  private classifyContainmentChild(childId: string): ContainmentChildKind | null {
    const childSub = this.subGraphLookup.get(childId);
    if (childSub) {
      switch (childSub.type) {
        case 'agent':
          return 'agent';
        case 'flow':
          return 'flow';
        case 'task':
          return 'task';
        case 'skill':
          return 'skill';
        case 'directive':
          return 'directive';
        case 'test':
          return 'testCase';
        default:
          // Legacy `subgraph` / `group` child — treat as `node` so
          // containment rules apply; the escape hatch only releases
          // the parent from validation, not the grandchildren.
          return 'node';
      }
    }
    const childVertex = this.vertices.get(childId);
    if (!childVertex) {
      return null;
    }
    if (this.isToolDefinition(childVertex)) {
      return 'tool';
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
   * Returns true when an edge endpoint id refers to an `agent` subgraph
   * or to an agent-instance vertex (`tag-rect` / `tagged-rectangle`).
   * Used by the delegation and failure edge checks.
   */
  private isAgentEndpoint(id: string): boolean {
    const sg = this.subGraphLookup.get(id);
    if (sg && sg.type === 'agent') {
      return true;
    }
    const vertex = this.vertices.get(id);
    if (vertex && (vertex.type === 'tag-rect' || vertex.type === 'tagged-rectangle')) {
      return true;
    }
    return false;
  }

  /**
   * Returns true when an edge endpoint id refers to a reference node
   * per §13 applicability (`shape: procs`). Used by the conformance
   * edge check.
   */
  private isReferenceEndpoint(id: string): boolean {
    const vertex = this.vertices.get(id);
    return vertex !== undefined && vertex.type === 'procs';
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §5.1: every edge operator has a primary
   * semantic. When the semantic contradicts the endpoint kinds, emit
   * `EDGE_SEMANTIC_CONTRADICTION`. Three specific rules:
   *   - delegation (`-->>`) source must be an agent.
   *   - failure    (`--x`)  source must be an agent.
   *   - conformance (`--o`) target must be a reference node.
   *
   * Container-boundary contract violations for `==>` are covered by
   * `validateContainerEdges()` (PR E) — not this pass.
   */
  private validateEdgeEndpointKinds(): void {
    for (const edge of this.edges) {
      const semantic = edge.edgeSemantic;
      if (semantic === undefined) {
        continue;
      }
      if (semantic === 'delegation' && !this.isAgentEndpoint(edge.start)) {
        this.emitWarning(
          'EDGE_SEMANTIC_CONTRADICTION',
          `delegation edge source "${edge.start}" is not an agent (see AGENTFLOW-SYNTAX.md §5.1)`,
          { edgeId: edge.id }
        );
        continue;
      }
      if (semantic === 'failure' && !this.isAgentEndpoint(edge.start)) {
        this.emitWarning(
          'EDGE_SEMANTIC_CONTRADICTION',
          `failure edge source "${edge.start}" is not an agent (see AGENTFLOW-SYNTAX.md §5.1)`,
          { edgeId: edge.id }
        );
        continue;
      }
      if (semantic === 'conformance' && !this.isReferenceEndpoint(edge.end)) {
        this.emitWarning(
          'EDGE_SEMANTIC_CONTRADICTION',
          `conformance edge target "${edge.end}" is not a reference node (shape: procs) (see AGENTFLOW-SYNTAX.md §5.1)`,
          { edgeId: edge.id }
        );
        continue;
      }
    }
  }

  /**
   * Normalise a list-valued metadata key per §12.1. Returns an array
   * regardless of whether the source was an array or a legacy
   * comma-separated string. The legacy form emits
   * `CAPABILITY_LIST_LEGACY_STRING` once per offending key per site.
   * Returns `undefined` when the key is absent or empty.
   */
  private readCapabilityList(
    siteId: string,
    metadata: Record<string, unknown> | undefined,
    key: 'permits' | 'requires' | 'deny' | 'fallbacks' | 'directives'
  ): string[] | undefined {
    if (!metadata) {
      return undefined;
    }
    const raw = metadata[key];
    if (Array.isArray(raw)) {
      return raw.map((v) => String(v));
    }
    if (typeof raw === 'string' && raw.length > 0) {
      this.emitWarning(
        'CAPABILITY_LIST_LEGACY_STRING',
        `\`${key}\` on "${siteId}" is a comma-separated string — use a YAML array (see AGENTFLOW-SYNTAX.md §12.1)`,
        { nodeId: siteId }
      );
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return undefined;
  }

  /**
   * Walk the structural parent chain of `id` (vertex or subgraph) to
   * find the nearest enclosing `agent` subgraph. Returns that
   * subgraph's id, or `undefined` when no ancestor agent exists.
   */
  private findEnclosingAgentId(id: string): string | undefined {
    const parent = new Map<string, string>();
    for (const sg of this.subGraphs) {
      for (const childId of sg.nodes) {
        parent.set(childId, sg.id);
      }
    }
    let cursor: string | undefined = parent.get(id);
    const seen = new Set<string>([id]);
    while (cursor !== undefined && !seen.has(cursor)) {
      seen.add(cursor);
      const sg = this.subGraphLookup.get(cursor);
      if (sg && sg.type === 'agent') {
        return cursor;
      }
      cursor = parent.get(cursor);
    }
    return undefined;
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §12: for every tool invocation site,
   * resolve the nearest enclosing agent and validate:
   *
   *     requires ⊆ permits  AND  requires ∩ deny = ∅
   *
   * Invocation sites are:
   *   - vertices whose incoming edge terminates on a tool definition
   *     (the edge's source is the invocation site for parent lookup);
   *   - `win-pane` instance vertices whose resolved `def` chain (from
   *     wave-2 `resolveInstances()`) lands on a tool.
   *
   * Tool definitions themselves are NOT invocation sites. Delegation
   * (`-->>`) does not transfer capabilities — each invocation is
   * checked against its own structural enclosing agent.
   */
  private validateCapabilities(): void {
    const siteToTool: { siteId: string; toolId: string }[] = [];

    // 1. Edges into a tool → the edge source is the invocation site.
    for (const edge of this.edges) {
      const target = this.vertices.get(edge.end);
      if (!target || !this.isToolDefinition(target)) {
        continue;
      }
      siteToTool.push({ siteId: edge.start, toolId: edge.end });
    }

    // 2. win-pane instances with a resolved tool def → the instance
    //    is the invocation site; the tool is the chain's terminal.
    for (const [id, vertex] of this.vertices) {
      const shape = vertex.type as string | undefined;
      if (shape !== 'win-pane' && shape !== 'window-pane') {
        continue;
      }
      const def = vertex.metadata?.def;
      if (typeof def !== 'string' || def.length === 0) {
        continue;
      }
      const visited = new Set<string>([id]);
      let cursor: string = def;
      let toolId: string | undefined;
      while (!visited.has(cursor)) {
        visited.add(cursor);
        const target = this.vertices.get(cursor);
        if (!target) {
          break;
        }
        if (this.isToolDefinition(target)) {
          toolId = cursor;
          break;
        }
        const next = target.metadata?.def;
        if (typeof next !== 'string' || next.length === 0) {
          break;
        }
        cursor = next;
      }
      if (toolId) {
        siteToTool.push({ siteId: id, toolId });
      }
    }

    for (const { siteId, toolId } of siteToTool) {
      const tool = this.vertices.get(toolId);
      if (!tool) {
        continue;
      }
      const requires = this.readCapabilityList(toolId, tool.metadata, 'requires') ?? [];
      const deny = this.readCapabilityList(toolId, tool.metadata, 'deny') ?? [];
      if (requires.length === 0 && deny.length === 0) {
        continue;
      }

      const agentId = this.findEnclosingAgentId(siteId);
      if (agentId === undefined) {
        this.emitWarning(
          'CAPABILITY_INVOCATION_NO_AGENT',
          `tool invocation at "${siteId}" has no enclosing agent (see AGENTFLOW-SYNTAX.md §12)`,
          { nodeId: siteId }
        );
        continue;
      }
      const agentSub = this.subGraphLookup.get(agentId);
      const permits = this.readCapabilityList(agentId, agentSub?.metadata, 'permits') ?? [];
      const permitsSet = new Set(permits);
      const denySet = new Set(deny);

      for (const cap of requires) {
        if (!permitsSet.has(cap)) {
          this.emitWarning(
            'CAPABILITY_MISSING',
            `tool "${toolId}" requires "${cap}" but agent "${agentId}" does not grant it (see AGENTFLOW-SYNTAX.md §12)`,
            { nodeId: siteId }
          );
        }
        if (denySet.has(cap)) {
          this.emitWarning(
            'CAPABILITY_DENIED',
            `tool "${toolId}" requires "${cap}" but its own deny list forbids it (see AGENTFLOW-SYNTAX.md §12)`,
            { nodeId: siteId }
          );
        }
      }
    }
  }

  /**
   * Per `AGENTFLOW-SYNTAX.md` §5.5: when a data edge (`==>`) touches a
   * container, the container must declare the matching contract:
   * `params` for incoming edges, `returns` for outgoing. A multi-param
   * container's incoming edge MUST carry a label that names one of
   * the declared parameters.
   *
   * Precedence edges (`-->`) are always valid at container boundaries
   * — they target the entry boundary on incoming, the completion
   * boundary on outgoing. Other semantics (association, governance,
   * bidirectional, conformance, delegation, failure) are not subject
   * to §5.5.
   */
  private validateContainerEdges(): void {
    for (const edge of this.edges) {
      if (edge.edgeSemantic !== 'data') {
        continue;
      }
      const startSub = this.subGraphLookup.get(edge.start);
      const endSub = this.subGraphLookup.get(edge.end);
      if (endSub) {
        // Incoming data edge — container needs `params`.
        const rawParams = endSub.metadata?.params;
        const params = Array.isArray(rawParams)
          ? rawParams.map((p) => String(p))
          : typeof rawParams === 'string' && rawParams.length > 0
            ? [rawParams]
            : [];
        if (params.length === 0) {
          this.emitWarning(
            'CONTAINER_EDGE_NO_CONTRACT',
            `incoming data edge to "${edge.end}" but container declares no \`params\` (see AGENTFLOW-SYNTAX.md §5.5)`,
            { edgeId: edge.id }
          );
        } else {
          const label = typeof edge.text === 'string' ? edge.text.trim() : '';
          if (label.length === 0) {
            if (params.length > 1) {
              this.emitWarning(
                'CONTAINER_EDGE_LABEL_REQUIRED',
                `incoming data edge to "${edge.end}" has no label but container declares ${params.length} params — label one (see AGENTFLOW-SYNTAX.md §5.5)`,
                { edgeId: edge.id }
              );
            }
            // single-param + no label = implicit binding, OK.
          } else if (!params.includes(label)) {
            this.emitWarning(
              'CONTAINER_EDGE_LABEL_UNRESOLVED',
              `incoming data edge label "${label}" does not match any declared param of "${edge.end}" (see AGENTFLOW-SYNTAX.md §5.5)`,
              { edgeId: edge.id }
            );
          }
        }
      }
      if (startSub) {
        // Outgoing data edge — container needs `returns`.
        const returns = startSub.metadata?.returns;
        const hasReturns =
          returns !== undefined &&
          returns !== null &&
          !(typeof returns === 'string' && returns.length === 0) &&
          !(Array.isArray(returns) && returns.length === 0);
        if (!hasReturns) {
          this.emitWarning(
            'CONTAINER_EDGE_NO_CONTRACT',
            `outgoing data edge from "${edge.start}" but container declares no \`returns\` (see AGENTFLOW-SYNTAX.md §5.5)`,
            { edgeId: edge.id }
          );
        }
      }
    }
  }

  /** Run every post-parse diagnostic validator once per parse. */
  private runPostParseValidators(): void {
    if (this.postParseValidationRun) {
      return;
    }
    this.postParseValidationRun = true;
    this.validateHexagonBranching();
    this.resolveInstances();
    this.validateConnectorReferences();
    this.validateMetadataApplicability();
    this.resolveReferences();
    this.validateReferenceKinds();
    this.validateContainment();
    this.validateEdgeEndpointKinds();
    this.validateCapabilities();
    this.validateContainerEdges();
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
          shape: SUBGRAPH_TYPE_TO_SHAPE[subGraph.type ?? 'subgraph'],
          dir: subGraph.dir,
          isGroup: true,
          look: config.look,
          metadata: subGraph.metadata,
        });
      }
    }

    // Synthesized connectors-group: opt-in via `connectors@{ view: ... }`,
    // only when no user-declared `subgraph connectors` exists. Re-parents
    // (expanded) or hides (collapsed) connector-designated vertices so the
    // agentflow-editor can expand/collapse the connectors grouping via a
    // stable id `agentflow-connectors-group`, parallel to types/templates.
    const connectorsMeta = this.declarationGroupMetadata.get('connectors');
    const userConnectorsSubgraph = this.subGraphLookup.get('connectors');
    let synthesizeConnectorsGroup = false;
    let connectorsGroupExpanded = false;
    if (connectorsMeta && !userConnectorsSubgraph) {
      const connectorVertices = this.getConnectorDesignatedVertices();
      if (connectorVertices.length > 0) {
        synthesizeConnectorsGroup = true;
        connectorsGroupExpanded = connectorsMeta.view === 'expanded';
        if (connectorsGroupExpanded) {
          for (const v of connectorVertices) {
            parentDB.set(v.id, 'agentflow-connectors-group');
          }
        } else {
          for (const v of connectorVertices) {
            hiddenIds.add(v.id);
            collapsedAncestorMap.set(v.id, 'agentflow-connectors-group');
          }
        }
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

    // -- Synthesize declaration groups (types, templates) --
    const typeDecls = this.getTypeDeclarations();
    const templateDecls = this.getTemplateDeclarations();
    // eslint-disable-next-line no-console
    console.log(
      AGENTFLOW_TPL_VERSION + ': getData() — types:',
      typeDecls.length,
      'templates:',
      templateDecls.length
    );

    const synthesizeDeclarationGroup = (opts: {
      groupId: string;
      label: string;
      expandedShape: ClusterShapeID;
      containerType: string;
      childPrefix: string;
      declarations: { name: string }[];
      groupMetadata: Record<string, unknown> | undefined;
    }) => {
      const isExpanded = opts.groupMetadata?.view === 'expanded';
      if (isExpanded) {
        nodes.push({
          id: opts.groupId,
          label: opts.label,
          labelStyle: '',
          labelType: 'text',
          padding: 8,
          cssCompiledStyles: [],
          cssClasses: '',
          shape: opts.expandedShape,
          isGroup: true,
          look: config.look,
          metadata: opts.groupMetadata,
        });
        for (const decl of opts.declarations) {
          const childId = `${opts.childPrefix}${decl.name}`;
          parentDB.set(childId, opts.groupId);
          nodes.push({
            id: childId,
            label: decl.name,
            labelStyle: '',
            labelType: 'text',
            parentId: opts.groupId,
            padding: 8,
            cssCompiledStyles: [],
            cssClasses: '',
            shape: 'typeDeclaration',
            isGroup: false,
            look: config.look,
            metadata: { typeDeclaration: decl },
          });
        }
      } else {
        nodes.push({
          id: opts.groupId,
          label: opts.label,
          labelStyle: '',
          labelType: 'text',
          padding: 8,
          cssCompiledStyles: [],
          cssClasses: '',
          shape: 'collapsedGroup',
          isGroup: false,
          look: config.look,
          metadata: { containerType: opts.containerType, ...opts.groupMetadata },
        });
      }
    };

    if (typeDecls.length > 0) {
      synthesizeDeclarationGroup({
        groupId: 'agentflow-types-group',
        label: 'Types',
        expandedShape: 'typesGroup',
        containerType: 'types',
        childPrefix: 'agentflow-type-',
        declarations: typeDecls,
        groupMetadata: this.declarationGroupMetadata.get('types'),
      });
    }

    if (templateDecls.length > 0) {
      synthesizeDeclarationGroup({
        groupId: 'agentflow-templates-group',
        label: 'Templates',
        expandedShape: 'templatesGroup',
        containerType: 'templates',
        childPrefix: 'agentflow-template-',
        declarations: templateDecls,
        groupMetadata: this.declarationGroupMetadata.get('templates'),
      });
    }

    if (synthesizeConnectorsGroup) {
      if (connectorsGroupExpanded) {
        nodes.push({
          id: 'agentflow-connectors-group',
          label: 'Connectors',
          labelStyle: '',
          labelType: 'text',
          padding: 8,
          cssCompiledStyles: [],
          cssClasses: '',
          shape: 'connectorsGroup',
          isGroup: true,
          look: config.look,
          metadata: connectorsMeta,
        });
      } else {
        nodes.push({
          id: 'agentflow-connectors-group',
          label: 'Connectors',
          labelStyle: '',
          labelType: 'text',
          padding: 8,
          cssCompiledStyles: [],
          cssClasses: '',
          shape: 'collapsedGroup',
          isGroup: false,
          look: config.look,
          metadata: { containerType: 'connectors', ...connectorsMeta },
        });
      }
    }

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
      types: typeDecls,
      typesByName: Object.fromEntries(this.typeDeclarations.entries()),
      templates: templateDecls,
      templatesByName: Object.fromEntries(this.templateDeclarations.entries()),
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
    // up-to-date diagnostics and resolved-instance metadata.
    this.runPostParseValidators();
    // Subgraph ids sometimes also appear in `this.vertices` when metadata
    // (`@{...}`) is attached to a container id — the metadata-attachment
    // path creates a placeholder vertex record. Those are NOT semantic
    // vertices; they're container descriptors and the semantic model
    // exposes them via `subGraphs` instead.
    const subGraphIds = new Set(this.subGraphs.map((sg) => sg.id));
    const vertices: SemanticVertex[] = [];
    for (const [id, v] of this.vertices) {
      if (subGraphIds.has(id)) {
        continue;
      }
      const vertex: SemanticVertex = { id };
      if (v.text !== undefined) {
        vertex.label = v.text;
      }
      if (v.type !== undefined) {
        vertex.shape = v.type;
      }
      if (this.isToolDefinition(v)) {
        vertex.vertexKind = 'tool';
      }
      const resolved = this.resolvedInstanceMetadata.get(id);
      if (resolved) {
        vertex.resolvedMetadata = resolved;
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
        if (typeof v.metadata.def === 'string') {
          vertex.def = v.metadata.def;
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
      typeDeclarations: [...this.typeDeclarations.values()],
      templateDeclarations: [...this.templateDeclarations.values()],
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

  /** Extract the declared name from a raw TYPE_DECL or TEMPLATE_DECL string. */
  private extractDeclName(declStr: string, prefix: 'type' | 'template'): string {
    // Matches `type Name ...` and `template Name ...` / `template %Name ...`.
    const re = prefix === 'type' ? /^type\s+([A-Z_a-z]\w*)/ : /^template\s+%?([A-Z_a-z]\w*)/;
    const match = re.exec(declStr);
    return match ? match[1] : '';
  }

  public addTypeMapping(declStr: string, loc: JisonLocation | undefined): void {
    this.pushMapping(this.extractDeclName(declStr, 'type'), 'type', loc);
  }

  public addTemplateMapping(declStr: string, loc: JisonLocation | undefined): void {
    this.pushMapping(this.extractDeclName(declStr, 'template'), 'template', loc);
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
    types: number;
    templates: number;
    totalElements: number;
  } {
    let vertices = 0;
    let edges = 0;
    let subgraphs = 0;
    let types = 0;
    let templates = 0;
    for (const m of this.elementMappings) {
      if (m.type === 'vertex') {
        vertices++;
      } else if (m.type === 'edge') {
        edges++;
      } else if (m.type === 'subgraph') {
        subgraphs++;
      } else if (m.type === 'type') {
        types++;
      } else if (m.type === 'template') {
        templates++;
      }
    }
    return {
      vertices,
      edges,
      subgraphs,
      types,
      templates,
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
