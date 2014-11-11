/**
 * Created by knut on 14-11-03.
 */
define('parser/graph',function() {
    var vertices = {};
    var edges = [];
    var graph = {
        addVertex: function (id, text, type, style) {
            console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
            if(typeof vertices[id] === 'undefined'){
                vertices[id]={id:id, styles:[]};
            }
            if(typeof text !== 'undefined'){
                vertices[id].text = text;
            }
            if(typeof type !== 'undefined'){
                vertices[id].type = type;
            }
            if(typeof style !== 'undefined'){
                if(style !== null){
                    console.log('Adding style: '+style);
                    style.forEach(function(s){
                        vertices[id].styles.push(s);
                    });
                }
            }
        },
        getVertices:function(){
            return vertices;
        },
        addLink: function (start, end, type, linktext) {
            var edge = {start:start, end:end, type:type.type, text:''};
            if(typeof linktext !== 'undefined'){
                edge.text = linktext;
            }
            edges.push(edge);
            //console.log('Got link from ' + start + ' to ' + end + ' type:' + type.type + ' linktext:' + linktext);
        },
        getEdges: function () {
            return edges;
        },
        clear:function(){
            vertices = {};
            edges = [];
        },
        defaultStyle:function(){
            return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
        }
    };

    return graph;
});
