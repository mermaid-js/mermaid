import type { DiagramDefinition } from '@mermaid-js/core/diagram-api/types.js';
import { parser } from './infoParser.js';
import { db } from './infoDb.js';
import { renderer } from './infoRenderer.js';

export const diagram: DiagramDefinition = {
  parser,
  db,
  renderer,
};
