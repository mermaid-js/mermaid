var gulp = require('gulp')
var concat = require('gulp-concat')

// Build editor
gulp.task('editor', function () {
  return gulp.src(['node_modules/d3/d3.min.js', 'node_modules/dagre-d3/dist/dagre-d3.min.js', 'dist/mermaid.slim.js', 'src/editor.js'])
    .pipe(concat('build.js'))
    .pipe(gulp.dest('./editor/'))
})
