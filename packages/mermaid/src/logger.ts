/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-console */
import dayjs from 'dayjs/esm';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export const log: Record<keyof typeof LEVELS, typeof console.log> = {
  trace: (..._args: any[]) => {},
  debug: (..._args: any[]) => {},
  info: (..._args: any[]) => {},
  warn: (..._args: any[]) => {},
  error: (..._args: any[]) => {},
  fatal: (..._args: any[]) => {},
};

/**
 * Sets a log level
 *
 * @param level - The level to set the logging to. Default is `"fatal"`
 */
export const setLogLevel = function (level: keyof typeof LEVELS | number | string = 'fatal') {
  let numericLevel: number = LEVELS.fatal;
  if (typeof level === 'string') {
    level = level.toLowerCase();
    if (level in LEVELS) {
      numericLevel = LEVELS[level as keyof typeof LEVELS];
    }
  } else if (typeof level === 'number') {
    numericLevel = level;
  }
  log.trace = () => {};
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
  if (numericLevel <= LEVELS.trace) {
    log.trace = console.debug
      ? console.debug.bind(console, format('TRACE'), 'color: lightgreen')
      : console.log.bind(console, '\x1b[32m', format('TRACE'));
  }
};

/**
 * Returns a format with the timestamp and the log level
 *
 * @param level - The level for the log format
 * @returns The format with the timestamp and log level
 */
const format = (level: Uppercase<LogLevel>): string => {
  const time = dayjs().format('ss.SSS');
  return `%c${time} : ${level} : `;
};
