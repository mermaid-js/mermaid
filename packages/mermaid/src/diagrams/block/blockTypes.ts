import type { DiagramDB } from '../../diagram-api/types.js';

export interface BlockDB extends DiagramDB {
  clear: () => void;
}
