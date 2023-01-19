const warning = () => null;
let localCommonDb = {};

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
export const getCommonDb = () => localCommonDb;
export let parseDirective = (p: any, statement: string, context: string, type: string) => {
  return;
}
/**
 * Placeholder for the real function that will be injected by mermaid.
 */
// eslint-disable @typescript-eslint/no-explicit-any
export let setupGraphViewbox: (
  graph: any,
  svgElem: any,
  padding: any,
  useMaxWidth: boolean
) => void;



/**
 * Function called by mermaid that injects utility functions that help the diagram to be a good citizen.
 * @param _log - The log function to use
 * @param _setLogLevel - The function to set the log level
 * @param _getConfig - The function to get the configuration
 * @param _sanitizeText - The function to sanitize text
 * @param _setupGraphViewbox - The function to setup the graph view-box
 * @param _commonDb - The common database
 */
export const injectUtils = (
  _log: Record<keyof typeof LEVELS, typeof console.log>,
  _setLogLevel: any,
  _getConfig: any,
  _sanitizeText: any,
  _setupGraphViewbox: any,
  _commonDb: any,
  _parseDirective: any
) => {
  _log.info('Mermaid utils injected into timeline-diagram');
  _log.info('123 ' , _parseDirective);
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
  localCommonDb = _commonDb;
  parseDirective = _parseDirective;

};
