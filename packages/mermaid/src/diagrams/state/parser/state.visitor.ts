import type { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { extractAccDescr, extractAccTitle } from '../../common/parser/commonExtract.js';
import type { StateDB } from '../stateDb.js';
// cspell:ignore Composit — mirrors the legacy jison COMPOSIT_STATE token name
import { stateParser } from './state.parser.js';

/**
 * Walks the state CST and rebuilds the `rootDoc` array of statement objects that `StateDB.setRootDoc`
 * / `extract` consume — the exact shapes produced by the legacy jison grammar's actions
 * (`{ stmt: 'relation', state1, state2 }`, `{ stmt: 'state', id, type, doc }`, `{ stmt: 'classDef' }`,
 * `{ stmt: 'dir', value }`, …). The `db` API is unchanged; only how it's filled.
 */

type DocStmt = Record<string, unknown> | string;

const img = (node: IToken | CstNode | undefined): string =>
  (node as IToken | undefined)?.image ?? '';
const tok = (arr: CstChildrenDictionary[string] | undefined): IToken | undefined =>
  arr?.[0] as IToken | undefined;

const stripStateMarker = (image: string): string =>
  image.replace(/(?:<<(?:fork|join|choice)>>|\[\[(?:fork|join|choice)]])\s*$/i, '').trim();
const unquote = (image: string): string => image.replace(/^"|"$/g, '');

const BaseVisitor = stateParser.getBaseCstVisitorConstructor();

class StateVisitor extends BaseVisitor {
  /** Set by the wrapper before each `visit()` — the `StateDB` the parser is populating. */
  yy!: StateDB;

  constructor() {
    super();
    this.validateVisitor();
  }

  stateDiagram(ctx: CstChildrenDictionary): void {
    const doc = ctx.document ? (this.visit(ctx.document[0] as CstNode) as DocStmt[]) : [];
    this.yy.setRootDoc(doc as unknown as Parameters<StateDB['setRootDoc']>[0]);
  }

  document(ctx: CstChildrenDictionary): DocStmt[] {
    const result: DocStmt[] = [];
    for (const statement of (ctx.statement ?? []) as CstNode[]) {
      const out = this.visit(statement) as DocStmt | undefined;
      if (out !== undefined && out !== null) {
        result.push(out);
      }
    }
    return result;
  }

  statement(ctx: CstChildrenDictionary): DocStmt | undefined {
    if (ctx.ClassDef) {
      return this.parseClassDef(img(tok(ctx.ClassDef)));
    }
    if (ctx.StyleStmt) {
      return this.parseStyle(img(tok(ctx.StyleStmt)));
    }
    if (ctx.ClassStmt) {
      return this.parseApplyClass(img(tok(ctx.ClassStmt)));
    }
    if (ctx.AccTitle) {
      this.yy.setAccTitle(extractAccTitle(img(tok(ctx.AccTitle))));
      return undefined;
    }
    if (ctx.AccDescr) {
      this.yy.setAccDescription(extractAccDescr(img(tok(ctx.AccDescr))));
      return undefined;
    }
    if (ctx.Concurrent) {
      return { stmt: 'state', id: this.yy.getDividerId(), type: 'divider' };
    }
    if (ctx.Scale || ctx.HideEmpty) {
      return undefined; // iteration 1: not wired to db yet
    }
    if (ctx.directionStatement) {
      return this.visit(ctx.directionStatement[0] as CstNode) as DocStmt;
    }
    if (ctx.stateStatement) {
      return this.visit(ctx.stateStatement[0] as CstNode) as DocStmt;
    }
    if (ctx.noteStatement) {
      return this.visit(ctx.noteStatement[0] as CstNode) as DocStmt;
    }
    if (ctx.clickStatement) {
      return this.visit(ctx.clickStatement[0] as CstNode) as DocStmt;
    }
    if (ctx.relationStatement) {
      return this.visit(ctx.relationStatement[0] as CstNode) as DocStmt;
    }
    return undefined;
  }

  directionStatement(ctx: CstChildrenDictionary): DocStmt {
    const value = ctx.DirectionTB ? 'TB' : ctx.DirectionBT ? 'BT' : ctx.DirectionRL ? 'RL' : 'LR';
    this.yy.setDirection(value);
    return { stmt: 'dir', value };
  }

  idStatement(ctx: CstChildrenDictionary): Record<string, unknown> {
    const hasClass = Boolean(ctx.StyleSeparator);
    let id: string;
    let className: string | undefined;
    if (ctx.EdgeState) {
      id = img(tok(ctx.EdgeState));
      className = hasClass ? img((ctx.Id as IToken[])[0]) : undefined;
    } else {
      id = img((ctx.Id as IToken[])[0]);
      className = hasClass ? img((ctx.Id as IToken[])[1]) : undefined;
    }
    const state: Record<string, unknown> = {
      stmt: 'state',
      id: id.trim(),
      type: 'default',
      description: '',
    };
    if (className !== undefined) {
      state.classes = [className.trim()];
    }
    return state;
  }

  relationStatement(ctx: CstChildrenDictionary): DocStmt {
    const idNodes = ctx.idStatement as CstNode[];
    const state1 = this.visit(idNodes[0]) as Record<string, unknown>;
    if (ctx.Arrow) {
      const state2 = this.visit(idNodes[1]) as Record<string, unknown>;
      const relation: Record<string, unknown> = { stmt: 'relation', state1, state2 };
      if (ctx.Descr) {
        relation.description = this.yy.trimColon(img(tok(ctx.Descr)));
      }
      return relation;
    }
    if (ctx.Descr) {
      state1.description = this.yy.trimColon(img(tok(ctx.Descr)));
    }
    return state1;
  }

  stateStatement(ctx: CstChildrenDictionary): DocStmt {
    if (ctx.Fork) {
      return { stmt: 'state', id: stripStateMarker(img(tok(ctx.Fork))), type: 'fork' };
    }
    if (ctx.Join) {
      return { stmt: 'state', id: stripStateMarker(img(tok(ctx.Join))), type: 'join' };
    }
    if (ctx.Choice) {
      return { stmt: 'state', id: stripStateMarker(img(tok(ctx.Choice))), type: 'choice' };
    }
    const ids = (ctx.CompositState as IToken[]).map((token) => token.image.trim());
    const id = ids[0];
    const description = ctx.StateString ? unquote(img(tok(ctx.StateString))).trim() : '';
    if (ctx.StateStructStart) {
      if (ids.length > 1) {
        throw new Error(`Error: State name must be a single word. Found: "${ids.join(' ')}"`);
      }
      const doc = ctx.document ? (this.visit(ctx.document[0] as CstNode) as DocStmt[]) : [];
      return { stmt: 'state', id, type: 'default', description, doc };
    }
    if (ids.length > 1) {
      // multiple words without a body — legacy yields separate id strings (no state added)
      return id;
    }
    if (ctx.StateString) {
      // `state "description" as id` (no body)
      return { stmt: 'state', id, type: 'default', description };
    }
    // bare `state id` — legacy grammar yields the raw id string
    return id;
  }

  noteStatement(ctx: CstChildrenDictionary): DocStmt | undefined {
    if (ctx.FloatingNote) {
      return undefined; // floating note: a no-op in the legacy grammar
    }
    const position = ctx.LeftOf ? 'left of' : 'right of';
    const id = img(tok(ctx.NoteId)).trim();
    const text = ctx.NoteTextInline
      ? img(tok(ctx.NoteTextInline))
          .replace(/^[\t ]*:[\t ]*/, '')
          .trim()
      : img(tok(ctx.NoteTextMultiline)).slice(0, -8).trim();
    return { stmt: 'state', id, note: { position, text } };
  }

  clickStatement(ctx: CstChildrenDictionary): DocStmt {
    const target = this.visit(ctx.idStatement[0] as CstNode) as Record<string, unknown>;
    const id = target.id as string;
    const strings = (ctx.StringTok ?? []) as IToken[];
    if (ctx.Href) {
      return { stmt: 'click', id, url: img(strings[0]), tooltip: '' };
    }
    return { stmt: 'click', id, url: img(strings[0]), tooltip: img(strings[1]) };
  }

  // ── whole-line statement parsers ──
  private parseClassDef(image: string): DocStmt {
    const match = /^classdef[\t ]+(\S+)(?:[\t ]+(.*))?$/i.exec(image);
    return { stmt: 'classDef', id: (match?.[1] ?? '').trim(), classes: (match?.[2] ?? '').trim() };
  }

  private parseStyle(image: string): DocStmt {
    const match = /^style[\t ]+([\w,]+)(?:[\t ]+(.*))?$/i.exec(image);
    return { stmt: 'style', id: (match?.[1] ?? '').trim(), styleClass: (match?.[2] ?? '').trim() };
  }

  private parseApplyClass(image: string): DocStmt {
    const match = /^class[\t ]+(\w+(?:[\t ]*,[\t ]*\w+)*)(?:[\t ]+(.*))?$/i.exec(image);
    return {
      stmt: 'applyClass',
      id: (match?.[1] ?? '').trim(),
      styleClass: (match?.[2] ?? '').trim(),
    };
  }
}

/** Singleton visitor — `yy` is set per parse by the wrapper. */
export const stateVisitor = new StateVisitor();
