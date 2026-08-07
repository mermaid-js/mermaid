import type { CstNode, IToken } from 'chevrotain';
import type { FlowDB } from '../flowDb.js';
import * as t from './flow.tokens.js';
import { flowParser } from './flow.parser.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BaseVisitor = flowParser.getBaseCstVisitorConstructor();

interface FlowText {
  text: string;
  type: string;
}

const DIRECTION_VALUE: Record<string, string> = {
  direction_tb: 'TB',
  direction_bt: 'BT',
  direction_rl: 'RL',
  direction_lr: 'LR',
  direction_td: 'TD',
};

/**
 * CST → FlowDB visitor for the flowchart parser.
 *
 * Reproduces the dataflow of `flow.jison`'s semantic actions: `vertex` returns the node id (and calls
 * `addVertex`); `node` returns an id array (the `&` chain); `vertexStatement` threads `addLink` across
 * the chain; statements call the matching `FlowDB` method. The DB sanitizes/normalizes values, so the
 * visitor passes raw token images through, exactly like jison did.
 *
 * `@{ }` shape data is deferred to its own increment (the `shapeData` nodes are ignored here).
 */
class FlowVisitor extends BaseVisitor {
  public yy!: FlowDB;

  constructor() {
    super();
    this.validateVisitor();
  }

  /** Image of the single token in a token-only rule context. */
  private tok(ctx: Record<string, any>): string {
    for (const key of Object.keys(ctx)) {
      const arr = ctx[key];
      if (Array.isArray(arr) && arr.length > 0 && (arr[0] as IToken).image !== undefined) {
        return (arr[0] as IToken).image;
      }
    }
    return '';
  }

  // ----- top level -----

  start(ctx: any) {
    this.visit(ctx.graphConfig);
    this.visit(ctx.document);
  }

  graphConfig(ctx: any) {
    if (ctx.DIR) {
      this.yy.setDirection(ctx.DIR[0].image);
    } else {
      this.yy.setDirection('TB');
    }
  }

  firstStmtSeparator() {
    /* structural only */
  }

  separator() {
    /* structural only */
  }

  spaceList() {
    /* structural only */
  }

  // document: returns the array jison would build (consumed by addSubGraph for subgraph bodies)
  document(ctx: any): unknown[] {
    const out: unknown[] = [];
    for (const lineNode of ctx.line ?? []) {
      const val = this.visit(lineNode);
      if (val === undefined) {
        continue;
      }
      if (!Array.isArray(val) || val.length > 0) {
        out.push(val);
      }
    }
    return out;
  }

  line(ctx: any): unknown {
    if (ctx.statement) {
      return this.visit(ctx.statement);
    }
    // a lone SEMI / NEWLINE / SPACE line — jison yields the token value
    return this.tok(ctx);
  }

  statement(ctx: any): unknown {
    if (ctx.subgraphStatement) {
      return this.visit(ctx.subgraphStatement);
    }
    if (ctx.direction) {
      return this.visit(ctx.direction);
    }
    if (ctx.styleStatement) {
      this.visit(ctx.styleStatement);
      return [];
    }
    if (ctx.linkStyleStatement) {
      this.visit(ctx.linkStyleStatement);
      return [];
    }
    if (ctx.classDefStatement) {
      this.visit(ctx.classDefStatement);
      return [];
    }
    if (ctx.classStatement) {
      this.visit(ctx.classStatement);
      return [];
    }
    if (ctx.clickStatement) {
      this.visit(ctx.clickStatement);
      return [];
    }
    if (ctx.acc_title) {
      this.yy.setAccTitle(extractAccValue(ctx.acc_title[0].image));
      return [];
    }
    if (ctx.acc_descr) {
      this.yy.setAccDescription(extractAccValue(ctx.acc_descr[0].image));
      return [];
    }
    if (ctx.acc_descr_multiline_value) {
      this.yy.setAccDescription(extractMultilineDescr(ctx.acc_descr_multiline_value[0].image));
      return [];
    }
    // vertexStatement
    return this.visit(ctx.vertexStatement);
  }

  // ----- vertex statements -----

  vertexStatement(ctx: any): string[] {
    const firstNodes: string[] = this.visit(ctx.node);
    if (ctx.shapeData) {
      this.addShapeData(firstNodes[firstNodes.length - 1], this.visit(ctx.shapeData));
    }
    let prev = firstNodes;
    let all = firstNodes;
    for (const seg of ctx.vertexSegment ?? []) {
      const { link, nodes, shapeData } = this.visit(seg);
      this.yy.addLink(prev, nodes, link);
      if (shapeData !== undefined) {
        this.addShapeData(nodes[nodes.length - 1], shapeData);
      }
      prev = nodes;
      all = [...nodes, ...all];
    }
    return all;
  }

  vertexSegment(ctx: any): { link: unknown; nodes: string[]; shapeData?: string } {
    return {
      link: this.visit(ctx.link),
      nodes: this.visit(ctx.node),
      shapeData: ctx.shapeData ? this.visit(ctx.shapeData) : undefined,
    };
  }

  // node: the `&` chain -> array of vertex ids (shapeData before an `&` attaches to the prior node)
  node(ctx: any): string[] {
    const ids: string[] = [this.visit(ctx.styledVertex)];
    for (const seg of ctx.ampSegment ?? []) {
      const { shapeData, id } = this.visit(seg);
      if (shapeData !== undefined) {
        this.addShapeData(ids[ids.length - 1], shapeData);
      }
      ids.push(id);
    }
    return ids;
  }

  ampSegment(ctx: any): { shapeData?: string; id: string } {
    return {
      shapeData: ctx.shapeData ? this.visit(ctx.shapeData) : undefined,
      id: this.visit(ctx.styledVertex),
    };
  }

  /** jison: yy.addVertex(id, …, shapeData) — metadata is the 8th argument. */
  private addShapeData(id: string, metadata: string) {
    this.yy.addVertex(
      id,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      undefined as any,
      metadata
    );
  }

  styledVertex(ctx: any): string {
    const id: string = this.visit(ctx.vertex);
    if (ctx.idString) {
      this.yy.setClass(id, this.visit(ctx.idString));
    }
    return id;
  }

  vertex(ctx: any): string {
    const id: string = this.visit(ctx.idString);
    if (ctx.shapeBody) {
      const shape = this.visit(ctx.shapeBody) as { type: string; text: FlowText; props?: object };
      this.yy.addVertex(
        id,
        shape.text as any,
        shape.type as any,
        undefined as any,
        undefined as any,
        undefined as any,
        shape.props,
        undefined
      );
    } else {
      this.yy.addVertex(
        id,
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any,
        undefined,
        undefined
      );
    }
    return id;
  }

  // ----- shapes -----

  shapeBody(ctx: any): unknown {
    const key = Object.keys(ctx)[0];
    return this.visit(ctx[key]);
  }

  squareShape(ctx: any) {
    return { type: 'square', text: this.visit(ctx.text) };
  }
  doubleCircleShape(ctx: any) {
    return { type: 'doublecircle', text: this.visit(ctx.text) };
  }
  roundOrCircleShape(ctx: any) {
    const isCircle = ctx.PS && ctx.PS.length === 2;
    return { type: isCircle ? 'circle' : 'round', text: this.visit(ctx.text) };
  }
  ellipseShape(ctx: any) {
    return { type: 'ellipse', text: this.visit(ctx.text) };
  }
  stadiumShape(ctx: any) {
    return { type: 'stadium', text: this.visit(ctx.text) };
  }
  subroutineShape(ctx: any) {
    return { type: 'subroutine', text: this.visit(ctx.text) };
  }
  propsShape(ctx: any) {
    const field = ctx.NODE_STRING[0].image;
    const value = ctx.NODE_STRING[1].image;
    return {
      type: 'rect',
      text: this.visit(ctx.text),
      props: Object.fromEntries([[field, value]]),
    };
  }
  cylinderShape(ctx: any) {
    return { type: 'cylinder', text: this.visit(ctx.text) };
  }
  diamondOrHexShape(ctx: any) {
    const isHex = ctx.DIAMOND_START && ctx.DIAMOND_START.length === 2;
    return { type: isHex ? 'hexagon' : 'diamond', text: this.visit(ctx.text) };
  }
  oddShape(ctx: any) {
    return { type: 'odd', text: this.visit(ctx.text) };
  }
  trapShape(ctx: any) {
    return { type: ctx.TRAPEND ? 'trapezoid' : 'lean_right', text: this.visit(ctx.text) };
  }
  invTrapShape(ctx: any) {
    return { type: ctx.TRAPEND ? 'lean_left' : 'inv_trapezoid', text: this.visit(ctx.text) };
  }

  // ----- links -----

  link(ctx: any): Record<string, unknown> {
    const id: string | undefined = ctx.LINK_ID?.[0]?.image;
    if (ctx.START_LINK) {
      const inf = this.yy.destructLink(ctx.LINK[0].image, ctx.START_LINK[0].image) as any;
      const obj: Record<string, unknown> = {
        type: inf.type,
        stroke: inf.stroke,
        length: inf.length,
        text: this.visit(ctx.edgeText),
      };
      if (id !== undefined) {
        obj.id = id;
      }
      return obj;
    }
    const inf = this.yy.destructLink(ctx.LINK[0].image, undefined as any) as any;
    const obj: Record<string, unknown> = { type: inf.type, stroke: inf.stroke, length: inf.length };
    if (id !== undefined) {
      obj.id = id;
    }
    if (ctx.arrowText) {
      obj.text = this.visit(ctx.arrowText);
    }
    return obj;
  }

  arrowText(ctx: any): FlowText {
    return this.visit(ctx.text);
  }

  edgeText(ctx: any): FlowText {
    const trailing = (ctx.edgeTextToken ?? []).map((n: CstNode) => this.visit(n)).join('');
    if (ctx.STR) {
      return { text: ctx.STR[0].image + trailing, type: 'string' };
    }
    if (ctx.MD_STR) {
      return { text: ctx.MD_STR[0].image + trailing, type: 'markdown' };
    }
    return { text: trailing, type: 'text' };
  }

  edgeTextToken(ctx: any): string {
    return this.tok(ctx);
  }

  // ----- statements -----

  subgraphStatement(ctx: any): string {
    let idObj: FlowText | undefined;
    let titleObj: FlowText | undefined;
    if (ctx.textNoTags) {
      const tnt: FlowText = this.visit(ctx.textNoTags);
      idObj = tnt;
      titleObj = ctx.text ? this.visit(ctx.text) : tnt; // same object when no explicit title
    }
    const doc = this.visit(ctx.document);
    return this.yy.addSubGraph(idObj as any, doc, titleObj as any);
  }

  classDefStatement(ctx: any) {
    this.yy.addClass(this.visit(ctx.idString), this.visit(ctx.stylesOpt));
  }

  classStatement(ctx: any) {
    const vertexIds: string = this.visit(ctx.idString[0]);
    const className: string = this.visit(ctx.idString[1]);
    this.yy.setClass(vertexIds, className);
  }

  styleStatement(ctx: any) {
    this.yy.addVertex(
      this.visit(ctx.idString),
      undefined as any,
      undefined as any,
      this.visit(ctx.stylesOpt),
      undefined as any,
      undefined as any,
      undefined,
      undefined
    );
  }

  linkStyleStatement(ctx: any) {
    const positions: (string | number)[] = ctx.DEFAULT ? ['default'] : this.visit(ctx.numList);
    if (ctx.INTERPOLATE) {
      this.yy.updateLinkInterpolate(positions as any, this.visit(ctx.alphaNum));
    }
    if (ctx.stylesOpt) {
      this.yy.updateLink(positions as any, this.visit(ctx.stylesOpt));
    }
  }

  clickStatement(ctx: any) {
    const id: string = ctx.CLICK[0].image;
    // Call the DB methods with the SAME arity jison used — specs spy on these and assert exact args.
    if (ctx.CALLBACKNAME) {
      if (ctx.CALLBACKARGS) {
        this.yy.setClickEvent(id, ctx.CALLBACKNAME[0].image, ctx.CALLBACKARGS[0].image);
      } else {
        (this.yy.setClickEvent as any)(id, ctx.CALLBACKNAME[0].image);
      }
      if (ctx.STR) {
        this.yy.setTooltip(id, ctx.STR[0].image);
      }
    } else if (ctx.alphaNum) {
      (this.yy.setClickEvent as any)(id, this.visit(ctx.alphaNum));
      if (ctx.STR) {
        this.yy.setTooltip(id, ctx.STR[0].image);
      }
    } else {
      // href "link" [target] | "link" [target] | "link" "tooltip" [target]
      const link: string = ctx.STR[0].image;
      const tooltip: string | undefined = ctx.STR[1]?.image;
      if (ctx.LINK_TARGET) {
        this.yy.setLink(id, link, ctx.LINK_TARGET[0].image);
      } else {
        (this.yy.setLink as any)(id, link);
      }
      if (tooltip !== undefined) {
        this.yy.setTooltip(id, tooltip);
      }
    }
  }

  direction(ctx: any) {
    return { stmt: 'dir', value: DIRECTION_VALUE[Object.keys(ctx)[0]] };
  }

  // ----- style lists -----

  numList(ctx: any): string[] {
    return (ctx.NUM as IToken[]).map((n) => n.image);
  }

  stylesOpt(ctx: any): string[] {
    return (ctx.style as CstNode[]).map((s) => this.visit(s));
  }

  style(ctx: any): string {
    return (ctx.styleComponent as CstNode[]).map((c) => this.visit(c)).join('');
  }

  styleComponent(ctx: any): string {
    return this.tok(ctx);
  }

  // ----- token lists -----

  idString(ctx: any): string {
    return (ctx.idStringToken as CstNode[]).map((n) => this.visit(n)).join('');
  }
  idStringToken(ctx: any): string {
    return this.tok(ctx);
  }

  alphaNum(ctx: any): string {
    return (ctx.alphaNumToken as CstNode[]).map((n) => this.visit(n)).join('');
  }
  alphaNumToken(ctx: any): string {
    return this.tok(ctx);
  }

  text(ctx: any): FlowText {
    const trailing = (ctx.textToken ?? []).map((n: CstNode) => this.visit(n)).join('');
    if (ctx.STR) {
      return { text: ctx.STR[0].image + trailing, type: 'string' };
    }
    if (ctx.MD_STR) {
      return { text: ctx.MD_STR[0].image + trailing, type: 'markdown' };
    }
    return { text: trailing, type: 'text' };
  }
  textToken(ctx: any): string {
    return this.tok(ctx);
  }

  textNoTags(ctx: any): FlowText {
    const trailing = (ctx.textNoTagsToken ?? []).map((n: CstNode) => this.visit(n)).join('');
    if (ctx.STR) {
      return { text: ctx.STR[0].image + trailing, type: 'text' }; // jison: textNoTags STR has type 'text'
    }
    if (ctx.MD_STR) {
      return { text: ctx.MD_STR[0].image + trailing, type: 'markdown' };
    }
    return { text: trailing, type: 'text' };
  }
  textNoTagsToken(ctx: any): string {
    if (ctx.keywords) {
      return this.visit(ctx.keywords);
    }
    return this.tok(ctx);
  }
  keywords(ctx: any): string {
    return this.tok(ctx);
  }

  // shapeData: concatenate the SHAPE_DATA token stream into the metadata string jison would build —
  // the `@{` opener contributes nothing (jison clears its yytext), and quoted-string content has
  // `\n\s*` collapsed to `<br/>` (jison's `<shapeDataStr>` rule); unquoted YAML keeps its newlines.
  shapeData(ctx: any): string {
    return (ctx.SHAPE_DATA ?? [])
      .map((tk: IToken) => {
        if (tk.tokenType === t.ShapeDataStart) {
          return '';
        }
        if (tk.tokenType === t.ShapeDataStringContent) {
          return tk.image.replace(/\n\s*/g, '<br/>');
        }
        return tk.image;
      })
      .join('');
  }
}

/** Strip the `accTitle:` / `accDescr:` prefix and trim, matching jison's acc value rules. */
function extractAccValue(image: string): string {
  return image.replace(/^acc(?:Title|Descr)[\t ]*:[\t ]*/, '').trim();
}

/** Strip the `accDescr { ... }` wrapper and trim. */
function extractMultilineDescr(image: string): string {
  return image
    .replace(/^accDescr[\t ]*{/, '')
    .replace(/}$/, '')
    .trim();
}

export const flowVisitor = new FlowVisitor();
