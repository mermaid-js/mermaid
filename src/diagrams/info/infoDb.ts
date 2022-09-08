/** Created by knut on 15-01-14. */
import { log } from '../../logger';
import { clear as commonClear } from '../../commonDb';

var message = '';
var info = false;

export const setMessage = (txt: string) => {
  log.debug('Setting message to: ' + txt);
  message = txt;
};

export const getMessage = () => {
  return message;
};

export const setInfo = (inf: boolean) => {
  info = inf;
};

export const getInfo = () => {
  return info;
};

export const clear = () => {
  commonClear();
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
