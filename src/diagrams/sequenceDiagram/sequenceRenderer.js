/* globals d3 */
/**
 * Created by knut on 14-11-23.
 */

var sq = require('./parser/sequenceDiagram').parser;
sq.yy = require('./sequenceDb');

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
module.exports.draw = function (text, id) {
    sq.yy.clear();
    sq.parse(text);

    // Intial config for margins etc
    var startMargin = 50;
    var margin = 50;
    var width = 150;
    var height = 65;
    var yStartMargin = 10;
    var diagram = d3.select('#'+id);
    /**
     * Draws an actor in the diagram with the attaced line
     * @param center - The center of the the actor
     * @param pos The position if the actor in the liost of actors
     * @param description The text in the box
     */
    var drawActor = function(elem, center, pos, description){
        var g = elem.append("g");
        g.append("line")
            .attr("x1", center)
            .attr("y1", yStartMargin)
            .attr("x2", center)
            .attr("y2", 2000)
            .attr("stroke-width", '0.5px')
            .attr("stroke", '#999');

        g.append("rect")
            .attr("x", startMargin  + pos*margin +i*150)
            .attr("y", yStartMargin)
            .attr("fill", '#eaeaea')
            .attr("stroke", '#666')
            .attr("width", width)
            .attr("height", height)
            .attr("rx", 3)
            .attr("ry", 3);
        g.append("text")      // text label for the x axis
            .attr("x", startMargin  + pos*margin +i*width + 75)
            .attr("y", yStartMargin+37.5)
            .style("text-anchor", "middle")
            .text(description)
        ;
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

    var drawMessage = function(elem, startx, stopx, verticalPos, txtCenter, msg){
        var g = elem.append("g");
        //Make an SVG Container
        //Draw the line
        if(msg.type===1){
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
        else{
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
            .attr("y", verticalPos-10)
            .style("text-anchor", "middle")
            .text(msg.message);
    };

    // Fetch data from the parsing
    var actors = sq.yy.getActors();
    var actorKeys = sq.yy.getActorKeys();
    var messages = sq.yy.getMessages();

    var i, maxX = 0;

    // Draw the actors
    for(i=0;i<actorKeys.length;i++){
        var key = actorKeys[i];

        // Add some rendering data to the object
        actors[key].x = startMargin  + i*margin +i*150;
        actors[key].y = yStartMargin;
        actors[key].width = yStartMargin;
        actors[key].height = yStartMargin;

        var center = actors[key].x + (width/2);

        // Keep track of width for with setting on the svg
        maxX = Math.max(maxX,actors[key].x);

        // Draw the box with the attached line
        drawActor(diagram, center,i, actors[key].description);
    }
    maxX = maxX + width;


    // The arrow head definition is attached to the svg once
    insertArrowHead(diagram);

    // Draw the messages/signals
    var verticalPos = startMargin + 30;
    messages.forEach(function(msg){

        verticalPos = verticalPos + 40;
        var startx = actors[msg.from].x + width/2;
        var stopx = actors[msg.to].x + width/2;
        var txtCenter = startx + (stopx-startx)/2;
        drawMessage(diagram, startx, stopx, verticalPos, txtCenter, msg);

    });

    diagram.attr("height", verticalPos + 40);
    diagram.attr("width", maxX );
};
