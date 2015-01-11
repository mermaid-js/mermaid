/**
 * Created by knut on 14-11-03.
 */

var vertices = {};
var edges = [];
var classes = [];
var subGraphs = [];
var direction;
// Functions to be run after graph rendering
var funs = [];
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 */
exports.addVertex = function (id, text, type, style) {

    if(typeof id === 'undefined'){
        return;
    }
    if(id.trim().length === 0){
        return;
    }

    if (typeof vertices[id] === 'undefined') {
        vertices[id] = {id: id, styles: [], classes:[]};
    }
    if (typeof text !== 'undefined') {
        vertices[id].text = text;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof style !== 'undefined') {
        if (style !== null) {
            style.forEach(function (s) {
                vertices[id].styles.push(s);
            });
        }
    }
};

/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
exports.addLink = function (start, end, type, linktext) {
    //console.log('Got edge', start, end);
    var edge = {start: start, end: end, type: undefined, text: ''};
    linktext = type.text;

    if (typeof linktext !== 'undefined') {
        edge.text = linktext;
    }

    if (typeof type !== 'undefined') {
        edge.type = type.type;
        edge.stroke = type.stroke;
    }
    edges.push(edge);
};
/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
exports.updateLink = function (pos, style) {
    var position = pos.substr(1);
    edges[pos].style = style;
};

exports.addClass = function (id, style) {
    if (typeof classes[id] === 'undefined') {
        classes[id] = {id: id, styles: []};
    }

    if (typeof style !== 'undefined') {
        if (style !== null) {
            style.forEach(function (s) {
                classes[id].styles.push(s);
            });
        }
    }
};

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setDirection = function (dir) {
    direction = dir;
};

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setClass = function (id,className) {
    if(id.indexOf(',')>0){
        id.split(',').forEach(function(id2){
            if(typeof vertices[id2] !== 'undefined'){
                vertices[id2].classes.push(className);
            }
        });
    }else{
        if(typeof vertices[id] !== 'undefined'){
            vertices[id].classes.push(className);
        }
    }
};
/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setClickEvent = function (id,functionName) {


        if(id.indexOf(',')>0){
            id.split(',').forEach(function(id2) {
                if (typeof vertices[id2] !== 'undefined') {
                    funs.push(function () {
                        var elem = document.getElementById(id2);
                        if (elem !== null) {
                            elem.onclick = function () {
                                eval(functionName + '(\'' + id2 + '\')'); // jshint ignore:line
                            };
                        }
                    });
                }
            });
        }else{
            //console.log('Checking now for ::'+id);
            if(typeof vertices[id] !== 'undefined'){
                funs.push(function(){
                    var elem = document.getElementById(id);
                    if(elem !== null){
                        //console.log('id was NOT null: '+id);
                        elem.onclick = function(){eval(functionName+'(\'' + id + '\')');}; // jshint ignore:line
                    }
                    else{
                        //console.log('id was null: '+id);
                    }
                });
            }
        }


};

exports.bindFunctions = function(){
    //setTimeout(function(){
        funs.forEach(function(fun){
            fun();
        });
    //},1000);

};
exports.getDirection = function () {
    return direction;
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
exports.getVertices = function () {
    return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
exports.getEdges = function () {
    return edges;
};

/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */
exports.getClasses = function () {
    return classes;
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.clear = function () {
    vertices = {};
    classes = {};
    edges = [];
    funs = [];
    subGraphs = [];
};
/**
 *
 * @returns {string}
 */
exports.defaultStyle = function () {
    return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.addSubGraph = function (list, title) {
    function uniq(a) {
        var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

        return a.filter(function(item) {
            var type = typeof item;
            if(type in prims)
                return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
            else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
        });
    }

    var subG = [];

    subG = uniq(subG.concat.apply(subG,list));
    //console.log(subG);

    subGraphs.push({nodes:subG,title:title});
};
exports.getSubGraphs = function (list) {
    return subGraphs;
};
