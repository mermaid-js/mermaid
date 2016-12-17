/**
 * Created by knut on 14-12-20.
 */
//var log = require('../../logger').create();
exports.drawRect = function(elem , rectData){
    var rectElem = elem.append('rect');
    rectElem.attr('x', rectData.x);
    rectElem.attr('y', rectData.y);
    rectElem.attr('fill', rectData.fill);
    rectElem.attr('stroke', rectData.stroke);
    rectElem.attr('width', rectData.width);
    rectElem.attr('height', rectData.height);
    rectElem.attr('rx', rectData.rx);
    rectElem.attr('ry', rectData.ry);

    if(typeof rectData.class !== 'undefined'){
        rectElem.attr('class', rectData.class);
    }

    return rectElem;
};

exports.drawText = function(elem, textData, width) {
    // Remove and ignore br:s
    var nText = textData.text.replace(/<br\/?>/ig,' ');

    var textElem = elem.append('text');
    textElem.attr('x', textData.x);
    textElem.attr('y', textData.y);
    textElem.style('text-anchor', textData.anchor);
    textElem.attr('fill', textData.fill);
    if (typeof textData.class !== 'undefined') {
        textElem.attr('class', textData.class);
    }
    /*    textData.text.split(/<br\/?>/ig).forEach(function(rowText){
            var span = textElem.append('tspan');
            span.attr('x', textData.x +textData.textMargin);
            span.attr('dy', textData.dy);
            span.text(rowText);
        });*/


    var span = textElem.append('tspan');
    //span.attr('x', textData.x);
    span.attr('x', textData.x+textData.textMargin*2);
    //span.attr('dy', textData.dy);
    span.text(nText);
    if(typeof textElem.textwrap !== 'undefined'){

        textElem.textwrap({
            x: textData.x, // bounding box is 300 pixels from the left
            y: textData.y, // bounding box is 400 pixels from the top
            width: width, // bounding box is 500 pixels across
            height: 1800 // bounding box is 600 pixels tall
        }, textData.textMargin);
    }

    return textElem;
};

exports.drawLabel = function(elem , txtObject){
    var rectData = exports.getNoteRect();
    rectData.x = txtObject.x;
    rectData.y = txtObject.y;
    rectData.width = 50;
    rectData.height = 20;
    rectData.fill = '#526e52';
    rectData.stroke = 'none';
    rectData.class = 'labelBox';
    //rectData.color = 'white';

    exports.drawRect(elem, rectData);

    txtObject.y = txtObject.y + txtObject.labelMargin;
    txtObject.x = txtObject.x + 0.5*txtObject.labelMargin;
    txtObject.fill = 'white';
    exports.drawText(elem, txtObject);

    //return textElem;
};
var actorCnt  = -1;
/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
exports.drawActor = function(elem, left, verticalPos, description,conf){
    var center = left + (conf.width/2);
    var g = elem.append('g');
    if(verticalPos === 0) {
        actorCnt++;
        g.append('line')
            .attr('id', 'actor'+actorCnt)
            .attr('x1', center)
            .attr('y1', 5)
            .attr('x2', center)
            .attr('y2', 2000)
            .attr('class', 'actor-line')
            .attr('stroke-width', '0.5px')
            .attr('stroke', '#999');
    }

    var rect = exports.getNoteRect();
    rect.x = left;
    rect.y = verticalPos;
    rect.fill = '#eaeaea';
    rect.width = conf.width;
    rect.height = conf.height;
    rect.class = 'actor';
    rect.rx = 3;
    rect.ry = 3;
    exports.drawRect(g, rect);

    _drawTextCandidateFunc(conf)(description, g, 
        rect.x, rect.y, rect.width, rect.height, {'class':'actor'});
};

exports.anchorElement = function(elem) {
    return elem.append('g');
};
/**
 * Draws an actor in the diagram with the attaced line
 * @param elem - element to append activation rect
 * @param bounds - activation box bounds
 * @param verticalPos - precise y cooridnate of bottom activation box edge
 */
exports.drawActivation = function(elem,bounds,verticalPos){
    var rect = exports.getNoteRect();
    var g = bounds.anchored;
    rect.x = bounds.startx;
    rect.y = bounds.starty;
    rect.fill = '#f4f4f4';
    rect.width = bounds.stopx - bounds.startx;
    rect.height = verticalPos - bounds.starty;
    exports.drawRect(g, rect);
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the list of actors
 * @param description The text in the box
 */
exports.drawLoop = function(elem,bounds,labelText, conf){
    var g = elem.append('g');
    var drawLoopLine = function(startx,starty,stopx,stopy){
        g.append('line')
            .attr('x1', startx)
            .attr('y1', starty)
            .attr('x2', stopx )
            .attr('y2', stopy )
            .attr('stroke-width', 2)
            .attr('stroke', '#526e52')
            .attr('class','loopLine');
    };
    drawLoopLine(bounds.startx, bounds.starty, bounds.stopx , bounds.starty);
    drawLoopLine(bounds.stopx , bounds.starty, bounds.stopx , bounds.stopy );
    drawLoopLine(bounds.startx, bounds.stopy , bounds.stopx , bounds.stopy );
    drawLoopLine(bounds.startx, bounds.starty, bounds.startx, bounds.stopy );
    if(typeof bounds.elsey !== 'undefined'){
        drawLoopLine(bounds.startx, bounds.elsey, bounds.stopx, bounds.elsey );
    }

    var txt = exports.getTextObj();
    txt.text = labelText;
    txt.x = bounds.startx;
    txt.y = bounds.starty;
    txt.labelMargin =  1.5 * 10; // This is the small box that says "loop"
    txt.class =  'labelText';    // Its size & position are fixed.
    txt.fill =  'white';

    exports.drawLabel(g,txt);

    txt = exports.getTextObj();
    txt.text = '[ ' + bounds.title + ' ]';
    txt.x = bounds.startx + (bounds.stopx - bounds.startx)/2;
    txt.y = bounds.starty + 1.5 * conf.boxMargin;
    txt.anchor = 'middle';
    txt.class = 'loopText';

    exports.drawText(g,txt);

    if(typeof bounds.elseText !== 'undefined') {
        txt.text = '[ ' + bounds.elseText + ' ]';
        txt.y = bounds.elsey + 1.5 * conf.boxMargin;
        exports.drawText(g, txt);
    }
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
exports.insertArrowHead = function(elem){
    elem.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('refX', 5)
        .attr('refY', 2)
        .attr('markerWidth', 6)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0,0 V 4 L6,2 Z'); //this is actual shape for arrowhead
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
exports.insertArrowCrossHead = function(elem){
    var defs = elem.append('defs');
    var marker = defs.append('marker')
        .attr('id', 'crosshead')
        .attr('markerWidth', 15)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .attr('refX', 16)
        .attr('refY', 4);

    // The arrow
    marker.append('path')
            .attr('fill','black')
            .attr('stroke','#000000')
            .style('stroke-dasharray', ('0, 0'))
            .attr('stroke-width','1px')
            .attr('d', 'M 9,2 V 6 L16,4 Z');

    // The cross
    marker.append('path')
            .attr('fill','none')
            .attr('stroke','#000000')
            .style('stroke-dasharray', ('0, 0'))
            .attr('stroke-width','1px')
            .attr('d', 'M 0,1 L 6,7 M 6,1 L 0,7')
        ; //this is actual shape for arrowhead

};

exports.getTextObj = function(){
    var txt = {
        x: 0,
        y: 0,
        'fill':'black',
        'text-anchor': 'start',
        style: '#666',
        width: 100,
        height: 100,
        textMargin:0,
        rx: 0,
        ry: 0
    };
    return txt;
};

exports.getNoteRect = function(){
    var rect = {
        x      : 0,
        y      : 0,
        fill   : '#EDF2AE',
        stroke : '#666',
        width  : 100,
        anchor : 'start',
        height : 100,
        rx     : 0,
        ry     : 0
    };
    return rect;
};

var _drawTextCandidateFunc = (function() {
    function byText(content, g, x, y, width, height, textAttrs) {
      var text = g.append('text')
        .attr('x', x + width / 2).attr('y', y + height / 2 + 5)
        .style('text-anchor', 'middle')
        .text(content);
      _setTextAttrs(text, textAttrs);
    }

    function byTspan(content, g, x, y, width, height, textAttrs) {
      var text = g.append('text')
        .attr('x', x + width / 2).attr('y', y) 
        .style('text-anchor', 'middle');
      text.append('tspan')
        .attr('x', x + width / 2).attr('dy', '0') 
        .text(content);

      if(typeof(text.textwrap) !== 'undefined'){
        text.textwrap({ //d3textwrap
              x: x + width / 2, y: y, width: width, height: height
        }, 0);
        //vertical aligment after d3textwrap expans tspan to multiple tspans
        var tspans = text.selectAll('tspan');
        if (tspans.length > 0 && tspans[0].length > 0) {
          tspans = tspans[0];
          //set y of <text> to the mid y of the first line 
          text.attr('y', y + (height/2.0 - text[0][0].getBBox().height*(1 - 1.0/tspans.length)/2.0))
            .attr("dominant-baseline", "central")
            .attr("alignment-baseline", "central");
        }
      } 
      _setTextAttrs(text, textAttrs);
    }

    function byFo(content, g, x, y, width, height, textAttrs) {
        var s = g.append('switch');
        var f = s.append("foreignObject")
                  .attr('x', x).attr('y', y)
                  .attr('width', width).attr('height', height);

        var text = f.append('div').style('display', 'table')
          .style('height', '100%').style('width', '100%');

        text.append('div').style('display', 'table-cell')
           .style('text-align', 'center').style('vertical-align', 'middle')
           .text(content);

        byTspan(content, s, x, y, width, height, textAttrs);
        _setTextAttrs(text, textAttrs);
    }

    function _setTextAttrs(toText, fromTextAttrsDict) {
      for (var key in fromTextAttrsDict) {
        if (fromTextAttrsDict.hasOwnProperty(key)) {
          toText.attr(key, fromTextAttrsDict[key]);
        }
      }
    }

    return function(conf) {
      return conf.textPlacement==='fo' ? byFo : (
          conf.textPlacement==='old' ? byText: byTspan);
    };
})();
