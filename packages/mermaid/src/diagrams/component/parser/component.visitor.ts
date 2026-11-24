import type { CstNode, IToken } from 'chevrotain';
import { db } from '../componentDb.js';
import type { Direction, RelationKind } from '../componentTypes.js';
import { componentParser } from './component.parser.js';

type Ctx = Record<string, (CstNode | IToken)[]>;

const token = (ctx: Ctx, name: string): IToken | undefined => ctx[name]?.[0] as IToken | undefined;
const tokens = (ctx: Ctx, name: string): IToken[] => (ctx[name] ?? []) as IToken[];
const nodes = (ctx: Ctx, name: string): CstNode[] => (ctx[name] ?? []) as CstNode[];

const unquote = (image: string): string => image.slice(1, -1);

/** Splits `classDef foo fill:#f96,stroke:#333` into the name and its style declarations. */
const parseStylesLine = (
  image: string,
  keyword: string
): { id: string; styles: string[] } | undefined => {
  const rest = image.slice(keyword.length).trim();
  const match = /^(\S+)\s*(.*)$/.exec(rest);
  if (!match) {
    return undefined;
  }
  const [, id, styleText] = match;
  const styles = styleText
    .split(',')
    .map((style) => style.trim())
    .filter(Boolean);
  return { id, styles };
};

const BaseVisitor = componentParser.getBaseCstVisitorConstructor();

class ComponentVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  build(cst: CstNode): void {
    this.visit(cst);
  }

  start(ctx: Ctx): void {
    for (const statement of nodes(ctx, 'statement')) {
      this.visit(statement);
    }
  }

  statement(ctx: Ctx): void {
    if (ctx.directionStatement) {
      this.visit(ctx.directionStatement as CstNode[]);
    } else if (ctx.componentStatement) {
      this.visit(ctx.componentStatement as CstNode[]);
    } else if (ctx.interfaceStatement) {
      this.visit(ctx.interfaceStatement as CstNode[]);
    } else if (ctx.actorStatement) {
      this.visit(ctx.actorStatement as CstNode[]);
    } else if (ctx.packageStatement) {
      this.visit(ctx.packageStatement as CstNode[]);
    } else if (ctx.relationStatement) {
      this.visit(ctx.relationStatement as CstNode[]);
    } else if (ctx.TITLE_LINE) {
      const image = token(ctx, 'TITLE_LINE')!.image;
      db.setDiagramTitle?.(image.replace(/^title[\t ]+/, '').trim());
    } else if (ctx.ACC_TITLE_LINE) {
      const image = token(ctx, 'ACC_TITLE_LINE')!.image;
      db.setAccTitle?.(image.replace(/^accTitle[\t ]*:/, '').trim());
    } else if (ctx.ACC_DESCR_LINE) {
      const image = token(ctx, 'ACC_DESCR_LINE')!.image;
      db.setAccDescription?.(image.replace(/^accDescr[\t ]*:/, '').trim());
    } else if (ctx.NOTE_LINE) {
      const image = token(ctx, 'NOTE_LINE')!.image;
      const match = /^note[\t ]+for[\t ]+(\S+)[\t ]+"([^\n\r"]*)"/.exec(image);
      if (!match) {
        throw new Error(`Malformed note statement: ${image}`);
      }
      const [, target, text] = match;
      db.addNote(target, text);
    } else if (ctx.CLASS_DEF_LINE) {
      const image = token(ctx, 'CLASS_DEF_LINE')!.image;
      const parsed = parseStylesLine(image, 'classDef');
      if (!parsed) {
        throw new Error(`Malformed classDef statement: ${image}`);
      }
      db.addClassDef(parsed.id, parsed.styles);
    } else if (ctx.CLASS_LINE) {
      const image = token(ctx, 'CLASS_LINE')!.image;
      const parsed = parseStylesLine(image, 'class');
      if (!parsed || parsed.styles.length === 0) {
        throw new Error(`Malformed class statement: ${image}`);
      }
      const ids = parsed.id.split(',').map((id) => id.trim());
      db.setClasses(ids, parsed.styles[0]);
    } else if (ctx.STYLE_LINE) {
      const image = token(ctx, 'STYLE_LINE')!.image;
      const parsed = parseStylesLine(image, 'style');
      if (!parsed) {
        throw new Error(`Malformed style statement: ${image}`);
      }
      db.setStyles(parsed.id, parsed.styles);
    }
  }

  directionStatement(ctx: Ctx): void {
    const direction = (['TB', 'TD', 'BT', 'LR', 'RL'] as const).find((name) => ctx[name]);
    db.setDirection((direction ?? 'LR') as Direction);
  }

  nodeLabel(ctx: Ctx): string {
    return unquote(token(ctx, 'QUOTED_STRING')!.image);
  }

  componentStatement(ctx: Ctx, parentId?: string): void {
    const id = token(ctx, 'IDENTIFIER')!.image;
    const label = ctx.nodeLabel ? (this.visit(ctx.nodeLabel as CstNode[]) as string) : undefined;
    const stereotype = token(ctx, 'STEREOTYPE_TEXT')?.image.trim();
    db.addComponent(id, label, stereotype, parentId);
    for (const body of nodes(ctx, 'componentBodyStatement')) {
      this.visit(body, id);
    }
  }

  componentBodyStatement(ctx: Ctx, parentId: string): void {
    if (ctx.portStatement) {
      this.visit(ctx.portStatement as CstNode[], parentId);
    } else if (ctx.componentStatement) {
      this.visit(ctx.componentStatement as CstNode[], parentId);
    }
  }

  portStatement(ctx: Ctx, parentId: string): void {
    const id = token(ctx, 'IDENTIFIER')!.image;
    db.addPort(parentId, id);
  }

  interfaceStatement(ctx: Ctx, parentId?: string): void {
    const id = token(ctx, 'IDENTIFIER')!.image;
    const label = ctx.nodeLabel ? (this.visit(ctx.nodeLabel as CstNode[]) as string) : undefined;
    db.addInterface(id, label, parentId);
  }

  actorStatement(ctx: Ctx): void {
    const id = token(ctx, 'IDENTIFIER')!.image;
    const label = ctx.nodeLabel ? (this.visit(ctx.nodeLabel as CstNode[]) as string) : undefined;
    const stereotype = token(ctx, 'STEREOTYPE_TEXT')?.image.trim();
    db.addActor(id, label, stereotype);
  }

  packageStatement(ctx: Ctx, parentId?: string): void {
    const id = token(ctx, 'IDENTIFIER')!.image;
    db.addPackage(id, parentId);
    for (const body of nodes(ctx, 'packageBodyStatement')) {
      this.visit(body, id);
    }
  }

  packageBodyStatement(ctx: Ctx, parentId: string): void {
    if (ctx.componentStatement) {
      this.visit(ctx.componentStatement as CstNode[], parentId);
    } else if (ctx.interfaceStatement) {
      this.visit(ctx.interfaceStatement as CstNode[], parentId);
    } else if (ctx.packageStatement) {
      this.visit(ctx.packageStatement as CstNode[], parentId);
    }
  }

  relationStatement(ctx: Ctx): void {
    const [source, target] = tokens(ctx, 'IDENTIFIER');
    const kind = this.visit(ctx.relationOperator as CstNode[]) as RelationKind;
    const colonLabel = token(ctx, 'COLON_LABEL');
    const label = colonLabel ? colonLabel.image.replace(/^:[\t ]*/, '').trim() : undefined;
    db.addRelation(source.image, target.image, kind, label || undefined);
  }

  relationOperator(ctx: Ctx): RelationKind {
    if (ctx.PROVIDES_ARROW) {
      return 'provides';
    }
    if (ctx.REQUIRES_ARROW) {
      return 'requires';
    }
    if (ctx.DEPENDENCY_ARROW) {
      return 'dependency';
    }
    if (ctx.ASSOCIATION_ARROW) {
      return 'association';
    }
    return 'link';
  }
}

export const componentVisitor = new ComponentVisitor();
