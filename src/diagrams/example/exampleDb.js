import { logger } from '../../logger'

var message = ''
var info = false

exports.setMessage = function (txt) {
  logger.debug('Setting message to: ' + txt)
  message = txt
}

exports.getMessage = function () {
  return message
}

exports.setInfo = function (inf) {
  info = inf
}

exports.getInfo = function () {
  return info
}
