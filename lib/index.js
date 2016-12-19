var os = require('os')
  , fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn

var mkdirp = require('mkdirp')

var phantomscript = path.join(__dirname, 'phantomscript.js')

module.exports = { process: processMermaid }

function processMermaid(files, _options, _next) {
  var options = _options || {}
    , outputDir = options.outputDir || process.cwd()
    , outputSuffix = options.outputSuffix || ''
    , next = _next || function() {}
    , phantomArgs = [
          phantomscript
        , outputDir
        , options.png
        , options.svg
        , options.css
        , options.sequenceConfig
        , options.ganttConfig
        , options.verbose
        , options.width
        , outputSuffix
      ];

  files.forEach(function(file) {
    phantomArgs.push(file)
  })

  mkdirp(outputDir, function(err) {
    if (err) {
      throw err
      return
    }
    phantom = spawn(options.phantomPath, phantomArgs)

    phantom.on('exit', next)

    phantom.stderr.pipe(process.stderr)
    phantom.stdout.pipe(process.stdout)
  })
}
