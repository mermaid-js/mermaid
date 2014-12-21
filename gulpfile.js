var gulp = require('gulp');
var path = require('path');
var jison = require('gulp-jison');
var less = require('gulp-less');
var shell = require('gulp-shell');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var extReplace = require('gulp-ext-replace');
var rename = require('gulp-rename');
var istanbul = require('gulp-istanbul');
var bump = require('gulp-bump');
var tag_version = require('gulp-tag-version');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

var paths = {
  scripts: ['./src/**/*.js', '!**/parser/*.js']
};

gulp.task('jison2', function() {
    return gulp.src('./src/*.jison')
        .pipe(jison({ moduleType: 'commonjs' }))
        .pipe(gulp.dest('./src/parser'));
});

gulp.task('jison', shell.task([
  'jison src/diagrams/flowchart/parser/flow.jison -o src/diagrams/flowchart/parser/flow.js',
  'jison src/diagrams/flowchart/parser/dot.jison -o src/diagrams/flowchart/parser/dot.js',
  'jison src/diagrams/sequenceDiagram/parser/sequenceDiagram.jison -o src/diagrams/sequenceDiagram/parser/sequenceDiagram.js',
  //'jison src/diagrams/sequenceDiagram/parser/sequence.jison -o src/diagrams/sequenceDiagram/parser/sequence.js'
]));

gulp.task('jison2', function() {
    return gulp.src('./src/diagrams/flowchart/**/*.jison')
        .pipe(jison({  }))
        .pipe(gulp.dest('./src/diagrams/flowchart'));
});

gulp.task('dist', ['slimDist', 'fullDist','jasmine']);
gulp.task('rdist', ['slimDist', 'fullDist']);

var jasmine = require('gulp-jasmine');

gulp.task('jasmine',['jison','lint'], function () {
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

gulp.task('less', function () {
    gulp.src(['./editor/css/editor.less'])
        .pipe(less({
            generateSourceMap: false, // default true
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(concat('editor.css'))
        .pipe(gulp.dest('./editor/css/'));
});

var browserify = require('gulp-browserify');

// Basic usage
gulp.task('slimDist', function() {
    // Single entry point to browserify
    return gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(rename('mermaid.slim.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});


// Build editor
gulp.task('editor', function() {
    /*gulp.src(['src/editor.js'])
        .pipe(browserify())
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./editor/'));*/
    return gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.js','src/editor.js'])
        .pipe(concat('build.js'))
        .pipe(gulp.dest('./editor/'));
});


// Basic usage
gulp.task('fullDist', ['slimDist'], function() {
    // Single entry point to browserify
    gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.js'])
        .pipe(concat('mermaid.full.js'))
        .pipe(gulp.dest('./dist/'));
    return gulp.src(['node_modules/d3/d3.min.js','node_modules/dagre-d3/dist/dagre-d3.min.js','dist/mermaid.slim.min.js'])
        .pipe(concat('mermaid.full.min.js'))
        .pipe(gulp.dest('./dist/'));
});

// Basic usage
gulp.task('npmDist', ['slimDist'], function() {
    // Single entry point to browserify
    return gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('bump', function(){
    gulp.src('./bw.json')
        .pipe(bump({key: "version"}))
        .pipe(gulp.dest('./'));
});

// Assuming there's "version: 1.2.3" in package.json,
// tag the last commit as "v1.2.3"//
gulp.task('tag', function() {
    return gulp.src(['./package.json']).pipe(tag_version());
});

/**
 * Bumping version number and tagging the repository with it.
 * Please read http://semver.org/
 *
 * You can use the commands
 *
 *     gulp patch     # makes v0.1.0 → v0.1.1
 *     gulp feature   # makes v0.1.1 → v0.2.0
 *     gulp release   # makes v0.2.1 → v1.0.0
 *
 * To bump the version numbers accordingly after you did a patch,
 * introduced a feature or made a backwards-incompatible release.
 */

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json', './bower.json'])
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'));
        // commit the changed version number
        //.pipe(git.commit('bumps package version'))

        // read only one file to get the version number
        //.pipe(filter('package.json'))
        // **tag it in the repository**
        //.pipe(tag_version());
}

gulp.task('patch', function() { return inc('patch'); })
gulp.task('feature', function() { return inc('minor'); })
gulp.task('release', function() { return inc('major'); })

// Using gulp-jshint and jshint-stylish
gulp.task('lint', function() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('test',['coverage','tape']);
