interface Pos {
  line: number;
  col: number;
}

export class CodeRange {
  start: Pos;
  stop: Pos;

  private constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
    this.start = { line: startLine, col: startCol };
    this.stop = { line: endLine, col: endCol };
  }

  public static from(context: any) {
    const start = context.start;
    const stop = context.stop;
    return new CodeRange(start.line, start.column, stop.line, stop.column + stop.text.length);
  }
}
