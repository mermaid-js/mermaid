import { logger } from '../../logger'

let message = ''
let info = false

export const setMessage = function (txt) {
  logger.debug('Setting message to: ' + txt)
  message = txt
}

export const getMessage = function () {
  return message
}

export const setInfo = function (inf) {
  info = inf
}

export const getInfo = function () {
  return info
}

export default {
  setMessage,
  getMessage,
  setInfo,
  getInfo
}
