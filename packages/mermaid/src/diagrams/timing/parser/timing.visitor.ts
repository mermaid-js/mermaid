import type { CstNode, IToken } from 'chevrotain';
import { db } from '../db.js';
import type { AnalogInterpolation, TimingSegment, TimingValue } from '../types.js';
import { timingParser } from './timing.parser.js';

type Ctx = Record<string, (CstNode | IToken)[]>;
type NamedNumber = ['period' | 'duty' | 'offset' | 'min' | 'max', number];
type AnalogParameter = NamedNumber | ['interpolation', AnalogInterpolation];

const BaseVisitor = timingParser.getBaseCstVisitorConstructor();

class TimingVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  build(cst: CstNode): void {
    this.visit(cst);
  }

  start(ctx: Ctx): void {
    for (const line of this.nodes(ctx, 'line')) {
      this.visit(line);
    }
  }

  line(ctx: Ctx): void {
    const child = this.firstNode(
      ctx,
      'blankLine',
      'commentLine',
      'titleStatement',
      'accTitleStatement',
      'accDescrStatement',
      'declaration',
      'timeUnitStatement',
      'atStatement',
      'sequenceStatement'
    );
    this.visit(child);
  }

  lineEnd(): undefined {
    return undefined;
  }

  blankLine(): undefined {
    return undefined;
  }

  commentLine(): undefined {
    return undefined;
  }

  titleStatement(ctx: Ctx): void {
    const image = this.token(ctx, 'TITLE_LINE').image;
    db.setDiagramTitle(image.slice('title'.length).trim());
  }

  accTitleStatement(ctx: Ctx): void {
    const image = this.token(ctx, 'ACC_TITLE_LINE').image;
    db.setAccTitle(image.slice(image.indexOf(':') + 1).trim());
  }

  accDescrStatement(ctx: Ctx): void {
    const line = this.tokens(ctx, 'ACC_DESCR_LINE')[0];
    const block = this.tokens(ctx, 'ACC_DESCR_BLOCK')[0];
    const description = line
      ? line.image.slice(line.image.indexOf(':') + 1).trim()
      : block.image.slice(block.image.indexOf('{') + 1, block.image.lastIndexOf('}')).trim();
    db.setAccDescription(description);
  }

  declaration(ctx: Ctx): void {
    this.visit(
      this.firstNode(
        ctx,
        'clockDeclaration',
        'binaryDeclaration',
        'stateDeclaration',
        'busDeclaration',
        'analogDeclaration'
      )
    );
  }

  signalAlias(ctx: Ctx): string {
    return this.unquote(this.token(ctx, 'STRING').image);
  }

  clockDeclaration(ctx: Ctx): void {
    const id = this.token(ctx, 'IDENTIFIER').image;
    const alias = this.nodes(ctx, 'signalAlias')[0];
    const values = new Map<string, number>();
    for (const parameter of this.nodes(ctx, 'clockParameter')) {
      const [name, value] = this.visit(parameter) as NamedNumber;
      this.setOnce(values, name, value, `Clock "${id}"`);
    }
    db.addSignal({
      id,
      label: alias ? (this.visit(alias) as string) : id,
      type: 'clock',
      clock: {
        period: values.get('period') ?? 0,
        duty: values.get('duty') ?? 50,
        offset: values.get('offset') ?? 0,
      },
    });
  }

  clockParameter(ctx: Ctx): NamedNumber {
    const value = Number(this.token(ctx, 'NUMBER').image);
    if (this.tokens(ctx, 'PERIOD').length > 0) {
      return ['period', value];
    }
    if (this.tokens(ctx, 'DUTY').length > 0) {
      return ['duty', value];
    }
    return ['offset', value];
  }

  binaryDeclaration(ctx: Ctx): void {
    this.addSimpleSignal(ctx, 'binary');
  }

  stateDeclaration(ctx: Ctx): void {
    const id = this.token(ctx, 'IDENTIFIER').image;
    const alias = this.nodes(ctx, 'signalAlias')[0];
    const list = this.nodes(ctx, 'valueList')[0];
    const states = list ? (this.visit(list) as TimingValue[]).map(String) : [];
    db.addSignal({
      id,
      label: alias ? (this.visit(alias) as string) : id,
      type: 'state',
      states,
    });
  }

  busDeclaration(ctx: Ctx): void {
    this.addSimpleSignal(ctx, 'bus');
  }

  analogDeclaration(ctx: Ctx): void {
    const id = this.token(ctx, 'IDENTIFIER').image;
    const alias = this.nodes(ctx, 'signalAlias')[0];
    const values = new Map<string, number | AnalogInterpolation>();
    for (const parameter of this.nodes(ctx, 'analogParameter')) {
      const [name, value] = this.visit(parameter) as AnalogParameter;
      this.setOnce(values, name, value, `Analog signal "${id}"`);
    }
    db.addSignal({
      id,
      label: alias ? (this.visit(alias) as string) : id,
      type: 'analog',
      analog: {
        ...(values.has('min') ? { min: values.get('min') as number } : {}),
        ...(values.has('max') ? { max: values.get('max') as number } : {}),
        interpolation: (values.get('interpolation') as AnalogInterpolation | undefined) ?? 'linear',
      },
    });
  }

  analogParameter(ctx: Ctx): AnalogParameter {
    if (this.tokens(ctx, 'INTERPOLATION').length > 0) {
      return ['interpolation', this.tokens(ctx, 'STEP').length > 0 ? 'step' : 'linear'];
    }
    const value = Number(this.token(ctx, 'NUMBER').image);
    return this.tokens(ctx, 'MIN').length > 0 ? ['min', value] : ['max', value];
  }

  valueList(ctx: Ctx): TimingValue[] {
    return this.nodes(ctx, 'value').map((value) => this.visit(value) as TimingValue);
  }

  timeUnitStatement(ctx: Ctx): void {
    db.setTimeUnit(this.token(ctx, 'WORD').image);
  }

  sequenceStatement(ctx: Ctx): void {
    const id = this.token(ctx, 'IDENTIFIER').image;
    const segments = this.nodes(ctx, 'segment').map(
      (segment) => this.visit(segment) as TimingSegment
    );
    db.setSequence(id, segments);
  }

  segment(ctx: Ctx): TimingSegment {
    const value = this.visit(this.nodes(ctx, 'value')[0]) as TimingValue;
    const repeat = this.tokens(ctx, 'NUMBER')[0];
    return { value, duration: repeat ? Number(repeat.image) : 1 };
  }

  value(ctx: Ctx): TimingValue {
    const number = this.tokens(ctx, 'NUMBER')[0];
    if (number) {
      return Number(number.image);
    }
    const string = this.tokens(ctx, 'STRING')[0];
    if (string) {
      return this.unquote(string.image);
    }
    return this.token(ctx, 'WORD').image;
  }

  atStatement(ctx: Ctx): void {
    const time = Number(this.token(ctx, 'NUMBER').image);
    const assignments = this.nodes(ctx, 'atBodyLine')
      .map((line) => this.visit(line) as { id: string; value: TimingValue } | undefined)
      .filter((assignment): assignment is { id: string; value: TimingValue } =>
        Boolean(assignment)
      );
    if (assignments.length === 0) {
      throw new Error(`The "at ${time}" block must contain at least one signal transition`);
    }
    for (const { id, value } of assignments) {
      db.addEvent(id, time, value);
    }
  }

  atBodyLine(ctx: Ctx): { id: string; value: TimingValue } | undefined {
    const assignment = this.nodes(ctx, 'timeAssignment')[0];
    return assignment ? (this.visit(assignment) as { id: string; value: TimingValue }) : undefined;
  }

  timeAssignment(ctx: Ctx): { id: string; value: TimingValue } {
    return {
      id: this.token(ctx, 'IDENTIFIER').image,
      value: this.visit(this.nodes(ctx, 'value')[0]) as TimingValue,
    };
  }

  private addSimpleSignal(ctx: Ctx, type: 'binary' | 'bus'): void {
    const id = this.token(ctx, 'IDENTIFIER').image;
    const alias = this.nodes(ctx, 'signalAlias')[0];
    db.addSignal({ id, label: alias ? (this.visit(alias) as string) : id, type });
  }

  private setOnce<T>(map: Map<string, T>, key: string, value: T, owner: string): void {
    if (map.has(key)) {
      throw new Error(`${owner} parameter "${key}" is declared more than once`);
    }
    map.set(key, value);
  }

  private unquote(image: string): string {
    const quote = image[0];
    const body = image.slice(1, -1);
    return body.replace(/\\(["'\\nrt])/g, (_match, escaped: string) => {
      if (escaped === 'n') {
        return '\n';
      }
      if (escaped === 'r') {
        return '\r';
      }
      if (escaped === 't') {
        return '\t';
      }
      return escaped === quote || escaped === '\\' ? escaped : `\\${escaped}`;
    });
  }

  private firstNode(ctx: Ctx, ...names: string[]): CstNode {
    for (const name of names) {
      const node = this.nodes(ctx, name)[0];
      if (node) {
        return node;
      }
    }
    throw new Error(`Expected one of: ${names.join(', ')}`);
  }

  private nodes(ctx: Ctx, name: string): CstNode[] {
    return (ctx[name] ?? []).filter((item): item is CstNode => 'children' in item);
  }

  private tokens(ctx: Ctx, name: string): IToken[] {
    return (ctx[name] ?? []).filter((item): item is IToken => 'image' in item);
  }

  private token(ctx: Ctx, name: string): IToken {
    const token = this.tokens(ctx, name)[0];
    if (!token) {
      throw new Error(`Expected ${name}`);
    }
    return token;
  }
}

export const timingVisitor = new TimingVisitor();
