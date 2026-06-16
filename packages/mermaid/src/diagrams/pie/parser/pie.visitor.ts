import type { CstNode, IToken } from 'chevrotain';
import {
  convertString,
  extractAccDescr,
  extractAccTitle,
  extractTitle,
} from '../../common/parser/commonExtract.js';
import { db } from '../pieDb.js';
import { pieParser } from './pie.parser.js';

interface PieChartCtx {
  ShowData?: IToken[];
  statement?: CstNode[];
}

interface StatementCtx {
  Title?: IToken[];
  AccTitle?: IToken[];
  AccDescr?: IToken[];
  section?: CstNode[];
}

interface SectionCtx {
  StringLiteral: IToken[];
  NumberLiteral: IToken[];
}

const BaseVisitor = pieParser.getBaseCstVisitorConstructor();

/**
 * Walks the pie CST and populates the existing pie `db` — the integration boundary is unchanged,
 * only how the same `db` gets filled. Reproduces the legacy (langium) value handling exactly.
 */
class PieVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  pieChart(ctx: PieChartCtx): void {
    // Unconditional, matching the legacy `db.setShowData(ast.showData)`.
    db.setShowData(Boolean(ctx.ShowData));
    (ctx.statement ?? []).forEach((statement) => this.visit(statement));
  }

  statement(ctx: StatementCtx): void {
    if (ctx.Title) {
      const title = extractTitle(ctx.Title[0].image);
      if (title) {
        db.setDiagramTitle(title);
      }
    } else if (ctx.AccTitle) {
      const accTitle = extractAccTitle(ctx.AccTitle[0].image);
      if (accTitle) {
        db.setAccTitle(accTitle);
      }
    } else if (ctx.AccDescr) {
      const accDescr = extractAccDescr(ctx.AccDescr[0].image);
      if (accDescr) {
        db.setAccDescription(accDescr);
      }
    } else if (ctx.section) {
      this.visit(ctx.section[0]);
    }
  }

  section(ctx: SectionCtx): void {
    const label = convertString(ctx.StringLiteral[0].image);
    const value = Number.parseFloat(ctx.NumberLiteral[0].image);
    db.addSection({ label, value });
  }
}

/** Singleton visitor — stateless aside from writing into the module-level `db`. */
export const pieVisitor = new PieVisitor();
