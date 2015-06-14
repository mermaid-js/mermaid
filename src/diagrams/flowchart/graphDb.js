/**
 * Created by knut on 14-11-03.
 */

var vertices = {};
var edges = [];
var classes = [];
var subGraphs = [];
var subCount=0;
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
    var txt;
    
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
        txt = text.trim();
        
        // strip quotes if string starts and exnds with a quote
        if(txt[0] === '"' && txt[txt.length-1] === '"'){
            txt = txt.substring(1,txt.length-1);
        }

        vertices[id].text = txt;
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
        edge.text = linktext.trim();
        
        // strip quotes if string starts and exnds with a quote
        if(edge.text[0] === '"' && edge.text[edge.text.length-1] === '"'){
            edge.text = edge.text.substring(1,edge.text.length-1);
        }
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

    if(pos === 'default'){
        edges.defaultStyle = style;
    }else{
        edges[pos].style = style;
    }
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
var clickEvents = [];
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
    funs.forEach(function(fun){
        fun();
    });
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
    //funs = [];
    subGraphs = [];
    subCount = 0;
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
            if(item===' '){
                return false;
            }
            if(type in prims)
                return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
            else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
        });
    }

    var nodeList = [];

    nodeList = uniq(nodeList.concat.apply(nodeList,list));


    var subGraph = {id:'subGraph'+subCount, nodes:nodeList,title:title};
//console.log('subGraph:' + subGraph.title + subGraph.id);
//console.log(subGraph.nodes);
    subGraphs.push(subGraph);
    subCount = subCount + 1;
    return subGraph.id;
};

var getPosForId = function(id){
    var i;
    for(i=0;i<subGraphs.length;i++){
        if(subGraphs[i].id===id){
            //console.log('Found pos for ',id,' ',i);
            return i;
        }
    }
    //console.log('No pos found for ',id,' ',i);
    return -1;
};
var secCount = -1;
var posCrossRef = [];
var indexNodes = function (id, pos) {
    var nodes = subGraphs[pos].nodes;
    secCount = secCount + 1;
    if(secCount>2000){
        return;
        
    }
    //var nPos = getPosForId(subGraphs[pos].id);
    posCrossRef[secCount]=pos;
    // Check if match
    if(subGraphs[pos].id === id){
        return {
            result:true,
            count:0
        };
    }
    

    var count = 0;
    var posCount = 1;
    while(count<nodes.length){
        var childPos = getPosForId(nodes[count]);
        // Ignore regular nodes (pos will be -1)
        if(childPos>=0){
            var res = indexNodes(id,childPos);
            if(res.result){
                return {
                    result:true,
                    count:posCount+res.count
                };
            }else{
                posCount = posCount + res.count;
            }
        }
        count = count +1;
    }
    
    return {
        result:false,
        count:posCount
    };

};



exports.getDepthFirstPos = function (pos) {
    return posCrossRef[pos];
};
exports.indexNodes = function (id) {
    secCount = -1;
    if(subGraphs.length>0){
        indexNodes('none',subGraphs.length-1,0);
    }
};

exports.getSubGraphs = function (list) {
    return subGraphs;
};

exports.parseError = function(err,hash){
    mermaid.parseError(err,hash);
};