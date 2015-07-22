var gulp = require('gulp');
var browserify = require('gulp-browserify');
var shell = require('gulp-shell');


var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');
var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var insert = require('gulp-insert');

/**
 * dist targets
 * * dist - creates everything
 * * mermaidAPI
 * * mermaidAPI.slim
 * * legacy - uses old build creates mermaid.full and mermaid.slim
 * * mermaid - new build creates mermaid.js and mermaid.min.js, mermaid.no-d3.js mermaid.no-d3.min.js
 */

// Basic usage
gulp.task('slimDist', function() {
    // Single entry point to browserify
    return gulp.src('src/main.js')
        .pipe(browserify())
        /*.pipe(browserify({standalone: 'mermaid'}))
         .on('prebundle', function(bundle) {
         // Keep these external for the slim version.
         slim_ext_libs.forEach(function(lib) {
         bundle.external(lib);
         });
         })*/
        .pipe(rename('mermaid-legacy.slim.js'))
        .pipe(insert.prepend('(function () { var define = undefined; '))
        .pipe(insert.append(' })();'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('fullDist', ['slimDist'], function() {
    // Single entry point to browserify
    gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.js'])
        .pipe(concat('mermaid-legacy.full.js'))
        .pipe(gulp.dest('./dist/'));
    return gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.min.js'])
        .pipe(concat('mermaid.full.min.js'))
        .pipe(gulp.dest('./dist/'));
});


// Basic usage
//gulp.task('api', shell.task([
//    'browserify src/mermaid.js | uglify > dist/mermaid.min.js',
//    'browserify src/mermaid.js | uglify > dist/mermaid.min.js',
//    'browserify src/mermaidAPI.js -o dist/mermaidAPI.js'
//    //'jison src/diagrams/sequenceDiagram/parser/sequenceDiagram.jison -o src/diagrams/sequenceDiagram/parser/sequenceDiagram.js'
//]));

// Basic usage
gulp.task('mermaid.slim',function() {
    // Single entry point to browserify
    var EXTERNALS = ['d3'];

    return gulp.src('src/mermaid.js')
        .pipe(browserify({
            external: ['d3'],
            entry:'src/mermaid.js',
            standalone: 'mermaid'
        }))
        .pipe(rename('mermaid.slim.js'))
        // .on('prebundle', function(bundle){
        //     EXTERNALS.forEach(function(external){
        //       if(external.expose){
        //         bundle.require(external.require, {expose: external.expose} )
        //       }
        //       else{
        //         bundle.require(external.require)
        //       }
        //   })
        // })
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('mermaid',function() {

    return gulp.src('src/mermaid.js')
        .pipe(browserify({
            entry:'src/mermaid.js',
            standalone: 'mermaid'
        }))
        .pipe(rename('mermaid.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('mermaidAPI',function() {
    return gulp.src('src/mermaidAPI.js')
        .pipe(browserify({
        }))
        .pipe(gulp.dest('./dist/'));
        //.pipe(uglify())
        //.pipe(extReplace('.min.js'))
        //.pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('mermaidAPI.slim',function() {
    return gulp.src('src/mermaidAPI.js')
        .pipe(browserify({
            debug:true,
            external: ['d3']
        }))
        .pipe(rename('mermaidAPI.slim.js'))
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

//gulp.task('dist', ['slimDist', 'fullDist','jasmine']);
gulp.task('legacy', ['slimDist', 'fullDist']);

gulp.task('dist', ['mermaidAPI', 'mermaidAPI.slim','mermaid.slim','mermaid']);
