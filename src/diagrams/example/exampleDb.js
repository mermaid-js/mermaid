/**
 * Created by knut on 15-01-14.
 */

var message = '';
var info = false;

exports.setMessage = function(txt){
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
    mermaid.parseError(err,hash);
};