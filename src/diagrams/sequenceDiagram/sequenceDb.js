/**
 * Created by knut on 14-11-19.
 */
var actors = {};
var actorKeys = [];
var messages = [];
var notes = [];
exports.addActor = function(id,name,description){
    //console.log('Adding actor: '+id);
    actors[id] = {name:name, description:description};
    actorKeys.push(id);
};

exports.addMessage = function(idFrom, idTo, message,  answer){
    //console.log('Adding message from='+idFrom+' to='+idTo+' message='+message+' answer='+answer);
    messages.push({from:idFrom, to:idTo, message:message, answer:answer});
};

exports.addSignal = function(idFrom, idTo, message,  messageType){
    //console.log('Adding message from='+idFrom+' to='+idTo+' message='+message+' answer='+answer);
    messages.push({from:idFrom, to:idTo, message:message, type:messageType});
};

exports.getMessages = function(){
    return messages;
};

exports.getActors = function(){
    return actors;
};
exports.getActor = function(id){
    return actors[id];
};
exports.getActorKeys = function(){
    return Object.keys(actors);
};

exports.clear = function(){
    actors = {};
    messages = [];
};

exports.LINETYPE = {
    SOLID  : 0,
    DOTTED : 1
};

exports.ARROWTYPE = {
    FILLED  : 0,
    OPEN    : 1
};

exports.PLACEMENT = {
    LEFTOF  : 0,
    RIGHTOF : 1,
    OVER    : 2
};

exports.addNote = function (actor, placement, message){
    var note = {actor:actor, placement: placement, message:message};

    notes.push(note);
};


exports.parseError = function(err, hash) {
    console.log('Syntax error:' + err);
};