import type { InfoFields, InfoDB } from './infoTypes.js';
import packageJson from '../../../package.json' assert { type: 'json' };

export const DEFAULT_INFO_DB: InfoFields = {
  version: packageJson.version + (includeLargeFeatures ? '' : '-tiny'),
} as const;

export const getVersion = (): string => DEFAULT_INFO_DB.version;

export const db: InfoDB = {
  getVersion,
};
