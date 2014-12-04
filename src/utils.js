/**
 * Created by knut on 14-11-23.
 */
module.exports.detectType = function(text){
    if(text.match(/^\s*sequenceDiagram/)){
        console.log('Detected sequenceDiagram syntax');
        return "sequenceDiagram";
    }

    if(text.match(/^\s*sequence/)){
        //console.log('Detected sequence syntax');
        return "sequence";
    }

    if(text.match(/^\s*digraph/)) {
        console.log('Detected flow syntax');
        return "dotGraph";
    }

    return "graph";
}