var graph = require('./diagrams/flowchart/graphDb');
var flow = require('./diagrams/flowchart/parser/flow');
var utils = require('./utils');
var flowRenderer = require('./diagrams/flowchart/flowRenderer');
var seq = require('./diagrams/sequenceDiagram/sequenceRenderer');
var he = require('he');

/**
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found elements with the
 * attribute already set. This way the init function can be triggered several times.
 *
 * ```
 * graph LR;
 *  a(Find elements)-->b{Processed};
 *  b-->|Yes|c(Leave element);
 *  c-->|No |d(Transform);
 * ```
 */
var init = function () {
    var arr = document.querySelectorAll('.mermaid');
    var i;

    var cnt = 0;
    for (i = 0; i < arr.length; i++) {
        var element = arr[i];

        // Check if previously processed
        if(!element.getAttribute("data-processed")) {
            element.setAttribute("data-processed", true);
        } else continue;

        var id;

        id = 'mermaidChart' + cnt;
        cnt++;

        var txt = element.innerHTML;
        txt = txt.replace(/>/g,'&gt;');
        txt = txt.replace(/</g,'&lt;');
        txt = he.decode(txt).trim();

        element.innerHTML = '<svg id="' + id + '">' +
        '<g />' +
        '</svg>';

        var graphType = utils.detectType(txt);

        switch(graphType){
            case 'graph':
                console.log('FC');
                flowRenderer.draw(txt, id,false);
                graph.bindFunctions();
            break;
            case 'dotGraph':
                flowRenderer.draw(txt, id,true);
                break;
            case 'sequenceDiagram':
                seq.draw(txt,id);
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
if(typeof document !== 'undefined'){
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

}


global.mermaid = {
    init:function(){
        init();
    },
    version:function(){
        return exports.version();
    },
    getParser:function(){
        return flow.parser;
    }
};