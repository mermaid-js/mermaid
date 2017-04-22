var gulp = require('gulp')
var path = require('path')
var less = require('gulp-less')
var concat = require('gulp-concat')

gulp.task('editor-less', function () {
  gulp.src(['./editor/css/editor.less'])
    .pipe(less({
      generateSourceMap: false, // default true
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(concat('editor.css'))
    .pipe(gulp.dest('./editor/css/'))
})

gulp.task('less', ['editor-less'])
