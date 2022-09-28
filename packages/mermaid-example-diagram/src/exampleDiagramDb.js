/** Created by knut on 15-01-14. */
import { log } from './mermaidUtils';

var message = '';
var info = false;

export const setMessage = (txt) => {
  log.debug('Setting message to: ' + txt);
  message = txt;
};

export const getMessage = () => {
  return message;
};

export const setInfo = (inf) => {
  info = inf;
};

export const getInfo = () => {
  return info;
};

export default {
  setMessage,
  getMessage,
  setInfo,
  getInfo,
  clear: () => {
    message = '';
    info = false;
  },
};
