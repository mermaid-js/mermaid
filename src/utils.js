/**
 * Created by knut on 14-11-23.
 */
module.exports.detectType = function(text){
    if(text.match(/^\s*sequence/)){
        return "sequence";
    }
    else{
        return "graph";
    }
}