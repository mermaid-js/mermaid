/**
 * Created by knut on 14-11-23.
 */

var cd = require('./parser/classDiagram').parser;
var cDDb = require('./classDb');
cd.yy = cDDb;
var d3 = require('../../d3');
import * as Logger from '../../logger';
import * as dagre from 'dagre';
var log = new Logger.Log();

var idCache;
if(typeof Map !== 'undefined'){
    idCache = new Map();
}
let classCnt = 0;
var conf = {

};

// Todo optimize
var getGraphId = function(label){
    for (var [id, classInfo] of idCache) {
        if(classInfo.label === label){
            return id;
        }
    }
    return undefined;
}

var drawEdge = function(elem, path) {
    //The data for our line
    var lineData = path.points;

    //This is the accessor function we talked about above
    var lineFunction = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate('cardinal');

    elem.append('path')
    .attr('d', lineFunction(lineData))
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'none');
}

var drawClass = function(elem, classDef){
    log.info('Rendering class '+classDef);
    //var rect = svgDraw.getNoteRect();
    //rect.x = startx;
    //rect.y = verticalPos;
    //rect.width = conf.width;
    //rect.class = 'note';
    //
    //var g = elem.append('g');
    //var rectElem = svgDraw.drawRect(g, rect);
    //
    //var textObj = svgDraw.getTextObj();
    //textObj.x = startx-4;
    //textObj.y = verticalPos-13;
    //textObj.textMargin = conf.noteMargin;
    //textObj.dy = '1em';
    //textObj.text = msg.message;
    //textObj.class = 'noteText';
    //
    //var textElem = svgDraw.drawText(g,textObj, conf.width-conf.noteMargin);
    //
    //var textHeight = textElem[0][0].getBBox().height;
    //if(textHeight > conf.width){
    //    textElem.remove();
    //    g = elem.append('g');
    //
    //    //textObj.x = textObj.x - conf.width;
    //    //textElem = svgDraw.drawText(g,textObj, 2*conf.noteMargin);
    //    textElem = svgDraw.drawText(g,textObj, 2*conf.width-conf.noteMargin);
    //    textHeight = textElem[0][0].getBBox().height;
    //    rectElem.attr('width',2*conf.width);
    //    exports.bounds.insert(startx, verticalPos, startx + 2*conf.width,  verticalPos + 2*conf.noteMargin + textHeight);
    //}else{
    //    exports.bounds.insert(startx, verticalPos, startx + conf.width,  verticalPos + 2*conf.noteMargin + textHeight);
    //}
    //
    //rectElem.attr('height',textHeight+ 2*conf.noteMargin);
    //exports.bounds.bumpVerticalPos(textHeight+ 2*conf.noteMargin);
    let id = 'classId'+classCnt;
    let classInfo = {
        id:id,
        label:classDef.id,
        width:0,
        height:0
    };

    var g = elem.append('g')
        .attr('id',id);
    var textElem = g.append('text')      // text label for the x axis
        .attr('x', '10')
        .attr('y', '17')
        .attr('fill', 'white')
        .attr('class', 'classText')
        .text(classDef.id);
    var box = textElem.node().getBBox();

    g.insert('rect',':first-child')
        .attr('x',0)
        .attr('y',0)
        .attr('fill','darkgrey')
        .attr('width',box.width+20)
        .attr('height',box.height+10);

    classInfo.width = box.width+20;
    classInfo.height = box.height+10;

    idCache.set(id,classInfo);
    classCnt++;
    return classInfo;
};



module.exports.setConf = function(cnf){
    var keys = Object.keys(cnf);

    keys.forEach(function(key){
        conf[key] = cnf[key];
    });
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
    cd.yy.clear();
    cd.parse(text);

    log.info('Rendering diagram '+text);


    //// Fetch the default direction, use TD if none was found
    var diagram = d3.select('#'+id);
    //var svg = diagram.append('svg');

    // Layout graph, Create a new directed graph
    var g = new dagre.graphlib.Graph();

    // Set an object for the graph label
    g.setGraph({});

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() { return {}; });

    let classes = cDDb.getClasses();
    for(let classDef of classes.values()){
        let node = drawClass(diagram, classDef)
        // Add nodes to the graph. The first argument is the node id. The second is
        // metadata about the node. In this case we're going to add labels to each of
        // our nodes.
        g.setNode(node.id,    node);
        log.info('Org height: '+node.height);
        //g.setNode("swilliams",  { label: "Saul Williams", width: 160, height: 100 });
        //g.setNode("bpitt",      { label: "Brad Pitt",     width: 108, height: 100 });
        //g.setNode("hford",      { label: "Harrison Ford", width: 168, height: 100 });
        //g.setNode("lwilson",    { label: "Luke Wilson",   width: 144, height: 100 });
        //g.setNode("kbacon",     { label: "Kevin Bacon",   width: 121, height: 100 });
    }

    let relations = cDDb.getRelations();
    for(let relation of relations){

        g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2));
    }
    dagre.layout(g);
    g.nodes().forEach(function(v) {
        log.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
        d3.select('#'+v).attr('transform','translate(' + (g.node(v).x-(g.node(v).width/2)) + ',' + (g.node(v).y-(g.node(v).height/2)) + ' )');
        //d3.select('#' +v +' rect').attr('x',(g.node(v).x-(g.node(v).width/2)))
        //.attr('y',(g.node(v).y-(g.node(v).height/2)));
    });
    g.edges().forEach(function(e) {
        log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
        drawEdge(diagram, g.edge(e))
    });


    //
        diagram.attr('height', '100%');
        diagram.attr('width', '100%');
    //
    //
    //
    //
    //if(conf.useMaxWidth) {
    //    diagram.attr('height', '100%');
    //    diagram.attr('width', '100%');
    //    diagram.attr('style', 'max-width:' + (width) + 'px;');
    //}else{
    //    diagram.attr('height',height);
    //    diagram.attr('width', width );
    //}
    //diagram.attr('viewBox', (box.startx-conf.diagramMarginX) + ' -' +conf.diagramMarginY + ' ' + width + ' ' + height);
};
