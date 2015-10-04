var gulp = require('gulp');
var bump = require('gulp-bump');

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
    return gulp.src(['./package.json'])
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