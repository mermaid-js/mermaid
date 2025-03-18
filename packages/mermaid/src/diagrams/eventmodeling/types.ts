import type { EventModelingDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

import type { EventModeling } from '@mermaid-js/parser';

export interface EventModelingDB extends DiagramDBBase<EventModelingDiagramConfig> {
  setOptions: (rawOptString: string) => void;
  getOptions: () => any;

  getAst: () => EventModeling | undefined;
  setAst: (ast: EventModeling) => void;
}
