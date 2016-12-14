/**
 * Created by knut on 14-11-23.
 */

var sq = require('./parser/sequenceDiagram').parser;
sq.yy = require('./sequenceDb');
var svgDraw = require('./svgDraw');
var d3 = require('../../d3');
var Logger = require('../../logger');
var log = new Logger.Log();

var conf = {

    diagramMarginX:50,
    diagramMarginY:30,
    // Margin between actors
    actorMargin:50,
    // Width of actor boxes
    width:150,
    // Height of actor boxes
    height:65,
    // Margin around loop boxes
    boxMargin:10,
    boxTextMargin:5,
    noteMargin:10,
    // Space between messages
    messageMargin:35,
    //mirror actors under diagram
    mirrorActors:false,
    // Depending on css styling this might need adjustment
    // Prolongs the edge of the diagram downwards
    bottomMarginAdj:1,

    // width of activation box
    activationWidth:10,

    //text placement as: tspan | fo | old only text as before 
    textPlacement: 'tspan', 
};

exports.bounds = {
    data:{
        startx:undefined,
        stopx :undefined,
        starty:undefined,
        stopy :undefined
    },
    verticalPos:0,

    sequenceItems: [],
    activations: [],
    init    : function(){
        this.sequenceItems = [];
        this.activations = [];
        this.data = {
            startx:undefined,
                stopx :undefined,
                starty:undefined,
                stopy :undefined
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
    updateBounds:function(startx,starty,stopx,stopy){
        var _self = this;
        var cnt = 0;
        function updateFn(type) { return function updateItemBounds(item) {
            cnt++;
            // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems
            var n = _self.sequenceItems.length-cnt+1;

            _self.updateVal(item, 'starty',starty - n*conf.boxMargin, Math.min);
            _self.updateVal(item, 'stopy' ,stopy  + n*conf.boxMargin, Math.max);

            _self.updateVal(exports.bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);
            _self.updateVal(exports.bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

            if (!(type == 'activation')) {
                _self.updateVal(item, 'startx',startx - n*conf.boxMargin, Math.min);
                _self.updateVal(item, 'stopx' ,stopx  + n*conf.boxMargin, Math.max);

                _self.updateVal(exports.bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);
                _self.updateVal(exports.bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
            }
        }}

        this.sequenceItems.forEach(updateFn());
        this.activations.forEach(updateFn('activation'));
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

        this.updateBounds(_startx,_starty,_stopx,_stopy);

    },
    newActivation:function(message, diagram){
        var actorRect = sq.yy.getActors()[message.from.actor];
        var stackedSize = actorActivations(message.from.actor).length;
        var x = actorRect.x + conf.width/2 + (stackedSize-1)*conf.activationWidth/2;
        this.activations.push({startx:x,starty:this.verticalPos+2,stopx:x+conf.activationWidth,stopy:undefined,
            actor: message.from.actor,
            anchored: svgDraw.anchorElement(diagram)
        });
    },
    endActivation:function(message){
        // find most recent activation for given actor
        var lastActorActivationIdx = this.activations
          .map(function(activation) { return activation.actor })
          .lastIndexOf(message.from.actor);
        var activation = this.activations.splice(lastActorActivationIdx, 1)[0];
        return activation;
    },
    newLoop:function(title){
        this.sequenceItems.push({startx:undefined,starty:this.verticalPos,stopx:undefined,stopy:undefined, title:title});
    },
    endLoop:function(){
        var loop = this.sequenceItems.pop();
        return loop;
    },
    addElseToLoop:function(message){
        var loop = this.sequenceItems.pop();
        loop.elsey =  exports.bounds.getVerticalPos();
        loop.elseText = message;
        this.sequenceItems.push(loop);
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
var drawNote = function(elem, startx, verticalPos, msg, forceWidth){
    var rect = svgDraw.getNoteRect();
    rect.x = startx;
    rect.y = verticalPos;
    rect.width = forceWidth || conf.width;
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

    var textElem = svgDraw.drawText(g,textObj, rect.width-conf.noteMargin);

    var textHeight = textElem[0][0].getBBox().height;
    if(!forceWidth && textHeight > conf.width){
        textElem.remove();
        g = elem.append('g');

        textElem = svgDraw.drawText(g,textObj, 2*rect.width-conf.noteMargin);
        textHeight = textElem[0][0].getBBox().height;
        rectElem.attr('width',2*rect.width);
        exports.bounds.insert(startx, verticalPos, startx + 2*rect.width,  verticalPos + 2*conf.noteMargin + textHeight);
    }else{
        exports.bounds.insert(startx, verticalPos, startx + rect.width,  verticalPos + 2*conf.noteMargin + textHeight);
    }

    rectElem.attr('height',textHeight+ 2*conf.noteMargin);
    exports.bounds.bumpVerticalPos(textHeight+ 2*conf.noteMargin);
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
    var g = elem.append('g');
    var txtCenter = startx + (stopx-startx)/2;

    var textElem = g.append('text')      // text label for the x axis
        .attr('x', txtCenter)
        .attr('y', verticalPos - 7)
        .style('text-anchor', 'middle')
        .attr('class', 'messageText')
        .text(msg.message);

    var textWidth;

    if(typeof textElem[0][0].getBBox !== 'undefined'){
        textWidth = textElem[0][0].getBBox().width;
    }
    else{
        //textWidth = getBBox(textElem).width; //.getComputedTextLength()
        textWidth = textElem[0][0].getBoundingClientRect();
        //textWidth = textElem[0][0].getComputedTextLength();
    }

    var line;

    if(startx===stopx){
        line  = g.append('path')
            .attr('d', 'M ' +startx+ ','+verticalPos+' C ' +(startx+60)+ ','+(verticalPos-10)+' ' +(startx+60)+ ',' +
            (verticalPos+30)+' ' +startx+ ','+(verticalPos+20));

        exports.bounds.bumpVerticalPos(30);
        var dx = Math.max(textWidth/2,100);
        exports.bounds.insert(startx-dx, exports.bounds.getVerticalPos() -10, stopx+dx,  exports.bounds.getVerticalPos());
    }else{
        line = g.append('line');
        line.attr('x1', startx);
        line.attr('y1', verticalPos);
        line.attr('x2', stopx);
        line.attr('y2', verticalPos);
        exports.bounds.insert(startx, exports.bounds.getVerticalPos() -10, stopx,  exports.bounds.getVerticalPos());
    }
    //Make an SVG Container
    //Draw the line
    if (msg.type === sq.yy.LINETYPE.DOTTED || msg.type === sq.yy.LINETYPE.DOTTED_CROSS || msg.type === sq.yy.LINETYPE.DOTTED_OPEN) {
        line.style('stroke-dasharray', ('3, 3'));
        line.attr('class', 'messageLine1');
    }
    else {
        line.attr('class', 'messageLine0');
    }

    var url =  '';
    if(conf.arrowMarkerAbsolute){
        url =  window.location.protocol+'//'+window.location.host+window.location.pathname +window.location.search;
        url = url.replace(/\(/g,'\\(');
        url = url.replace(/\)/g,'\\)');
    }

    line.attr('stroke-width', 2);
    line.attr('stroke', 'black');
    line.style('fill', 'none');     // remove any fill colour
    if (msg.type === sq.yy.LINETYPE.SOLID || msg.type === sq.yy.LINETYPE.DOTTED){
        line.attr('marker-end', 'url(' + url + '#arrowhead)');
    }

    if (msg.type === sq.yy.LINETYPE.SOLID_CROSS || msg.type === sq.yy.LINETYPE.DOTTED_CROSS){
        line.attr('marker-end', 'url(' + url + '#crosshead)');
    }

};


module.exports.drawActors = function(diagram, actors, actorKeys,verticalPos){
    var i;
    // Draw the actors
    for(i=0;i<actorKeys.length;i++){
        var key = actorKeys[i];

        // Add some rendering data to the object
        actors[key].x = i*conf.actorMargin +i*conf.width;
        actors[key].y = verticalPos;
        actors[key].width = conf.diagramMarginX;
        actors[key].height = conf.diagramMarginY;

        // Draw the box with the attached line
        svgDraw.drawActor(diagram, actors[key].x, verticalPos, actors[key].description, conf);
        exports.bounds.insert(actors[key].x, verticalPos, actors[key].x + conf.width, conf.height);

    }

    // Add a margin between the actor boxes and the first arrow
    //exports.bounds.bumpVerticalPos(conf.height+conf.messageMargin);
    exports.bounds.bumpVerticalPos(conf.height);
};


module.exports.setConf = function(cnf){
    var keys = Object.keys(cnf);

    keys.forEach(function(key){
        conf[key] = cnf[key];
    });
};

var actorActivations = function(actor) {
    return module.exports.bounds.activations.filter(function(activation) {
        return activation.actor == actor;
    });
};

var actorFlowVerticaBounds = function(actor) {
    // handle multiple stacked activations for same actor
    var actors = sq.yy.getActors();
    var activations = actorActivations(actor);

    var left = activations.reduce(function(acc,activation) { return Math.min(acc,activation.startx)}, actors[actor].x + conf.width/2);
    var right = activations.reduce(function(acc,activation) { return Math.max(acc,activation.stopx)}, actors[actor].x + conf.width/2);
    return [left,right];
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
    sq.yy.clear();
    sq.parse(text+'\n');

    exports.bounds.init();
    var diagram = d3.select('#'+id);

    var startx;
    var stopx;
    var forceWidth;

    // Fetch data from the parsing
    var actors = sq.yy.getActors();
    var actorKeys = sq.yy.getActorKeys();
    var messages = sq.yy.getMessages();
    var title = sq.yy.getTitle();
    module.exports.drawActors(diagram, actors, actorKeys, 0);

    // The arrow head definition is attached to the svg once
    svgDraw.insertArrowHead(diagram);
    svgDraw.insertArrowCrossHead(diagram);

    function activeEnd(msg, verticalPos) {
        var activationData = exports.bounds.endActivation(msg);
        if(activationData.starty + 18 > verticalPos) {
            activationData.starty = verticalPos - 6;
            verticalPos += 12;
        }
        svgDraw.drawActivation(diagram, activationData, verticalPos, conf);

        exports.bounds.insert(activationData.startx, verticalPos -10, activationData.stopx,  verticalPos);
    }

    var lastMsg;

    // Draw the messages/signals
    messages.forEach(function(msg){
        var loopData;

        switch(msg.type){
            case sq.yy.LINETYPE.NOTE:
                exports.bounds.bumpVerticalPos(conf.boxMargin);

                startx = actors[msg.from].x;
                stopx = actors[msg.to].x;

                if(msg.placement === sq.yy.PLACEMENT.RIGHTOF){
                    drawNote(diagram, startx + (conf.width + conf.actorMargin)/2, exports.bounds.getVerticalPos(), msg);

                }else if(msg.placement === sq.yy.PLACEMENT.LEFTOF){
                    drawNote(diagram, startx - (conf.width + conf.actorMargin)/2, exports.bounds.getVerticalPos(), msg);
                }else if(msg.to === msg.from) {
                    // Single-actor over
                    drawNote(diagram, startx, exports.bounds.getVerticalPos(), msg);
                }else{
                    // Multi-actor over
                    forceWidth = Math.abs(startx - stopx) + conf.actorMargin;
                    drawNote(diagram, (startx + stopx + conf.width - forceWidth)/2, exports.bounds.getVerticalPos(), msg,
                        forceWidth);
                }
                break;
            case sq.yy.LINETYPE.ACTIVE_START:
                exports.bounds.newActivation(msg, diagram);
                break;
            case sq.yy.LINETYPE.ACTIVE_END:
                activeEnd(msg, exports.bounds.getVerticalPos());
                break;
            case sq.yy.LINETYPE.LOOP_START:
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                exports.bounds.newLoop(msg.message);
                exports.bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
                break;
            case sq.yy.LINETYPE.LOOP_END:
                loopData = exports.bounds.endLoop();

                svgDraw.drawLoop(diagram, loopData,'loop', conf);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                break;
            case sq.yy.LINETYPE.OPT_START:
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                exports.bounds.newLoop(msg.message);
                exports.bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
                break;
            case sq.yy.LINETYPE.OPT_END:
                loopData = exports.bounds.endLoop();

                svgDraw.drawLoop(diagram, loopData, 'opt', conf);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                break;
            case sq.yy.LINETYPE.ALT_START:
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                exports.bounds.newLoop(msg.message);
                exports.bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
                break;
            case sq.yy.LINETYPE.ALT_ELSE:

                //exports.drawLoop(diagram, loopData);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                loopData = exports.bounds.addElseToLoop(msg.message);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                break;
            case sq.yy.LINETYPE.ALT_END:
                loopData = exports.bounds.endLoop();

                svgDraw.drawLoop(diagram, loopData,'alt', conf);
                exports.bounds.bumpVerticalPos(conf.boxMargin);
                break;
            default:
              try {
                lastMsg = msg;
                exports.bounds.bumpVerticalPos(conf.messageMargin);
                var fromBounds = actorFlowVerticaBounds(msg.from);
                var toBounds = actorFlowVerticaBounds(msg.to);
                var fromIdx = fromBounds[0] <= toBounds[0]?1:0;
                var toIdx = fromBounds[0] < toBounds[0]?0:1;
                startx = fromBounds[fromIdx];
                stopx = toBounds[toIdx];

                var verticalPos = exports.bounds.getVerticalPos();
                drawMessage(diagram, startx, stopx, verticalPos, msg);
                var allBounds = fromBounds.concat(toBounds);
                exports.bounds.insert(Math.min.apply(null, allBounds), verticalPos, Math.max.apply(null, allBounds), verticalPos);
              } catch (e) {
                  console.error('error while drawing message', e);
              }
        }
    });


    if(conf.mirrorActors){
        // Draw actors below diagram
        exports.bounds.bumpVerticalPos(conf.boxMargin*2);
        module.exports.drawActors(diagram, actors, actorKeys, exports.bounds.getVerticalPos());
    }

    var box = exports.bounds.getBounds();

    // Adjust line height of actor lines now that the height of the diagram is known
    log.debug('For line height fix Querying: #' + id + ' .actor-line');
    var actorLines = d3.selectAll('#' + id + ' .actor-line');
    actorLines.attr('y2',box.stopy);


    var height = box.stopy - box.starty + 2*conf.diagramMarginY;

    if(conf.mirrorActors){
        height = height - conf.boxMargin + conf.bottomMarginAdj;
    }

    var width = (box.stopx - box.startx) + (2 * conf.diagramMarginX);

    if(title) {
      diagram.append('text')
        .text(title)
        .attr('x', ( ( box.stopx-box.startx) / 2 ) - ( 2 * conf.diagramMarginX ) )
        .attr('y', -25);
    }

    if(conf.useMaxWidth) {
        diagram.attr('height', '100%');
        diagram.attr('width', '100%');
        diagram.attr('style', 'max-width:' + (width) + 'px;');
    }else{
        diagram.attr('height',height);
        diagram.attr('width', width );
    }
    var extraVertForTitle = title ? 40 : 0;
    diagram.attr('viewBox', (box.startx - conf.diagramMarginX) + ' -' + (conf.diagramMarginY + extraVertForTitle) + ' ' + width + ' ' + (height + extraVertForTitle));
};
