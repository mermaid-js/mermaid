import type { InfoFields, InfoDB } from './infoTypes.js';
import { version } from '../../../package.json';

export const DEFAULT_INFO_DB: InfoFields = { version } as const;

export const getVersion = (): string => DEFAULT_INFO_DB.version;

export const db: InfoDB = {
  getVersion,
};
