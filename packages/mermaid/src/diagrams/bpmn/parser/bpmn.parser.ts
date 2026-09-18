import { CstParser, Lexer } from 'chevrotain';
import type { CstNode, IToken } from 'chevrotain';
import * as t from './bpmn.tokens.js';
import { bpmnTokens } from './bpmn.tokens.js';
import { TRIGGERS_BY_POSITION, positionsFor } from '../types.js';

const listOf = (items: string[]): string =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}` : items[0];

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
        { ALT: () => this.SUBRULE(this.meta) },
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

  private meta = this.RULE('meta', () => {
    this.OR([
      { ALT: () => this.CONSUME(t.Title) },
      { ALT: () => this.CONSUME(t.AccTitle) },
      { ALT: () => this.CONSUME(t.AccDescrMultiline) },
      { ALT: () => this.CONSUME(t.AccDescr) },
    ]);
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

  keyword: string;

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

  directed?: boolean;
}

export interface ParsedDiagram {
  direction: string;
  nodes: ParsedNode[];
  flows: ParsedFlow[];
  title?: string;
  accTitle?: string;
  accDescr?: string;
}

const imageOf = (token?: IToken) => token?.image ?? '';

const arrowLabel = (image: string) => image.replace(/^--/, '').replace(/-+>$/, '').trim();

class BpmnVisitor extends BpmnBaseVisitor {
  private nodes: ParsedNode[] = [];
  private flows: ParsedFlow[] = [];
  private direction = 'LR';
  private title: string | undefined;
  private accTitle: string | undefined;
  private accDescr: string | undefined;
  private generated = 0;

  private baseLevel: number | undefined;

  constructor() {
    super();
    this.validateVisitor();
  }

  public reset() {
    this.nodes = [];
    this.flows = [];
    this.direction = 'LR';
    this.title = undefined;
    this.accTitle = undefined;
    this.accDescr = undefined;
    this.generated = 0;
    this.baseLevel = undefined;
  }

  public result(): ParsedDiagram {
    return {
      direction: this.direction,
      nodes: this.nodes,
      flows: this.flows,
      ...(this.title ? { title: this.title } : {}),
      ...(this.accTitle ? { accTitle: this.accTitle } : {}),
      ...(this.accDescr ? { accDescr: this.accDescr } : {}),
    };
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
    const meta = (ctx.meta as CstNode[] | undefined)?.[0];
    if (meta) {
      this.visit(meta);
      return;
    }
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
    const opener = ['Start', 'Intermediate', 'Boundary', 'End', 'Throw'].find((name) => ctx[name]);
    const keyword = opener?.toLowerCase() ?? 'start';
    const node = this.element(ctx, 'event', keyword);
    const triggerToken = (ctx.Trigger as IToken[] | undefined)?.[0];
    node.qualifier = imageOf(triggerToken) || undefined;
    this.checkTrigger(
      keyword,
      node.qualifier ?? 'none',
      triggerToken ?? (opener ? (ctx[opener] as IToken[])[0] : undefined)
    );
    return node;
  }

  private checkTrigger(keyword: string, trigger: string, at?: IToken): void {
    const allowed = TRIGGERS_BY_POSITION[keyword as keyof typeof TRIGGERS_BY_POSITION] as
      | readonly string[]
      | undefined;
    if (!allowed || allowed.includes(trigger)) {
      return;
    }
    const where = `at line ${at?.startLine ?? '?'}`;
    if (trigger === 'none') {
      throw new Error(`BPMN error ${where}: a ${keyword} event must name what triggers it.`);
    }
    const positions = positionsFor(trigger);
    const instead = positions.length
      ? ` The notation draws ${trigger} on ${listOf(positions)} events.`
      : '';
    throw new Error(
      `BPMN error ${where}: a ${keyword} event cannot carry the ${trigger} trigger.${instead}`
    );
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
    node.qualifier = ctx.DataInput
      ? 'input'
      : ctx.DataOutput
        ? 'output'
        : ctx.DataCollection
          ? 'collection'
          : undefined;
    return node;
  }

  public meta(ctx: Record<string, IToken[]>) {
    const after = (image: string, keyword: string) =>
      image
        .slice(keyword.length)
        .replace(/^[\t :]+/, '')
        .trim();
    const title = ctx.Title?.[0];
    if (title) {
      this.title = after(imageOf(title), 'title');
    }
    const accTitle = ctx.AccTitle?.[0];
    if (accTitle) {
      this.accTitle = after(imageOf(accTitle), 'accTitle');
    }
    const accDescr = ctx.AccDescr?.[0];
    if (accDescr) {
      this.accDescr = after(imageOf(accDescr), 'accDescr');
    }
    const braced = ctx.AccDescrMultiline?.[0];
    if (braced) {
      this.accDescr = imageOf(braced)
        .replace(/^accDescr[\t ]*{/, '')
        .replace(/}$/, '')
        .trim();
    }
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
