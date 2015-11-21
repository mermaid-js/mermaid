//var proxyquire = require('proxyquire');
//var newD3;
///**
// * Created by knut on 14-11-18.
// */
//
//var d3 = {
//    select:function(){
//        return new newD3();
//    },
//    selectAll:function(){
//        return new newD3();
//    }
//};

//var classRenderer = proxyquire('./classRenderer', { '../../d3': d3 });
//var testDom = require('testdom')('<html><body><div id="tst"></div></body></html>');

var classRenderer = require('./classRenderer');
var parser = require('./parser/classDiagram').parser;


describe('class diagram, ', function () {
    describe('when rendering a classDiagram',function() {
        var conf;
        beforeEach(function () {
            ////parser.yy = require('./classDb');
            ////parser.yy.clear();
            ////parseError = function(err, hash) {
            ////    log.debug('Syntax error:' + err);
            ////    log.debug(hash);
            ////};
            ////sq.yy.parseError = parseError;
            //
            //newD3 = function() {
            //    var o = {
            //        append: function () {
            //            return newD3();
            //        },
            //        attr: function () {
            //            return this;
            //        },
            //        style: function () {
            //            return this;
            //        },
            //        text: function () {
            //            return this;
            //        },
            //        0:{
            //            0: {
            //                getBBox: function () {
            //                    return {
            //                        height: 10,
            //                        width: 20
            //                    };
            //                }
            //            }
            //
            //        }
            //    };
            //
            //    return o;
            //};
            //
            //conf = {
            //    diagramMarginX:50,
            //    diagramMarginY:10,
            //    actorMargin:50,
            //    width:150,
            //    // Height of actor boxes
            //    height:65,
            //    boxMargin:10,
            //    messageMargin:40,
            //    boxTextMargin:15,
            //    noteMargin:25,
            //    mirrorActors:true,
            //    // Depending on css styling this might need adjustment
            //    // Prolongs the edge of the diagram downwards
            //    bottomMarginAdj:1
            //};
            //classRenderer.setConf(conf);

                // ... add whatever browser globals your tests might need ...
            //}
            Object.defineProperties(window.HTMLElement.prototype, {
                getBBox :{
                    get : function() {return {x:10,y:10,width:100,height:100}; }
                },
                offsetLeft: {
                    get: function() { return parseFloat(window.getComputedStyle(this).marginLeft) || 0; }
                },
                offsetTop: {
                    get: function() { return parseFloat(window.getComputedStyle(this).marginTop) || 0; }
                },
                offsetHeight: {
                    get: function() { return parseFloat(window.getComputedStyle(this).height) || 0; }
                },
                offsetWidth: {
                    get: function() { return parseFloat(window.getComputedStyle(this).width) || 0; }
                }
            });
        });
        it('it should handle one actor', function () {
            var str = 'classDiagram\n'+
            'Class01 --|> Class02';

            //classRenderer.draw(str,'tst');

            //console.log(document.body.innerHTML);

        });
    });
});
