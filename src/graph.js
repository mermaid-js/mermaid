/**
 * Created by knut on 14-11-03.
 */
var mermaid;
if(typeof mermaid === 'undefined') {
    mermaid = {}
}
mermaid.vertices = {};
mermaid.edges = [];

mermaid.graph = {
    /**
     * Function called by parser when a node definition has been found
     * @param id
     * @param text
     * @param type
     * @param style
     */
    addVertex: function (id, text, type, style) {
        console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
        if(typeof mermaid.vertices[id] === 'undefined'){
            mermaid.vertices[id]={id:id, styles:[]};
        }
        if(typeof text !== 'undefined'){
            mermaid.vertices[id].text = text;
        }
        if(typeof type !== 'undefined'){
            mermaid.vertices[id].type = type;
        }
        if(typeof style !== 'undefined'){
            if(style !== null){
                style.forEach(function(s){
                    mermaid.vertices[id].styles.push(s);
                });
            }
        }
    },
    /**
     * Function called by parser when a link/edge definition has been found
     * @param start
     * @param end
     * @param type
     * @param linktext
     */
    addLink: function (start, end, type, linktext) {
        var edge = {start:start, end:end, type:undefined, text:''};
        var linktext = type.text;
        if(typeof linktext !== 'undefined'){
            edge.text = linktext;
        }

        if(typeof type !== 'undefined'){
            edge.type = type.type;
        }
        mermaid.edges.push(edge);
    },
    /**
     * Updates a link with a style
     * @param pos
     * @param style
     */
    updateLink: function (pos, style) {
        var position = pos.substr(1);
        mermaid.edges[position].style = style;
    },
    /**
     * Called by parser when a graph definition is found, stores the direction of the chart.
     * @param dir
     */
    setDirection: function(dir){
        mermaid.direction = dir;
    },
    /**
     * Retrieval function for fetching the found nodes after parsing has completed.
     * @returns {{}|*|mermaid.vertices}
     */
    getVertices:function(){
        return mermaid.vertices;
    },
    /**
     * Retrieval function for fetching the found links after parsing has completed.
     * @returns {{}|*|mermaid.edges}
     */
    getEdges: function () {
        return mermaid.edges;
    },

    /**
     * Clears the internal graph db so that a new graph can be parsed.
     */
    clear:function(){
        mermaid.vertices = {};
        mermaid.edges = [];
    },
    /**
     *
     * @returns {string}
     */
    defaultStyle:function(){
        return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
    }
};

