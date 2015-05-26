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
 * Function returning version information
 * @returns {string} A string containing the version info
 */
exports.version = function(){
    return require('../package.json').version;
};

var render = function(id, txt,cb){

    d3.select('body').append('div')
        .attr('id', 'd'+id)
        .append('svg')
        .attr('id', id)
        .attr('width','100%')
        .attr('xmlns','http://www.w3.org/2000/svg')
        .append('g');



    //console.log(d3.select('#d'+id).node().innerHTML);
    var element = d3.select('#d'+id).node();
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
    //console.log(document.body.innerHTML);
    cb(d3.select('#d'+id).node().innerHTML);

    if(typeof d3.select('#d'+id).node().remove === 'function'){    
        d3.select('#d'+id).node().remove();
    }
};

exports.render = function(id, text,cb){
if(typeof document === 'undefined'){
        //jsdom = require('jsdom').jsdom;
        //console.log(jsdom);
        
            //htmlStub = '<html><head></head><body><div class="mermaid">'+text+'</div><script src="dist/mermaid.full.js"></script><script>var mermaid_config = {startOnLoad:true}</script></body></html>';
            htmlStub = '<html><head></head><body></body></html>';
    //        // html file skull with a container div for the d3 dataviz
    //
    // pass the html stub to jsDom
       /* jsdom.env({ 
            features : { QuerySelectorAll : true },
            html : htmlStub,
            done : function(errors, win) {
                // process the html document, like if we were at client side
                // code to generate the dataviz and process the resulting html file to be added here
                //var d3 = require('d3');
                //console.log('Here we go: '+JSON.stringify(d3));
                
                global.document = win.document;
                global.window = win;

                var element = win.document.createElement('div');
                element.setAttribute('id','did');
                //document.
                console.log(document.body.innerHTML);
                //console.log('Element:',element);
                //console.log(win);
                //mermaid.init();
                //render(win.document, 'myId', text, callback);
                
            }
        });*/
        //var jsdom = require('jsdom').jsdom;
        //global.document = jsdom(htmlStub);
        //global.window = document.parentWindow;
        //
        //render(id, text, cb);
                //var element = win.document.createElement('div');
                //element.setAttribute('id','did');
                //document.
    }
    else{
        // In browser
        render( id, text, cb);
    }
};

global.api = {
    render : exports.render,
    detectType: utils.detectType
};

console.log('APA');

//var getBBox = function(selector){
//    var xmin, xmax, ymin, ymax,p;
//    // clean up path
//    var t = d3.select(selector).attr("d");  // get svg line's code
//    console.log(t)
//    t = t.replace(/[a-z].*/g," ") // remove relative coords, could rather tag it for later processing to absolute!
//        .replace(/[\sA-Z]+/gi," ").trim().split(" ");  // remove letters and simplify spaces.
//    console.log(t)
//
//    for(var i in t){    // set valid initial values
//        if(t[i].length>1){
//            p = t[i].split(",");
//            xmin = xmax = p[0]; ymin = ymax = p[1]; }
//    }
//    for(var i in t){ // update xmin,xmax,ymin,ymax
//        p = t[i].split(",");
//        if(!p[1]){ p[0]=xmin; p[1] = ymin;} // ignore relative jumps such h20 v-10
//        xmin = Math.min(xmin, p[0]);
//        xmax = Math.max(xmax, p[0]);
//        ymin = Math.min(ymin, p[1]);
//        ymax = Math.max(ymax, p[1]);
//    } return [[xmin,ymax],[xmax,ymin]]; //  [[left, bottom], [right, top]] as for https://github.com/mbostock/d3/wiki/Geo-Paths#bounds
//}
//var bb = getBBox("path");