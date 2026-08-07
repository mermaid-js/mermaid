import type { CstNode, IToken } from 'chevrotain';
import { db } from '../usecaseDb.js';
import type { ArrowType } from '../usecaseTypes.js';
import { UsecaseModelBuilder } from './usecaseModelBuilder.js';
import { usecaseParser } from './usecase.parser.js';

interface StartCtx {
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
}

interface ArrowCtx {
  SOLID_ARROW?: IToken[];
  BACK_ARROW?: IToken[];
  CIRCLE_ARROW?: IToken[];
  CROSS_ARROW?: IToken[];
  CIRCLE_ARROW_REVERSED?: IToken[];
  CROSS_ARROW_REVERSED?: IToken[];
  edgeLabel?: CstNode[];
}

interface EdgeLabelCtx {
  IDENTIFIER?: IToken[];
  STRING?: IToken[];
}

interface SystemBoundaryStatementCtx {
  systemBoundaryName: CstNode[];
  systemBoundaryContent?: CstNode[];
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
}

interface ParsedArrow {
  type: ArrowType;
  label?: string;
}

interface BoundaryUsecase {
  id: string;
  name: string;
  classes?: string[];
}

const unquote = (text: string): string => text.slice(1, -1);
const BaseVisitor = usecaseParser.getBaseCstVisitorConstructorWithDefaults();

class UsecaseVisitor extends BaseVisitor {
  private readonly builder = new UsecaseModelBuilder(db);

  constructor() {
    super();
    this.validateVisitor();
  }

  start(ctx: StartCtx): void {
    this.builder.reset();
    for (const statement of ctx.statement ?? []) {
      this.visit(statement);
    }
  }

  statement(ctx: StatementCtx): void {
    const child =
      ctx.actorStatement?.[0] ??
      ctx.systemBoundaryStatement?.[0] ??
      ctx.directionStatement?.[0] ??
      ctx.classDefStatement?.[0] ??
      ctx.classStatement?.[0] ??
      ctx.styleStatement?.[0] ??
      ctx.entityStatement?.[0];
    if (child) {
      this.visit(child);
    }
  }

  actorStatement(ctx: ActorStatementCtx): void {
    const actors = ctx.actorName.map((actor) => this.visit(actor) as ParsedActor);
    if (ctx.arrow && ctx.entityName) {
      const actor = actors[0];
      this.builder.addActor(actor.name, actor.metadata);
      const arrow = this.visit(ctx.arrow[0]) as ParsedArrow;
      const target = this.visit(ctx.entityName[0]) as string;
      this.builder.addRelationship(actor.name, target, arrow.type, arrow.label);
      return;
    }
    for (const actor of actors) {
      this.builder.addActor(actor.name, actor.metadata);
    }
  }

  actorName(ctx: ActorNameCtx): ParsedActor {
    const name = ctx.IDENTIFIER?.[0].image ?? unquote(ctx.STRING![0].image);
    const metadata = ctx.metadata
      ? (this.visit(ctx.metadata[0]) as Record<string, string>)
      : undefined;
    return { name, metadata };
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

  entityStatement(ctx: EntityStatementCtx): void {
    const entity = this.visit(ctx.entityName[0]) as string;
    if (ctx.arrow) {
      const arrow = this.visit(ctx.arrow[0]) as ParsedArrow;
      const target = this.visit(ctx.entityName[1]) as string;
      this.builder.addRelationship(entity, target, arrow.type, arrow.label);
      return;
    }
    if (ctx.systemBoundaryType) {
      const types = this.visit(ctx.systemBoundaryType[0]) as ('package' | 'rect')[];
      const boundaryId = this.builder.generateId(entity);
      for (const type of types) {
        this.builder.setSystemBoundaryType(boundaryId, type);
      }
      return;
    }
    this.builder.addUseCase(entity, entity);
  }

  entityName(ctx: EntityNameCtx): string {
    return ctx.STRING ? unquote(ctx.STRING[0].image) : ctx.IDENTIFIER![0].image;
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
    const label = ctx.edgeLabel ? (this.visit(ctx.edgeLabel[0]) as string) : undefined;
    return { type: this.builder.arrowType(arrowText), label };
  }

  edgeLabel(ctx: EdgeLabelCtx): string {
    return ctx.IDENTIFIER?.[0].image ?? unquote(ctx.STRING![0].image);
  }

  systemBoundaryStatement(ctx: SystemBoundaryStatementCtx): void {
    const name = this.visit(ctx.systemBoundaryName[0]) as string;
    this.builder.startSystemBoundary(this.builder.generateId(name));
    for (const content of ctx.systemBoundaryContent ?? []) {
      const useCase = this.visit(content) as BoundaryUsecase | undefined;
      if (useCase) {
        this.builder.addUseCase(useCase.id, useCase.name, useCase.classes);
      }
    }
    this.builder.endSystemBoundary();
  }

  systemBoundaryName(ctx: SystemBoundaryNameCtx): string {
    return ctx.IDENTIFIER?.[0].image ?? unquote(ctx.STRING![0].image);
  }

  systemBoundaryContent(ctx: SystemBoundaryContentCtx): BoundaryUsecase | undefined {
    return ctx.boundaryUsecase
      ? (this.visit(ctx.boundaryUsecase[0]) as BoundaryUsecase)
      : undefined;
  }

  boundaryUsecase(ctx: BoundaryUsecaseCtx): BoundaryUsecase {
    const name = ctx.STRING ? unquote(ctx.STRING[0].image) : ctx.IDENTIFIER![0].image;
    const id = ctx.STRING ? this.builder.generateId(name) : name;
    const classId = ctx.STRING ? ctx.IDENTIFIER?.[0].image : ctx.IDENTIFIER?.[1]?.image;
    return { id, name, classes: classId ? [classId] : undefined };
  }

  systemBoundaryType(ctx: SystemBoundaryTypeCtx): ('package' | 'rect')[] {
    const tokens = [...(ctx.PACKAGE ?? []), ...(ctx.RECT ?? [])].sort(
      (left, right) => left.startOffset - right.startOffset
    );
    return tokens.map((token) => (token.tokenType.name === 'PACKAGE' ? 'package' : 'rect'));
  }

  directionStatement(ctx: DirectionStatementCtx): void {
    const direction =
      ctx.TB?.[0].image ??
      ctx.TD?.[0].image ??
      ctx.BT?.[0].image ??
      ctx.RL?.[0].image ??
      ctx.LR![0].image;
    this.builder.setDirection(direction);
  }

  classDefStatement(ctx: ClassDefStatementCtx): void {
    const styles = this.visit(ctx.styles[0]) as string[];
    this.builder.addClassDef(ctx.IDENTIFIER[0].image, styles);
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

  classStatement(ctx: ClassStatementCtx): void {
    const ids = ctx.IDENTIFIER.map((token) => token.image);
    this.builder.applyClass(ids.slice(0, -1), ids.at(-1)!);
  }

  styleStatement(ctx: StyleStatementCtx): void {
    const styles = this.visit(ctx.styles[0]) as string[];
    this.builder.applyStyles(ctx.IDENTIFIER[0].image, styles);
  }
}

/** Singleton visitor; per-parse mutable state is reset by the start rule. */
export const usecaseVisitor = new UsecaseVisitor();
