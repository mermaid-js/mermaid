/* globals d3 */
/**
 * Created by knut on 14-11-23.
 */

var sq = require('./parser/sequenceDiagram').parser;
sq.yy = require('./sequenceDb');
var svgDraw = require('./svgDraw');
var conf = {

    diagramMarginX:50,
    diagramMarginY:10,
    // Margin between actors
    actorMargin:50,
    // Width of actor moxes
    width:150,
    // Height of actor boxes
    height:65,
    // Margin around loop boxes
    boxMargin:10,
    boxTextMargin:5,

    noteMargin:10,
    // Space between messages
    messageMargin:35
};

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
    updateVal : function (obj,key,val,fun){
        if(typeof obj[key] === 'undefined'){
            obj[key] = val;
        }else{
            obj[key] = fun(val,obj[key]);
        }
    },
    updateLoops:function(startx,starty,stopx,stopy){
        var _self = this;
        var cnt = 0;
        this.list.forEach(function(loop){
            cnt++;
            // The loop list is a stack so the biggest margins in the beginning of the list
            var n = _self.list.length-cnt+1;

            _self.updateVal(loop, 'startx',startx - n*conf.boxMargin, Math.min);
            _self.updateVal(loop, 'starty',starty - n*conf.boxMargin, Math.min);
            _self.updateVal(loop, 'stopx' ,stopx  + n*conf.boxMargin, Math.max);
            _self.updateVal(loop, 'stopy' ,stopy  + n*conf.boxMargin, Math.max);

            _self.updateVal(exports.bounds.data,'startx',startx - n*conf.boxMargin ,Math.min);
            _self.updateVal(exports.bounds.data,'starty',starty - n*conf.boxMargin ,Math.min);
            _self.updateVal(exports.bounds.data,'stopx' ,stopx  + n*conf.boxMargin ,Math.max);
            _self.updateVal(exports.bounds.data,'stopy' ,stopy  + n*conf.boxMargin ,Math.max);
        });
    },
    insert:function(startx,starty,stopx,stopy){

        var _startx, _starty, _stopx, _stopy;

        _startx = Math.min(startx,stopx);
        _stopx  = Math.max(startx,stopx);
        _starty = Math.min(starty,stopy);
        _stopy  = Math.max(starty,stopy);

        this.updateVal(exports.bounds.data,'startx',_startx,Math.min);
        this.updateVal(exports.bounds.data,'starty',_starty,Math.min);
        this.updateVal(exports.bounds.data,'stopx' ,_stopx ,Math.max);
        this.updateVal(exports.bounds.data,'stopy' ,_stopy ,Math.max);

        this.updateLoops(_startx,_starty,_stopx,_stopy);

    },
    newLoop:function(title){
        this.list.push({startx:undefined,starty:this.verticalPos,stopx:undefined,stopy:undefined, title:title});
    },
    endLoop:function(){
        var loop = this.list.pop();
        //loop.stopy =  exports.bounds.getVerticalPos();
        return loop;
    },
    bumpVerticalPos:function(bump){
        this.verticalPos = this.verticalPos + bump;
        this.data.stopy = this.verticalPos;
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
var drawNote = function(elem, startx, verticalPos, msg){
    var rect = svgDraw.getNoteRect();
    rect.x = startx;
    rect.y = verticalPos;
    rect.width = conf.width;
    rect.class = 'note';

    var g = elem.append("g");
    var rectElem = svgDraw.drawRect(g, rect);

    var textObj = svgDraw.getTextObj();
    textObj.x = startx;
    textObj.y = verticalPos+conf.noteMargin;
    textObj.textMargin = conf.noteMargin;
    textObj.dy = '1em';
    textObj.text = msg.message;
    textObj.class = 'noteText';

    var textElem = svgDraw.drawText(g,textObj);

    var textHeight = textElem[0][0].getBBox().height;
    exports.bounds.insert(startx, verticalPos, startx + conf.width,  verticalPos + 2*conf.noteMargin + textHeight);

    rectElem.attr('height',textHeight+ 2*conf.noteMargin);
    exports.bounds.bumpVerticalPos(textHeight+ 2*conf.noteMargin);
};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the list of actors
 * @param description The text in the box
 */
exports.drawLoop = function(elem,bounds){
    var g = elem.append("g");
    var drawLoopLine = function(startx,starty,stopx,stopy){
        g.append("line")
            .attr("x1", startx)
            .attr("y1", starty)
            .attr("x2", stopx )
            .attr("y2", stopy )
            .attr("stroke-width", 2)
            .attr("stroke", "#526e52")
            .attr('class','loopLine');
    };
    drawLoopLine(bounds.startx, bounds.starty, bounds.stopx , bounds.starty);
    drawLoopLine(bounds.stopx , bounds.starty, bounds.stopx , bounds.stopy );
    drawLoopLine(bounds.startx, bounds.stopy , bounds.stopx , bounds.stopy );
    drawLoopLine(bounds.startx, bounds.starty, bounds.startx, bounds.stopy );

    var txt = svgDraw.getTextObj();
    txt.text = "Loop";
    txt.x = bounds.startx;
    txt.y = bounds.starty;
    txt.labelMargin =  1.5 * conf.boxMargin;
    txt.class =  'labelText';
    txt.fill =  'white';

    svgDraw.drawLabel(g,txt);

    txt = svgDraw.getTextObj();
    txt.text = bounds.title;
    txt.x = bounds.startx + (bounds.stopx - bounds.startx)/2;
    txt.y = bounds.starty + 1.5 * conf.boxMargin;
    txt.anchor = 'middle';
    txt.class = 'loopText';

    svgDraw.drawText(g,txt);
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

    var textElem = g.append("text")      // text label for the x axis
        .attr("x", txtCenter)
        .attr("y", verticalPos - 7)
        .style("text-anchor", "middle")
        .attr("class", "messageText")
        .text(msg.message);

    var textWidth = textElem[0][0].getBBox().width;

    var line;

    if(startx===stopx){
        line  = g.append("path")
            .attr('d', 'M ' +startx+ ','+verticalPos+' C ' +(startx+60)+ ','+(verticalPos-10)+' ' +(startx+60)+ ',' +
            (verticalPos+30)+' ' +startx+ ','+(verticalPos+20));

        exports.bounds.bumpVerticalPos(30);
        var dx = Math.max(textWidth/2,100);
        exports.bounds.insert(startx-dx, exports.bounds.getVerticalPos() -10, stopx+dx,  exports.bounds.getVerticalPos());
    }else{
        line = g.append("line");
        line.attr("x1", startx);
        line.attr("y1", verticalPos);
        line.attr("x2", stopx);
        line.attr("y2", verticalPos);
        exports.bounds.insert(startx, exports.bounds.getVerticalPos() -10, stopx,  exports.bounds.getVerticalPos());
    }
    //Make an SVG Container
    //Draw the line
    if (msg.type === 1) {
        line.style("stroke-dasharray", ("3, 3"));
        line.attr("class", "messageLine1");
    }
    else {
        line.attr("class", "messageLine0");
    }

    line.attr("stroke-width", 2);
    line.attr("stroke", "black");
    line.style("fill", "none");     // remove any fill colour
    line.attr("marker-end", "url(#arrowhead)");

};

/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */
var drawActor = function(elem, left,description){
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

    exports.bounds.insert(left, 0, left + conf.width, conf.height);
};

module.exports.drawActors = function(diagram, actors, actorKeys){
    var i;
    // Draw the actors
    for(i=0;i<actorKeys.length;i++){
        var key = actorKeys[i];

        // Add some rendering data to the object
        actors[key].x = i*conf.actorMargin +i*conf.width;
        actors[key].y = 0;
        actors[key].width = conf.diagramMarginY;
        actors[key].height = conf.diagramMarginY;

        // Draw the box with the attached line
        drawActor(diagram, actors[key].x, actors[key].description);
    }

    // Add a margin between the actor boxes and the first arrow
    //exports.bounds.bumpVerticalPos(conf.height+conf.messageMargin);
    exports.bounds.bumpVerticalPos(conf.height);
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
    exports.bounds.init();
    var diagram = d3.select('#'+id);

    // Fetch data from the parsing
    var actors = sq.yy.getActors();
    var actorKeys = sq.yy.getActorKeys();
    var messages = sq.yy.getMessages();

    module.exports.drawActors(diagram, actors, actorKeys);

    // The arrow head definition is attached to the svg once
    insertArrowHead(diagram);

    // Draw the messages/signals
    messages.forEach(function(msg){


        var startx;
        var stopx;
        switch(msg.type){
            case sq.yy.LINETYPE.NOTE:
                exports.bounds.bumpVerticalPos(conf.boxMargin);

                startx = actors[msg.from].x;
                stopx = actors[msg.to].x;

                if(msg.placement !== 0){
                    // Right of
                    drawNote(diagram, startx + (conf.width + conf.actorMargin)/2, exports.bounds.getVerticalPos(), msg);

                }else{
                    // Left of
                    drawNote(diagram, startx - (conf.width + conf.actorMargin)/2, exports.bounds.getVerticalPos(), msg);
                }
                break;
            case sq.yy.LINETYPE.LOOP_START:
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                exports.bounds.newLoop(msg.message);
                exports.bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
                break;
            case sq.yy.LINETYPE.LOOP_END:
                var loopData = exports.bounds.endLoop();

                exports.drawLoop(diagram, loopData);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                break;
            default:
                exports.bounds.bumpVerticalPos(conf.messageMargin);
                startx = actors[msg.from].x + conf.width/2;
                stopx = actors[msg.to].x + conf.width/2;

                drawMessage(diagram, startx, stopx, exports.bounds.getVerticalPos(), msg);

        }
    });

    var box = exports.bounds.getBounds();

    var height = box.stopy-box.starty+2*conf.diagramMarginY;
    var width  = box.stopx-box.startx+2*conf.diagramMarginX;

    diagram.attr("height",height);
    diagram.attr("width", width );
    diagram.attr("viewBox", (box.startx-conf.diagramMarginX) + ' -' +conf.diagramMarginY + ' ' + width + ' ' + height);
};
