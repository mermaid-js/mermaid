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
    .interpolate("basis");

    svg
    .append("svg:path")
    .attr("d", lineGen(points))
    .style("stroke", "grey")
    .style("stroke-width", "4")
    .style("fill", "none");
}

function svgDrawLineForCommits(svg, fromId, toId) {
    log.debug("svgDrawLineForCommits: ", fromId, toId);
    var fromBbox = svg.select("#node-" + fromId).node().getBBox();
    var toBbox = svg.select("#node-" + toId).node().getBBox();
    //log.debug("svgDrawLineForCommits: ", fromBbox, toBbox);
    svgDrawLine(svg, [
        {"x": fromBbox.x, "y": fromBbox.y + fromBbox.height/2 },
        {"x": toBbox.x + (fromBbox.x - toBbox.x)/2, "y": fromBbox.y + fromBbox.height/2 },
        {"x": toBbox.x + (fromBbox.x - toBbox.x)/2, "y": toBbox.y + toBbox.height/2 },
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

            commitid = commit.parent
        } while (commitid && allCommitsDict[commitid]);
    }

    if (_.isArray(commitid)) {
        log.debug("found merge commmit", commitid);
        renderCommitHistory(svg, commitid[0], branches, direction, branchNum);
        renderCommitHistory(svg, commitid[1], branches, direction, ++branchNum);
    }
}

function renderLines(svg, commit) {
    while (commit.seq > 0) {
        if (_.isString(commit.parent)) {
            svgDrawLineForCommits(svg, commit.id, commit.parent);
            commit = allCommitsDict[commit.parent];
        } else if (_.isArray(commit.parent)) {
            svgDrawLineForCommits(svg, commit.id, commit.parent[0])
            svgDrawLineForCommits(svg, commit.id, commit.parent[1])
            renderLines(svg, allCommitsDict[commit.parent[1]]);
            commit = allCommitsDict[commit.parent[0]];
        }
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
        allCommitsDict = db.getCommits();
        var branches = db.getBranchesAsObjArray();
        var svg = d3.select('#' + id);
        svgAddArrowMarker(svg);
        svgCreateDefs(svg);
        var branchNum = 0;
        _.each(branches, function(v, k) {
            renderCommitHistory(svg, v.commit.id, branches, direction, branchNum);
            renderLines(svg, v.commit);
            branchNum++;
        })

        svg.attr('height', 900);
        svg.attr('width', 1200);
    } catch (e) {
        log.error("Error while rendering gitgraph");
        log.error(e.message);
    }
};
