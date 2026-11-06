import type { ParserDefinition } from '../../../diagram-api/types.js';
import { BpmnDb } from '../bpmnDb.js';
import { parseBpmn } from './bpmn.parser.js';

/** Parses into the db the diagram definition hands over as `yy`, so each render owns its own. */
export const parser: ParserDefinition = {
  parse: (input: string): void => {
    const target = parser.parser?.yy;
    if (!(target instanceof BpmnDb)) {
      throw new TypeError('The bpmn parser needs a BpmnDb as its yy.');
    }
    target.clear();
    target.parse(input);
  },
  parser: { yy: new BpmnDb() },
};

export { parseBpmn };
export default parser;
