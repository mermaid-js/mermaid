/**
 * Grammar for the kanban diagram — a direct port of the legacy `kanban.jison` productions,
 * rewritten from bottom-up into recursive-descent form. The token stream it consumes is byte-identical to the one
 * the legacy lexer produced, so each rule below maps onto a named jison production.
 *
 * Statement terminators are modelled structurally rather than skipped. The legacy `stop`
 * production requires a newline, a blank line or end-of-input after *every* statement, so
 * skipping newlines here would quietly accept inputs the legacy grammar rejects — two statements
 * on one line, or a blank line wedged between the `kanban` keyword and the first column.
 */
import { CstParser, EMPTY_ALT, EOF } from 'chevrotain';
import type { CstNode } from 'chevrotain';
import {
  Class,
  Icon,
  Kanban,
  MetadataStart,
  NewLine,
  NodeDEnd,
  NodeDStart,
  NodeDescr,
  NodeId,
  ShapeData,
  SpaceLine,
  SpaceList,
  allTokens,
} from './kanban.tokens.js';

class KanbanParser extends CstParser {
  // `this.RULE` assigns these at construction time; declare them so TypeScript sees the shape.
  declare start: () => CstNode;
  declare leadingSpaceLines: () => CstNode;
  declare document: () => CstNode;
  declare documentLine: () => CstNode;
  declare statement: () => CstNode;
  declare content: () => CstNode;
  declare stop: () => CstNode;
  declare node: () => CstNode;
  declare shape: () => CstNode;
  declare shapeData: () => CstNode;

  constructor() {
    super(allTokens);

    // start: mindMap | spaceLines mindMap
    // mindMap: KANBAN document | KANBAN NL document
    this.RULE('start', () => {
      this.OPTION(() => this.SUBRULE(this.leadingSpaceLines));
      this.CONSUME(Kanban);
      this.OPTION2(() => this.CONSUME(NewLine));
      this.SUBRULE(this.document);
      // Rejects trailing tokens no statement claimed, rather than silently dropping them.
      this.CONSUME(EOF);
    });

    // spaceLines: SPACELINE | spaceLines SPACELINE | spaceLines NL
    // The first element must be a SPACELINE; only later ones may be bare newlines.
    this.RULE('leadingSpaceLines', () => {
      this.CONSUME(SpaceLine);
      this.MANY(() => {
        this.OR([{ ALT: () => this.CONSUME2(SpaceLine) }, { ALT: () => this.CONSUME(NewLine) }]);
      });
    });

    // document: document statement stop | statement stop
    this.RULE('document', () => {
      this.AT_LEAST_ONE(() => this.SUBRULE(this.documentLine));
    });

    this.RULE('documentLine', () => {
      this.SUBRULE(this.statement);
      this.SUBRULE(this.stop);
    });

    // statement: SPACELIST node shapeData | SPACELIST node | SPACELIST ICON | SPACELIST CLASS
    //          | SPACELIST | SPACELINE | node shapeData | node | ICON | CLASS
    this.RULE('statement', () => {
      this.OR([
        // A blank or comment line is a statement in its own right — and still needs a terminator.
        { ALT: () => this.CONSUME(SpaceLine) },
        {
          ALT: () => {
            this.CONSUME(SpaceList);
            this.OPTION(() => this.SUBRULE(this.content));
          },
        },
        { ALT: () => this.SUBRULE2(this.content) },
      ]);
    });

    this.RULE('content', () => {
      this.OR([
        {
          ALT: () => {
            this.SUBRULE(this.node);
            this.OPTION(() => this.SUBRULE(this.shapeData));
          },
        },
        { ALT: () => this.CONSUME(Icon) },
        { ALT: () => this.CONSUME(Class) },
      ]);
    });

    // stop: NL | EOF | SPACELINE | stop NL | stop EOF
    this.RULE('stop', () => {
      this.OR([
        {
          ALT: () =>
            this.AT_LEAST_ONE(() => {
              this.OR2([
                { ALT: () => this.CONSUME(NewLine) },
                { ALT: () => this.CONSUME(SpaceLine) },
              ]);
            }),
        },
        // End of input terminates the final statement. Gated so that it cannot stand in for a
        // missing newline mid-diagram, which is what keeps two statements off one line.
        { GATE: () => this.LA(1).tokenType === EOF, ALT: EMPTY_ALT() },
      ]);
    });

    // node: nodeWithId | nodeWithoutId
    this.RULE('node', () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(NodeId);
            this.OPTION(() => this.SUBRULE(this.shape));
          },
        },
        { ALT: () => this.SUBRULE2(this.shape) },
      ]);
    });

    // NODE_DSTART NODE_DESCR NODE_DEND — exactly one description token, as in the legacy rule.
    this.RULE('shape', () => {
      this.CONSUME(NodeDStart);
      this.CONSUME(NodeDescr);
      this.CONSUME(NodeDEnd);
    });

    // shapeData: shapeData SHAPE_DATA | SHAPE_DATA
    // `MetadataStart` stands in for the legacy empty-image `SHAPE_DATA` that `@{` returned.
    this.RULE('shapeData', () => {
      this.CONSUME(MetadataStart);
      this.MANY(() => this.CONSUME(ShapeData));
    });

    this.performSelfAnalysis();
  }
}

/** Singleton parser; grammar recording happens once at module load. */
export const kanbanParser = new KanbanParser();
