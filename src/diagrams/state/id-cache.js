const idCache = {};

export const set = (key, val) => {
  idCache[key] = val;
};

export const get = k => idCache[k];
export const keys = () => Object.keys(idCache);
export const size = () => keys().length;

export default {
  get,
  set,
  keys,
  size
};
