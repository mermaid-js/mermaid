
var db = require('./gitGraphAst');
var gitGraphParser = require('./parser/gitGraph');
var d3 = require('../../d3');
var Logger = require('../../logger');

var log = new Logger.Log();
exports.setConf = function(config) {

}

exports.draw = function (txt, id, ver) {
    try{
        var parser;
        parser = gitGraphParser.parser;
        parser.yy = db;

        log.debug('in gitgraph renderer', txt, id, ver);
        // Parse the graph definition
        parser.parse(txt + "\n");
        var commits = db.getCommitsArray();
        log.debug(commits);
        log.debug("id: " + commits[0].id);
        log.debug(db.getCommits());
        log.debug("length:", commits.length);
        log.debug("length:", Object.keys(db.getCommits()).length);
        // Fetch the default direction, use TD if none was found
        var svg = d3.select('#'+id);

        var g = svg.append('g');

        //g.append('text')      // text label for the x axis
        //.attr('x', 100)
        //.attr('y', 40)
        //.attr('class','version')
        //.attr('font-size','32px')
        //.style('text-anchor', 'middle')
        //.text('mermaid raghu'+ ver);

        var circles = svg.selectAll("circle")
            .data(commits)
            .enter()
            .append("circle")
            .attr("cx", function(d, i){
                return (i*50) + 25;
            })
            .attr("cy", 50)
            .attr("r", 15)
            .attr("fill", "yellow")
            .attr("stroke", "grey");
        /*
        var box = exports.bounds.getBounds();

        var height = box.stopy-box.starty+2*conf.diagramMarginY;
        var width  = box.stopx-box.startx+2*conf.diagramMarginX;*/

        svg.attr('height',100);
        svg.attr('width', 400);
        //svg.attr('viewBox', '0 0 300 150');
    }catch(e) {
        log.error("Error while rendering gitgraph");
        log.error(e.message);
    }
};
