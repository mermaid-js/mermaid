import type { ParserDefinition } from '../../../diagram-api/types.js';
import { runChevrotainParse } from '../../common/parser/runChevrotainParse.js';
import { db } from '../bpmnDb.js';
import { validateBpmn } from '../bpmnValidate.js';
import { bpmnLexer } from './bpmn.lexer.js';
import { bpmnParser } from './bpmn.parser.js';
import { bpmnVisitor } from './bpmn.visitor.js';

export const parser: ParserDefinition = {
  // eslint-disable-next-line @typescript-eslint/require-await -- normalizes synchronous parser errors into rejected promises
  parse: async (input: string): Promise<void> => {
    db.clear();
    bpmnParser.input = [];
    try {
      runChevrotainParse(
        {
          diagramType: 'bpmn',
          lexer: bpmnLexer,
          parser: bpmnParser,
          entry: () => bpmnParser.document(),
          visit: (cst) => bpmnVisitor.build(cst, db),
        },
        input
      );
    } catch (error) {
      db.clear();
      const parseError = bpmnParser.errors[0];
      if (parseError) {
        const { token } = parseError;
        const line = token.startLine ?? 1;
        const column = token.startColumn ?? 1;
        throw new Error(
          `Error parsing bpmn diagram: ${parseError.message} at line ${line}, column ${column}`
        );
      }
      throw error;
    }

    const errors = validateBpmn(db.getModel());
    if (errors.length > 0) {
      db.clear();
      throw new Error(errors.join('\n'));
    }
  },
};
