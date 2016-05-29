var gulp = require('gulp');
var shell = require('gulp-shell');
var jison = require('gulp-jison');
var filelog = require('gulp-filelog');

gulp.task('jison', function() {
    return gulp.src('./src/**/*.jison')
        .pipe(filelog('Jison file:'))
        .pipe(jison({ moduleType: 'commonjs' }))
        .pipe(gulp.dest('./src/'));
});

gulp.task('jison_legacy', function(){
    shell.task([
        'node node_modules/jison/lib/cli.js src/diagrams/classDiagram/parser/classDiagram.jison       -o src/diagrams/classDiagram/parser/classDiagram.js',
        'node node_modules/jison/lib/cli.js src/diagrams/sequenceDiagram/parser/sequenceDiagram.jison -o src/diagrams/sequenceDiagram/parser/sequenceDiagram.js',
        'node node_modules/jison/lib/cli.js src/diagrams/example/parser/example.jison                 -o src/diagrams/example/parser/example.js',
        'node node_modules/jison/lib/cli.js src/diagrams/flowchart/parser/flow.jison                  -o src/diagrams/flowchart/parser/flow.js',
        'node node_modules/jison/lib/cli.js src/diagrams/flowchart/parser/dot.jison                  -o src/diagrams/flowchart/parser/dot.js',
        'node node_modules/jison/lib/cli.js src/diagrams/gitGraph/parser/gitGraph.jison               -o src/diagrams/gitGraph/parser/gitGraph.js',
        'node node_modules/jison/lib/cli.js src/diagrams/gantt/parser/gantt.jison                     -o src/diagrams/gantt/parser/gantt.js'
    ]);
});

