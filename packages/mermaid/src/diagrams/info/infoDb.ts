/** Created by knut on 15-01-14. */
import { clear } from '../../commonDb.js';
import type { InfoDB } from './infoTypes.js';

let info = false;

export const setInfo = (toggle: boolean): void => {
  info = toggle;
};

export const getInfo = (): boolean => info;

const db: InfoDB = {
  clear,
  setInfo,
  getInfo,
};

export default db;
