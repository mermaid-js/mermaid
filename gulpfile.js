import gulp from 'gulp'
import jison from 'gulp-jison'
import print from 'gulp-print'

gulp.task('jison', function () {
  return gulp.src('./src/**/*.jison')
    .pipe(print())
    .pipe(jison({ 'token-stack': true }))
    .pipe(gulp.dest('./src/'))
})
