var gulp = require('gulp');
var jison = require('gulp-jison');
var shell = require('gulp-shell')

gulp.task('jison2', function() {
    return gulp.src('./src/*.jison')
        .pipe(jison({ moduleType: 'amd' }))
        .pipe(gulp.dest('./src/'));
});

gulp.task('jison', shell.task([
  'jison src/parser/mermaid.jison -o src/parser/mermaid.js',
  'source scripts/compileJison.sh'
]))

gulp.task('jison2', shell.task([
    'jison src/parser/flow.jison -o src/parser/flow.js',
    'source scripts/compileFlow.sh'
]))