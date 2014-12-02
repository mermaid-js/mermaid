var gulp = require('gulp');
var path = require('path');
var jison = require('gulp-jison');
var less = require('gulp-less');
var shell = require('gulp-shell');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');
var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');


gulp.task('jison2', function() {
    return gulp.src('./src/*.jison')
        .pipe(jison({ moduleType: 'amd' }))
        .pipe(gulp.dest('./src/'));
});

gulp.task('jison', shell.task([
  'jison src/parser/flow.jison -o src/parser/flow.js'
  //'source scripts/compileJison.sh'
  //  'jison src/parser/flow.jison -o src/parser/flow.js',
]))

gulp.task('jisonSd', shell.task([
    //'jison src/parser/flow.jison -o src/parser/flow.js',
    'jison src/parser/sequence.jison -o src/parser/sequence.js'
    //'source scripts/compileFlow.sh'
]));

gulp.task('dist', ['slimDist', 'fullDist']);

var jasmine = require('gulp-jasmine');

gulp.task('jasmine',['jison'], function () {
    return gulp.src(['src/**/*.spec.js'])
        .pipe(jasmine());
});

gulp.task('coverage', function (cb) {
    gulp.src(['src/**/*.js', '!src/**/*.spec.js'])
        .pipe(istanbul()) // Covering files
        .on('finish', function () {
            gulp.src(['src/**/*.spec.js'])
                .pipe(jasmine())
                .pipe(istanbul.writeReports()) // Creating the reports after tests runned
                .on('end', cb);
        });
});

gulp.task('less', function () {
    gulp.src(['./editor/css/editor.less'])
        .pipe(less({
            generateSourceMap: false, // default true
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(concat('editor.css'))
        .pipe(gulp.dest('./editor/css/'));
});

var browserify = require('gulp-browserify');

// Basic usage
gulp.task('slimDist', function() {
    // Single entry point to browserify
    return gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(rename('mermaid.slim.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});


// Build editor
gulp.task('editor', function() {
    /*gulp.src(['src/editor.js'])
        .pipe(browserify())
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./editor/'));*/
    return gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.js','src/editor.js'])
        .pipe(concat('build.js'))
        .pipe(gulp.dest('./editor/'));
});


// Basic usage
gulp.task('fullDist', ['slimDist'], function() {
    // Single entry point to browserify
    gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.js'])
        .pipe(concat('mermaid.full.js'))
        .pipe(gulp.dest('./dist/'));
    return gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.min.js'])
        .pipe(concat('mermaid.full.min.js'))
        .pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('npmDist', ['slimDist'], function() {
    // Single entry point to browserify
    return gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(gulp.dest('./dist/'));
});