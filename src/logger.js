import moment from 'moment'

export const LEVELS = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
}

const format = (level) => {
  const time = moment().format('HH:mm:ss (SSS)')
  return `${time} : ${level} : `
}

export const Log = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {}
}

export const setLogLevel = function (level) {
  if (level <= LEVELS.fatal) {
    Log.fatal = console.log.bind(console, '\x1b[35m', format('FATAL'))
  }
  if (level <= LEVELS.error) {
    Log.error = console.log.bind(console, '\x1b[31m', format('ERROR'))
  }
  if (level <= LEVELS.warn) {
    Log.warn = console.log.bind(console, `\x1b[33m`, format('WARN'))
  }
  if (level <= LEVELS.info) {
    Log.info = console.log.bind(console, '\x1b[34m', format('INFO'))
  }
  if (level <= LEVELS.debug) {
    Log.debug = console.log.bind(console, '\x1b[32m', format('DEBUG'))
  }
}
