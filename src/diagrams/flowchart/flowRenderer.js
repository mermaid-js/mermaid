/**
 * Created by knut on 14-12-11.
 */
var graph = require('./graphDb');
var flow = require('./parser/flow');
var dot = require('./parser/dot');
var d3 = require('../../d3');
var dagreD3 = require('./dagre-d3');
var Logger = require('../../logger');
var log = new Logger.Log();


var conf = {
};
module.exports.setConf = function(cnf){
    var keys = Object.keys(cnf);
    var i;
    for(i=0;i<keys.length;i++){
        conf[keys[i]] = cnf[keys[i]];
    }
};

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

        /**
         * Variable for storing the classes for the vertice
         * @type {string}
         */
        var classStr = '';

        //log.debug(vertice.classes);

        if(vertice.classes.length >0){
            classStr = vertice.classes.join(' ');
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



        var labelTypeStr = '';
        if(conf.htmlLabels) {
            labelTypeStr = 'html';
            verticeText = verticeText.replace(/fa:fa[\w\-]+/g,function(s){
                return '<i class="fa '+ s.substring(3)+'"></i>';
            });

        } else {
            var svg_label = document.createElementNS('http://www.w3.org/2000/svg', 'text');

            var rows = verticeText.split(/<br>/);

            var j = 0;
            for(j=0;j<rows.length;j++){
                var tspan = document.createElementNS('http://www.w3.org/2000/svg','tspan');
                tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
                tspan.setAttribute('dy', '1em');
                tspan.setAttribute('x', '1');
                tspan.textContent = rows[j];
                svg_label.appendChild(tspan);
            }

            labelTypeStr = 'svg';
            verticeText = svg_label;


            //verticeText = verticeText.replace(/<br\/>/g, '\n');
            //labelTypeStr = 'text';
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
            case 'odd_right':
                _shape = 'rect_left_inv_arrow';
                break;
            case 'circle':
                _shape = 'circle';
                break;
            case 'ellipse':
                _shape = 'ellipse';
                break;
            case 'group':
                _shape = 'rect';
                // Need to create a text node if using svg labels, see #367
                verticeText = conf.htmlLabels ? '' : document.createElementNS('http://www.w3.org/2000/svg', 'text');
                break;
            default:
                _shape = 'rect';
        }
        // Add the node
        g.setNode(vertice.id, {labelType: labelTypeStr, shape:_shape, label: verticeText, rx: radious, ry: radious, 'class': classStr, style: style, id:vertice.id});
    });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */
exports.addEdges = function (edges, g) {
    var cnt=0;
    
    var defaultStyle;
    if(typeof edges.defaultStyle !== 'undefined'){
        defaultStyle = edges.defaultStyle.toString().replace(/,/g , ';');
    }

    edges.forEach(function (edge) {
        cnt++;
        var edgeData = {};

        // Set link type for rendering
        if(edge.type === 'arrow_open'){
            edgeData.arrowhead = 'none';
        }
        else{
            edgeData.arrowhead = 'normal';
        }

        var style = '';


        if(typeof edge.style !== 'undefined'){
            edge.style.forEach(function(s){
                style = style + s +';';
            });
        }
        else{
            switch(edge.stroke){
                case 'normal':
                    style = 'fill:none';
                    if(typeof defaultStyle !== 'undefined'){
                        style = defaultStyle;
                    }
                    break;
                case 'dotted':
                    style = 'stroke: #333; fill:none;stroke-width:2px;stroke-dasharray:3;';
                    break;
                case 'thick':
                    style = 'stroke: #333; stroke-width: 3.5px;fill:none';
                    break;
            }
        }
        edgeData.style = style;
        
        if (typeof edge.interpolate !== 'undefined') {
            edgeData.lineInterpolate = edge.interpolate;
        } else {
            if (typeof edges.defaultInterpolate !== 'undefined') {
                edgeData.lineInterpolate = edges.defaultInterpolate;
            }
        }

        if (typeof edge.text === 'undefined') {
            if (typeof edge.style !== 'undefined') {
                edgeData.arrowheadStyle = 'fill: #333';
            }
        } else {
            edgeData.arrowheadStyle = 'fill: #333';
            if(typeof edge.style === 'undefined') {
                edgeData.labelpos = 'c';
                if (conf.htmlLabels) {
                    edgeData.labelType = 'html';
                    edgeData.label = '<span class="edgeLabel">'+edge.text+'</span>';
                } else {
                    edgeData.labelType = 'text';
                    edgeData.style = 'stroke: #333; stroke-width: 1.5px;fill:none';
                    edgeData.label = edge.text.replace(/<br>/g, '\n');
                }
             } else {
                edgeData.label = edge.text.replace(/<br>/g, '\n');
            }
        }
        // Add the edge to the graph
        g.setEdge(edge.start, edge.end, edgeData, cnt);
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

    var classes = graph.getClasses();

    // Add default class if undefined
    if(typeof(classes.default) === 'undefined') {
        classes.default = {id:'default'};
        //classes.default.styles = ['fill:#ffa','stroke:#666','stroke-width:3px'];
        classes.default.styles = [];
        classes.default.clusterStyles = ['rx:4px','fill: rgb(255, 255, 222)','rx: 4px','stroke: rgb(170, 170, 51)','stroke-width: 1px'];
        classes.default.nodeLabelStyles = ['fill:#000','stroke:none','font-weight:300','font-family:"Helvetica Neue",Helvetica,Arial,sans-serf','font-size:14px'];
        classes.default.edgeLabelStyles = ['fill:#000','stroke:none','font-weight:300','font-family:"Helvetica Neue",Helvetica,Arial,sans-serf','font-size:14px'];
    }
    return classes;
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
exports.draw = function (text, id,isDot) {
    log.debug('Drawing flowchart');
    var parser;
    graph.clear();
    if(isDot){
        parser = dot.parser;

    }else{
        parser = flow.parser;
    }
    parser.yy = graph;

    // Parse the graph definition
    try{

        parser.parse(text);
    }
    catch(err){
        log.debug('Parsing failed');
    }

    // Fetch the default direction, use TD if none was found
    var dir;
    dir = graph.getDirection();
    if(typeof dir === 'undefined'){
        dir='TD';
    }

    // Create the input mermaid.graph
    var g = new dagreD3.graphlib.Graph({
        multigraph:true,
        compound: true
    })
        .setGraph({
            rankdir: dir,
            marginx: 20,
            marginy: 20

        })
        .setDefaultEdgeLabel(function () {
            return {};
        });

    var subG;
    var subGraphs = graph.getSubGraphs();
    var i = 0;
    for(i=subGraphs.length-1;i>=0;i--){
        subG = subGraphs[i];
        graph.addVertex(subG.id,subG.title,'group',undefined);
    }

    // Fetch the verices/nodes and edges/links from the parsed graph definition
    var vert = graph.getVertices();

    //log.debug(vert);
    var edges = graph.getEdges();

    i = 0;
    var j;
    for(i=subGraphs.length-1;i>=0;i--){
        subG = subGraphs[i];

        d3.selectAll('cluster').append('text');

        for(j=0;j<subG.nodes.length;j++){
            //log.debug('Setting node',subG.nodes[j],' to subgraph '+id);
            g.setParent(subG.nodes[j],subG.id);
        }
    }
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
        var shapeSvg = parent.insert('polygon', ':first-child')
            .attr('points', points.map(function (d) {
                return d.x + ',' + d.y;
            }).join(' '))
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('transform', 'translate(' + (-s / 2) + ',' + (s * 2 / 4) + ')');
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
                {x: 0, y: -h/2}
            ];
        var shapeSvg = parent.insert('polygon', ':first-child')
            .attr('points', points.map(function (d) {
                return d.x + ',' + d.y;
            }).join(' '))
            .attr('transform', 'translate(' + (-w / 2) + ',' + (h * 2 / 4) + ')');
        node.intersect = function (point) {
            return dagreD3.intersect.polygon(node, points, point);
        };
        return shapeSvg;
    };

    // Add custom shape for box with inverted arrow on right side
    render.shapes().rect_right_inv_arrow = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            points = [
                {x: 0, y: 0},
                {x: w+h/2, y: 0},
                {x: w, y: -h/2},
                {x: w+h/2, y: -h},
                {x: 0, y: -h}
            ];
        var shapeSvg = parent.insert('polygon', ':first-child')
            .attr('points', points.map(function (d) {
                return d.x + ',' + d.y;
            }).join(' '))
            .attr('transform', 'translate(' + (-w / 2) + ',' + (h * 2 / 4) + ')');
        node.intersect = function (point) {
            return dagreD3.intersect.polygon(node, points, point);
        };
        return shapeSvg;
    };

    // Add our custom arrow - an empty arrowhead
    render.arrows().none = function normal(parent, id, edge, type) {
        var marker = parent.append('marker')
            .attr('id', id)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 9)
            .attr('refY', 5)
            .attr('markerUnits', 'strokeWidth')
            .attr('markerWidth', 8)
            .attr('markerHeight', 6)
            .attr('orient', 'auto');

        var path = marker.append('path')
            .attr('d', 'M 0 0 L 0 0 L 0 0 z');
        dagreD3.util.applyStyle(path, edge[type + 'Style']);
    };

    // Override normal arrowhead defined in d3. Remove style & add class to allow css styling.
    render.arrows().normal = function normal(parent, id, edge, type) {
        var marker = parent.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto")

        var path = marker.append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("class", "arrowheadPath")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "1,0");
    };

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select('#' + id);
    //svgGroup = d3.select('#' + id + ' g');

    // Run the renderer. This is what draws the final graph.
    var element = d3.select('#' + id + ' g');
    render(element, g);

    //var tip = d3.tip().html(function(d) { return d; });
    element.selectAll('g.node')
                .attr('title', function(){
            return graph.getTooltip(this.id);
        });

/*
 var xPos = document.querySelectorAll('.clusters rect')[0].x.baseVal.value;
 var width = document.querySelectorAll('.clusters rect')[0].width.baseVal.value;
    var cluster = d3.selectAll('.cluster');
    var te = cluster.append('text');
    te.attr('x', xPos+width/2);
    te.attr('y', 12);
    //te.stroke('black');
    te.attr('id', 'apa12');
    te.style('text-anchor', 'middle');
    te.text('Title for cluster');
*/
    if(conf.useMaxWidth) {
        // Center the graph
        svg.attr('height', '100%');
        svg.attr('width', conf.width);
        //svg.attr('viewBox', svgb.getBBox().x + ' 0 '+ g.graph().width+' '+ g.graph().height);
        svg.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20));
        svg.attr('style', 'max-width:' + (g.graph().width + 20) + 'px;');
    }
    else{
        // Center the graph
        svg.attr('height', g.graph().height );
        if(typeof conf.width === 'undefined'){
            svg.attr('width', g.graph().width );
        }else{
            svg.attr('width', conf.width );
        }
        //svg.attr('viewBox', svgb.getBBox().x + ' 0 '+ g.graph().width+' '+ g.graph().height);
        svg.attr('viewBox',  '0 0 ' + (g.graph().width+20) + ' ' + (g.graph().height+20));    }


    // Index nodes
    graph.indexNodes('subGraph'+i);
    
    for(i=0;i<subGraphs.length;i++){
        subG = subGraphs[i];

        if (subG.title !== 'undefined') {
            var clusterRects = document.querySelectorAll('#' + id + ' #' + subG.id + ' rect');
            //log.debug('looking up: #' + id + ' #' + subG.id)
            var clusterEl = document.querySelectorAll('#' + id + ' #' + subG.id);

            var xPos = clusterRects[0].x.baseVal.value;
            var yPos = clusterRects[0].y.baseVal.value;
            var width = clusterRects[0].width.baseVal.value;
            var cluster = d3.select(clusterEl[0]);
            var te = cluster.append('text');
            te.attr('x', xPos + width / 2);
            te.attr('y', yPos + 14);
            te.attr('fill', 'black');
            te.attr('stroke', 'none');
            te.attr('id', id + 'Text');
            te.style('text-anchor', 'middle');

            if(typeof subG.title === 'undefined'){
                te.text('Undef');
            }else{
                //te.text(subGraphs[subGraphs.length-i-1].title);
                te.text(subG.title);

            }
        }
    }

    // Add label rects for non html labels
    if(!conf.htmlLabels){
        var labels = document.querySelectorAll('#' + id +' .edgeLabel .label');
        var i;
        for(i=0;i<labels.length;i++){
            var label = labels[i];

            // Get dimensions of label
            var dim = label.getBBox();

            var rect =  document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('rx',0);
            rect.setAttribute('ry',0);
            rect.setAttribute('width',dim.width);
            rect.setAttribute('height',dim.height);
            rect.setAttribute('style','fill:#e8e8e8;');

            label.insertBefore(rect, label.firstChild);
        }
    }

};

