var db = require('./gitGraphAst');
var gitGraphParser = require('./parser/gitGraph');
var d3 = require('../../d3');
var Logger = require('../../logger');

var log = new Logger.Log();
exports.setConf = function (config) {

}

exports.draw = function (txt, id, ver) {
    try {
        var parser;
        parser = gitGraphParser.parser;
        parser.yy = db;

        log.debug('in gitgraph renderer', txt, id, ver);
        // Parse the graph definition
        parser.parse(txt + "\n");
        var direction = db.getDirection();
        var commits = db.getCommitsArray();
        log.debug("# of commits: " + commits.length);
        //log.debug("id: " + commits[0].id);
        //log.debug(db.getCommits());
        //log.debug("length:", commits.length);
        //log.debug("length:", Object.keys(db.getCommits()).length);
        // Fetch the default direction, use TD if none was found
        var svg = d3.select('#' + id);
        //<marker id="triangle" refX="5" refY="5" markerUnits="strokeWidth" fill="#666" markerWidth="4" markerHeight="3" orient="auto" viewBox="0 0 10 10">
        //<path d="M 0 0 L 10 5 L 0 10 z"></path>
        //</marker>
        svg.append("marker")
            .attr({
                "id": "triangle",
                "refX": "5",
                "refY": "5",
                "markerUnits": "strokeWidth",
                "fill": "#666",
                "markerWidth": "4",
                "markerHeight": "3",
                "orient": "auto",
                "viewBox": "0,0,10,10"
            })
            .append("svg:path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z");
        var count = commits.length;
        var nodes = svg
            .selectAll("g.commit")
            .data(commits)
            .enter()
            .append("g")
            .attr("class", "commit")
            .attr("id", function (d) {
                return d.id;
            })
            .attr("transform", function (d, i) {
                if (direction == "TB" || direction == "BT")
                    return "translate(50," + (50 + i * 100) + ")";
                if (direction == "LR")
                    return "translate(" + (50 + (count -i) * 100) + ", 50)";
            });

        var lines = svg.selectAll("g.arrows")
            .data(commits)
            .enter()
            .append("g")
            .append("line")
            .attr("transform", function(d, i) {
                if (direction == "TB" || direction == "BT")
                    return "translate(50," + (70 + (i * 100)) + ")";
                if (direction == "LR")
                    return "translate(" + (70 + (i * 100)) + ", 50)";
            })
            .attr({
                "x1": direction == "LR" ? 60:0,
                "y1": direction == "LR" ? 0:0,
                "x2": direction == "LR" ? 0:0,
                "y2": direction == "LR" ? 0:60
            })
            .attr("marker-end", "url(#triangle)")
            .attr("stroke", "black")
            .attr("stroke-width", "3")
        //g.append('text')      // text label for the x axis
        //.attr('x', 100)
        //.attr('y', 40)
        //.attr('class','version')
        //.attr('font-size','32px')
        //.style('text-anchor', 'middle')
        //.text('mermaid raghu'+ ver);

        var circles = svg.selectAll("g.commit")
            .append("circle")
            .attr("r", 15)
            .attr("fill", "yellow")
            .attr("stroke", "grey");
        var textContainer = svg.selectAll("g.commit")
            .append("g")
            .attr("transform", function () {
                if (direction == "LR") return "translate(-30, 35)";
                if (direction == "BT" || direction == "TB") return "translate(200, 0)";
            })
            .attr("class", "commit-label");
        textContainer
            .append("text")
            .text(function (c) {
                return c.id + "," + c.seq;
            });

        /*
        var box = exports.bounds.getBounds();

        var height = box.stopy-box.starty+2*conf.diagramMarginY;
        var width  = box.stopx-box.startx+2*conf.diagramMarginX;*/

        svg.attr('height', 900);
        svg.attr('width', 1200);
        //svg.attr('viewBox', '0 0 300 150');
    } catch (e) {
        log.error("Error while rendering gitgraph");
        log.error(e.message);
    }
};
