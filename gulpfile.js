require('gulp')
require('gulp-shell')
require('gulp-concat')
require('gulp-uglify')
require('gulp-ext-replace')
require('gulp-rename')
require('gulp-istanbul')
require('gulp-bump')
require('gulp-tag-version')
require('gulp-insert')
var requireDir = require('require-dir')

requireDir('./gulp/tasks')

// var paths = {
//   scripts: ['./src/**/*.js', '!**/parser/*.js']
// }
