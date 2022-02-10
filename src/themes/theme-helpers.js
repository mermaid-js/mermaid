import { adjust } from 'khroma';

export const mkBorder = (col, darkMode) =>
  darkMode ? adjust(col, { s: -40, l: 10 }) : adjust(col, { s: -40, l: -10 });
