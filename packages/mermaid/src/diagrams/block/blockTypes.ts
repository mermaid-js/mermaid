import type { DiagramDB } from '../../diagram-api/types.js';
import type { BaseDiagramConfig } from '../../config.type.js';

export interface BlockConfig extends BaseDiagramConfig {
  padding?: number;
}

export interface BlockDB extends DiagramDB {
  clear: () => void;
  getConfig: () => BlockConfig | undefined;
}
