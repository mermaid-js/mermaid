/**
 * Created by knut on 14-11-03.
 */
define('parser/mermaid.spec',['parser/scope','parser/mermaid.js'],function(scope, p){
    console.log('here:'+p);

    describe('when parsing ',function(){
        beforeEach(function(){
            console.log('here');
            p.yy = scope;
        });
        it('should',function(){
            var res = p.parse('A-->B;');

            expect(p.yy.getLinks()).toBe('apa');
        })
    });


    describe('just checking', function() {

        it('works for app', function () {
            expect(2).toBe(2);
        });
    });

});

