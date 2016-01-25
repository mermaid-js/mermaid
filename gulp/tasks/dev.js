/**
 * Created by knut on 2015-12-26.
 */
var gulp = require('gulp');
var shell = require('gulp-shell');
var liveServer = require("live-server");

var params = {
    port: 8080, // Set the server port. Defaults to 8080.
    host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0.
    root: "./test/examples", // Set root directory that's being server. Defaults to cwd.
    open: true, // When false, it won't load your browser by default.
    ignore: 'scss,my/templates', // comma-separated string for paths to ignore
    //file: "index.html", // When set, serve this file for every 404 (useful for single-page applications)
    wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
    mount: [['/dist', './dist']] // Mount a directory to a route.
};
gulp.task('live-server',function(){
    liveServer.start(params);
});


gulp.task('watch2',['live-server'],function(){
return shell.task([
    'watchify src/mermaid.js    -s mermaid   -o dist/mermaid.js',
    'node node_modules/eslint-watch/bin/esw src -w'
    ]);
});


// Basic usage
gulp.task('watch-mermaid',function() {

    return gulp.src('src/mermaid.js')
        .pipe(browserify({
            entry:'src/mermaid.js',
            standalone: 'mermaid'
        }))
        .pipe(rename('mermaid.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(extReplace('.min.js'))
        .pipe(gulp.dest('./dist/'));
});

//var bg = require("gulp-bg");
//
//let bgtask;
//gulp.task("server", bgtask = bg("node", "--harmony", "server.js"));
//
//const exitCallback = (proc) => { if (proc.errorcode != 0) { process.exit(proc.errorcode); } };
//
//gulp.task("stop", () => {
//    bgtask.setCallback(exitCallback);
//bgtask.stop();
//}
//});
//
//gulp.task("default", ["server"], function() {
//    gulp.watch(["server.js"], ["server"]);
//});