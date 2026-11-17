import type { DiagramDB } from '@mermaid-js/core/diagram-api/types.js';

export interface InfoFields {
  version: string;
}

export interface InfoDB extends DiagramDB {
  getVersion: () => string;
}
