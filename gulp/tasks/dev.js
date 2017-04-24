/**
 * Created by knut on 2015-12-26.
 */
var gulp = require('gulp')
var shell = require('gulp-shell')
var liveServer = require('live-server')

var params = {
  port: 8080, // Set the server port. Defaults to 8080.
  host: '0.0.0.0', // Set the address to bind to. Defaults to 0.0.0.0.
  root: './test/examples', // Set root directory that's being server. Defaults to cwd.
  open: true, // When false, it won't load your browser by default.
  ignore: 'scss,my/templates', // comma-separated string for paths to ignore
  // file: "index.html", // When set, serve this file for every 404 (useful for single-page applications)
  wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
  mount: [['/dist', './dist']] // Mount a directory to a route.
}
gulp.task('live-server', function () {
  liveServer.start(params)
})

gulp.task('watch2', ['live-server'], function () {
  return shell.task([
    'yarn build -- --watch'
  ])
})
