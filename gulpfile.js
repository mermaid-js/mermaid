var gulp = require('gulp');
var jison = require('gulp-jison');
var shell = require('gulp-shell')

gulp.task('jison', function() {
    return gulp.src('./src/*.jison')
        .pipe(jison({ moduleType: 'amd' }))
        .pipe(gulp.dest('./src/'));
});

gulp.task('shorthand', shell.task([
  'echo hello',
  'echo world',
  'jison src/mermaid.jison -o src/mermaid.js'
]))