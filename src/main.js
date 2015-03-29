var graph = require('./diagrams/flowchart/graphDb');
var flow = require('./diagrams/flowchart/parser/flow');
var utils = require('./utils');
var flowRenderer = require('./diagrams/flowchart/flowRenderer');
var seq = require('./diagrams/sequenceDiagram/sequenceRenderer');
var info = require('./diagrams/example/exampleRenderer');
var he = require('he');
var infoParser = require('./diagrams/example/parser/example');
var flowParser = require('./diagrams/flowchart/parser/flow');
var dotParser = require('./diagrams/flowchart/parser/dot');
var sequenceParser = require('./diagrams/sequenceDiagram/parser/sequenceDiagram');
var sequenceDb = require('./diagrams/sequenceDiagram/sequenceDb');
var infoDb = require('./diagrams/example/exampleDb');
var gantt       = require('./diagrams/gantt/ganttRenderer');
var ganttParser = require('./diagrams/gantt/parser/gantt');
var ganttDb = require('./diagrams/gantt/ganttDb');

var nextId = 0;

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
/**
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found elements with the
 * attribute already set. This way the init function can be triggered several times.
 * 
 * Optionally, `init` can accept in the second argument one of the following:
 * - a DOM Node
 * - an array of DOM nodes (as would come from a jQuery selector)
 * - a W3C selector, a la `.mermaid`
 * 
 * ```
 * graph LR;
 *  a(Find elements)-->b{Processed};
 *  b-->|Yes|c(Leave element);
 *  c-->|No |d(Transform);
 * ```
 */

/**
 * Renders the mermaid diagrams
 * @* param nodes- a css selector or an array of nodes
 */
var init = function () {
    var nodes;
    if(arguments.length === 2){
        // sequence config was passed as #1
        if(typeof arguments[0] !== 'undefined'){
            mermaid.sequenceConfig = arguments[0];      
        }

        nodes = arguments[1];
    }
    else{
        nodes = arguments[0];
    }
    
    nodes = nodes === undefined ? document.querySelectorAll('.mermaid')
        : typeof nodes === "string" ? document.querySelectorAll(nodes)
        : nodes instanceof Node ? [nodes]
        // Last case  - sequence config was passed pick next 
        : nodes;
    
    var i;
    for (i = 0; i < nodes.length; i++) {
        var element = nodes[i];

        // Check if previously processed
        if(!element.getAttribute("data-processed")) {
            element.setAttribute("data-processed", true);
        } else {
            continue;
        }

        var id = 'mermaidChart' + nextId++;

        var txt = element.innerHTML;
        txt = txt.replace(/>/g,'&gt;');
        txt = txt.replace(/</g,'&lt;');
        txt = he.decode(txt).trim();

        element.innerHTML = '<svg id="' + id + '" width="100%" xmlns="http://www.w3.org/2000/svg">' +
            '<g />' +
            '</svg>';

        var graphType = utils.detectType(txt);
        var classes = {};

        switch(graphType){
            case 'graph':
                classes = flowRenderer.getClasses(txt, false);

                if(typeof mermaid.flowchartConfig === 'object'){
                    flowRenderer.setConf(mermaid.flowchartConfig);
                }
                flowRenderer.draw(txt, id, false);
                utils.cloneCssStyles(element.firstChild, classes);
                graph.bindFunctions();
                break;
            case 'dotGraph':
                classes = flowRenderer.getClasses(txt, true);
                flowRenderer.draw(txt, id, true);
                utils.cloneCssStyles(element.firstChild, classes);
                break;
            case 'sequenceDiagram':
                if(typeof mermaid.sequenceConfig === 'object'){
                    seq.setConf(mermaid.sequenceConfig);
                }
                seq.draw(txt,id);
                utils.cloneCssStyles(element.firstChild, []);
                break;
            case 'gantt':
                if(typeof mermaid.ganttConfig === 'object'){
                    gantt.setConf(mermaid.ganttConfig);
                    
                }
                gantt.draw(txt,id);
                utils.cloneCssStyles(element.firstChild, []);
                break;
            case 'info':
                info.draw(txt,id,exports.version());
                utils.cloneCssStyles(element.firstChild, []);
                break;
        }

    }

};

exports.tester = function(){};

/**
 * Function returning version information
 * @returns {string} A string containing the version info
 */
exports.version = function(){
    return require('../package.json').version;
};

var equals = function (val, variable){
    if(typeof variable === 'undefined'){
        return false;
    }
    else{
        return (val === variable);
    }
};

global.mermaid = {
    startOnLoad:true,
    htmlLabels:true,
    init:function(sequenceConfig, nodes){
        init.apply(null, arguments);
    },
    version:function(){
        return exports.version();
    },
    getParser:function(){
        return flow.parser;
    },
    parse:function(text){
        return parse(text);
    },
    parseError:function(err,hash){
        console.log('Mermaid Syntax error:');
        console.log(err);
    }
};

exports.contentLoaded = function(){
    // Check state of start config mermaid namespace
    //console.log('global.mermaid.startOnLoad',global.mermaid.startOnLoad);
    //console.log('mermaid_config',mermaid_config);
    if (typeof mermaid_config !== 'undefined') {
        if (equals(false, mermaid_config.htmlLabels)) {
            global.mermaid.htmlLabels = false;
        }
    }

    if(global.mermaid.startOnLoad) {

        // For backwards compatability reasons also check mermaid_config variable
        if (typeof mermaid_config !== 'undefined') {
            // Check if property startOnLoad is set
            if (equals(true, mermaid_config.startOnLoad)) {
                global.mermaid.init(mermaid.sequenceConfig);
            }
        }
        else {
            // No config found, do autostart in this simple case
            global.mermaid.init(mermaid.sequenceConfig);
        }
    }

};

if(typeof document !== 'undefined'){
    /**
     * Wait for document loaded before starting the execution
     */
    document.addEventListener('DOMContentLoaded', function(){
        exports.contentLoaded();
    }, false);
}
