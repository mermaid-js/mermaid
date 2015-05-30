var he = require('he');
var mermaidAPI = require('./mermaidAPI');
var nextId = 0;

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
    
    console.log('Found ',nodes.length,' nodes');
    console.log('Hooo hooo');
    mermaidAPI.initialize(mermaid_config);
    var insertSvg = function(svgCode){
        element.innerHTML = svgCode;
    };
    
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


        mermaidAPI.render(id,txt,insertSvg);
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
    startOnLoad:    true,
    htmlLabels:     true,
    
    init: function(sequenceConfig, nodes) {
        init.apply(null, arguments);
    },
    version: function() {
        return mermaidAPI.version();
    },
    parse: function(text) {
        return mermaidAPI.parse(text);
    },
    parseError: function(err, hash) {
        console.log('Mermaid Syntax error:');
        console.log(err);
    },
    render:function(id, text){
        return mermaidAPI.render(id, text);
    }
};

exports.contentLoaded = function(){
    // Check state of start config mermaid namespace
    console.log('Starting mermaid');
    console.log('global.mermaid.startOnLoad',global.mermaid.startOnLoad);
    console.log('mermaid_config',mermaid_config);
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
                global.mermaid.init();
            }
        }
        else {
            // No config found, do autostart in this simple case
            global.mermaid.init();
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
