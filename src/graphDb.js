/**
 * Created by knut on 14-11-03.
 */

var vertices = {};
var edges = [];
var direction;
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 */
exports.addVertex = function (id, text, type, style) {
    console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
    if (typeof vertices[id] === 'undefined') {
        vertices[id] = {id: id, styles: []};
    }
    if (typeof text !== 'undefined') {
        vertices[id].text = text;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof style !== 'undefined') {
        if (style !== null) {
            style.forEach(function (s) {
                vertices[id].styles.push(s);
            });
        }
    }
};
/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
exports.addLink = function (start, end, type, linktext) {
    var edge = {start: start, end: end, type: undefined, text: ''};
    var linktext = type.text;
    if (typeof linktext !== 'undefined') {
        edge.text = linktext;
    }

    if (typeof type !== 'undefined') {
        edge.type = type.type;
    }
    edges.push(edge);
};
/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
exports.updateLink = function (pos, style) {
    var position = pos.substr(1);
    edges[position].style = style;
};
/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setDirection = function (dir) {
    direction = dir;
};
exports.getDirection = function () {
    return direction;
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
exports.getVertices = function () {
    return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
exports.getEdges = function () {
    return edges;
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.clear = function () {
    vertices = {};
    edges = [];
};
/**
 *
 * @returns {string}
 */
exports.defaultStyle = function () {
    return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
};

