import pino from 'pino';

/**
 * What do we get from 'pino'?
 * - log level. The level is used in the prettify function to determine which log is printed to the console.
 * - `child` method to create a child logger with a given name. The name is added to the log message with the prettify function.
 */
const logger = pino({
  level: 'warn',
});

const LEVELS = ['log', 'trace', 'debug', 'info', 'warn', 'error'];

function bind(logger: any, level: string) {
  // @ts-ignore
  logger[level] = (console[level] || console['log']).bind(console);
}

function bind2(logger: any, level: string, args: any[]) {
  // @ts-ignore
  logger[level] = (console[level] || console['log']).bind(console, args[0], args[1]);
}

function prettify(logger: any): typeof logger {
  LEVELS.forEach((level) => bind(logger, level));
  const childFn = logger.child;
  logger.child = function (opts: any) {
    const child = childFn.call(logger, opts);
    LEVELS.forEach((level) => bind2(child, level, ['%c' + opts.name || '', 'color: #00f']));
    return child;
  };
  return logger;
}

let rootLogger = prettify(logger);
export default rootLogger;
