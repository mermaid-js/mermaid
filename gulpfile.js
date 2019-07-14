import gulp from 'gulp'
import jison from 'gulp-jison'
import print from 'gulp-print'
// const es = require('event-stream')

const logFile = function (es) {
  return es.map(function (file, cb) {
    log(file.path)
    return cb()
  })
}

gulp.task('jison', function () {
  return gulp.src('./src/**/*.jison')
    // .pipe(filelog('Jison file:'))
    // .pipe(logFile(es))
    .pipe(print())
    .pipe(jison({ 'token-stack': true }))
    .pipe(gulp.dest('./src/'))
})
