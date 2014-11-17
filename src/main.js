var mermaid;
if (typeof mermaid === 'undefined') {
    mermaid = {}
}

/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
mermaid.addVertices = function (vert, g) {
    var keys = Object.keys(vert);

    // Iterate through each item in the vertice object (containing all the vertices found) in the graph definition
    keys.forEach(function (id) {
        var vertice = vert[id];
        var verticeText;

        var i;
        var style = '';
        // Create a compund style definiton from the style definitions found for the node in the graph definition
        for (i = 0; i < vertice.styles.length; i++) {
            if (typeof vertice.styles[i] !== 'undefined') {
                style = style + vertice.styles[i] + ';';
            }
        }

        // Use vertice id as text in the box if no text is provided by the graph definition
        if (vertice.text === undefined) {
            verticeText = vertice.id;
        }
        else {
            verticeText = vertice.text;
        }

        // Create the node in the graph nased on defined form
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
mermaid.addEdges = function (edges, g) {
    edges.forEach(function (edge) {

        // Set link type for rendering
        if(edge.type === 'arrow_open'){
            aHead = 'none';
        }
        else{
            aHead = 'vee';
        }

        // Add the edge to the graph
        if (edge.text === 'undefined') {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{ arrowheadStyle: "fill: #333", arrowhead: aHead});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", arrowhead: aHead
                });
            }
        }
        else {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{label: edge.text, arrowheadStyle: "fill: #33f", arrowhead: aHead});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", label: edge.text, arrowhead: aHead
                });
            }
        }
    });
};

/**
 * Draws a chart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
mermaid.drawChart = function (text, id) {
    mermaid.graph.clear();
    parser.yy = mermaid.graph;

    // Parse the graph definition
    parser.parse(text);

    // Fetch the default direction, use TD if none was found
    var dir;
    dir = mermaid.direction;
    if(typeof dir === 'undefined'){
        dir='TD';
    }

    // Create the input mermaid.graph
    var g = new dagreD3.graphlib.Graph()
        .setGraph({
            rankdir: dir,
            marginx: 20,
            marginy: 20
        })
        .setDefaultEdgeLabel(function () {
            return {};
        });

    // Fetch the verices/nodes and edges/links from the parsed graph definition
    var vert = mermaid.graph.getVertices();
    var edges = mermaid.graph.getEdges();

    this.addVertices(vert, g);
    this.addEdges(edges, g);

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
mermaid.init = function () {
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

        this.drawChart(chartText, id);
    }
    ;
};

/**
 * Version management
 * @returns {string}
 */
mermaid.version = function(){
    return '0.1.1';
}
/**
 * Wait for coument loaded before starting the execution
 */
document.addEventListener('DOMContentLoaded', function(){
        mermaid.init();
    }, false);