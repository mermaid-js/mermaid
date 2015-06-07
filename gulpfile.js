var gulp = require('gulp');


var shell = require('gulp-shell');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');
var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var bump = require('gulp-bump');
var tag_version = require('gulp-tag-version');

var insert = require('gulp-insert');

var requireDir = require('require-dir');
var tasks = requireDir('./gulp/tasks');


var paths = {
  scripts: ['./src/**/*.js', '!**/parser/*.js']
};



















