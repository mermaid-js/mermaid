import type { InfoFields, InfoDB } from './infoTypes.js';

export const DEFAULT_INFO_DB: InfoFields = {
  info: false,
} as const;

let info: boolean = DEFAULT_INFO_DB.info;

export const setInfo = (toggle: boolean): void => {
  info = toggle;
};

export const getInfo = (): boolean => info;

const clear = (): void => {
  info = DEFAULT_INFO_DB.info;
};

const db: InfoDB = {
  clear: clear,
  setInfo: setInfo,
  getInfo: getInfo,
};

export default db;
