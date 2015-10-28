/**
 * Created by knut on 14-11-23.
 */

var cd = require('./parser/classDiagram').parser;
sq.yy = require('./classDb');
var d3 = require('../../d3');
import * as Logger from '../../logger';
var log = new Logger.Log();


var conf = {

};



/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
var drawClass = function(elem, startx, verticalPos, msg){
    var rect = svgDraw.getNoteRect();
    rect.x = startx;
    rect.y = verticalPos;
    rect.width = conf.width;
    rect.class = 'note';

    var g = elem.append('g');
    var rectElem = svgDraw.drawRect(g, rect);

    var textObj = svgDraw.getTextObj();
    textObj.x = startx-4;
    textObj.y = verticalPos-13;
    textObj.textMargin = conf.noteMargin;
    textObj.dy = '1em';
    textObj.text = msg.message;
    textObj.class = 'noteText';

    var textElem = svgDraw.drawText(g,textObj, conf.width-conf.noteMargin);

    var textHeight = textElem[0][0].getBBox().height;
    if(textHeight > conf.width){
        textElem.remove();
        g = elem.append('g');

        //textObj.x = textObj.x - conf.width;
        //textElem = svgDraw.drawText(g,textObj, 2*conf.noteMargin);
        textElem = svgDraw.drawText(g,textObj, 2*conf.width-conf.noteMargin);
        textHeight = textElem[0][0].getBBox().height;
        rectElem.attr('width',2*conf.width);
        exports.bounds.insert(startx, verticalPos, startx + 2*conf.width,  verticalPos + 2*conf.noteMargin + textHeight);
    }else{
        exports.bounds.insert(startx, verticalPos, startx + conf.width,  verticalPos + 2*conf.noteMargin + textHeight);
    }

    rectElem.attr('height',textHeight+ 2*conf.noteMargin);
    exports.bounds.bumpVerticalPos(textHeight+ 2*conf.noteMargin);
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
    cd.parse(text+'\n');

    var width  = box.stopx-box.startx+2*conf.diagramMarginX;
    if(conf.useMaxWidth) {
        diagram.attr('height', '100%');
        diagram.attr('width', '100%');
        diagram.attr('style', 'max-width:' + (width) + 'px;');
    }else{
        diagram.attr('height',height);
        diagram.attr('width', width );
    }
    diagram.attr('viewBox', (box.startx-conf.diagramMarginX) + ' -' +conf.diagramMarginY + ' ' + width + ' ' + height);
};
