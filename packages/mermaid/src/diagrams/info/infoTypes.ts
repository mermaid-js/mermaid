import type { DiagramDB } from '../../diagram-api/types.js';

export interface InfoDB extends DiagramDB {
  clear: () => void;
  setInfo: (info: boolean) => void;
  getInfo: () => boolean;
}
