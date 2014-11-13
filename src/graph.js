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
                console.log('Adding style: '+style);
                style.forEach(function(s){
                    mermaid.vertices[id].styles.push(s);
                });
            }
        }
    },
    getVertices:function(){
        return mermaid.vertices;
    },
    addLink: function (start, end, type, linktext) {
        var edge = {start:start, end:end, type:undefined, text:''};
        if(typeof linktext !== 'undefined'){
            edge.text = linktext;
        }

        if(typeof type !== 'undefined'){
            edge.type = type.type;
        }
        mermaid.edges.push(edge);
        //console.log('Got link from ' + start + ' to ' + end + ' type:' + type.type + ' linktext:' + linktext);
    },
    updateLink: function (pos, style) {
        //mermaid.edges.push(edge);
        var position = pos.substr(1);
        console.log('Got link style for ' + position + ' style ' + style);
        mermaid.edges[position].style = style;
    },
    getEdges: function () {
        return mermaid.edges;
    },
    clear:function(){
        mermaid.vertices = {};
        mermaid.edges = [];
    },
    defaultStyle:function(){
        return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
    }
};

