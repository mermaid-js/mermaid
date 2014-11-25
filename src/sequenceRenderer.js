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

        //console.log('Doing key: '+key)

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
