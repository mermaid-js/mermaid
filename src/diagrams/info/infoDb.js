/**
 * Created by knut on 15-01-14.
 */
import { logger } from '../../logger';

var message = '';
var info = false;

export const setMessage = txt => {
  logger.debug('Setting message to: ' + txt);
  message = txt;
};

export const getMessage = () => {
  return message;
};

export const setInfo = inf => {
  info = inf;
};

export const getInfo = () => {
  return info;
};

// export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }

export default {
  setMessage,
  getMessage,
  setInfo,
  getInfo
  // parseError
};
