var db = require('./gitGraphAst');
var _ = require('lodash');
var gitGraphParser = require('./parser/gitGraph');
var d3 = require('../../d3');
var Logger = require('../../logger');

var log = new Logger.Log();
var allCommitsDict = {};
exports.setConf = function (config) {

}

function svgCreateDefs(svg) {
    svg.append("defs")
        .append("circle")
        .attr("id", "def-commit")
        .attr("r", 15)
        .attr("cx", 0)
        .attr("cy", 0);
    svg.select("defs")
        .append("line")
        .attr("id", "def-arrow-rl")
        .attr("x1", 25)
        .attr("y1", 0)
        .attr("x2", -25)
        .attr("y2", 0)
        .attr("marker-end", "url(#triangle)");
}
function svgAddArrowMarker(svg) {
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
}

function svgDrawLine(svg, points) {

    var lineGen = d3.svg.line()
    .x(function(d) { return d.x })
    .y(function(d) {return d.y})
    .interpolate("linear");

    svg
    .append("svg:path")
    .attr("d", lineGen(points))
    .style("stroke", "grey")
    .style("stroke-width", "2")
    .style("fill", "none");
}

function svgDrawLineForCommits(svg, fromId, toId) {
    log.debug("svgDrawLineForCommits: ", fromId, toId);
    var fromBbox = svg.select("#node-" + fromId).node().getBBox();
    var toBbox = svg.select("#node-" + toId).node().getBBox();
    log.debug("svgDrawLineForCommits: ", fromBbox, toBbox);
    svgDrawLine(svg, [
        {"x": fromBbox.x, "y": fromBbox.y + fromBbox.height/2 },
        {"x": toBbox.x + toBbox.width, "y": toBbox.y + toBbox.height/2 }
        ]);
}
function renderCommitHistory(svg, commitid, branches, direction, branchNum) {
    var commit;
    branchNum = branchNum || 1;
    if (_.isString(commitid)) {
        do {
            commit = allCommitsDict[commitid];
            log.debug("in renderCommitHistory", commit.id, commit.seq);
            if (svg.select("#node-" +  commitid).size() > 0) return;
            svg
                .append("g")
                .attr("class", "commit")
                .attr("id", function() { return "node-" + commit.id; })
                .append("use")
                .attr("transform", function() {
                    return "translate(" + (commit.seq * 100 + 50 )+ ", " + (branchNum * 50)+")";
                })
                .attr("xlink:href", "#def-commit")
                .attr("fill", "yellow")
                .attr("stroke", "grey")
                .attr("stroke-width", "2");

            if (commit.parent && commit.seq > 0) {
                log.debug("drawing line: ", commit.id, commit.seq);
                var parent = allCommitsDict[commit.parent] || allCommitsDict[commit.parent[0]];
                log.debug("parentid: ", parent.id);
                var parentNode = svg.select("#node-" + parent.id);
                log.debug("parent:", parentNode.size());
                //var parentNode = document.getElementById("node-"+parent.id);
                //if (parentNode) {
                    //log.debug("parent  ", parentNode);
                    //log.debug("parent BBox", parentNode.);
                //}
                var pathInfo = [
                    {x: commit.seq *100 + 35, y: branchNum* 50},
                    {x: parent.seq *100 + 65, y: branchNum* 50}
                ];
                if (parentNode.node()) {
                    //var rect = parentNode.node().getBoundingClientRect()
                    //log.debug("parent BCR", rect);
                    var rect = parentNode.node().getBBox();
                    log.debug("parent BBox", rect);
                    pathInfo[1].x = rect.x + rect.width;
                    pathInfo[1].y = rect.y + rect.height/2;
                }
                svgDrawLine(svg, pathInfo);
            }
            commitid = commit.parent
        } while (commitid && allCommitsDict[commitid]);
    }

    if (_.isArray(commitid)) {
        log.debug("found merge commmit", commitid);
        renderCommitHistory(svg, commitid[0], branches, direction, branchNum);
        renderCommitHistory(svg, commitid[1], branches, direction, ++branchNum);
        //confusing... commit should still refer to original commit.
        // commitid has been modified as commitid = commit.parent;
        svgDrawLineForCommits(svg, commit.id, commitid[1]);
    }
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
        allCommitsDict = db.getCommits();
        var branches = db.getBranchesAsObjArray();
        var commit = _.maxBy(commits, 'seq');
        var svg = d3.select('#' + id);
        svgAddArrowMarker(svg);
        svgCreateDefs(svg);
        var count = commits.length;

        renderCommitHistory(svg, commit.id, branches, direction);
        /*
         *var nodes = svg
         *    .selectAll("g.commit")
         *    .data(commits)
         *    .enter()
         *    .append("g")
         *    .attr("class", "commit")
         *    .attr("id", function (d) {
         *        return d.id;
         *    })
         *    .attr("transform", function (d, i) {
         *        if (direction == "TB" || direction == "BT")
         *            return "translate(50," + (50 + i * 100) + ")";
         *        if (direction == "LR")
         *            return "translate(" + (50 + (count -i) * 100) + ", 50)";
         *    });
         */

        /*
         *var lines = svg.selectAll("g.arrows")
         *    .data(commits)
         *    .enter()
         *    .append("g")
         *    .append("line")
         *    .attr("transform", function(d, i) {
         *        if (direction == "TB" || direction == "BT")
         *            return "translate(50," + (70 + (i * 100)) + ")";
         *        if (direction == "LR")
         *            return "translate(" + (70 + (i * 100)) + ", 50)";
         *    })
         *    .attr({
         *        "x1": direction == "LR" ? 60:0,
         *        "y1": direction == "LR" ? 0:0,
         *        "x2": direction == "LR" ? 0:0,
         *        "y2": direction == "LR" ? 0:60
         *    })
         *    .attr("marker-end", "url(#triangle)")
         *    .attr("stroke", "black")
         *    .attr("stroke-width", "3")
         */

        /*
         *var circles = svg.selectAll("g.commit")
         *    .append("circle")
         *    .attr("r", 15)
         *    .attr("fill", "yellow")
         *    .attr("stroke", "grey");
         *var textContainer = svg.selectAll("g.commit")
         *    .append("g")
         *    .attr("transform", function () {
         *        if (direction == "LR") return "translate(-30, 35)";
         *        if (direction == "BT" || direction == "TB") return "translate(200, 0)";
         *    })
         *    .attr("class", "commit-label");
         *textContainer
         *    .append("text")
         *    .text(function (c) {
         *        return c.id + "," + c.seq;
         *    });
         */

        svg.attr('height', 900);
        svg.attr('width', 1200);
    } catch (e) {
        log.error("Error while rendering gitgraph");
        log.error(e.message);
    }
};
