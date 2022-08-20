import moment from 'moment-mini';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LEVELS: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export const log: Record<keyof typeof LEVELS, typeof console.log> = {
  debug: (..._args: any[]) => {},
  info: (..._args: any[]) => {},
  warn: (..._args: any[]) => {},
  error: (..._args: any[]) => {},
  fatal: (..._args: any[]) => {},
};

/**
 * Sets a log level
 *
 * @param {LogLevel} [level="fatal"] The level to set the logging to. Default is `"fatal"`
 */
export const setLogLevel = function (level: keyof typeof LEVELS | number | string = 'fatal') {
  let numericLevel: number = LEVELS.fatal;
  if (typeof level === 'string') {
    level = level.toLowerCase();
    if (level in LEVELS) {
      numericLevel = LEVELS[level as keyof typeof LEVELS];
    }
  }
  log.debug = () => {};
  log.info = () => {};
  log.warn = () => {};
  log.error = () => {};
  log.fatal = () => {};
  if (numericLevel <= LEVELS.fatal) {
    log.fatal = console.error
      ? console.error.bind(console, format('FATAL'), 'color: orange')
      : console.log.bind(console, '\x1b[35m', format('FATAL'));
  }
  if (numericLevel <= LEVELS.error) {
    log.error = console.error
      ? console.error.bind(console, format('ERROR'), 'color: orange')
      : console.log.bind(console, '\x1b[31m', format('ERROR'));
  }
  if (numericLevel <= LEVELS.warn) {
    log.warn = console.warn
      ? console.warn.bind(console, format('WARN'), 'color: orange')
      : console.log.bind(console, `\x1b[33m`, format('WARN'));
  }
  if (numericLevel <= LEVELS.info) {
    log.info = console.info
      ? console.info.bind(console, format('INFO'), 'color: lightblue')
      : console.log.bind(console, '\x1b[34m', format('INFO'));
  }
  if (numericLevel <= LEVELS.debug) {
    log.debug = console.debug
      ? console.debug.bind(console, format('DEBUG'), 'color: lightgreen')
      : console.log.bind(console, '\x1b[32m', format('DEBUG'));
  }
};

/**
 * Returns a format with the timestamp and the log level
 *
 * @param {LogLevel} level The level for the log format
 * @returns {string} The format with the timestamp and log level
 */
const format = (level: string): string => {
  const time = moment().format('ss.SSS');
  return `%c${time} : ${level} : `;
};
