var mermaid;
if (typeof mermaid === 'undefined') {
    mermaid = {}
}

/**
 * Function used by parser to store vertices/nodes found in graph script.
 * @param vert
 * @param g
 */
mermaid.addVertices = function (vert, g) {
    var keys = Object.keys(vert);

    keys.forEach(function (id) {
        var vertice = vert[id];
        var verticeText;


        console.log(vertice.styles.length);

        var i;
        var style = '';
        for (i = 0; i < vertice.styles.length; i++) {
            if (typeof vertice.styles[i] !== 'undefined') {
                style = style + vertice.styles[i] + ';';
            }
        }

        if (vertice.text === undefined) {
            verticeText = vertice.id;
        }
        else {
            verticeText = vertice.text;
        }


        if (style === '') {
            //style = graph.defaultStyle();
        }

        console.log('g.setNode("' + vertice.id + '",    { label: "' + verticeText + '" });');
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

mermaid.addEdges = function (edges, g) {
    edges.forEach(function (edge) {
        var type, style;

        if(typeof edge.type === 'undefined'){
            type = 'arrow';
        }else{
            type = edge.type;
        }
        if(typeof edge.style === 'undefined'){
            style = 'arrow';
        }else{
            type = edge.type;
        }

        var edgeText;
        //console.log(vertice);
        if (edge.text === 'undefined') {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{ arrowheadStyle: "fill: #333"});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333"
                });
            }

        }
        else {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{label: edge.text, arrowheadStyle: "fill: #333"});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", label: edge.text
                });
            }
        }
        console.log('g.setEdge("' + edge.start + '","' + edge.end + '") ---');

    });
};

mermaid.drawChart = function (text, id) {

    console.log('drawing char with id:' + id);
    console.log(text);
    mermaid.graph.clear();
    parser.yy = mermaid.graph;

    var err = function () {
        console.log('Syntax error!!!');
    };

    parser.parse(text);

    var vert = mermaid.graph.getVertices();
    var edges = mermaid.graph.getEdges();

    console.log(edges);

    var keys = Object.keys(vert);

    var dir;
    dir = mermaid.direction;
    if(typeof dir === 'undefined'){
        dir='TD';
    }



    // Create the input mermaid.graph
    var g = new dagreD3.graphlib.Graph()
        .setGraph({
            //rankdir: "LR",
            rankdir: dir,
            marginx: 20,
            marginy: 20
        })
        .setDefaultEdgeLabel(function () {
            return {};
        });

    console.log(g);

    this.addVertices(vert, g);
    this.addEdges(edges, g);

    // Create the renderer
    var render = new dagreD3.render();

    // Add our custom shape
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

mermaid.init = function () {
    var arr = document.querySelectorAll('.mermaid');


    var cnt = 0;
    for (i = 0; i < arr.length; i++) {
        var element = arr[i];
        var id;
        //if(element.id.length === 0){
        id = 'mermaidChart' + cnt;
        //arr[i].id = id;
        cnt++;
        //}
        //else{
        //    id=element.id;
        //}

        var chartText = element.textContent.trim();

        console.log(element);

        element.innerHTML = '<svg id="' + id + '" width="100%">' +
        '<g />' +
        '</svg>';


        this.drawChart(chartText, id);
    }
    ;
};
mermaid.init();