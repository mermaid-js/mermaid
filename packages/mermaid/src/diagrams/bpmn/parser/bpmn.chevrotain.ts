import { db } from '../bpmnDb.js';
import { parseBpmn } from './bpmn.parser.js';

/**
 * The parser entry mermaid calls.
 *
 * Clearing before each parse is what keeps two diagrams on one page independent: both
 * the db and the parser's own state are module-level singletons.
 */
export const parser = {
  parse: (input: string): void => {
    db.clear();
    db.parse(input);
  },
  parser: { yy: db },
};

export { parseBpmn };
export default parser;
