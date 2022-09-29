const warning = (s: string) => {
  // Todo remove debug code
  console.error('Log function was called before initialization', s); // eslint-disable-line
};

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
  trace: warning,
  debug: warning,
  info: warning,
  warn: warning,
  error: warning,
  fatal: warning,
};

export let setLogLevel: (level: keyof typeof LEVELS | number | string) => void;
export let getConfig: () => object;
export let sanitizeText: (str: string) => string;
// eslint-disable @typescript-eslint/no-explicit-any
export let setupGraphViewbox: (
  graph: any,
  svgElem: any,
  padding: any,
  useMaxWidth: boolean
) => void;

export const injectUtils = (
  _log: Record<keyof typeof LEVELS, typeof console.log>,
  _setLogLevel: any,
  _getConfig: any,
  _sanitizeText: any,
  _setupGraphViewbox: any
) => {
  _log.info('Mermaid utils injected');
  log.trace = _log.trace;
  log.debug = _log.debug;
  log.info = _log.info;
  log.warn = _log.warn;
  log.error = _log.error;
  log.fatal = _log.fatal;
  setLogLevel = _setLogLevel;
  getConfig = _getConfig;
  sanitizeText = _sanitizeText;
  setupGraphViewbox = _setupGraphViewbox;
};

/*
const warning = (..._args: any[]) => {
  console.error('Log function was called before initialization');
};

export let log = {
  trace: warning,
  debug: warning,
  info: warning,
  warn: warning,
  error: warning,
  fatal: warning,
};
export let setLogLevel;
export let getConfig;
export let sanitizeText;
export let setupGraphViewbox;
export const injectUtils = (_log, _setLogLevel, _getConfig, _sanitizeText, _setupGraphViewbox) => {
  log = _log;
  setLogLevel = _setLogLevel;
  getConfig = _getConfig;
  sanitizeText = _sanitizeText;
  setupGraphViewbox = _setupGraphViewbox;
};
*/
