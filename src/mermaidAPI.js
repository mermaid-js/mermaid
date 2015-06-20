var graph = require('./diagrams/flowchart/graphDb');
var flow = require('./diagrams/flowchart/parser/flow');
var utils = require('./utils');
var flowRenderer = require('./diagrams/flowchart/flowRenderer');
var seq = require('./diagrams/sequenceDiagram/sequenceRenderer');
var info = require('./diagrams/example/exampleRenderer');
var infoParser = require('./diagrams/example/parser/example');
var flowParser = require('./diagrams/flowchart/parser/flow');
var dotParser = require('./diagrams/flowchart/parser/dot');
var sequenceParser = require('./diagrams/sequenceDiagram/parser/sequenceDiagram');
var sequenceDb = require('./diagrams/sequenceDiagram/sequenceDb');
var infoDb = require('./diagrams/example/exampleDb');
var gantt       = require('./diagrams/gantt/ganttRenderer');
var ganttParser = require('./diagrams/gantt/parser/gantt');
var ganttDb = require('./diagrams/gantt/ganttDb');
var d3 = require('./d3');
var nextId = 0;

// Default options, can be overridden at initialization time
/**
 * Object with the co0nfigurations
 * @type {Object}
 */
var config = {
    cloneCssStyles: true,
    flowchart:{
        // Default is to not set width
        //        width: 1200
        htmlLabels:true,
        useMaxWidth:true
    },
    sequenceDiagram:{
        diagramMarginX:50,
        diagramMarginY:10,
        // Margin between actors
        actorMargin:50,
        // Width of actor moxes
        width:150,
        // Height of actor boxes
        height:65,
        // Margin around loop boxes
        boxMargin:10,
        boxTextMargin:5,

        noteMargin:10,
        // Space between messages
        messageMargin:35,
        //mirror actors under diagram
        mirrorActors:true,
        // Depending on css styling this might need adjustment
        // Prolongs the edge of the diagram downwards
        bottomMarginAdj:1,
        useMaxWidth:true
    },
    gantt:{
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        sidePadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        fontFamily: '"Open-Sans", "sans-serif"',
        numberSectionStyles:3,
        axisFormatter: [
            // Within a day
            ["%I:%M", function (d) {
                return d.getHours();
            }],
            // Monday a week
            ["w. %U", function (d) {
                return d.getDay() == 1;
            }],
            // Day within a week (not monday)
            ["%a %d", function (d) {
                return d.getDay() && d.getDate() != 1;
            }],
            // within a month
            ["%b %d", function (d) {
                return d.getDate() != 1;
            }],
            // Month
            ["%m-%y", function (d) {
                return d.getMonth();
            }]
        ]    }
};

/**
 * Function that parses a mermaid diagram defintion. If parsing fails the parseError callback is called and an error is
 * thrown and
 * @param text
 */
var parse = function(text){
    var graphType = utils.detectType(text);
    var parser;

    switch(graphType){
        case 'graph':
            parser = flowParser;
            parser.parser.yy = graph;
            break;
        case 'dotGraph':
            parser = dotParser;
            parser.parser.yy = graph;
            break;
        case 'sequenceDiagram':
            parser = sequenceParser;
            parser.parser.yy = sequenceDb;
            break;
        case 'info':
            parser = infoParser;
            parser.parser.yy = infoDb;
            break;
        case 'gantt':
            parser = ganttParser;
            parser.parser.yy = ganttDb;
            break;
    }

    try{
        parser.parse(text);
        return true;
    }
    catch(err){
        return false;
    }
};
exports.parse = parse;

/**
 * Function returning version information
 * @returns {string} A string containing the version info
 */
exports.version = function(){
    return require('../package.json').version;
};

var render = function(id, txt, cb, container){

    if(typeof container !== 'undefined'){
        d3.select(container).append('div')
            .attr('id', 'd'+id)
            .append('svg')
            .attr('id', id)
            .attr('width','100%')
            .attr('xmlns','http://www.w3.org/2000/svg')
            .append('g');
    }
    else{
        d3.select('body').append('div')
            .attr('id', 'd'+id)
            .append('svg')
            .attr('id', id)
            .attr('width','100%')
            .attr('xmlns','http://www.w3.org/2000/svg')
            .append('g');
    }

    var element = d3.select('#d'+id).node();
    var graphType = utils.detectType(txt);
    var classes = {};
    switch(graphType){
        case 'graph':
            flowRenderer.setConf(config.flowchart);
            flowRenderer.draw(txt, id, false);
            if(config.cloneCssStyles){
                classes = flowRenderer.getClasses(txt, false);
                utils.cloneCssStyles(element.firstChild, classes);
            }
            graph.bindFunctions();
            break;
        case 'dotGraph':
            flowRenderer.setConf(config.flowchart);
            flowRenderer.draw(txt, id, true);
            if(config.cloneCssStyles) {
                classes = flowRenderer.getClasses(txt, true);
                utils.cloneCssStyles(element.firstChild, classes);
            }
            break;
        case 'sequenceDiagram':
            //if(typeof mermaid.sequenceConfig === 'object'){
            seq.setConf(config.sequenceDiagram);
            //}
            seq.draw(txt,id);
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
        case 'gantt':
            gantt.setConf(config.gantt);
            gantt.draw(txt,id);
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
        case 'info':
            info.draw(txt,id,exports.version());
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
    }

    if(typeof cb !== 'undefined'){
        cb(d3.select('#d'+id).node().innerHTML);
    }

    var node = d3.select('#d'+id).node();
    if(node !== null && typeof node.remove === 'function'){
        d3.select('#d'+id).node().remove();
    }
};

exports.render = function(id, text, cb, containerElement){
if(typeof document === 'undefined'){
        // Todo handle rendering serverside using phantomjs
    }
    else{
        // In browser
        render( id, text, cb, containerElement);
    }
};


var setConf = function(cnf){
    // Top level initially mermaid, gflow, sequenceDiagram and gantt
    var lvl1Keys = Object.keys(cnf);
    var i;
    for(i=0;i<lvl1Keys.length;i++){

        if(typeof cnf[lvl1Keys[i]] === 'object' ){
            var lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

            var j;
            for(j=0;j<lvl2Keys.length;j++) {
                //console.log('Setting conf ',lvl1Keys[i],'-',lvl2Keys[j]);
                if(typeof config[lvl1Keys[i]] === 'undefined'){
                    
                    config[lvl1Keys[i]] = {};
                }
                config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
            }
        }else{
            config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
        }
    }
};
exports.initialize = function(options){
    // Update default config with options supplied at initialization
    if(typeof options === 'object'){
        setConf(options);
    }

};
exports.getConfig = function(){
    return config;
};
global.mermaidAPI = {
    render     : exports.render,
    parse      : exports.parse,
    initialize : exports.initialize,
    detectType : utils.detectType
};
