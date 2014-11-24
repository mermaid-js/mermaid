(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function (global){
var graph = require('./graphDb');
var flow = require('./parser/flow');
var utils = require('./utils');
var seq = require('./sequenceRenderer');
/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
var addVertices = function (vert, g) {
    var keys = Object.keys(vert);

    var styleFromStyleArr = function(styleStr,arr){
        var i;
        // Create a compound style definition from the style definitions found for the node in the graph definition
        for (i = 0; i < arr.length; i++) {
            if (typeof arr[i] !== 'undefined') {
                styleStr = styleStr + arr[i] + ';';
            }
        }

        return styleStr;
    }

    // Iterate through each item in the vertice object (containing all the vertices found) in the graph definition
    keys.forEach(function (id) {
        var vertice = vert[id];
        var verticeText;

        var i;

        var style = '';
        var classes = graph.getClasses();
        // Check if class is defined for the node

        if(vertice.classes.length >0){
            for (i = 0; i < vertice.classes.length; i++) {
                style = styleFromStyleArr(style,classes[vertice.classes[i]].styles);
            }
        }
        else{
            // Use default classes
            style = styleFromStyleArr(style,classes.default.styles);
        }


        // Create a compound style definition from the style definitions found for the node in the graph definition
        style = styleFromStyleArr(style, vertice.styles);

        // Use vertice id as text in the box if no text is provided by the graph definition
        if (vertice.text === undefined) {
            verticeText = vertice.id;
        }
        else {
            verticeText = vertice.text;
        }

        // Create the node in the graph based on defined form
        if (vertice.type === 'round') {
            g.setNode(vertice.id, {label: verticeText, rx: 5, ry: 5, style: style, id:vertice.id});
        } else {
            if (vertice.type === 'diamond') {
                g.setNode(vertice.id, {shape: "question", label: verticeText, rx: 0, ry: 0, style: style, id:vertice.id});
            } else {
                g.setNode(vertice.id, {label: verticeText, rx: 0, ry: 0, style: style, id:vertice.id});
            }
        }
    });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param edges
 * @param g
 */
var addEdges = function (edges, g) {
    var cnt=0;
    edges.forEach(function (edge) {
        cnt++;

        // Set link type for rendering
        if(edge.type === 'arrow_open'){
            aHead = 'none';
        }
        else{
            aHead = 'vee';
        }

        // Add the edge to the graph
        if (typeof edge.text === 'undefined') {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{ style: "stroke: #333; stroke-width: 1.5px;fill:none", arrowheadStyle: "fill: #333", arrowhead: aHead},cnt);
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", arrowhead: aHead
                },cnt);
            }
        }
        // Edge with text
        else {

            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{style: "stroke: #333; stroke-width: 1.5px;fill:none", label: edge.text, arrowheadStyle: "fill: #333", arrowhead: aHead},cnt);
            }else{

                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", label: edge.text, arrowhead: aHead
                },cnt);
            }
        }
    });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
var draw = function (text, id) {
    graph.clear();
    flow.parser.yy = graph;

    // Parse the graph definition
    flow.parser.parse(text);

    // Fetch the default direction, use TD if none was found
    var dir;
    dir = graph.getDirection();
    if(typeof dir === 'undefined'){
        dir='TD';
    }

    // Create the input mermaid.graph
    var g = new dagreD3.graphlib.Graph({multigraph:true})
        .setGraph({
            rankdir: dir,
            marginx: 20,
            marginy: 20

        })
        .setDefaultEdgeLabel(function () {
            return {};
        });

    // Fetch the verices/nodes and edges/links from the parsed graph definition
    var vert = graph.getVertices();
    var edges = graph.getEdges();
    var classes = graph.getClasses();

    if(typeof classes.default === 'undefined'){
        classes.default = {id:'default'};
        classes.default.styles = ['fill:#eaeaea','stroke:#666','stroke-width:1.5px'];
    }
    addVertices(vert, g);
    addEdges(edges, g);

    // Create the renderer
    var render = new dagreD3.render();

    // Add custom shape for rhombus type of boc (decision)
    render.shapes().question = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height * 3,
            points = [
                {x: w / 2, y: 0},
                {x: w, y: -h / 2},
                {x: w / 2, y: -h},
                {x: 0, y: -h / 2}
            ];
        shapeSvg = parent.insert("polygon", ":first-child")
            .attr("points", points.map(function (d) {
                return d.x + "," + d.y;
            }).join(" "))
            .style("fill", "#fff")
            .style("stroke", "#333")
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("transform", "translate(" + (-w / 2) + "," + (h * 2 / 4) + ")");
        node.intersect = function (point) {
            return dagreD3.intersect.polygon(node, points, point);
        };
        return shapeSvg;
    };

    // Add our custom arrow - an empty arrowhead
    render.arrows().none = function normal(parent, id, edge, type) {
      var marker = parent.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto");

      var path = marker.append("path")
        .attr("d", "M 0 0 L 0 0 L 0 0 z");
      dagreD3.util.applyStyle(path, edge[type + "Style"]);
    };

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select("#" + id);
    svgGroup = d3.select("#" + id + " g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select("#" + id + " g"), g);

    // Center the graph
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    //svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
};

/**
 * Go through the document and find the chart definitions in there and render the charts
 */
var init = function () {
    var arr = document.querySelectorAll('.mermaid');

    var cnt = 0;
    for (i = 0; i < arr.length; i++) {
        var element = arr[i];
        var id;

        id = 'mermaidChart' + cnt;
        cnt++;

        var chartText = element.textContent.trim();

        element.innerHTML = '<svg id="' + id + '" width="100%">' +
        '<g />' +
        '</svg>';

        if(utils.detectType(chartText) === 'graph'){
            draw(chartText, id);
            graph.bindFunctions();
        }
        else{
            seq.draw(chartText,id);
        }

    }
    ;
};

/**
 * Version management
 * @returns {string}
 */
exports.version = function(){
    return '0.2.3';
}

var equals = function (val, variable){
    if(typeof variable !== 'undefined'){
        return false;
    }
    else{
        return (val === variable);
    }
};

/**
 * Wait for coument loaded before starting the execution
 */
document.addEventListener('DOMContentLoaded', function(){
    // Check presence of config object
    if(typeof mermaid_config !== 'undefined'){
        // Check if property startOnLoad is set
        if(equals(true,mermaid_config.startOnLoad)){
            init();
        }
    }
    else{
        // No config found, do autostart in this simple case
        init();
    }
}, false);

global.mermaid = {
    init:function(){
        init();
    },
    version:function(){
        return exports.version();
    }
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./graphDb":5,"./parser/flow":6,"./sequenceRenderer":9,"./utils":10}],5:[function(require,module,exports){
/**
 * Created by knut on 14-11-03.
 */

var vertices = {};
var edges = [];
var classes = [];
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
    //console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
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
    var edge = {start: start, end: end, type: undefined, text: ''};
    var linktext = type.text;
    if (typeof linktext !== 'undefined') {
        edge.text = linktext;
    }

    if (typeof type !== 'undefined') {
        edge.type = type.type;
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
    edges[position].style = style;
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
                                eval(functionName + '(\'' + id2 + '\')');
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
                        elem.onclick = function(){eval(functionName+'(\'' + id + '\')');};
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
};
/**
 *
 * @returns {string}
 */
exports.defaultStyle = function () {
    return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
};


},{}],6:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,7],$V1=[2,13],$V2=[1,21],$V3=[1,22],$V4=[1,23],$V5=[1,24],$V6=[1,25],$V7=[1,26],$V8=[1,27],$V9=[1,28],$Va=[1,29],$Vb=[1,30],$Vc=[1,15],$Vd=[1,16],$Ve=[1,17],$Vf=[1,14],$Vg=[6,9],$Vh=[11,30,31,32,33,34,35,36,37,38,39,40,48,50,51,52],$Vi=[2,7],$Vj=[11,43,44,45,46],$Vk=[9,11,21,23,24,25,26,27,43,44,45,46,47],$Vl=[9,11,21,23,24,25,26,27,31,32,33,34,35,36,37,38,39,40,43,44,45,46,47],$Vm=[9,11,21,23,24,25,26,27,30,31,32,33,34,35,36,37,38,39,40,43,44,45,46,47],$Vn=[31,32,33,34,35,36,37,38,39,40],$Vo=[31,32,33,34,35,36,37,38,39,40,47],$Vp=[23,25,27,47],$Vq=[1,93],$Vr=[1,90],$Vs=[1,88],$Vt=[1,91],$Vu=[1,89],$Vv=[1,94],$Vw=[1,92],$Vx=[1,101],$Vy=[11,34],$Vz=[9,11,30,31,32,33,34,53,56];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"graphConfig":4,"statements":5,"EOF":6,"spaceList":7,"GRAPH":8,"SPACE":9,"DIR":10,"SEMI":11,"statement":12,"verticeStatement":13,"styleStatement":14,"classDefStatement":15,"classStatement":16,"clickStatement":17,"vertex":18,"link":19,"alphaNum":20,"SQS":21,"text":22,"SQE":23,"PS":24,"PE":25,"DIAMOND_START":26,"DIAMOND_STOP":27,"alphaNumStatement":28,"alphaNumToken":29,"MINUS":30,"ALPHA":31,"NUM":32,"COLON":33,"COMMA":34,"PLUS":35,"EQUALS":36,"MULT":37,"DOT":38,"TAGSTART":39,"TAGEND":40,"linkStatement":41,"arrowText":42,"ARROW_POINT":43,"ARROW_CIRCLE":44,"ARROW_CROSS":45,"ARROW_OPEN":46,"PIPE":47,"CLASSDEF":48,"stylesOpt":49,"CLASS":50,"CLICK":51,"STYLE":52,"HEX":53,"style":54,"styleComponent":55,"UNIT":56,"$accept":0,"$end":1},
terminals_: {2:"error",6:"EOF",8:"GRAPH",9:"SPACE",10:"DIR",11:"SEMI",21:"SQS",23:"SQE",24:"PS",25:"PE",26:"DIAMOND_START",27:"DIAMOND_STOP",30:"MINUS",31:"ALPHA",32:"NUM",33:"COLON",34:"COMMA",35:"PLUS",36:"EQUALS",37:"MULT",38:"DOT",39:"TAGSTART",40:"TAGEND",43:"ARROW_POINT",44:"ARROW_CIRCLE",45:"ARROW_CROSS",46:"ARROW_OPEN",47:"PIPE",48:"CLASSDEF",50:"CLASS",51:"CLICK",52:"STYLE",53:"HEX",56:"UNIT"},
productions_: [0,[3,3],[3,4],[4,4],[5,3],[5,1],[7,2],[7,1],[12,2],[12,2],[12,2],[12,2],[12,2],[13,0],[13,3],[13,1],[18,4],[18,4],[18,4],[18,1],[20,1],[20,2],[28,1],[28,3],[29,1],[29,1],[29,1],[29,1],[29,1],[29,1],[29,1],[29,1],[29,1],[29,1],[19,2],[19,1],[41,1],[41,1],[41,1],[41,1],[42,3],[22,3],[22,5],[22,1],[15,5],[16,5],[17,5],[14,5],[14,5],[49,1],[49,3],[54,1],[54,2],[55,1],[55,1],[55,1],[55,1],[55,1],[55,1],[55,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 2:
this.$=$$[$0-3];
break;
case 3:
 yy.setDirection($$[$0-1]);this.$ = $$[$0-1];
break;
case 14:
 yy.addLink($$[$0-2],$$[$0],$$[$0-1]);this.$ = 'oy'
break;
case 15:
this.$ = 'yo';
break;
case 16:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'square');
break;
case 17:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'round');
break;
case 18:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'diamond');
break;
case 19:
this.$ = $$[$0];yy.addVertex($$[$0]);
break;
case 20: case 22: case 24: case 25: case 51:
this.$=$$[$0];
break;
case 21:
this.$=$$[$0-1]+''+$$[$0];
break;
case 23:
this.$=$$[$0-2]+'-'+$$[$0];
break;
case 26: case 27: case 28: case 29: case 30: case 31: case 32: case 33: case 35: case 43:
this.$ = $$[$0];
break;
case 34:
$$[$0-1].text = $$[$0];this.$ = $$[$0-1];
break;
case 36:
this.$ = {"type":"arrow"};
break;
case 37:
this.$ = {"type":"arrow_circle"};
break;
case 38:
this.$ = {"type":"arrow_cross"};
break;
case 39:
this.$ = {"type":"arrow_open"};
break;
case 40:
this.$ = $$[$0-1];
break;
case 41:
this.$ = $$[$0-2] + ' ' +$$[$0];
break;
case 42:
this.$ = $$[$0-4] + ' - ' +$$[$0];
break;
case 44:
this.$ = $$[$0-4];yy.addClass($$[$0-2],$$[$0]);
break;
case 45:
this.$ = $$[$0-4];yy.setClass($$[$0-2], $$[$0]);
break;
case 46:
this.$ = $$[$0-4];yy.setClickEvent($$[$0-2], $$[$0]);
break;
case 47:
this.$ = $$[$0-4];yy.addVertex($$[$0-2],undefined,undefined,$$[$0]);
break;
case 48:
this.$ = $$[$0-4];yy.updateLink($$[$0-2],$$[$0]);
break;
case 49:
this.$ = [$$[$0]]
break;
case 50:
$$[$0-2].push($$[$0]);this.$ = $$[$0-2];
break;
case 52:
this.$ = $$[$0-1] + $$[$0];
break;
case 53: case 54: case 55: case 56: case 57: case 58: case 59:
this.$=$$[$0]
break;
}
},
table: [{3:1,4:2,8:[1,3]},{1:[3]},{5:4,7:5,9:$V0,11:$V1,12:6,13:8,14:9,15:10,16:11,17:12,18:13,20:18,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb,48:$Vc,50:$Vd,51:$Ve,52:$Vf},{9:[1,31]},{6:[1,32],7:33,9:$V0},{5:34,11:$V1,12:6,13:8,14:9,15:10,16:11,17:12,18:13,20:18,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb,48:$Vc,50:$Vd,51:$Ve,52:$Vf},o($Vg,[2,5]),o($Vh,$Vi,{7:35,9:$V0}),{11:[1,36]},{11:[1,37]},{11:[1,38]},{11:[1,39]},{11:[1,40]},{11:[2,15],19:41,41:42,43:[1,43],44:[1,44],45:[1,45],46:[1,46]},{9:[1,47]},{9:[1,48]},{9:[1,49]},{9:[1,50]},o($Vj,[2,19],{21:[1,51],24:[1,52],26:[1,53]}),o($Vk,[2,20],{28:19,29:20,20:54,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb}),o($Vl,[2,22],{30:[1,55]}),o($Vm,[2,24]),o($Vm,[2,25]),o($Vm,[2,26]),o($Vm,[2,27]),o($Vm,[2,28]),o($Vm,[2,29]),o($Vm,[2,30]),o($Vm,[2,31]),o($Vm,[2,32]),o($Vm,[2,33]),{10:[1,56]},{1:[2,1]},{11:$V1,12:57,13:8,14:9,15:10,16:11,17:12,18:13,20:18,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb,48:$Vc,50:$Vd,51:$Ve,52:$Vf},{6:[1,58],7:33,9:$V0},o($Vh,[2,6]),o($Vg,[2,8]),o($Vg,[2,9]),o($Vg,[2,10]),o($Vg,[2,11]),o($Vg,[2,12]),{18:59,20:18,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},o($Vn,[2,35],{42:60,47:[1,61]}),o($Vo,[2,36]),o($Vo,[2,37]),o($Vo,[2,38]),o($Vo,[2,39]),{20:62,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb,53:[1,63]},{20:64,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:65,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:66,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:68,22:67,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:68,22:69,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:68,22:70,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},o($Vk,[2,21]),{29:71,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{11:[1,72]},o($Vg,[2,4]),{1:[2,2]},{11:[2,14]},o($Vn,[2,34]),{20:68,22:73,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{9:[1,74]},{9:[1,75]},{9:[1,76]},{9:[1,77]},{9:[1,78]},{23:[1,79]},o($Vp,[2,43],{7:81,9:[1,80]}),{25:[1,82]},{27:[1,83]},o($Vl,[2,23]),o([9,11,31,32,33,34,35,36,37,38,39,40,48,50,51,52],[2,3]),{47:[1,84]},{9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,49:85,53:$Vv,54:86,55:87,56:$Vw},{9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,49:95,53:$Vv,54:86,55:87,56:$Vw},{9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,49:96,53:$Vv,54:86,55:87,56:$Vw},{20:97,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{20:98,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},o($Vj,[2,16]),{7:35,9:$V0,20:68,22:99,28:19,29:20,30:$Vi,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},{30:[1,100]},o($Vj,[2,17]),o($Vj,[2,18]),o($Vn,[2,40]),{11:[2,47],34:$Vx},o($Vy,[2,49],{55:102,9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,53:$Vv,56:$Vw}),o($Vz,[2,51]),o($Vz,[2,53]),o($Vz,[2,54]),o($Vz,[2,55]),o($Vz,[2,56]),o($Vz,[2,57]),o($Vz,[2,58]),o($Vz,[2,59]),{11:[2,48],34:$Vx},{11:[2,44],34:$Vx},{11:[2,45]},{11:[2,46]},o($Vp,[2,41]),{7:103,9:$V0},{9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,53:$Vv,54:104,55:87,56:$Vw},o($Vz,[2,52]),{20:68,22:105,28:19,29:20,31:$V2,32:$V3,33:$V4,34:$V5,35:$V6,36:$V7,37:$V8,38:$V9,39:$Va,40:$Vb},o($Vy,[2,50],{55:102,9:$Vq,30:$Vr,31:$Vs,32:$Vt,33:$Vu,53:$Vv,56:$Vw}),o($Vp,[2,42])],
defaultActions: {32:[2,1],58:[2,2],59:[2,14],97:[2,45],98:[2,46]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 52;
break;
case 1:return 48;
break;
case 2:return 50;
break;
case 3:return 51;
break;
case 4:return 8;
break;
case 5:return 10;
break;
case 6:return 10;
break;
case 7:return 10;
break;
case 8:return 10;
break;
case 9:return 10;
break;
case 10:return 10;
break;
case 11:return 53;
break;
case 12:return 32;
break;
case 13:return 'BRKT';
break;
case 14:return 56;
break;
case 15:return 56;
break;
case 16:return 56;
break;
case 17:return 33;
break;
case 18:return 11;
break;
case 19:return 34;
break;
case 20:return 36;
break;
case 21:return 37;
break;
case 22:return 38;
break;
case 23:return 39;
break;
case 24:return 40;
break;
case 25:return 45;
break;
case 26:return 43;
break;
case 27:return 44;
break;
case 28:return 46;
break;
case 29:return 30;
break;
case 30:return 35;
break;
case 31:return 36;
break;
case 32:return 31;
break;
case 33:return 47;
break;
case 34:return 24;
break;
case 35:return 25;
break;
case 36:return 21;
break;
case 37:return 23;
break;
case 38:return 26
break;
case 39:return 27
break;
case 40:return 9;
break;
case 41:return 'NEWLINE';
break;
case 42:return 6;
break;
}
},
rules: [/^(?:style\b)/,/^(?:classDef\b)/,/^(?:class\b)/,/^(?:click\b)/,/^(?:graph\b)/,/^(?:LR\b)/,/^(?:RL\b)/,/^(?:TB\b)/,/^(?:BT\b)/,/^(?:TD\b)/,/^(?:BR\b)/,/^(?:#[a-f0-9]+)/,/^(?:[0-9]+)/,/^(?:#)/,/^(?:px\b)/,/^(?:pt\b)/,/^(?:dot\b)/,/^(?::)/,/^(?:;)/,/^(?:,)/,/^(?:=)/,/^(?:\*)/,/^(?:\.)/,/^(?:<)/,/^(?:>)/,/^(?:--[x])/,/^(?:-->)/,/^(?:--[o])/,/^(?:---)/,/^(?:-)/,/^(?:\+)/,/^(?:=)/,/^(?:[a-zåäöæøA-ZÅÄÖÆØ_]+)/,/^(?:\|)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:\s)/,/^(?:\n)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3,"fs":1,"path":2}],7:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,11],$V1=[1,12],$V2=[1,17],$V3=[1,16],$V4=[6,8,28],$V5=[6,8,14,16,28,31,32],$V6=[6,8,14,16,18,28,31,32],$V7=[6,31,32],$V8=[1,35],$V9=[6,8,16,18,28,31,32];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"sequenceConfig":4,"statements":5,"EOF":6,"SEQ":7,"SPACE":8,"DIR":9,"newlines":10,"statement":11,"preStatement":12,"alphaNum":13,"COLON":14,"text":15,"DOT":16,"message":17,"EQUALS":18,"callee":19,"action":20,"SQS":21,"SQE":22,"actorDefinition":23,"messageDefinition":24,"caller":25,"answer":26,"spaceList":27,"NEWLINE":28,"alphaNumStatement":29,"alphaNumToken":30,"ALPHA":31,"NUM":32,"textStatement":33,"textToken":34,"$accept":0,"$end":1},
terminals_: {2:"error",6:"EOF",7:"SEQ",8:"SPACE",9:"DIR",14:"COLON",16:"DOT",18:"EQUALS",21:"SQS",22:"SQE",28:"NEWLINE",31:"ALPHA",32:"NUM"},
productions_: [0,[3,2],[3,1],[4,4],[5,3],[5,2],[5,3],[12,3],[11,1],[11,3],[11,5],[20,2],[23,3],[24,7],[25,1],[26,1],[19,1],[17,1],[27,2],[27,1],[10,2],[10,2],[10,1],[10,1],[13,1],[29,2],[29,1],[30,1],[30,1],[15,1],[33,2],[33,1],[34,1],[34,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: case 5:
this.$=$$[$0-1];
break;
case 3:
 this.$ = $$[$0-1];
break;
case 4: case 6:
this.$=$$[$0-2];
break;
case 7:
this.$={a:$$[$0-2],b:$$[$0]}
break;
case 8:
yy.addActor($$[$0].a,'actor',$$[$0].b);this.$='actor';
break;
case 9:
yy.addMessage($$[$0-2].a,$$[$0-2].b,$$[$0]);this.$='message';
break;
case 10:
yy.addMessage($$[$0-4].a,$$[$0-2],$$[$0],$$[$0-4].b);this.$='actor';
break;
case 11:
this.$='action';
break;
case 12:
this.$='actor';
break;
case 13:
console.log('Got new message from='+$$[$0-6]+' to='+$$[$0-2]+' message='+$$[$0]+' answer='+$$[$0-4]);this.$='actor';
break;
case 24: case 27: case 28: case 29: case 33:
this.$=$$[$0];
break;
case 25: case 30:
this.$=$$[$0-1]+''+$$[$0];
break;
}
},
table: [{3:1,4:2,6:[1,3],7:[1,4]},{1:[3]},{5:5,11:6,12:7,13:8,29:9,30:10,31:$V0,32:$V1},{1:[2,2]},{8:[1,13]},{1:[2,1]},{6:[1,15],8:$V2,10:14,28:$V3},o($V4,[2,8],{16:[1,18],18:[1,19]}),{14:[1,20],30:21,31:$V0,32:$V1},o($V5,[2,24]),o($V5,[2,26]),o($V6,[2,27]),o($V6,[2,28]),{9:[1,22]},{5:23,6:[1,24],11:6,12:7,13:8,29:9,30:10,31:$V0,32:$V1},{1:[2,5]},o($V7,[2,22],{10:25,8:$V2,28:$V3}),o($V7,[2,23],{10:26,8:$V2,28:$V3}),{13:28,17:27,29:9,30:10,31:$V0,32:$V1},{13:30,19:29,29:9,30:10,31:$V0,32:$V1},{8:$V8,15:31,30:34,31:$V0,32:$V1,33:32,34:33},o($V5,[2,25]),{8:$V2,10:36,28:$V3},{1:[2,4]},{1:[2,6]},o($V7,[2,20]),o($V7,[2,21]),o($V4,[2,9]),o($V4,[2,17],{30:21,31:$V0,32:$V1}),{16:[1,37]},{16:[2,16],30:21,31:$V0,32:$V1},o([6,16,18,28],[2,7],{30:34,34:38,8:$V8,31:$V0,32:$V1}),o($V9,[2,29]),o($V9,[2,31]),o($V9,[2,32]),o($V9,[2,33]),o([31,32],[2,3]),{13:28,17:39,29:9,30:10,31:$V0,32:$V1},o($V9,[2,30]),o($V4,[2,10])],
defaultActions: {3:[2,2],5:[2,1],15:[2,5],23:[2,4],24:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 28;
break;
case 1:return 7;
break;
case 2:return 9;
break;
case 3:return 32;
break;
case 4:return 14;
break;
case 5:return 'MINUS';
break;
case 6:return 'PLUS';
break;
case 7:return 18;
break;
case 8:return 31;
break;
case 9:return 'SLASH';
break;
case 10:return 'PS';
break;
case 11:return 'PE';
break;
case 12:return 21;
break;
case 13:return 22;
break;
case 14:return 16;
break;
case 15:return 8;
break;
case 16:return 6;
break;
}
},
rules: [/^(?:\n)/,/^(?:sequence\b)/,/^(?:TB\b)/,/^(?:[0-9]+)/,/^(?::)/,/^(?:-)/,/^(?:\+)/,/^(?:=)/,/^(?:[a-zåäöæøA-ZÅÄÖÆØ()]+)/,/^(?:\/)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\.)/,/^(?:\s)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3,"fs":1,"path":2}],8:[function(require,module,exports){
/**
 * Created by knut on 14-11-19.
 */
var actors = {};
var actorKeys = [];
var messages = [];
exports.addActor = function(id,name,description){
    console.log('Adding actor: '+id);
    actors[id] = {name:name, description:description};
    actorKeys.push(id);
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

exports.getActorKeys = function(){
    return actorKeys;
};

exports.clear = function(){
    actors = {};
    messages = [];
};
},{}],9:[function(require,module,exports){
/**
 * Created by knut on 14-11-23.
 */

var sq = require('./parser/sequence').parser;
sq.yy = require('./sequenceDb');

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
    sq.yy.clear();
    sq.parse(text);

    var actors = sq.yy.getActors();
    var actorKeys = sq.yy.getActorKeys();

    var i;
    //console.log('Len = ' + )
    for(i=0;i<actorKeys.length;i++){
        var key = actorKeys[i];

        console.log('Doing key: '+key)

        var startMargin = 50;
        var margin = 50;
        var width = 150;
        var yStartMargin = 10;

        console.log('x=: '+(startMargin  + i*margin +i*150))

        var cont = d3.select("#mermaidChart0");
        var g = cont.append("g")
        g.append("rect")
            .attr("x", startMargin  + i*margin +i*150)
            .attr("y", yStartMargin)
            .attr("fill", '#eaeaea')
            .attr("stroke", '#666')
            .attr("width", 150)
            .attr("height", 65)
            .attr("rx", 3)
            .attr("ry", 3)
        g.append("text")      // text label for the x axis
            .attr("x", startMargin  + i*margin +i*150 + 75)
            .attr("y", yStartMargin+37.5)
            .style("text-anchor", "middle")
            .text(actors[actorKeys[i]].description)
            ;

    }
    //
    ////var cont = d3.select(id);
    //var cont = d3.select("#mermaidChart0");
    //var g = cont.append("g")
    //    .attr("x", 150)
    //    .attr("y", 10);
    //g.append("rect")
    //    .attr("fill", '#eaeaea')
    //    .attr("stroke", '#666')
    //    .attr("width", 150)
    //    .attr("height", 75)
    //    .attr("rx", 5)
    //    .attr("ry", 5)
    //g.append("text")      // text label for the x axis
    //    .style("text-anchor", "middle")
    //    .text("Date pok  ")
    //    .attr("y", 10);
    /*
     graph.clear();
     flow.parser.yy = graph;

     // Parse the graph definition
     flow.parser.parse(text);

     // Fetch the default direction, use TD if none was found
     var dir;
     dir = graph.getDirection();
     if(typeof dir === 'undefined'){
     dir='TD';
     }

     // Create the input mermaid.graph
     var g = new dagreD3.graphlib.Graph({multigraph:true})
     .setGraph({
     rankdir: dir,
     marginx: 20,
     marginy: 20

     })
     .setDefaultEdgeLabel(function () {
     return {};
     });

     // Fetch the verices/nodes and edges/links from the parsed graph definition
     var vert = graph.getVertices();
     var edges = graph.getEdges();
     var classes = graph.getClasses();

     if(typeof classes.default === 'undefined'){
     classes.default = {id:'default'};
     classes.default.styles = ['fill:#eaeaea','stroke:#666','stroke-width:1.5px'];
     }
     addVertices(vert, g);
     addEdges(edges, g);

     // Create the renderer
     var render = new dagreD3.render();

     // Add custom shape for rhombus type of boc (decision)
     render.shapes().question = function (parent, bbox, node) {
     var w = bbox.width,
     h = bbox.height * 3,
     points = [
     {x: w / 2, y: 0},
     {x: w, y: -h / 2},
     {x: w / 2, y: -h},
     {x: 0, y: -h / 2}
     ];
     shapeSvg = parent.insert("polygon", ":first-child")
     .attr("points", points.map(function (d) {
     return d.x + "," + d.y;
     }).join(" "))
     .style("fill", "#fff")
     .style("stroke", "#333")
     .attr("rx", 5)
     .attr("ry", 5)
     .attr("transform", "translate(" + (-w / 2) + "," + (h * 2 / 4) + ")");
     node.intersect = function (point) {
     return dagreD3.intersect.polygon(node, points, point);
     };
     return shapeSvg;
     };

     // Add our custom arrow - an empty arrowhead
     render.arrows().none = function normal(parent, id, edge, type) {
     var marker = parent.append("marker")
     .attr("id", id)
     .attr("viewBox", "0 0 10 10")
     .attr("refX", 9)
     .attr("refY", 5)
     .attr("markerUnits", "strokeWidth")
     .attr("markerWidth", 8)
     .attr("markerHeight", 6)
     .attr("orient", "auto");

     var path = marker.append("path")
     .attr("d", "M 0 0 L 0 0 L 0 0 z");
     dagreD3.util.applyStyle(path, edge[type + "Style"]);
     };

     // Set up an SVG group so that we can translate the final graph.
     var svg = d3.select("#" + id);
     svgGroup = d3.select("#" + id + " g");

     // Run the renderer. This is what draws the final graph.
     render(d3.select("#" + id + " g"), g);

     // Center the graph
     var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
     //svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
     svg.attr("height", g.graph().height + 40);
     */
};

},{"./parser/sequence":7,"./sequenceDb":8}],10:[function(require,module,exports){
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
},{}]},{},[4])