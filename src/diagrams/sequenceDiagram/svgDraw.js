/**
 * Created by knut on 14-12-20.
 */
exports.drawRect = function(elem , rectData){
    var g = elem.append("g");
    var rectElem = g.append("rect");
    rectElem.attr("x", rectData.x);
    rectElem.attr("y", rectData.x);
    rectElem.attr("fill", rectData.fill);
    rectElem.attr("stroke", rectData.stroke);
    rectElem.attr("width", rectData.width);
    rectElem.attr("height", rectData.height);
    rectElem.attr("rx", rectData.rx);
    rectElem.attr("ry", rectData.ry);

    return rectElem;
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
