/**
 * Created by knut on 14-12-20.
 */
exports.drawRect = function(elem , rectData){
    var rectElem = elem.append("rect");
    rectElem.attr("x", rectData.x);
    rectElem.attr("y", rectData.y);
    rectElem.attr("fill", rectData.fill);
    rectElem.attr("stroke", rectData.stroke);
    rectElem.attr("width", rectData.width);
    rectElem.attr("height", rectData.height);
    rectElem.attr("rx", rectData.rx);
    rectElem.attr("ry", rectData.ry);

    if(typeof rectData.class !== 'undefined'){
        rectElem.attr("class", rectData.class);
    }

    return rectElem;
};

exports.drawText = function(elem , textData){
    var textElem = elem.append('text');
    textElem.attr('x', textData.x);
    textElem.attr('y', textData.y);
    textElem.style('text-anchor', textData.anchor);
    textElem.attr('fill', textData.fill);

    textData.text.split(/<br\/?>/ig).forEach(function(rowText){
        var span = textElem.append('tspan');
        span.attr('x', textData.x +textData.textMargin);
        span.attr('dy', textData.dy);
        span.text(rowText);
    });

    if(typeof textData.class !== 'undefined'){
        textElem.attr("class", textData.class);
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

    var label = exports.drawRect(elem, rectData);

    txtObject.y = txtObject.y + txtObject.labelMargin;
    txtObject.x = txtObject.x + 0.5*txtObject.labelMargin;
    txtObject.fill = 'white';
    exports.drawText(elem, txtObject);

    //return textElem;
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
exports.drawActor = function(elem, left,description,conf){
    var center = left + (conf.width/2);
    var g = elem.append("g");
    g.append("line")
        .attr("x1", center)
        .attr("y1", 5)
        .attr("x2", center)
        .attr("y2", 2000)
        .attr("class", 'actor-line')
        .attr("stroke-width", '0.5px')
        .attr("stroke", '#999');

    g.append("rect")
        .attr("x", left)
        .attr("y", 0)
        .attr("fill", '#eaeaea')
        .attr("stroke", '#666')
        .attr("width", conf.width)
        .attr("height", conf.height)
        .attr("class", 'actor')
        .attr("rx", 3)
        .attr("ry", 3);
    g.append("text")      // text label for the x axis
        .attr("x", center)
        .attr("y", (conf.height/2)+5)
        .attr('class','actor')
        .style("text-anchor", "middle")
        .text(description)
    ;
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
exports.insertArrowHead = function(elem){
    elem.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("refX", 5) /*must be smarter way to calculate shift*/
        .attr("refY", 2)
        .attr("markerWidth", 6)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
exports.insertArrowCrossHead = function(elem){
    elem.append("defs").append("marker")
        .attr("id", "crosshead")
        .attr("refX", 15) /*must be smarter way to calculate shift*/
        .attr("refY", 4)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path")
        .attr("fill",'none')
        .attr("stroke",'#000000')
        .style("stroke-dasharray", ("0, 0"))
        .attr("stroke-width",'1px')
        .attr("d", "M 1,1 L 7,7 M 7,1 L 1,7"); //this is actual shape for arrowhead
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
        x: 0,
        y: 0,
        fill: '#EDF2AE',
        stroke: '#666',
        width: 100,
        anchor:'start',
        height: 100,
        rx: 0,
        ry: 0
    };
    return rect;
};
