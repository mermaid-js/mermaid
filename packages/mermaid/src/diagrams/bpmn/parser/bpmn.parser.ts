import { CstParser, Lexer } from 'chevrotain';
import type { CstNode, IToken } from 'chevrotain';
import * as t from './bpmn.tokens.js';
import { bpmnTokens } from './bpmn.tokens.js';

/**
 * A line-oriented grammar: one statement per line, preceded by the indentation token
 * that says how deeply it nests. The tree itself is assembled from those widths
 * afterwards, in the DB, because Chevrotain has no indentation-aware rule form here.
 */
class BpmnParser extends CstParser {
  constructor() {
    super(t.bpmnTokens, { recoveryEnabled: false });
    this.performSelfAnalysis();
  }

  public diagram = this.RULE('diagram', () => {
    this.MANY(() => this.CONSUME(t.Newline));
    this.OPTION(() => this.CONSUME(t.Indent));
    this.CONSUME(t.Header);
    this.OPTION2(() => this.CONSUME(t.Direction));
    this.MANY2(() => this.SUBRULE(this.line));
  });

  private line = this.RULE('line', () => {
    this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
    this.OPTION(() => this.CONSUME(t.Indent));
    this.OPTION2(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.container) },
        { ALT: () => this.SUBRULE(this.event) },
        { ALT: () => this.SUBRULE(this.gateway) },
        { ALT: () => this.SUBRULE(this.activity) },
        { ALT: () => this.SUBRULE(this.artifact) },
        { ALT: () => this.SUBRULE(this.flow) },
      ])
    );
  });

  private container = this.RULE('container', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Pool) },
      { ALT: () => this.CONSUME(t.Lane) },
      { ALT: () => this.CONSUME(t.Group) },
    ]);
    this.SUBRULE(this.nameAndLabel);
  });

  private event = this.RULE('event', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Start) },
      { ALT: () => this.CONSUME(t.Intermediate) },
      { ALT: () => this.CONSUME(t.Boundary) },
      { ALT: () => this.CONSUME(t.End) },
      { ALT: () => this.CONSUME(t.Throw) },
    ]);
    this.OPTION(() => this.CONSUME(t.Trigger));
    this.SUBRULE(this.nameAndLabel);
  });

  private gateway = this.RULE('gateway', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Xor) },
      { ALT: () => this.CONSUME(t.And) },
      { ALT: () => this.CONSUME(t.Or) },
      { ALT: () => this.CONSUME(t.EventGateway) },
      { ALT: () => this.CONSUME(t.Complex) },
    ]);
    this.SUBRULE(this.nameAndLabel);
  });

  private activity = this.RULE('activity', () => {
    this.OPTION(() => this.CONSUME(t.TaskType));
    this.OR([
      { ALT: () => this.CONSUME(t.Task) },
      { ALT: () => this.CONSUME(t.Subprocess) },
      { ALT: () => this.CONSUME(t.Call) },
    ]);
    this.SUBRULE(this.nameAndLabel);
  });

  /** An id, a label, or both - a bare label is enough when the id is never referenced. */
  private artifact = this.RULE('artifact', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.DataStore) },
      { ALT: () => this.CONSUME(t.DataCollection) },
      { ALT: () => this.CONSUME(t.DataInput) },
      { ALT: () => this.CONSUME(t.DataOutput) },
      { ALT: () => this.CONSUME(t.DataObject) },
      { ALT: () => this.CONSUME(t.Annotation) },
    ]);
    this.SUBRULE(this.nameAndLabel);
  });

  private nameAndLabel = this.RULE('nameAndLabel', () => {
    this.OPTION(() => this.CONSUME(t.Identifier));
    this.OPTION2(() => this.CONSUME(t.QuotedString));
  });

  private flow = this.RULE('flow', () => {
    this.CONSUME(t.Identifier);
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(t.LabelledArrow) },
        { ALT: () => this.CONSUME(t.MessageArrow) },
        { ALT: () => this.CONSUME(t.Arrow) },
        { ALT: () => this.CONSUME(t.AssociationArrow) },
        { ALT: () => this.CONSUME(t.AssociationLine) },
      ]);
      this.CONSUME2(t.Identifier);
    });
  });
}

export const bpmnParser = new BpmnParser();
export const BpmnBaseVisitor = bpmnParser.getBaseCstVisitorConstructorWithDefaults();

export const bpmnLexer = new Lexer(bpmnTokens, { positionTracking: 'onlyStart' });

export interface ParsedNode {
  kind:
    | 'pool'
    | 'lane'
    | 'group'
    | 'event'
    | 'gateway'
    | 'activity'
    | 'data'
    | 'store'
    | 'annotation';
  /** The keyword that opened the statement, e.g. `start`, `xor`, `task`. */
  keyword: string;
  /** The trigger or task-type qualifier, when the statement carried one. */
  qualifier?: string;
  id: string;
  label: string;
  level: number;
  parentId?: string;
}

export interface ParsedFlow {
  from: string;
  to: string;
  label?: string;
  kind: 'sequence' | 'message' | 'association';
  /** Whether an association carries an arrowhead. Sequence and message flows always do. */
  directed?: boolean;
}

export interface ParsedDiagram {
  direction: string;
  nodes: ParsedNode[];
  flows: ParsedFlow[];
}

const imageOf = (token?: IToken) => token?.image ?? '';
/** Turns a `-- label -->` image into just its label. */
const arrowLabel = (image: string) => image.replace(/^--/, '').replace(/-+>$/, '').trim();

class BpmnVisitor extends BpmnBaseVisitor {
  private nodes: ParsedNode[] = [];
  private flows: ParsedFlow[] = [];
  private direction = 'LR';
  private generated = 0;
  /** Indentation of the first content line, so absolute indent never matters. */
  private baseLevel: number | undefined;

  constructor() {
    super();
    this.validateVisitor();
  }

  public reset() {
    this.nodes = [];
    this.flows = [];
    this.direction = 'LR';
    this.generated = 0;
    this.baseLevel = undefined;
  }

  public result(): ParsedDiagram {
    return { direction: this.direction, nodes: this.nodes, flows: this.flows };
  }

  public diagram(ctx: Record<string, CstNode[] | IToken[]>) {
    const direction = (ctx.Direction as IToken[] | undefined)?.[0];
    if (direction) {
      this.direction = direction.image;
    }
    for (const line of (ctx.line as CstNode[] | undefined) ?? []) {
      this.visit(line);
    }
    this.assignParents();
  }

  public line(ctx: Record<string, CstNode[] | IToken[]>) {
    const indent = (ctx.Indent as IToken[] | undefined)?.[0];
    const level = indent ? indent.image.length : 0;
    for (const key of ['container', 'event', 'gateway', 'activity', 'artifact'] as const) {
      const rule = (ctx[key] as CstNode[] | undefined)?.[0];
      if (rule) {
        const node = this.visit(rule) as ParsedNode;
        this.baseLevel ??= level;
        node.level = Math.max(0, level - this.baseLevel);
        this.nodes.push(node);
        return;
      }
    }
    const flow = (ctx.flow as CstNode[] | undefined)?.[0];
    if (flow) {
      this.visit(flow);
    }
  }

  public container(ctx: Record<string, CstNode[] | IToken[]>): ParsedNode {
    const keyword = ctx.Pool ? 'pool' : ctx.Group ? 'group' : 'lane';
    return this.element(ctx, keyword, keyword);
  }

  public event(ctx: Record<string, CstNode[] | IToken[]>): ParsedNode {
    const keyword =
      ['Start', 'Intermediate', 'Boundary', 'End', 'Throw']
        .find((name) => ctx[name])
        ?.toLowerCase() ?? 'start';
    const node = this.element(ctx, 'event', keyword);
    node.qualifier = imageOf((ctx.Trigger as IToken[] | undefined)?.[0]) || undefined;
    return node;
  }

  public gateway(ctx: Record<string, CstNode[] | IToken[]>): ParsedNode {
    const byToken: Record<string, string> = {
      Xor: 'xor',
      And: 'and',
      Or: 'or',
      EventGateway: 'event-gateway',
      Complex: 'complex',
    };
    const token = Object.keys(byToken).find((name) => ctx[name]);
    return this.element(ctx, 'gateway', token ? byToken[token] : 'xor');
  }

  public activity(ctx: Record<string, CstNode[] | IToken[]>): ParsedNode {
    const keyword = ctx.Subprocess ? 'subprocess' : ctx.Call ? 'call' : 'task';
    const node = this.element(ctx, 'activity', keyword);
    node.qualifier = imageOf((ctx.TaskType as IToken[] | undefined)?.[0]) || undefined;
    return node;
  }

  public artifact(ctx: Record<string, CstNode[] | IToken[]>): ParsedNode {
    if (ctx.DataStore) {
      return this.element(ctx, 'store', 'data-store');
    }
    if (ctx.Annotation) {
      return this.element(ctx, 'annotation', 'note');
    }
    const node = this.element(ctx, 'data', 'data');
    // The keyword carries the marker the notation draws in the data object's corner.
    node.qualifier = ctx.DataInput
      ? 'input'
      : ctx.DataOutput
        ? 'output'
        : ctx.DataCollection
          ? 'collection'
          : undefined;
    return node;
  }

  public nameAndLabel(ctx: Record<string, IToken[]>) {
    const quoted = ctx.QuotedString?.[0];
    return {
      id: imageOf(ctx.Identifier?.[0]),
      label: quoted ? quoted.image.slice(1, -1) : '',
    };
  }

  public flow(ctx: Record<string, IToken[]>) {
    const byOffset = (a: IToken, b: IToken) => (a.startOffset ?? 0) - (b.startOffset ?? 0);
    const ids = [...(ctx.Identifier ?? [])].sort(byOffset);
    const connectors = [
      ...(ctx.LabelledArrow ?? []),
      ...(ctx.MessageArrow ?? []),
      ...(ctx.Arrow ?? []),
      ...(ctx.AssociationArrow ?? []),
      ...(ctx.AssociationLine ?? []),
    ].sort(byOffset);

    for (const [index, connector] of connectors.entries()) {
      const from = ids[index];
      const to = ids[index + 1];
      if (!from || !to) {
        break;
      }
      const name = connector.tokenType.name;
      const isAssociation = name === 'AssociationArrow' || name === 'AssociationLine';
      this.flows.push({
        from: from.image,
        to: to.image,
        kind: isAssociation ? 'association' : name === 'MessageArrow' ? 'message' : 'sequence',
        ...(isAssociation ? { directed: name === 'AssociationArrow' } : {}),
        label: name === 'LabelledArrow' ? arrowLabel(connector.image) : undefined,
      });
    }
  }

  private element(
    ctx: Record<string, CstNode[] | IToken[]>,
    kind: ParsedNode['kind'],
    keyword: string
  ): ParsedNode {
    const named = this.visit((ctx.nameAndLabel as CstNode[])[0]) as { id: string; label: string };
    const id = named.id || `${keyword}-${++this.generated}`;
    return { kind, keyword, id, label: named.label || named.id || '', level: 0 };
  }

  /**
   * Resolves each node's parent from the indentation depths, by walking back to the
   * nearest earlier node at a shallower level.
   */
  private assignParents() {
    for (const [index, node] of this.nodes.entries()) {
      for (let back = index - 1; back >= 0; back--) {
        if (this.nodes[back].level < node.level) {
          node.parentId = this.nodes[back].id;
          break;
        }
      }
    }
  }
}

const visitor = new BpmnVisitor();

/** Parses one diagram. State is reset per call, so repeated renders stay independent. */
export function parseBpmn(input: string): ParsedDiagram {
  const lexed = bpmnLexer.tokenize(input);
  if (lexed.errors.length > 0) {
    const first = lexed.errors[0];
    throw new Error(`BPMN lexing error at line ${first.line ?? '?'}: ${first.message}`);
  }
  bpmnParser.input = lexed.tokens;
  const cst = bpmnParser.diagram();
  if (bpmnParser.errors.length > 0) {
    const first = bpmnParser.errors[0];
    throw new Error(`BPMN parse error at line ${first.token?.startLine ?? '?'}: ${first.message}`);
  }
  visitor.reset();
  visitor.visit(cst);
  return visitor.result();
}
