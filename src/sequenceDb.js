/**
 * Created by knut on 14-11-19.
 */
var actors = {};
var messages = [];
exports.addActor = function(id,name,description){
    //console.log('Adding actor: '+id);
    actors[id] = {name:name, description:description};
};

exports.addMessage = function(idFrom, idTo, message,  answer){
    //console.log('Adding message from='+idFrom+' to='+idTo+' message='+message+' answer='+answer);
    messages.push({from:idFrom, to:idTo, message:message, answer:answer});
};

exports.getMessages = function(){
    return messages;
};

exports.getActors = function(){
    return actors;
};

exports.clear = function(){
    actors = {};
    messages = [];
};