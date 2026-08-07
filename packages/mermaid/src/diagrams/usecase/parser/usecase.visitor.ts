import type { CstNode, IToken } from 'chevrotain';
import { buildUsecaseGraphAST } from '../usecaseAst.js';
import { db } from '../usecaseDb.js';
import { UsecaseModelBuilder } from './usecaseModelBuilder.js';
import type {
  ArrowType,
  EdgeOccurrence,
  GraphStatement,
  NodeOccurrence,
  Span,
} from '../usecaseTypes.js';
import { usecaseParser } from './usecase.parser.js';

interface StartCtx {
  USECASE: IToken[];
  statement?: CstNode[];
}

interface StatementCtx {
  actorStatement?: CstNode[];
  systemBoundaryStatement?: CstNode[];
  directionStatement?: CstNode[];
  classDefStatement?: CstNode[];
  classStatement?: CstNode[];
  styleStatement?: CstNode[];
  entityStatement?: CstNode[];
  NEWLINE?: IToken[];
}

interface ActorStatementCtx {
  actorName: CstNode[];
  arrow?: CstNode[];
  entityName?: CstNode[];
}

interface ActorNameCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
  metadata?: CstNode[];
}

interface MetadataCtx {
  metadataProperty: CstNode[];
}

interface MetadataPropertyCtx {
  STRING: IToken[];
}

interface EntityStatementCtx {
  entityName: CstNode[];
  arrow?: CstNode[];
  systemBoundaryType?: CstNode[];
}

interface EntityNameCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
  nodeLabel?: CstNode[];
}

interface NodeLabelCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
}

interface ArrowCtx {
  SOLID_ARROW?: IToken[];
  BACK_ARROW?: IToken[];
  CIRCLE_ARROW?: IToken[];
  CROSS_ARROW?: IToken[];
  CIRCLE_ARROW_REVERSED?: IToken[];
  CROSS_ARROW_REVERSED?: IToken[];
  edgeLabel?: CstNode[];
  LINE_SOLID?: IToken[];
}

interface EdgeLabelCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
}

interface ParsedLabel {
  name: string;
  span: Span;
}

interface SystemBoundaryStatementCtx {
  systemBoundaryName: CstNode[];
  systemBoundaryContent?: CstNode[];
  END: IToken[];
}

interface SystemBoundaryNameCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
}

interface SystemBoundaryContentCtx {
  boundaryUsecase?: CstNode[];
}

interface BoundaryUsecaseCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
}

interface SystemBoundaryTypeCtx {
  PACKAGE?: IToken[];
  RECT?: IToken[];
}

interface DirectionStatementCtx {
  TB?: IToken[];
  TD?: IToken[];
  BT?: IToken[];
  RL?: IToken[];
  LR?: IToken[];
}

interface ClassDefStatementCtx {
  IDENTIFIER: IToken[];
  styles: CstNode[];
}

interface StylesCtx {
  styleValue: CstNode[];
}

interface StyleValueCtx {
  styleComponent: CstNode[];
}

interface StyleComponentCtx {
  IDENTIFIER?: IToken[];
  NUMBER?: IToken[];
  HASH_COLOR?: IToken[];
  COLON?: IToken[];
  STRING?: IToken[];
  DASH?: IToken[];
  DOT?: IToken[];
  PERCENT?: IToken[];
}

interface ClassStatementCtx {
  IDENTIFIER: IToken[];
}

interface StyleStatementCtx {
  IDENTIFIER: IToken[];
  styles: CstNode[];
}

interface ParsedActor {
  name: string;
  metadata?: Record<string, string>;
  idSpan: Span;
  labelSpan: Span;
}

interface ParsedEntity {
  id: string;
  name: string;
  classes?: string[];
  idSpan: Span;
  labelSpan?: Span;
}

interface ParsedArrow {
  type: ArrowType;
  label?: string;
  labelSpan?: Span;
}

type BoundaryUsecase = ParsedEntity;

type PendingGraphStatement = Omit<GraphStatement, 'edges' | 'span'> & {
  edges?: Omit<EdgeOccurrence, 'span'>[];
};

const unquote = (text: string): string => text.slice(1, -1);
const BaseVisitor = usecaseParser.getBaseCstVisitorConstructorWithDefaults();

class UsecaseVisitor extends BaseVisitor {
  private readonly builder = new UsecaseModelBuilder(db);
  private source = '';

  constructor() {
    super();
    this.validateVisitor();
  }

  build(cst: CstNode, source: string): void {
    this.source = source;
    this.visit(cst);
  }

  start(ctx: StartCtx): void {
    this.builder.reset();
    const statements: GraphStatement[] = [];
    for (const statementNode of ctx.statement ?? []) {
      const statement = this.visit(statementNode) as GraphStatement | undefined;
      if (statement) {
        statements.push(statement);
      }
    }
    db.setAST(
      buildUsecaseGraphAST(db, this.source, this.tokenSpan(ctx.USECASE[0], false), statements)
    );
  }

  statement(ctx: StatementCtx): GraphStatement | undefined {
    if (ctx.NEWLINE) {
      const offset = ctx.NEWLINE[0].startOffset;
      return { kind: 'blank', span: [offset, offset] };
    }
    const child =
      ctx.actorStatement?.[0] ??
      ctx.systemBoundaryStatement?.[0] ??
      ctx.directionStatement?.[0] ??
      ctx.classDefStatement?.[0] ??
      ctx.classStatement?.[0] ??
      ctx.styleStatement?.[0] ??
      ctx.entityStatement?.[0];
    if (!child) {
      return undefined;
    }
    const pending = this.visit(child) as PendingGraphStatement;
    const { edges, ...statement } = pending;
    const span = this.nodeSpan(child);
    return {
      ...statement,
      span,
      ...(edges ? { edges: edges.map((edge): EdgeOccurrence => ({ ...edge, span })) } : {}),
    };
  }

  actorStatement(ctx: ActorStatementCtx): PendingGraphStatement {
    const actors = ctx.actorName.map((actor) => this.visit(actor) as ParsedActor);
    const nodes = ctx.actorName.map((actorNode, index) =>
      this.nodeOccurrence(
        actorNode,
        this.builder.generateId(actors[index].name),
        actors[index].idSpan,
        actors[index].labelSpan,
        true
      )
    );
    if (ctx.arrow && ctx.entityName) {
      const actor = actors[0];
      this.builder.addActor(actor.name, actor.metadata);
      const arrow = this.visit(ctx.arrow[0]) as ParsedArrow;
      const target = this.visit(ctx.entityName[0]) as ParsedEntity;
      this.ensureEntity(target);
      this.builder.addRelationship(actor.name, target.id, arrow.type, arrow.label);
      const relationship = db.getRelationships().at(-1)!;
      nodes.push(
        this.nodeOccurrence(
          ctx.entityName[0],
          target.id,
          target.idSpan,
          target.labelSpan,
          target.labelSpan !== undefined
        )
      );
      return {
        kind: 'edge',
        nodes,
        edges: [
          {
            id: relationship.id,
            ...(arrow.labelSpan ? { labelSpan: arrow.labelSpan } : {}),
          },
        ],
      };
    }
    for (const actor of actors) {
      this.builder.addActor(actor.name, actor.metadata);
    }
    return { kind: 'node', nodes };
  }

  actorName(ctx: ActorNameCtx): ParsedActor {
    const token = ctx.IDENTIFIER?.[0] ?? ctx.STRING![0];
    const name = ctx.IDENTIFIER?.[0].image ?? unquote(ctx.STRING![0].image);
    const metadata = ctx.metadata
      ? (this.visit(ctx.metadata[0]) as Record<string, string>)
      : undefined;
    const nameSpan = this.tokenSpan(token, token.tokenType.name === 'STRING');
    return { name, metadata, idSpan: nameSpan, labelSpan: nameSpan };
  }

  metadata(ctx: MetadataCtx): Record<string, string> {
    const metadata: Record<string, string> = {};
    for (const property of ctx.metadataProperty) {
      const [key, value] = this.visit(property) as [string, string];
      metadata[key] = value;
    }
    return metadata;
  }

  metadataProperty(ctx: MetadataPropertyCtx): [string, string] {
    return [unquote(ctx.STRING[0].image), unquote(ctx.STRING[1].image)];
  }

  entityStatement(ctx: EntityStatementCtx): PendingGraphStatement {
    const entity = this.visit(ctx.entityName[0]) as ParsedEntity;
    const sourceOccurrence = this.nodeOccurrence(
      ctx.entityName[0],
      entity.id,
      entity.idSpan,
      entity.labelSpan,
      !ctx.arrow
    );
    if (ctx.arrow) {
      const arrow = this.visit(ctx.arrow[0]) as ParsedArrow;
      const target = this.visit(ctx.entityName[1]) as ParsedEntity;
      this.ensureEntity(entity);
      this.ensureEntity(target);
      this.builder.addRelationship(entity.id, target.id, arrow.type, arrow.label);
      const relationship = db.getRelationships().at(-1)!;
      return {
        kind: 'edge',
        nodes: [
          sourceOccurrence,
          this.nodeOccurrence(
            ctx.entityName[1],
            target.id,
            target.idSpan,
            target.labelSpan,
            target.labelSpan !== undefined
          ),
        ],
        edges: [
          {
            id: relationship.id,
            ...(arrow.labelSpan ? { labelSpan: arrow.labelSpan } : {}),
          },
        ],
      };
    }
    if (ctx.systemBoundaryType) {
      const types = this.visit(ctx.systemBoundaryType[0]) as ('package' | 'rect')[];
      for (const type of types) {
        this.builder.setSystemBoundaryType(entity.id, type);
      }
      return {
        kind: 'style',
        group: entity.id,
        ref: entity.id,
        refSpan: entity.idSpan,
      };
    }
    this.builder.addUseCase(entity.id, entity.name, entity.classes);
    return { kind: 'node', nodes: [sourceOccurrence] };
  }

  entityName(ctx: EntityNameCtx): ParsedEntity {
    if (ctx.STRING) {
      return this.createQuotedEntity(ctx.STRING[0], ctx.IDENTIFIER?.[0]);
    }
    const token = ctx.IDENTIFIER![0];
    const label = ctx.nodeLabel ? (this.visit(ctx.nodeLabel[0]) as ParsedLabel) : undefined;
    return this.createParsedEntity(
      token,
      label?.name ?? token.image,
      ctx.IDENTIFIER?.[1],
      label?.span
    );
  }

  nodeLabel(ctx: NodeLabelCtx): ParsedLabel {
    const tokens = [...(ctx.IDENTIFIER ?? []), ...(ctx.STRING ?? [])].sort(
      (left, right) => left.startOffset - right.startOffset
    );
    const first = tokens[0];
    if (tokens.length === 1 && first.tokenType.name === 'STRING') {
      return { name: unquote(first.image), span: this.tokenSpan(first, true) };
    }
    const span: Span = [this.tokenSpan(first, false)[0], this.tokenSpan(tokens.at(-1)!, false)[1]];
    return { name: this.source.slice(span[0], span[1]), span };
  }

  arrow(ctx: ArrowCtx): ParsedArrow {
    let arrowText = '--';
    if (ctx.SOLID_ARROW) {
      arrowText = '-->';
    } else if (ctx.BACK_ARROW) {
      arrowText = '<--';
    } else if (ctx.CIRCLE_ARROW) {
      arrowText = '--o';
    } else if (ctx.CROSS_ARROW) {
      arrowText = '--x';
    } else if (ctx.CIRCLE_ARROW_REVERSED) {
      arrowText = 'o--';
    } else if (ctx.CROSS_ARROW_REVERSED) {
      arrowText = 'x--';
    }
    const label = ctx.edgeLabel ? (this.visit(ctx.edgeLabel[0]) as ParsedLabel) : undefined;
    return {
      type: this.builder.arrowType(arrowText),
      ...(label ? { label: label.name, labelSpan: label.span } : {}),
    };
  }

  edgeLabel(ctx: EdgeLabelCtx): ParsedLabel {
    const token = ctx.IDENTIFIER?.[0] ?? ctx.STRING![0];
    return {
      name: ctx.IDENTIFIER?.[0].image ?? unquote(ctx.STRING![0].image),
      span: this.tokenSpan(token, token.tokenType.name === 'STRING'),
    };
  }

  systemBoundaryStatement(ctx: SystemBoundaryStatementCtx): PendingGraphStatement {
    const name = this.visit(ctx.systemBoundaryName[0]) as ParsedEntity;
    this.builder.startSystemBoundary(name.id);
    const children: GraphStatement[] = [];
    for (const content of ctx.systemBoundaryContent ?? []) {
      const useCase = this.visit(content) as BoundaryUsecase | undefined;
      if (useCase) {
        this.builder.addUseCase(useCase.id, useCase.name, useCase.classes);
        children.push({
          kind: 'node',
          span: this.nodeSpan(content),
          nodes: [
            this.nodeOccurrence(content, useCase.id, useCase.idSpan, useCase.labelSpan, true),
          ],
        });
      }
    }
    this.builder.endSystemBoundary();
    return {
      kind: 'group',
      group: name.id,
      idSpan: name.idSpan,
      titleSpan: name.labelSpan ?? name.idSpan,
      endSpan: this.tokenSpan(ctx.END[0], false),
      ...(children.length > 0 ? { children } : {}),
    };
  }

  systemBoundaryName(ctx: SystemBoundaryNameCtx): ParsedEntity {
    if (ctx.STRING) {
      return this.createQuotedEntity(ctx.STRING[0]);
    }
    const token = ctx.IDENTIFIER![0];
    return this.createParsedEntity(token, token.image, undefined, this.tokenSpan(token, false));
  }

  systemBoundaryContent(ctx: SystemBoundaryContentCtx): BoundaryUsecase | undefined {
    return ctx.boundaryUsecase
      ? (this.visit(ctx.boundaryUsecase[0]) as BoundaryUsecase)
      : undefined;
  }

  boundaryUsecase(ctx: BoundaryUsecaseCtx): BoundaryUsecase {
    if (ctx.STRING) {
      return this.createQuotedEntity(ctx.STRING[0], ctx.IDENTIFIER?.[0]);
    }
    const token = ctx.IDENTIFIER![0];
    return this.createParsedEntity(token, token.image, ctx.IDENTIFIER?.[1]);
  }

  systemBoundaryType(ctx: SystemBoundaryTypeCtx): ('package' | 'rect')[] {
    const tokens = [...(ctx.PACKAGE ?? []), ...(ctx.RECT ?? [])].sort(
      (left, right) => left.startOffset - right.startOffset
    );
    return tokens.map((token) => (token.tokenType.name === 'PACKAGE' ? 'package' : 'rect'));
  }

  directionStatement(ctx: DirectionStatementCtx): PendingGraphStatement {
    const direction =
      ctx.TB?.[0].image ??
      ctx.TD?.[0].image ??
      ctx.BT?.[0].image ??
      ctx.RL?.[0].image ??
      ctx.LR![0].image;
    this.builder.setDirection(direction);
    return { kind: 'direction' };
  }

  classDefStatement(ctx: ClassDefStatementCtx): PendingGraphStatement {
    const styles = this.visit(ctx.styles[0]) as string[];
    const classToken = ctx.IDENTIFIER[0];
    this.builder.addClassDef(classToken.image, styles);
    return {
      kind: 'classDef',
      ref: classToken.image,
      refSpan: this.tokenSpan(classToken, false),
    };
  }

  styles(ctx: StylesCtx): string[] {
    const styles: string[] = [];
    for (const value of ctx.styleValue) {
      styles.push(...(this.visit(value) as string[]));
    }
    return styles;
  }

  styleValue(ctx: StyleValueCtx): string[] {
    return ctx.styleComponent.map((component) => this.visit(component) as string);
  }

  styleComponent(ctx: StyleComponentCtx): string {
    return (
      ctx.IDENTIFIER?.[0] ??
      ctx.NUMBER?.[0] ??
      ctx.HASH_COLOR?.[0] ??
      ctx.COLON?.[0] ??
      ctx.STRING?.[0] ??
      ctx.DASH?.[0] ??
      ctx.DOT?.[0] ??
      ctx.PERCENT![0]
    ).image;
  }

  classStatement(ctx: ClassStatementCtx): PendingGraphStatement {
    const classToken = ctx.IDENTIFIER.at(-1)!;
    const nodeTokens = ctx.IDENTIFIER.slice(0, -1);
    this.builder.applyClass(
      nodeTokens.map((token) => token.image),
      classToken.image
    );
    return {
      kind: 'classAssign',
      ref: classToken.image,
      refSpan: this.tokenSpan(classToken, false),
      nodes: nodeTokens.map((token) => ({
        id: token.image,
        span: this.tokenSpan(token, false),
        idSpan: this.tokenSpan(token, false),
      })),
    };
  }

  styleStatement(ctx: StyleStatementCtx): PendingGraphStatement {
    const styles = this.visit(ctx.styles[0]) as string[];
    const nodeToken = ctx.IDENTIFIER[0];
    this.builder.applyStyles(nodeToken.image, styles);
    const nodeSpan = this.tokenSpan(nodeToken, false);
    return {
      kind: 'style',
      nodes: [{ id: nodeToken.image, span: nodeSpan, idSpan: nodeSpan }],
    };
  }

  private createQuotedEntity(token: IToken, classToken?: IToken): ParsedEntity {
    return this.createParsedEntity(
      token,
      unquote(token.image),
      classToken,
      this.tokenSpan(token, true)
    );
  }

  private createParsedEntity(
    token: IToken,
    name: string,
    classToken?: IToken,
    labelSpan?: Span
  ): ParsedEntity {
    const quoted = token.tokenType.name === 'STRING';
    const entity: ParsedEntity = {
      id: quoted ? this.builder.generateId(name) : token.image,
      name,
      idSpan: this.tokenSpan(token, quoted),
    };
    if (classToken) {
      entity.classes = [classToken.image];
    }
    if (labelSpan) {
      entity.labelSpan = labelSpan;
    }
    return entity;
  }

  private ensureEntity(entity: ParsedEntity): void {
    if (!db.getActor(entity.id) && !db.getUseCase(entity.id)) {
      db.addUseCase({
        id: entity.id,
        name: entity.name,
        ...(entity.classes ? { classes: entity.classes } : {}),
      });
    }
  }

  private nodeOccurrence(
    node: CstNode,
    id: string,
    idSpan: Span,
    labelSpan: Span | undefined,
    defines: boolean
  ): NodeOccurrence {
    return {
      id,
      span: this.nodeSpan(node),
      idSpan,
      ...(labelSpan ? { labelSpan } : {}),
      ...(defines ? { defines: true } : {}),
    };
  }

  private nodeSpan(node: CstNode): Span {
    const location = node.location;
    if (location?.startOffset === undefined || location.endOffset === undefined) {
      throw new Error('Usecase CST node is missing full location tracking');
    }
    const start = location.startOffset;
    let end = location.endOffset + 1;
    while (end > start) {
      const code = this.source.charCodeAt(end - 1);
      if (code !== 10 && code !== 13) {
        break;
      }
      end--;
    }
    return [start, end];
  }

  private tokenSpan(token: IToken, excludeQuotes: boolean): Span {
    const quoteOffset = excludeQuotes ? 1 : 0;
    const end = token.endOffset ?? token.startOffset + token.image.length - 1;
    return [token.startOffset + quoteOffset, end + 1 - quoteOffset];
  }
}

/** Singleton visitor; per-parse mutable state is reset by the start rule. */
export const usecaseVisitor = new UsecaseVisitor();
