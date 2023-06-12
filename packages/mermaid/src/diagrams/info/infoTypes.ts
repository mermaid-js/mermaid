import type { DiagramDb } from '../../diagram-api/types.js';

/**
 * Info diagram DB.
 */
export interface InfoDb extends DiagramDb {
  clear: () => void;
  setInfo: (info: boolean) => void;
  getInfo: () => boolean;
}
