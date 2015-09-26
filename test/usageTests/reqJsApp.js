require.config({
    paths: {
        mermaid: '../../dist/mermaid'
    },
    shim: {
        mermaid: {
            exports: 'mermaid'
        }
    }
});

require([], function (){
    QUnit.module('requireTest.html');

    QUnit.test('using mermaid in requirejs', function (assert){
        var done = assert.async();
        require(['mermaid'], function (mermaid) {
            assert.ok(mermaid, 'mermaid is not null');
            console.log(mermaid);
            mermaid.init();
            assert.equal(window.d3.selectAll('path')[0].length, 8,
                'drew 8 paths');
            done();
        });
    });

    QUnit.load();
    QUnit.start();
});
