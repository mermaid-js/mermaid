import type { RailroadDB } from './railroadTypes.js';

import {
  clear as commonClear,
} from '../../commonDb.js';

const clear = (): void => {
  commonClear();
};

export const db: RailroadDB = {
  clear,
};
