/**
 * Walks the kanban CST and populates the diagram db.
 *
 * This is the only place with side effects; the grammar itself is pure. Each method corresponds
 * to the semantic action of the matching legacy jison production, and the values it derives
 * (levels from indentation width, node types from the shape delimiters, the metadata string) are
 * computed exactly as the legacy actions computed them.
 *
 * Alongside the db it collects the source spans for the read-model, following
 * `usecaseModelBuilder`. It hands them to the db rather than assembling the model here, so that
 * a render — or a bare `mermaid.parse()` — never pays for a model nothing on that path reads.
 * Spans are offsets into the text handed to `parse`, which in the render pipeline is the
 * preprocessed source rather than the author's original.
 */
import type { CstNode, IToken } from 'chevrotain';
import { log } from '../../../logger.js';
import { metadataOccurrences } from '../kanbanAst.js';
import type {
  KanbanGraphStatement,
  KanbanDB,
  KanbanMetadataOccurrence,
  KanbanNodeOccurrence,
  Span,
} from '../kanbanTypes.js';
import { kanbanParser } from './kanban.parser.js';

interface ParsedNode {
  id: string;
  descr: string;
  type: number;
  idSpan?: Span;
  labelSpan?: Span;
}

interface ParsedShapeData {
  value: string;
  span: Span;
  metadata: KanbanMetadataOccurrence[];
}

type StatementDraft = Omit<KanbanGraphStatement, 'level'>;

const BaseVisitor = kanbanParser.getBaseCstVisitorConstructor();

/**
 * The legacy lexer rewrote newlines inside a quoted metadata value to `<br/>` in the lexer
 * action. Chevrotain cannot mutate a token image, so the rewrite happens here instead.
 */
function shapeDataImage(token: IToken): string {
  return token.tokenType.name === 'ShapeDataStringText'
    ? token.image.replace(/\n\s*/g, '<br/>')
    : token.image;
}

function isToken(value: CstNode | IToken): value is IToken {
  return 'tokenType' in value;
}

function collectTokens(node: CstNode, out: IToken[]): void {
  for (const children of Object.values(node.children)) {
    for (const child of children) {
      if (isToken(child)) {
        out.push(child);
      } else {
        collectTokens(child, out);
      }
    }
  }
}

function tokenSpan(token: IToken): Span {
  return [token.startOffset, (token.endOffset ?? token.startOffset + token.image.length - 1) + 1];
}

/** The source range a CST subtree covers. Children are keyed by name, so they need sorting. */
function nodeSpan(node: CstNode): Span {
  const tokens: IToken[] = [];
  collectTokens(node, tokens);
  let start = Number.POSITIVE_INFINITY;
  let end = 0;
  for (const token of tokens) {
    const [tokenStart, tokenEnd] = tokenSpan(token);
    start = Math.min(start, tokenStart);
    end = Math.max(end, tokenEnd);
  }
  return [start, end];
}

class KanbanVisitor extends BaseVisitor {
  private yy!: KanbanDB;
  private source = '';
  private statements: KanbanGraphStatement[] = [];
  private headerSpan: Span = [0, 0];

  constructor() {
    super();
    this.validateVisitor();
  }

  /** Entry point. `yy` is the db the parse should fill — see `kanban.chevrotain.ts`. */
  public build(cst: CstNode, yy: KanbanDB, source: string): void {
    this.yy = yy;
    this.source = source;
    this.statements = [];
    this.headerSpan = [0, 0];
    this.visit(cst as never);
    this.yy.setAstSource({
      source,
      headerSpan: this.headerSpan,
      // Terminators are visited after the statement they close, so comments folded into a
      // terminator arrive in source order without a sort.
      statements: this.statements,
    });
  }

  /** Records a `%%` line. Blank lines are not statements unless nothing precedes them. */
  private recordComments(tokens: IToken[] | undefined): void {
    for (const token of tokens ?? []) {
      if (token.tokenType.name === 'CommentLine') {
        this.statements.push({ kind: 'comment', span: tokenSpan(token) });
      }
    }
  }

  start(ctx: { Kanban: IToken[]; leadingSpaceLines?: CstNode[]; document?: CstNode[] }): void {
    this.headerSpan = tokenSpan(ctx.Kanban[0]);
    // Visited first so anything written above the keyword keeps its place in source order.
    if (ctx.leadingSpaceLines) {
      this.visit(ctx.leadingSpaceLines as never);
    }
    this.visit(ctx.document as never);
  }

  leadingSpaceLines(ctx: { SpaceLine?: IToken[] }): void {
    // Blank lines ahead of the `kanban` keyword carry no data, but comments there are still
    // comments, and a source map that dropped them would be lying about the file.
    this.recordComments(ctx.SpaceLine);
  }

  document(ctx: { documentLine?: CstNode[] }): void {
    for (const line of ctx.documentLine ?? []) {
      this.visit(line as never);
    }
  }

  documentLine(ctx: { statement?: CstNode[]; stop?: CstNode[] }): void {
    this.visit(ctx.statement as never);
    this.visit(ctx.stop as never);
  }

  /**
   * `stop` greedily consumes every terminator that follows a statement, so all but the first
   * comment in a document arrives here rather than through {@link statement}. Recording them keeps
   * `kind: 'comment'` complete — a consumer mapping source ranges can rely on it.
   */
  stop(ctx: { SpaceLine?: IToken[] }): void {
    this.recordComments(ctx.SpaceLine);
  }

  statement(ctx: { SpaceLine?: IToken[]; SpaceList?: IToken[]; content?: CstNode[] }): void {
    if (ctx.SpaceLine) {
      const token = ctx.SpaceLine[0];
      this.statements.push({
        kind: token.tokenType.name === 'CommentLine' ? 'comment' : 'blank',
        span: tokenSpan(token),
      });
      return;
    }
    if (!ctx.content) {
      return;
    }
    // Indentation width is the node's level, exactly as the legacy `$1.length` action read it.
    const level = ctx.SpaceList ? ctx.SpaceList[0].image.length : 0;
    const draft = this.visit(ctx.content as never, level) as StatementDraft;
    this.statements.push({ ...draft, level });
  }

  content(
    ctx: { node?: CstNode[]; shapeData?: CstNode[]; Icon?: IToken[]; Class?: IToken[] },
    level: number
  ): StatementDraft {
    if (ctx.Icon) {
      const token = ctx.Icon[0];
      this.yy.decorateNode({ icon: token.image });
      const span = tokenSpan(token);
      return { kind: 'icon', value: token.image, valueSpan: span, span };
    }
    if (ctx.Class) {
      const token = ctx.Class[0];
      this.yy.decorateNode({ class: token.image });
      const span = tokenSpan(token);
      return { kind: 'classAssign', value: token.image, valueSpan: span, span };
    }

    const node = this.visit(ctx.node as never) as ParsedNode;
    log.info('Node: ', node.id);
    const shapeData = ctx.shapeData
      ? (this.visit(ctx.shapeData as never) as ParsedShapeData)
      : undefined;
    // The db sanitizes the id and substitutes a generated one when that leaves nothing, so the
    // stored id can differ from the source text — `a<b` becomes `a`, `"<script>"` becomes `kbn0`.
    // The occurrence has to carry the stored id or it will not resolve against `ast.nodes`.
    const storedId = shapeData
      ? this.yy.addNode(level, node.id, node.descr, node.type, shapeData.value)
      : // Called with four arguments so the db still sees `shapeData === undefined`.
        (this.yy.addNode as (l: number, i: string, d: string, t: number) => string)(
          level,
          node.id,
          node.descr,
          node.type
        );

    // `@{ … }` closes with a token the grammar never sees, so the metadata span is the one that
    // reaches furthest right.
    const span: Span = [nodeSpan(ctx.node![0])[0], shapeData?.span[1] ?? nodeSpan(ctx.node![0])[1]];
    const occurrence: KanbanNodeOccurrence = {
      // A shape written without an id is marked by the missing `idSpan`, not by an empty `id`.
      id: storedId,
      span,
      defines: true,
      ...(node.idSpan ? { idSpan: node.idSpan } : {}),
      ...(node.labelSpan ? { labelSpan: node.labelSpan } : {}),
      ...(shapeData ? { metadataSpan: shapeData.span, metadata: shapeData.metadata } : {}),
    };
    return { kind: 'node', nodes: [occurrence], span };
  }

  node(ctx: { NodeId?: IToken[]; shape?: CstNode[] }): ParsedNode {
    const shape = ctx.shape ? (this.visit(ctx.shape as never) as ParsedNode) : undefined;
    if (!ctx.NodeId) {
      // nodeWithoutId — the description doubles as the id.
      return shape!;
    }
    const token = ctx.NodeId[0];
    const id = token.image;
    const idSpan = tokenSpan(token);
    return shape
      ? { id, descr: shape.descr, type: shape.type, idSpan, labelSpan: shape.labelSpan }
      : { id, descr: id, type: 0, idSpan };
  }

  shape(ctx: { NodeDStart: IToken[]; NodeDescr: IToken[]; NodeDEnd: IToken[] }): ParsedNode {
    const descrToken = ctx.NodeDescr[0];
    const descr = descrToken.image;
    return {
      id: descr,
      descr,
      type: this.yy.getType(ctx.NodeDStart[0].image, ctx.NodeDEnd[0].image),
      labelSpan: tokenSpan(descrToken),
    };
  }

  shapeData(ctx: { MetadataStart: IToken[]; ShapeData?: IToken[] }): ParsedShapeData {
    // `@{` itself contributes nothing, matching the empty-image token the legacy lexer returned.
    let value = '';
    for (const token of ctx.ShapeData ?? []) {
      value += shapeDataImage(token);
    }

    const open = ctx.MetadataStart[0];
    const bodyStart = (open.endOffset ?? open.startOffset + 1) + 1;
    const last = ctx.ShapeData?.at(-1);
    // The closing `}` is a mode-change token, so it is not in the CST. It is the first `}` after
    // the last metadata token — any brace inside a quoted value is already behind us by then.
    const searchFrom = last ? tokenSpan(last)[1] : bodyStart;
    const close = this.source.indexOf('}', searchFrom);
    const bodyEnd = close === -1 ? searchFrom : close;
    return {
      value,
      span: [open.startOffset, close === -1 ? searchFrom : close + 1],
      metadata: metadataOccurrences(this.source, bodyStart, bodyEnd),
    };
  }
}

/** Singleton visitor; validation happens once at module load. */
export const kanbanVisitor = new KanbanVisitor();
