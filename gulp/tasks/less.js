var gulp = require('gulp');
var path = require('path');
var less = require('gulp-less');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

gulp.task('editor-less', function () {
    gulp.src(['./editor/css/editor.less'])
        .pipe(less({
            generateSourceMap: false, // default true
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(concat('editor.css'))
        .pipe(gulp.dest('./editor/css/'));
});

gulp.task('mermaid-less', function () {
    gulp.src(['./src/less/*/mermaid.less'])
        .pipe(less({
            generateSourceMap: false, // default true
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(rename(function (path) {
            if(path.dirname === 'default'){
                path.basename = 'mermaid';
            }else{
                path.basename = 'mermaid.' + path.dirname;
            }
            path.dirname = '';
        }))
        .pipe(gulp.dest('./dist/'));
});


gulp.task('less',['mermaid-less', 'editor-less']);