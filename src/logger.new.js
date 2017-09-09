import moment from 'moment'
import chalk from 'chalk'

export const Log = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {}
}
export const level = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
}

export const setLogLevel = function (level) {
  Log.fatal = () => {}
  Log.error = () => {}
  Log.warn = () => {}
  Log.info = () => {}
  Log.debug = () => {}
  if (level <= level.fatal) {
    Log.fatal = (message) => chalk.bgHex('#DDDDDD').red(format('FATAL', message))
  }
  if (level <= level.error) {
    Log.error = (message) => chalk.bgHex('#DDDDDD').red(format('ERROR', message))
  }
  if (level <= level.warn) {
    Log.warn = (message) => chalk.bgHex('#DDDDDD').orange(format('WARN', message))
  }
  if (level <= level.info) {
    Log.info = (message) => chalk.bgHex('#DDDDDD').blue(format('INFO', message))
  }
  if (level <= level.debug) {
    Log.debug = (message) => chalk.bgHex('#DDDDDD').green(format('DEBUG', message))
  }
}

const format = (level, message) => {
  const time = moment().format('HH:mm:ss (SSS)')
  return `${level} : ${time} : ${message}`
}
