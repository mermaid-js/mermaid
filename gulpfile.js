var requireDir = require('require-dir')
var gulp = require('gulp')
var jison = require('gulp-jison')
var filelog = require('gulp-filelog')

gulp.task('jison', function () {
  return gulp.src('./src/**/*.jison')
    .pipe(filelog('Jison file:'))
    .pipe(jison({ 'token-stack': true }))
    .pipe(gulp.dest('./src/'))
})

requireDir('./gulp/tasks')
