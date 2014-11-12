/**
 * Created by knut on 14-11-03.
 */
define('parser/flow.spec',['parser/graph','parser/flow'],function(graph, p){

    describe('when parsing ',function(){
        beforeEach(function(){
            graph.clear();
            p.yy = graph;
            /*p.parse.parseError= function parseError(str, hash) {
                console.log(str);
            }*/
        });

        it('should handle a nodes and edges',function(){
            var res = p.parse('apa-apa-åäö');
            console.log('Done parsing:' + res);
        });
    });

});

