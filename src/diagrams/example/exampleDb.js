/**
 * Created by knut on 15-01-14.
 */
var Logger = require('../../logger');
var log = new Logger.Log();

var message = '';
var info = false;

exports.setMessage = function(txt){
    log.debug('Setting message to: '+txt);
    message = txt;
};

exports.getMessage = function(){
    return message;
};

exports.setInfo = function(inf){
    info = inf;
};

exports.getInfo = function(){
    return info;
};

exports.parseError = function(err,hash){
    global.mermaidAPI.parseError(err,hash);
};