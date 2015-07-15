/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid functionality and to render
 * the diagrams to svg code.
 */
var he = require('he');
var mermaidAPI = require('./mermaidAPI');
var nextId = 0;
var log = require('./logger').create();

module.exports.mermaidAPI = mermaidAPI;
/**
 * ## init
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
 * ```mermaid
 * graph LR;
 *  a(Find elements)-->b{Processed}
 *  b-->|Yes|c(Leave element)
 *  b-->|No |d(Transform)
 * ```
 * Renders the mermaid diagrams
 * @param nodes a css selector or an array of nodes
 */
var init = function () {
    log.debug('Starting rendering diagrams');
    var nodes;
    if(arguments.length >= 2){
        /*! sequence config was passed as #1 */
        if(typeof arguments[0] !== 'undefined'){
            mermaid.sequenceConfig = arguments[0];      
        }

        nodes = arguments[1];
    }
    else{
        nodes = arguments[0];
    }

    // if last argument is a function this is the callback function
    var callback;
    if(typeof arguments[arguments.length-1] === 'function'){
        callback = arguments[arguments.length-1];
        log.debug('Callback function found');
    }else{
        var conf= mermaidAPI.getConfig();
        if(typeof conf.mermaid !== 'undefined'){
            if(typeof conf.mermaid.callback === 'function'){
                callback = conf.mermaid.callback;
                log.debug('Callback function found');
            }else{
                log.debug('No Callback function found');
            }
        }
    }
    nodes = nodes === undefined ? document.querySelectorAll('.mermaid')
        : typeof nodes === "string" ? document.querySelectorAll(nodes)
        : nodes instanceof Node ? [nodes]
        /*! Last case  - sequence config was passed pick next */
        : nodes;
    
    var i;

    if(typeof mermaid_config !== 'undefined'){
        mermaidAPI.initialize(mermaid_config);
        
    }

    log.debug('Start On Load before: '+mermaid.startOnLoad);
    if(typeof mermaid.startOnLoad !== 'undefined'){
        log.debug('Start On Load inner: '+mermaid.startOnLoad);
        mermaidAPI.initialize({startOnLoad:mermaid.startOnLoad});

    }


    if(typeof mermaid.ganttConfig !== 'undefined'){
        mermaidAPI.initialize({gantt:mermaid.ganttConfig});
    }

    var insertSvg = function(svgCode){
        element.innerHTML = svgCode;
        if(typeof callback !== 'undefined'){
            callback(id);
        }
    };
    
    for (i = 0; i < nodes.length; i++) {
        var element = nodes[i];

        /*! Check if previously processed */
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

        mermaidAPI.render(id,txt,insertSvg, element);
    }

};

exports.init = init;
exports.parse = mermaidAPI.parse;
/**
 * ## version
 * Function returning version information
 * @returns {string} A string containing the version info
 */
exports.version = function(){
    return 'v'+require('../package.json').version;
};

/**
 * ## initialize
 * This function overrides the default configuration.
 * @param config
 */
exports.initialize = function(config){
    log.debug('Initializing mermaid');
    if(typeof config.mermaid !== 'undefined') {
        if (typeof config.mermaid.startOnLoad !== 'undefined') {
            global.mermaid.startOnLoad = config.mermaid.startOnLoad;
        }
        if (typeof config.mermaid.htmlLabels !== 'undefined') {
            global.mermaid.htmlLabels = config.mermaid.htmlLabels;
        }
    }
    mermaidAPI.initialize(config);
};


var equals = function (val, variable){
    if(typeof variable === 'undefined'){
        return false;
    }
    else{
        return (val === variable);
    }
};

/**
 * Global mermaid object. Contains the functions:
 * * init
 * * initialize
 * * version
 * * parse
 * * parseError
 * * render
 */
global.mermaid = {
    startOnLoad:    true,
    htmlLabels:     true,
    
    init: function(sequenceConfig, nodes) {
        init.apply(null, arguments);
    },
    initialize: function(config) {
        exports.initialize(config);
    },
    version: function() {
        return mermaidAPI.version();
    },
    parse: function(text) {
        return mermaidAPI.parse(text);
    },
    parseError: function(err, hash) {
        log.debug('Mermaid Syntax error:');
        log.debug(err);
    },
    render:function(id, text,callback, element){
        return mermaidAPI.render(id, text,callback, element);
    }
};

/**
 * ## parseError
 * This function overrides the default configuration.
 * @param config
 */
exports.parseError = global.mermaid.parseError;

/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */
exports.contentLoaded = function(){
    var config;
    // Check state of start config mermaid namespace
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
            mermaidAPI.initialize({startOnLoad:global.mermaid.startOnLoad});
            // No config found, do check API config
            config = mermaidAPI.getConfig();
            if(config.startOnLoad){
                global.mermaid.init();
            }
        }
    }else{
        config = mermaidAPI.getConfig();
        if(config.startOnLoad){
            global.mermaid.init();
        }
        
    }

};



if(typeof document !== 'undefined'){
    /*!
     * Wait for document loaded before starting the execution
     */
    document.addEventListener('DOMContentLoaded', function(){
        exports.contentLoaded();
    }, false);
}
