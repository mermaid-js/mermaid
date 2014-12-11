/**
 * Created by knut on 14-11-23.
 */
/**
 * Detects the type of the graph text.
 * @param {string} text The text defining the graph
 * @param {string} text The second text defining the graph
 * @returns {string} A graph definition key
 */
module.exports.detectType = function(text,a){
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
};
