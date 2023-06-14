import type { DiagramDB } from '../../diagram-api/types.js';

export interface InfoFields {
  info: boolean;
}

export const DEFAULT_INFO_DB: InfoFields = {
  info: false,
} as const;

export interface InfoDB extends DiagramDB {
  clear: () => void;
  setInfo: (info: boolean) => void;
  getInfo: () => boolean;
}
