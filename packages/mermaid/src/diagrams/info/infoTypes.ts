import type { DiagramDB } from '../../diagram-api/types.js';

export interface InfoFields {
  info: boolean;
}

export interface InfoDB extends DiagramDB {
  clear: () => void;
  setInfo: (info: boolean) => void;
  getInfo: () => boolean;
}
