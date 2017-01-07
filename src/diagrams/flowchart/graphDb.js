/**
 * Created by knut on 14-11-03.
 */
var Logger = require('../../logger');
var log = new Logger.Log();
var utils = require('../../utils');

var d3 = require('../../d3');
var vertices = {};
var edges = [];
var classes = [];
var subGraphs = [];
var tooltips = {};
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
    log.info('Got edge...', start, end);
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
 * Updates a link's line interpolation algorithm
 * @param pos
 * @param interpolate
 */
exports.updateLinkInterpolate = function (pos, interp) {
    if(pos === 'default'){
        edges.defaultInterpolate = interp;
    }else{
        edges[pos].interpolate = interp;
    }
};

/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
exports.updateLink = function (pos, style) {
    if(pos === 'default'){
        edges.defaultStyle = style;
    }else{
        if(utils.isSubstringInArray('fill', style) === -1) {
            style.push('fill:none');
        }
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

var setTooltip = function(id,tooltip){
    if(typeof  tooltip !== 'undefined'){
        tooltips[id]=tooltip;
    }
};

var setClickFun = function(id, functionName){
    if(typeof functionName === 'undefined'){
        return;
    }
    if (typeof vertices[id] !== 'undefined') {
        funs.push(function (element) {
            var elem = d3.select(element).select('#'+id);
            if (elem !== null) {
                elem.on('click', function () {
                    eval(functionName + '(\'' + id + '\')'); // jshint ignore:line
                });
            }
        });
    }
};

var setLink = function(id, linkStr){
    if(typeof linkStr === 'undefined'){
        return;
    }
    if (typeof vertices[id] !== 'undefined') {
        funs.push(function (element) {
            var elem = d3.select(element).select('#'+id);
            if (elem !== null) {
                elem.on('click', function () {
                    window.open(linkStr,'newTab'); // jshint ignore:line
                });
            }
        });
    }
};
exports.getTooltip = function(id){
    return tooltips[id];
};

/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setClickEvent = function (id,functionName, link,tooltip) {
        if(id.indexOf(',')>0){
            id.split(',').forEach(function(id2) {
                setTooltip(id2,tooltip);
                setClickFun(id2, functionName);
                setLink(id2, link);
            });
        }else{
            setTooltip(id,tooltip);
            setClickFun(id, functionName);
            setLink(id, link);
        }
};

exports.bindFunctions = function(element){
    funs.forEach(function(fun){
        fun(element);
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

var setupToolTips = function(element){

    var tooltipElem = d3.select('.mermaidTooltip');
    if(tooltipElem[0][0] === null){
        tooltipElem = d3.select('body')
            .append('div')
            .attr('class', 'mermaidTooltip')
            .style('opacity', 0);
    }

    var svg = d3.select(element).select('svg');

    var nodes = svg.selectAll('g.node');
    nodes
        .on('mouseover', function() {
            var el = d3.select(this);
            var title = el.attr('title');
            // Dont try to draw a tooltip if no data is provided
            if(title === null){
                return;
            }
            var rect = this.getBoundingClientRect();

            tooltipElem.transition()
                .duration(200)
                .style('opacity', '.9');
            tooltipElem.html(el.attr('title'))
                .style('left', (rect.left+(rect.right-rect.left)/2) + 'px')
                .style('top', (rect.top-14+document.body.scrollTop) + 'px');
            el.classed('hover',true);

        })
        .on('mouseout', function() {
            tooltipElem.transition()
                .duration(500)
                .style('opacity', 0);
            var el = d3.select(this);
            el.classed('hover',false);
        });
};
funs.push(setupToolTips);

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.clear = function () {
    vertices = {};
    classes = {};
    edges = [];
    funs = [];
    funs.push(setupToolTips);
    subGraphs = [];
    subCount = 0;
    tooltips = [];
};
/**
 *
 * @returns {string}
 */
exports.defaultStyle = function () {
    return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.addSubGraph = function (list, title) {
    function uniq(a) {
        var prims = {'boolean':{}, 'number':{}, 'string':{}}, objs = [];

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
//log.debug('subGraph:' + subGraph.title + subGraph.id);
//log.debug(subGraph.nodes);
    subGraphs.push(subGraph);
    subCount = subCount + 1;
    return subGraph.id;
};

var getPosForId = function(id){
    var i;
    for(i=0;i<subGraphs.length;i++){
        if(subGraphs[i].id===id){
            //log.debug('Found pos for ',id,' ',i);
            return i;
        }
    }
    //log.debug('No pos found for ',id,' ',i);
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
exports.indexNodes = function () {
    secCount = -1;
    if(subGraphs.length>0){
        indexNodes('none',subGraphs.length-1,0);
    }
};

exports.getSubGraphs = function () {
    return subGraphs;
};

exports.parseError = function(err,hash){
    global.mermaidAPI.parseError(err,hash);
};