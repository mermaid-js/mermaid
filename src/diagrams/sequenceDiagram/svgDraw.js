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

    return rectElem;
};

exports.drawText = function(elem , textData){
    var textElem = elem.append('text');
    textElem.attr('x', textData.x);
    textElem.attr('y', textData.y);
    textElem.style('text-anchor', 'start');

    textData.text.split('<br>').forEach(function(rowText){
        var span = textElem.append('tspan');
        span.attr('x', textData.x +textData.textMargin);
        span.attr('dy', textData.dy);
        span.text(rowText);
    });

    return textElem;
};

exports.getTextObj = function(){
    var rect = {
        x: 0,
        y: 0,
        'text-anchor': 'start',
        style: '#666',
        width: 100,
        height: 100,
        rx: 0,
        ry: 0
    };
    return rect;
};

exports.getNoteRect = function(){
    var rect = {
        x: 0,
        y: 0,
        fill: '#EDF2AE',
        stroke: '#666',
        width: 100,
        height: 100,
        rx: 0,
        ry: 0
    };
    return rect;
};
