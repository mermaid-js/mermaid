/**
 * Created by knut on 14-12-11.
 */
var db = require('./exampleDb');
var exampleParser = require('./parser/example.js');
var d3 = require('../../d3');
var Logger = require('../../logger');
var log = new Logger.Log();

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
exports.draw = function (txt, id, ver) {
    var parser;
    parser = exampleParser.parser;
    parser.yy = db;
    log.debug('Renering example diagram');
    // Parse the graph definition
    parser.parse(txt);

    // Fetch the default direction, use TD if none was found
    var svg = d3.select('#'+id);

    var g = svg.append('g');

    g.append('text')      // text label for the x axis
        .attr('x', 100)
        .attr('y', 40)
        .attr('class','version')
        .attr('font-size','32px')
        .style('text-anchor', 'middle')
        .text('mermaid '+ ver);

    /*
    var box = exports.bounds.getBounds();

    var height = box.stopy-box.starty+2*conf.diagramMarginY;
    var width  = box.stopx-box.startx+2*conf.diagramMarginX;*/

    svg.attr('height',100);
    svg.attr('width', 400 );
    //svg.attr('viewBox', '0 0 300 150');
};