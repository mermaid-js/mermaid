import { version } from '@mermaid-js/core/version.js';
import type { InfoFields, InfoDB } from './infoTypes.js';

export const DEFAULT_INFO_DB: InfoFields = { version } as const;

export const getVersion = (): string => DEFAULT_INFO_DB.version;

export const db: InfoDB = {
  getVersion,
};
