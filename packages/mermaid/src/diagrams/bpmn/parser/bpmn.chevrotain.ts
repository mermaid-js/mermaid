import { db } from '../bpmnDb.js';
import { parseBpmn } from './bpmn.parser.js';

export const parser = {
  parse: (input: string): void => {
    db.clear();
    db.parse(input);
  },
  parser: { yy: db },
};

export { parseBpmn };
export default parser;
