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
    dividerMargin:10,
    padding:5 ,
    textHeight:15
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
    //.interpolate('cardinal');
    .interpolate('basis');

    elem.append('path')
    .attr('d', lineFunction(lineData))
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'none');
}

var drawClass = function(elem, classDef){
    log.info('Rendering class '+classDef);

    var addTspan = function(textEl, txt,isFirst){
        var tSpan = textEl.append('tspan')
            .attr('x',conf.padding)
            .text(txt);
        if(!isFirst){
            tSpan.attr('dy',15);
        }
    };

    let id = 'classId'+classCnt;
    let classInfo = {
        id:id,
        label:classDef.id,
        width:0,
        height:0
    };

    var g = elem.append('g')
        .attr('id',id);
    var title = g.append('text')      // text label for the x axis
        .attr('x', conf.padding)
        .attr('y', conf.textHeight+conf.padding)
        .attr('fill', 'white')
        .attr('class', 'classText')
        .text(classDef.id);

    var titleHeight = title.node().getBBox().height;

    var membersLine = g.append('line')      // text label for the x axis
        .attr('x1',0)
        .attr('y1',conf.padding+titleHeight + conf.dividerMargin/2)
        .attr('y2',conf.padding+titleHeight + conf.dividerMargin/2)
        .attr('fill', 'white')
        .attr('class', 'classText')
        .attr('style','stroke:rgb(255,255,255);stroke-width:1');

    var members = g.append('text')      // text label for the x axis
        .attr('x', conf.padding)
        .attr('y', titleHeight+(conf.dividerMargin)+conf.textHeight)
        .attr('fill', 'white')
        .attr('class', 'classText');

    let isFirst = true;
    for(let member of classDef.members){
        addTspan(members,member, isFirst);
        isFirst = false;
    }

    //console.warn(JSON.stringify(classDef));

    var membersBox = members.node().getBBox();

    var methodsLine = g.append('line')      // text label for the x axis
        .attr('x1',0)
        .attr('y1',conf.padding + titleHeight + 3*conf.dividerMargin/2+membersBox.height)
        .attr('y2',conf.padding + titleHeight + 3*conf.dividerMargin/2+membersBox.height)
        .attr('fill', 'white')
        .attr('class', 'classText')
        .attr('style','stroke:rgb(255,255,255);stroke-width:1');


    var methods = g.append('text')      // text label for the x axis
        .attr('x', conf.padding)
        .attr('y', titleHeight+2*conf.dividerMargin+membersBox.height + conf.textHeight)
        .attr('fill', 'white')
        .attr('class', 'classText');

    isFirst = true;
    for(let method of classDef.methods){
        addTspan(methods,method,isFirst);
        isFirst = false;
    }

    var classBox = g.node().getBBox();
    g.insert('rect',':first-child')
        .attr('x',0)
        .attr('y',0)
        .attr('fill','darkgrey')
        .attr('width',  classBox.width+2*conf.padding)
        .attr('height', classBox.height+conf.padding+0.5*conf.dividerMargin);


    membersLine.attr('x2',classBox.width+2*conf.padding);
    methodsLine.attr('x2',classBox.width+2*conf.padding);


    classInfo.width = classBox.width+2*conf.padding;
    classInfo.height = classBox.height+conf.padding+0.5*conf.dividerMargin;

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
        let node = drawClass(diagram, classDef);
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
