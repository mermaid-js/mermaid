/**
 * Created by knut on 14-12-11.
 */
var graph = require('./graphDb');
var flow = require('./parser/flow');
var dot = require('./parser/dot');
var dagreD3 = require('dagre-d3');
/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
exports.addVertices = function (vert, g) {
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
    };

    // Iterate through each item in the vertice object (containing all the vertices found) in the graph definition
    keys.forEach(function (id) {
        var vertice = vert[id];
        var verticeText;

        var i;

        /**
         * Variable for storing the classes for the vertice
         * @type {string}
         */
        var classStr = '';

        if(vertice.classes.length >0){
            classStr = vertice.classes.join(" ");
        }

        /**
         * Variable for storing the extracted style for the vertice
         * @type {string}
         */
        var style = '';
        // Create a compound style definition from the style definitions found for the node in the graph definition
        style = styleFromStyleArr(style, vertice.styles);

        // Use vertice id as text in the box if no text is provided by the graph definition
        if (typeof vertice.text === 'undefined') {
            verticeText = vertice.id;
        }
        else {
            verticeText = vertice.text;
        }

        var radious = 0;
        var _shape = '';

        // Set the shape based parameters
        switch(vertice.type){
            case 'round':
                radious = 5;
                _shape = 'rect';
                break;
            case 'square':
                _shape = 'rect';
                break;
            case 'diamond':
                _shape = 'question';
                break;
            case 'odd':
                _shape = 'rect_left_inv_arrow';
                break;
            case 'circle':
                _shape = 'circle';
                break;
            default:
                _shape = 'rect';
        }
        // Add the node
        g.setNode(vertice.id, {labelType: "html",shape:_shape, label: verticeText, rx: radious, ry: radious, class: classStr, style: style, id:vertice.id});
    });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */
exports.addEdges = function (edges, g) {
    var cnt=0;
    var aHead;
    edges.forEach(function (edge) {
        cnt++;

        // Set link type for rendering
        if(edge.type === 'arrow_open'){
            aHead = 'none';
        }
        else{
            aHead = 'normal';
        }

        var style = '';
        if(typeof edge.style !== 'undefined'){
            edge.style.forEach(function(s){
                style = style + s +';';
            });
        }

        // Add the edge to the graph
        if (typeof edge.text === 'undefined') {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{ style: "stroke: #333; stroke-width: 1.5px;fill:none", arrowheadStyle: "fill: #333", arrowhead: aHead},cnt);
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: style, arrowheadStyle: "fill: #333", arrowhead: aHead
                },cnt);
            }
        }
        // Edge with text
        else {

            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{labelType: "html",style: "stroke: #333; stroke-width: 1.5px;fill:none", labelpos:'c', label: '<span style="background:#e8e8e8">'+edge.text+'</span>', arrowheadStyle: "fill: #333", arrowhead: aHead},cnt);
            }else{
                g.setEdge(edge.start, edge.end, {
                    labelType: "html",style: style, arrowheadStyle: "fill: #333", label: edge.text, arrowhead: aHead
                },cnt);
            }
        }
    });
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
exports.getClasses = function (text, isDot) {
    var parser;
    graph.clear();
    if(isDot){
        parser = dot.parser;

    }else{
        parser = flow.parser;
    }
    parser.yy = graph;

    // Parse the graph definition
    parser.parse(text);

    var classDefStylesObj = {};
    var classDefStyleStr = '';

    var classes = graph.getClasses();

    // Add default class if undefined
    if(typeof classes.default === 'undefined') {
        classes.default = {id:'default'};
        classes.default.styles = ['fill:#eaeaea','stroke:#666','stroke-width:1.5px'];
    } 
    return classes;
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
exports.draw = function (text, id,isDot) {
    var parser;
    graph.clear();
    if(isDot){
        parser = dot.parser;

    }else{
        parser = flow.parser;
    }
    parser.yy = graph;

    // Parse the graph definition
    parser.parse(text);

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
    exports.addVertices(vert, g);
    exports.addEdges(edges, g);

    // Create the renderer
    var render = new dagreD3.render();

    // Add custom shape for rhombus type of boc (decision)
    render.shapes().question = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            s = (w + h) * 0.8,
            points = [
                {x: s / 2, y: 0},
                {x: s, y: -s / 2},
                {x: s / 2, y: -s},
                {x: 0, y: -s / 2}
            ];
        var shapeSvg = parent.insert("polygon", ":first-child")
            .attr("points", points.map(function (d) {
                return d.x + "," + d.y;
            }).join(" "))
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("transform", "translate(" + (-s / 2) + "," + (s * 2 / 4) + ")");
        node.intersect = function (point) {
            return dagreD3.intersect.polygon(node, points, point);
        };
        return shapeSvg;
    };

    // Add custom shape for box with inverted arrow on left side
    render.shapes().rect_left_inv_arrow = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            points = [
                {x: -h/2, y: 0},
                {x: w, y: 0},
                {x: w, y: -h},
                {x: -h/2, y: -h},
                {x: 0, y: -h/2},
            ];
        var shapeSvg = parent.insert("polygon", ":first-child")
            .attr("points", points.map(function (d) {
                return d.x + "," + d.y;
            }).join(" "))
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
    svg.attr("height", g.graph().height );
    svg.attr("width", g.graph().width );
};