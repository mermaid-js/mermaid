/* globals d3 */
/**
 * Created by knut on 14-11-23.
 */

var sq = require('./parser/sequenceDiagram').parser;
sq.yy = require('./sequenceDb');

exports.bounds = {
    data:{
        startx:undefined,
        stopx :undefined,
        starty:undefined,
        stopy :undefined,
    },
    verticalPos:0,

    list: [],
    init    : function(){
        this.list = [];
        this.data = {
            startx:undefined,
                stopx :undefined,
                starty:undefined,
                stopy :undefined,
        };
        this.verticalPos =0;
    },
    applyMin:function(minVal, margin){
        var minValue = minVal;
        this.list.forEach(function(loop){
            if(typeof loop.startx === 'undefined'){
                loop.startx = minValue  - margin;
            }else{
                loop.startx = Math.min(minValue - margin,loop.startx);
            }
            minValue = loop.startx;
        });
        return minValue;
    },
    applyMax:function(maxVal, margin){
        var maxValue = maxVal;
        this.list.forEach(function(loop){
            if(typeof loop.stopx === 'undefined'){
                loop.stopx = maxValue + margin;
            }else{
                loop.stopx = Math.max(maxValue + margin,loop.stopx);
            }
            maxValue = loop.stopx;
        });

        return maxValue;
    },
    insert:function(startx,starty,stopx,stopy){
        var updateVal = function (key,val,fun){
            if(typeof exports.bounds.data[key] === 'undefined'){
                //console.log('Setting startx',startx);
                exports.bounds.data[key] = val;
            }else{
                exports.bounds.data[key] = fun(val,exports.bounds.data[key]);
            }
        };
        updateVal('startx',startx,Math.min);
        updateVal('starty',starty,Math.min);
        updateVal('stopx' ,stopx ,Math.max);
        updateVal('stopy' ,stopy ,Math.max);

        //updateLoops();
    },
    newLoop:function(){
        this.list.push({startx:undefined,starty:exports.bounds.getVerticalPos(),stopx:undefined,stopy:undefined});
    },
    endLoop:function(){
        var loop = this.list.pop();
        loop.stopy =  exports.bounds.getVerticalPos();
    },
    bumpVerticalPos:function(bump){
        this.verticalPos = this.verticalPos + bump;
    },
    getVerticalPos:function(){
        return this.verticalPos;
    },
    getBounds:function(){
        return this.data;
    }
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
var drawNote = function(elem, startX, verticalPos, msg){
    var g = elem.append("g");
    var rectElem = g.append("rect")
        .attr("x", startX + conf.noteMargin)
        .attr("y", verticalPos - conf.noteMargin)
        .attr("fill", '#EDF2AE')
        .attr("stroke", '#666')
        .attr("width", conf.width)
        .attr("height", 100)
        .attr("rx", 0)
        .attr("ry", 0);
    var textElem = g.append("text")
        .attr("x", startX + 10)
        .attr("y", verticalPos - 15)
        .style("text-anchor", "start");
    msg.message.split('<br>').forEach(function(rowText){
        textElem.append("tspan")
            .attr("x", startX + 35 )
            .attr("dy", '1em')
            .text(rowText);
    });

    exports.bounds.insert(startX + conf.noteMargin, verticalPos -conf.noteMargin, startX + conf.noteMargin + conf.width,  verticalPos -conf.noteMargin + textElem[0][0].getBBox().height+20);

    //console.log('textElem.height');
    //console.log(textElem[0][0].getBBox());
    rectElem.attr('height',textElem[0][0].getBBox().height+20);

    exports.bounds.verticalPos = verticalPos + textElem[0][0].getBBox().height - 10;

    return verticalPos + textElem[0][0].getBBox().height - 10;
};


/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
var insertArrowHead = function(elem){
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
 * Draws a message
 * @param elem
 * @param startx
 * @param stopx
 * @param verticalPos
 * @param txtCenter
 * @param msg
 */
var drawMessage = function(elem, startx, stopx, verticalPos, msg){
    var g = elem.append("g");
    var txtCenter = startx + (stopx-startx)/2;
    //Make an SVG Container
    //Draw the line
    if(msg.type !== 2) {
        if (msg.type === 1) {
            g.append("line")
                .attr("x1", startx)
                .attr("y1", verticalPos)
                .attr("x2", stopx)
                .attr("y2", verticalPos)
                .attr("stroke-width", 2)
                .attr("stroke", "black")
                .style("stroke-dasharray", ("3, 3"))
                .attr("class", "link")
                .attr("marker-end", "url(#arrowhead)");
            //.attr("d", diagonal);
        }
        else {
            g.append("line")
                .attr("x1", startx)
                .attr("y1", verticalPos)
                .attr("x2", stopx)
                .attr("y2", verticalPos)
                .attr("stroke-width", 2)
                .attr("stroke", "black")
                .attr("class", "link")
                .attr("marker-end", "url(#arrowhead)");
            //.attr("d", diagonal);
        }

        g.append("text")      // text label for the x axis
            .attr("x", txtCenter)
            .attr("y", verticalPos - 10)
            .style("text-anchor", "middle")
            .text(msg.message);

        //console.log('Setting message bounds');
        exports.bounds.insert(startx, exports.bounds.getVerticalPos() -10, stopx,  exports.bounds.getVerticalPos());
    }
    else{
        var textElem = g.append("text")
            .attr("x", txtCenter)
            .attr("y", exports.bounds.getVerticalPos() - 10)
            .style("text-anchor", "middle")
            .text(msg.message);
        var box = textElem[0][0].getBBox();

        exports.bounds.insert(box.x, exports.bounds.getVerticalPos() -10, box.x+box.width,  exports.bounds.getVerticalPos()-10 + box.height);
    }
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
var drawActor = function(elem, center, pos, description,i){
    var g = elem.append("g");
    g.append("line")
        .attr("x1", center)
        .attr("y1", conf.diagramMarginY)
        .attr("x2", center)
        .attr("y2", 2000)
        .attr("stroke-width", '0.5px')
        .attr("stroke", '#999');

    g.append("rect")
        .attr("x", conf.diagramMarginX  + pos*conf.messageMargin +i*150)
        .attr("y", conf.diagramMarginY)
        .attr("fill", '#eaeaea')
        .attr("stroke", '#666')
        .attr("width", conf.width)
        .attr("height", conf.height)
        .attr("rx", 3)
        .attr("ry", 3);
    g.append("text")      // text label for the x axis
        .attr("x", conf.diagramMarginX  + pos*conf.messageMargin +i*conf.width + 75)
        .attr("y", conf.diagramMarginY+37.5)
        .style("text-anchor", "middle")
        .text(description)
    ;

    exports.bounds.insert(conf.diagramMarginX  + pos*conf.margin +i*150, conf.diagramMarginY, conf.diagramMarginX  + pos*conf.margin +i*150 + conf.width,  conf.diagramMarginY + conf.height);
};

module.exports.drawActors = function(diagram, actors, actorKeys){
    var i;
    // Draw the actors
    for(i=0;i<actorKeys.length;i++){
        var key = actorKeys[i];

        // Add some rendering data to the object
        actors[key].x = conf.diagramMarginX  + i*conf.messageMargin +i*conf.width;
        actors[key].y = conf.diagramMarginY;
        actors[key].width = conf.diagramMarginY;
        actors[key].height = conf.diagramMarginY;

        var center = actors[key].x + (conf.width/2);

        // Keep track of width for with setting on the svg
        //maxX = Math.max(maxX,actors[key].x);

        // Draw the box with the attached line
        drawActor(diagram, center,i, actors[key].description, i);
    }

    // Add a margin between the actor boxes and the first arrow
    exports.bounds.bumpVerticalPos(conf.diagramMarginY + conf.height);
};

var conf = {

    diagramMarginX:50,
    diagramMarginY:10,
    // Margin between actors
    margin:50,
    // Width of actor moxes
    width:150,
    // Height of actor boxes
    height:65,
    // Margin around loop boxes
    loopMargin:10,

    noteMargin:25,
    // Space between messages
    messageMargin:40
};
module.exports.setConf = function(cnf){
    conf = cnf;
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
    sq.yy.clear();
    sq.parse(text);

    var diagram = d3.select('#'+id);

    // Fetch data from the parsing
    var actors = sq.yy.getActors();
    var actorKeys = sq.yy.getActorKeys();
    var messages = sq.yy.getMessages();

    var i, maxX = 0, minX=0;

    module.exports.drawActors(diagram, actors, actorKeys);

    // The arrow head definition is attached to the svg once
    insertArrowHead(diagram);

    // Draw the messages/signals
    messages.forEach(function(msg){

        exports.bounds.bumpVerticalPos(conf.messageMargin);
        var startx;
        var stopx;
        switch(msg.type){
            case sq.yy.LINETYPE.NOTE:
                startx = actors[msg.from].x + conf.width/2;
                stopx = actors[msg.to].x + conf.width/2;

                if(msg.placement !== 0){
                    // Right of
                    drawNote(diagram, startx, exports.bounds.getVerticalPos(), msg);

                }else{
                    // Left of
                    drawNote(diagram, startx - conf.width - conf.margin, exports.bounds.getVerticalPos(), msg);
                }
                break;
            case sq.yy.LINETYPE.LOOP_START:
                //var loop = exports.bounds.newLoop();
                exports.bounds.newLoop();
                break;
            case sq.yy.LINETYPE.LOOP_END:
                exports.bounds.endLoop();
                //var loopData = loopList.pop();
                //loopData.stopy = exports.bounds.getVerticalPos();
                //drawLoop(loopData,10);
                break;
            default:
                startx = actors[msg.from].x + conf.width/2;
                stopx = actors[msg.to].x + conf.width/2;

                drawMessage(diagram, startx, stopx, exports.bounds.getVerticalPos(), msg);
                // Keep track of width for with setting on the svg
                maxX = Math.max(maxX,startx + 176);
                exports.bounds.applyMax(maxX,conf.loopMargin);

        }
    });

    // TODO fetch from bounds
    diagram.attr("height", exports.bounds.getVerticalPos() + 40);
    diagram.attr("width", maxX );
    diagram.attr("viewBox", minX + ' 0 '+maxX+ ' ' +(exports.bounds.getVerticalPos() + 40));
};
