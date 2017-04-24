var gulp = require('gulp')
var jasmine = require('gulp-jasmine')
var istanbul = require('gulp-istanbul')
var qunit = require('gulp-qunit')
var bower = require('gulp-bower')

gulp.task('test', ['coverage', 'jasmine', 'qunit'])

gulp.task('jasmine', ['jison', 'lint'], function () {
  return gulp.src(['src/**/*.spec.js'])
    .pipe(jasmine({ includeStackTrace: true }))
})

gulp.task('jas', function () {
  return gulp.src(['src/**/*.spec.js'])
    .pipe(jasmine({ includeStackTrace: true }))
})

gulp.task('coverage', function (cb) {
  gulp.src(['src/**/*.js', '!src/**/*.spec.js'])
    .pipe(istanbul()) // Covering files
    .on('finish', function () {
      gulp.src(['src/**/*.spec.js'])
        .pipe(jasmine())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb)
    })
})

gulp.task('qunit', ['usageTestsBower'], function () {
  return gulp.src('test/usageTests/requireTest.html')
    .pipe(qunit())
})

gulp.task('usageTestsBower', function () {
  return bower({ cwd: 'test/usageTests' })
    .pipe(gulp.dest('test/usageTests/bower_components'))
})

var jasmineBrowser = require('gulp-jasmine-browser')

gulp.task('jasmine2', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(jasmineBrowser.specRunner({ console: true }))
    .pipe(jasmineBrowser.headless())
})
