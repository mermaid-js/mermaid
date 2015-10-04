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
var Logger;

Logger = (function() {
    function Logger(options) {
        var level, num, ref;
        this.options = options || {};
        this.level = this.options.level || Logger.levels.default;
        ref = Logger.levels;
        for (level in ref) {
            num = ref[level];
            Logger.define(this, level);
        }
    }

    Logger.prototype.add = function(level, message, callback) {
        if (this.level > (Logger.levels[level] || 5)) {
            return;
        }
        if (callback) {
            message = callback();
        } else if (typeof message === 'function') {
            message = message();
        }
        return this.write({
            timestamp: new Date,
            severity: level,
            message: message,
            pid: process.pid
        });
    };

    function formatTime(timestamp){
        var hh = timestamp.getUTCHours();
        var mm = timestamp.getUTCMinutes();
        var ss = timestamp.getSeconds();
        var ms = timestamp.getMilliseconds();
        // If you were building a timestamp instead of a duration, you would uncomment the following line to get 12-hour (not 24) time
        // if (hh > 12) {hh = hh % 12;}
        // These lines ensure you have two-digits
        if (hh < 10) {hh = "0"+hh;}
        if (mm < 10) {mm = "0"+mm;}
        if (ss < 10) {ss = "0"+ss;}
        if (ms < 100){ms = "0"+ms;}
        if (ms < 10) {ms = "00"+ms;}
        // This formats your string to HH:MM:SS
        var t = hh+":"+mm+":"+ss +' ('+ms+')';
        return t;
    }

    Logger.prototype.write = function(options) {
        if(typeof console !== 'undefined'){
            if(typeof console.log  !== 'undefined'){
                return console.log(this.build_message(options));
            }
        }
    };

    Logger.prototype.build_message = function(options) {
        return "[" + formatTime(options.timestamp) + "] " + options.message;
    };

    return Logger;

})();

Logger.define = function(logger, level) {
    return logger[level] = function(message, callback) {
        return this.add(level, message, callback);
    };
};

Logger.levels = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
    default:5
};
exports.setLogLevel = function(level){
    Logger.levels.default = level;
}
exports.create = function(options) {
    return new Logger(options);
};