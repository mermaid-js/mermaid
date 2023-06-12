/** Created by knut on 15-01-14. */
import { clear } from '../../commonDb.js';
import type { InfoDb } from './infoTypes.js';

let info = false;

export const setInfo = (inf: boolean): void => {
  info = inf;
};

export const getInfo = (): boolean => info;

const db: InfoDb = {
  clear,
  setInfo,
  getInfo,
};

export default db;
