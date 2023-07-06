import type { DiagramDB } from '../../diagram-api/types.js';

export interface RailroadDB extends DiagramDB {
  clear: () => void;
}
