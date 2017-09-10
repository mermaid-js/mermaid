import gulp from 'gulp'
import jison from 'gulp-jison'
import filelog from 'gulp-filelog'

gulp.task('jison', function () {
  return gulp.src('./src/**/*.jison')
    .pipe(filelog('Jison file:'))
    .pipe(jison({ 'token-stack': true }))
    .pipe(gulp.dest('./src/'))
})
