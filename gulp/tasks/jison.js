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

gulp.task('jison_legacy', shell.task([
    'jison src/diagrams/flowchart/parser/flow.jison -o src/diagrams/flowchart/parser/flow.js',
    'jison src/diagrams/flowchart/parser/dot.jison -o src/diagrams/flowchart/parser/dot.js',
    'jison src/diagrams/sequenceDiagram/parser/sequenceDiagram.jison -o src/diagrams/sequenceDiagram/parser/sequenceDiagram.js',
    'jison src/diagrams/example/parser/example.jison -o src/diagrams/example/parser/example.js',
    'jison src/diagrams/gantt/parser/gantt.jison -o src/diagrams/gantt/parser/gantt.js',
    //'jison src/diagrams/sequenceDiagram/parser/sequenceDiagram.jison -o src/diagrams/sequenceDiagram/parser/sequenceDiagram.js'
]));

