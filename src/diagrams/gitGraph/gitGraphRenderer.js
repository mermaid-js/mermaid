var db = require('./gitGraphAst');
var _ = require('lodash');
var gitGraphParser = require('./parser/gitGraph');
var d3 = require('../../d3');
var Logger = require('../../logger');

var log = new Logger.Log();
var allCommitsDict = {};
var branchNum;
var config = {
    nodeWidth: 75,
    lineStrokeWidth: 4,
    branchLineHeight: 50,
    lineColor: "grey",
    leftMargin: 50
}
var apiConfig = {};
exports.setConf = function(c) {
    apiConfig = c;
}


function svgCreateDefs(svg) {
    svg.append("defs")
        .append("g")
        .attr("id", "def-commit")
        .append("circle")
        .attr("r", 15)
        .attr("cx", 0)
        .attr("cy", 0);
    svg.select("#def-commit")
        .append('foreignObject')
        .attr('width', 100)
        .attr('height', 100)
        .attr('x', 50)
        .attr('y', 50)
        .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
        .append('xhtml:p')
        .text("a big chunk of text that should wrap");
    //.attr("requiredExtensions", "http://www.w3.org/1999/xhtml")
    //.attr("width", 50)
    //.attr("height", 30)
    //.attr("x", 30)
    //.attr("y", 30)
    //.append("xhtml:body")
    //.append("xhtml:p")
    //.text("something")
}


function svgDrawLine(svg, points, interpolate) {
    interpolate = interpolate || "basis";
    var lineGen = d3.svg.line()
        .x(function(d) {
            return Math.round(d.x)
        })
        .y(function(d) {
            return Math.round(d.y)
        })
        .interpolate(interpolate);

    svg
        .append("svg:path")
        .attr("d", lineGen(points))
        .style("stroke", config.lineColor)
        .style("stroke-width", config.lineStrokeWidth)
        .style("fill", "none");
}
// Pass in the element and its pre-transform coords
function getElementCoords(element, coords) {
    coords = coords || element.node().getBBox();
    var ctm = element.node().getCTM(),
        xn = ctm.e + coords.x * ctm.a,
        yn = ctm.f + coords.y * ctm.d;
    //log.debug(ctm, coords);
    return {
        left: xn,
        top: yn,
        width: coords.width,
        height: coords.height
    };
};

function svgDrawLineForCommits(svg, fromId, toId) {
    log.debug("svgDrawLineForCommits: ", fromId, toId);
    var fromBbox = getElementCoords(svg.select("#node-" + fromId + " circle"));
    var toBbox = getElementCoords(svg.select("#node-" + toId + " circle"));
    //log.debug("svgDrawLineForCommits: ", fromBbox, toBbox);
    if (fromBbox.left - toBbox.left > config.nodeWidth) {
        var lineStart = { x: fromBbox.left - config.nodeWidth, y: toBbox.top  + toBbox.height/2};
        var lineEnd ={ x: toBbox.left + toBbox.width, y: toBbox.top + toBbox.height/2 };
        svgDrawLine(svg, [lineStart , lineEnd], "linear")
        svgDrawLine(svg, [
        {x: fromBbox.left, y: fromBbox.top + fromBbox.height/2},
        {x: fromBbox.left - config.nodeWidth/2, y: fromBbox.top + fromBbox.height/2},
        {x: fromBbox.left - config.nodeWidth/2, y: lineStart.y},
        lineStart]);
    } else {
        svgDrawLine(svg, [{
            "x": fromBbox.left,
            "y": fromBbox.top + fromBbox.height / 2
        }, {
            "x": fromBbox.left - config.nodeWidth/2,
            "y": fromBbox.top + fromBbox.height / 2
        }, {
            "x": fromBbox.left - config.nodeWidth/2,
            "y": toBbox.top + toBbox.height / 2
        }, {
            "x": toBbox.left + toBbox.width,
            "y": toBbox.top + toBbox.height / 2
        }]);
    }
}

function cloneNode(svg, selector) {
    return svg.select(selector).node().cloneNode(true);
}

function renderCommitHistory(svg, commitid, branches, direction) {
    var commit;
    if (_.isString(commitid)) {
        do {
            commit = allCommitsDict[commitid];
            log.debug("in renderCommitHistory", commit.id, commit.seq);
            if (svg.select("#node-" + commitid).size() > 0)  {
            return;
            }
            svg
                .append(function() {
                    return cloneNode(svg, "#def-commit");
                })
                .attr("class", "commit")
                .attr("id", function() {
                    return "node-" + commit.id;
                })
                .attr("transform", function() {
                    return "translate(" + (commit.seq * config.nodeWidth + config.leftMargin) + ", "
                                + (branchNum * config.branchLineHeight) + ")";
                })
                .attr("fill", "yellow")
                .attr("stroke", "grey")
                .attr("stroke-width", "2");

            commitid = commit.parent
        } while (commitid && allCommitsDict[commitid]);
    }

    if (_.isArray(commitid)) {
        log.debug("found merge commmit", commitid);
        renderCommitHistory(svg, commitid[0], branches, direction);
        branchNum++;
        renderCommitHistory(svg, commitid[1], branches, direction);
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

exports.draw = function(txt, id, ver) {
    try {
        var parser;
        parser = gitGraphParser.parser;
        parser.yy = db;

        log.debug('in gitgraph renderer', txt, id, ver);
        // Parse the graph definition
        parser.parse(txt + "\n");

        config = _.extend(config, apiConfig, db.getOptions());
        log.debug("effective options", config);
        var direction = db.getDirection();
        allCommitsDict = db.getCommits();
        var branches = db.getBranchesAsObjArray();
        var svg = d3.select('#' + id);
        svgCreateDefs(svg);
        branchNum = 1;
        _.each(branches, function(v, k) {
            renderCommitHistory(svg, v.commit.id, branches, direction);
            renderLines(svg, v.commit);
            branchNum++;
        })

        svg.attr('height', 900);
        svg.attr('width', 2500);
    } catch (e) {
        log.error("Error while rendering gitgraph");
        log.error(e.message);
    }
};
