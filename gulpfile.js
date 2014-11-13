var gulp = require('gulp');
var jison = require('gulp-jison');
var shell = require('gulp-shell');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');

gulp.task('jison2', function() {
    return gulp.src('./src/*.jison')
        .pipe(jison({ moduleType: 'amd' }))
        .pipe(gulp.dest('./src/'));
});

gulp.task('jison', shell.task([
  'jison src/parser/flow.jison -o src/parser/flow.js',
  'source scripts/compileJison.sh'
]))

gulp.task('jison2', shell.task([
    'jison src/parser/flow.jison -o src/parser/flow.js',
    'source scripts/compileFlow.sh'
]))

gulp.task('distSlim', function() {
    gulp.src(['./src/parser/flow.js','./src/graph.js','./src/main.js'])
        .pipe(concat('mermaid.slim.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));

});

gulp.task('distFull', function() {
    gulp.src(['./lib/d3.v3.min.js', './lib/dagre-d3.min.js', './src/parser/flow.js','./src/graph.js','./src/main.js'])
        .pipe(concat('mermaid.full.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('dist', ['distSlim', 'distFull'], function() {
    gulp.src(['./lib/d3.v3.min.js', './lib/dagre-d3.min.js', './dist/mermaid.slim.min.js'])
        .pipe(concat('mermaid.full.min.js'))
        .pipe(gulp.dest('./dist/'))
});