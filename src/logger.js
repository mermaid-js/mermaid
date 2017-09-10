import moment from 'moment'

export const LEVELS = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
}

export const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {}
}

export const setLogLevel = function (level) {
  logger.debug = () => {}
  logger.info = () => {}
  logger.warn = () => {}
  logger.error = () => {}
  logger.fatal = () => {}
  if (level <= LEVELS.fatal) {
    logger.fatal = console.log.bind(console, '\x1b[35m', format('FATAL'))
  }
  if (level <= LEVELS.error) {
    logger.error = console.log.bind(console, '\x1b[31m', format('ERROR'))
  }
  if (level <= LEVELS.warn) {
    logger.warn = console.log.bind(console, `\x1b[33m`, format('WARN'))
  }
  if (level <= LEVELS.info) {
    logger.info = console.log.bind(console, '\x1b[34m', format('INFO'))
  }
  if (level <= LEVELS.debug) {
    logger.debug = console.log.bind(console, '\x1b[32m', format('DEBUG'))
  }
}

const format = (level) => {
  const time = moment().format('HH:mm:ss.SSS')
  return `${time} : ${level} : `
}
