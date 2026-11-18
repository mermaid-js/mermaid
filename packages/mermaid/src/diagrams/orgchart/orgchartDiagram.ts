import type { DiagramDefinition } from '../../diagram-api/types.js';
import { createOrgChartParser } from './parser/orgchart.chevrotain.js';
import { createOrgChartDb } from './orgchartDb.js';
import { renderer } from './orgchartRenderer.js';
import styles from './styles.js';

const createOrgChartDiagram = (): DiagramDefinition => {
  const db = createOrgChartDb();
  return {
    db,
    parser: createOrgChartParser(db),
    renderer,
    styles,
  };
};

export const diagram: DiagramDefinition = {
  ...createOrgChartDiagram(),
  createInstance: createOrgChartDiagram,
};
