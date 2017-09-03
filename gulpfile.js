const gulp = require('gulp')
const jison = require('gulp-jison')
const filelog = require('gulp-filelog')

gulp.task('jison', function () {
  return gulp.src('./src/**/*.jison')
    .pipe(filelog('Jison file:'))
    .pipe(jison({ 'token-stack': true }))
    .pipe(gulp.dest('./src/'))
})
