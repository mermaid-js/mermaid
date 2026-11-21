import type { CstNode, IToken } from 'chevrotain';
import type { MarbleDB, RawMarbleLine } from '../marbleTypes.js';
import { marbleParser } from './marble.parser.js';

type Ctx = Record<string, (CstNode | IToken)[] | undefined>;

const tokenOf = (ctx: Ctx, ...names: string[]): IToken | undefined => {
  for (const name of names) {
    const found = ctx[name]?.[0];
    if (found) {
      return found as IToken;
    }
  }
  return undefined;
};

const unquote = (image: string): string => image.slice(1, -1);

/** The text after a statement's `:`, trimmed, as accTitle and accDescr take it. */
const afterColon = (image: string): string => image.slice(image.indexOf(':') + 1).trim();

/** A lane or axis body without its leading `:`, positioned at the character after the `:`. */
const bodyOf = (name: string, body: IToken): RawMarbleLine => ({
  name,
  body: body.image.slice(1),
  line: body.startLine ?? 1,
  column: (body.startColumn ?? 1) + 1,
});

const BaseVisitor = marbleParser.getBaseCstVisitorConstructor();

/** Walks the CST and records each statement on the db it is given. */
class MarbleVisitor extends BaseVisitor {
  private db: MarbleDB | undefined;

  constructor() {
    super();
    this.validateVisitor();
  }

  build(cst: CstNode, db: MarbleDB): void {
    this.db = db;
    try {
      this.visit(cst);
      db.build();
    } finally {
      this.db = undefined;
    }
  }

  private get target(): MarbleDB {
    if (!this.db) {
      throw new Error('The marble visitor ran without a db');
    }
    return this.db;
  }

  start(ctx: Ctx) {
    ctx.line?.forEach((line) => this.visit(line as CstNode));
  }

  line(ctx: Ctx) {
    if (ctx.statement) {
      this.visit(ctx.statement[0] as CstNode);
    }
  }

  statement(ctx: Ctx) {
    for (const rule of [
      'titleStatement',
      'accTitleStatement',
      'accDescrStatement',
      'axisStatement',
      'labelStatement',
      'laneStatement',
    ]) {
      const node = ctx[rule]?.[0];
      if (node) {
        this.visit(node as CstNode);
      }
    }
  }

  lineEnd() {
    // Nothing to record.
  }

  titleStatement(ctx: Ctx) {
    const image = tokenOf(ctx, 'TITLE_LINE')?.image ?? 'title';
    this.target.setDiagramTitle(image.slice('title'.length).trim());
  }

  accTitleStatement(ctx: Ctx) {
    this.target.setAccTitle(afterColon(tokenOf(ctx, 'ACC_TITLE_LINE')?.image ?? ''));
  }

  accDescrStatement(ctx: Ctx) {
    const line = tokenOf(ctx, 'ACC_DESCR_LINE');
    if (line) {
      this.target.setAccDescription(afterColon(line.image));
      return;
    }
    const block = tokenOf(ctx, 'ACC_DESCR_BLOCK')?.image ?? '{}';
    const description = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'));
    this.target.setAccDescription(
      description
        .split(/\r\n|\n|\r/)
        .map((part) => part.trim())
        .join('\n')
        .trim()
    );
  }

  axisStatement(ctx: Ctx) {
    this.target.setAxis(bodyOf('axis', tokenOf(ctx, 'MARBLE_BODY')!));
  }

  labelStatement(ctx: Ctx) {
    const symbol = tokenOf(ctx, 'IDENTIFIER', 'SYMBOL')!;
    const text = tokenOf(ctx, 'QUOTED_STRING')!;
    this.target.addLabel(symbol.image, unquote(text.image).trim(), {
      line: symbol.startLine ?? 1,
      column: symbol.startColumn ?? 1,
    });
  }

  laneStatement(ctx: Ctx) {
    const name = tokenOf(ctx, 'IDENTIFIER', 'QUOTED_STRING')!;
    const display = name.image.startsWith('"') ? unquote(name.image).trim() : name.image;
    this.target.addLane(bodyOf(display, tokenOf(ctx, 'MARBLE_BODY')!));
  }
}

/** Singleton visitor; the db is passed per call, so the visitor itself holds no diagram state. */
export const marbleVisitor = new MarbleVisitor();
