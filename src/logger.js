/**
 * #logger
 * logger = require('logger').create()
 * logger.info("blah")
 * => [2011-3-3T20:24:4.810 info (5021)] blah
 * logger.debug("boom")
 * =>
 * logger.level = Logger.levels.debug
 * logger.debug(function() { return "booom" })
 * => [2011-3-3T20:24:4.810 error (5021)] booom
 */

const LEVELS = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
    default: 5
};

var defaultLevel = LEVELS.error;

exports.setLogLevel = function (level) {
    defaultLevel = level;
};

function formatTime(timestamp) {
    var hh = timestamp.getUTCHours();
    var mm = timestamp.getUTCMinutes();
    var ss = timestamp.getSeconds();
    var ms = timestamp.getMilliseconds();
    // If you were building a timestamp instead of a duration, you would uncomment the following line to get 12-hour (not 24) time
    // if (hh > 12) {hh = hh % 12;}
    // These lines ensure you have two-digits
    if (hh < 10) {
        hh = '0' + hh;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (ss < 10) {
        ss = '0' + ss;
    }
    if (ms < 100) {
        ms = '0' + ms;
    }
    if (ms < 10) {
        ms = '00' + ms;
    }
    // This formats your string to HH:MM:SS
    var t = hh + ':' + mm + ':' + ss + ' (' + ms + ')';
    return t;
}

function format(level) {
  const time = formatTime(new Date());
  return '%c ' + time  +' :%c' + level + ': ';
}

function Log(level) {
    this.level = level;

    this.log = function() {
        var args = Array.prototype.slice.call(arguments);
        var level = args.shift();
        var logLevel = this.level;
        if(typeof logLevel === 'undefined'){
            logLevel = defaultLevel;
        }
        if (logLevel <= level) {
            if (typeof console !== 'undefined') { //eslint-disable-line no-console
                if (typeof console.log !== 'undefined') { //eslint-disable-line no-console
                    //return console.log('[' + formatTime(new Date()) + '] ' , str); //eslint-disable-line no-console
                    args.unshift('[' + formatTime(new Date()) + '] ');
                    console.log.apply(console, args.map(function(a){
                        if (typeof a === "object") {
                          return a.toString() + JSON.stringify(a, null, 2);
                        }
                        return a;
                    }));
                }
            }
        }
    };

    this.trace = window.console.debug.bind(window.console, format('TRACE', name), 'color:grey;', 'color: grey;');
    this.debug = window.console.debug.bind(window.console, format('DEBUG', name), 'color:grey;', 'color: green;');
    this.info  = window.console.debug.bind(window.console, format('INFO',  name), 'color:grey;', 'color: blue;');
    this.warn  = window.console.debug.bind(window.console, format('WARN',  name), 'color:grey;', 'color: orange;');
    this.error = window.console.debug.bind(window.console, format('ERROR', name), 'color:grey;', 'color: red;');

}

exports.Log = Log;
