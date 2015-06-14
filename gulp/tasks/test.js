var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var shell = require('gulp-shell');
var jison = require('gulp-jison');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');
var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var insert = require('gulp-insert');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

// Using gulp-jshint and jshint-stylish
gulp.task('lint', function() {
    return gulp.src(['./src/**/*.js', '!**/parser/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('test',['coverage','tape','jasmine']);

gulp.task('jasmine',['jison','lint'], function () {
    return gulp.src(['src/**/*.spec.js'])
        .pipe(jasmine({includeStackTrace:true}));
});

gulp.task('jas', function () {
    return gulp.src(['src/**/*.spec.js'])
        .pipe(jasmine({includeStackTrace:true}));
});

gulp.task('tape', shell.task(['./node_modules/.bin/tape ./test/cli_test-*.js']));

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