import { DEFAULT_INFO_DB, type InfoDB } from './infoTypes.js';

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
