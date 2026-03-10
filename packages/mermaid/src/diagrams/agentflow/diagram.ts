import type { MermaidConfig } from '../../config.type.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { FlowDB } from '../flowchart/flowDb.js';
import renderer from './renderer.js';
// @ts-ignore: JISON doesn't support types
import flowParser from '../flowchart/parser/flowParser.ts';
import flowStyles from '../flowchart/styles.js';

export const diagram = {
  parser: flowParser,
  get db() {
    return new FlowDB();
  },
  renderer,
  styles: flowStyles,
  init: (cnf: MermaidConfig) => {
    cnf.flowchart ??= {};
    if (cnf.layout) {
      setConfig({ layout: cnf.layout });
    }
    cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    setConfig({ flowchart: { arrowMarkerAbsolute: cnf.arrowMarkerAbsolute } });
  },
};
