import moment from 'moment'

const format = (level) => {
  const time = moment().format('HH:mm:ss (SSS)')
  return `%c ${time} :%c${level}: `
}

export const Log = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {}
}

/**
 * logLevel , decides the amount of logging to be used.
 *    * debug: 1
 *    * info: 2
 *    * warn: 3
 *    * error: 4
 *    * fatal: 5
 */
export const setLogLevel = function (level) {
  if (level < 6) {
    Log.fatal = console.log.bind(console, format('FATAL'), 'color:grey;', 'color: red;')
  }
  if (level < 5) {
    Log.error = console.log.bind(console, format('ERROR'), 'color:grey;', 'color: red;')
  }
  if (level < 4) {
    Log.warn = console.log.bind(console, format('WARN'), 'color:grey;', 'color: orange;')
  }
  if (level < 3) {
    Log.info = console.log.bind(console, format('INFO'), 'color:grey;', 'color: info;')
  }
  if (level < 2) {
    Log.debug = console.log.bind(console, format('DEBUG'), 'color:grey;', 'color: green;')
  }
}
