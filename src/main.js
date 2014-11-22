var graph = require('./graphDb');
var flow = require('./parser/flow');

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
            g.setNode(vertice.id, {label: verticeText, rx: 5, ry: 5, style: style});
        } else {
            if (vertice.type === 'diamond') {
                g.setNode(vertice.id, {shape: "question", label: verticeText, rx: 0, ry: 0, style: style});
            } else {
                g.setNode(vertice.id, {label: verticeText, rx: 0, ry: 0, style: style});
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
 * Draws a chart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
var drawChart = function (text, id) {
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

        drawChart(chartText, id);
    }
    ;
};

/**
 * Version management
 * @returns {string}
 */
exports.version = function(){
    return '0.2.2';
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