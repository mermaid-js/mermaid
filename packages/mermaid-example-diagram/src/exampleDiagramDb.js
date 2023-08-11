/** Created by knut on 15-01-14. */
import { log } from './mermaidUtils.js';

var message = '';
var info = false;

export const setMessage = (txt) => {
  log.debug('Setting message to: ' + txt);
  message = txt;
};

export const getMessage = () => {
  return message;
};

/**
 * Sets the info flag
 *
 * @param {boolean} inf
 */
export const setInfo = (inf) => {
  info = inf;
};

export const getInfo = () => {
  return info;
};

export const clear = () => {
  message = '';
  info = false;
};

export default {
  setMessage,
  getMessage,
  setInfo,
  getInfo,
  clear,
};
