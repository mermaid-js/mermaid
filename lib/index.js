var path = require('path')
var spawn = require('child_process').spawn

var mkdirp = require('mkdirp')

var phantomscript = path.join(__dirname, 'phantomscript.js')

module.exports = { process: processMermaid }

function processMermaid (files, _options, _next) {
  var options = _options || {}
  var outputDir = options.outputDir || process.cwd()
  var outputSuffix = options.outputSuffix || ''
  var next = _next || function () { }
  var phantomArgs = [
    phantomscript,
    outputDir,
    options.png,
    options.svg,
    options.css,
    options.sequenceConfig,
    options.ganttConfig,
    options.verbose,
    options.width,
    outputSuffix
  ]

  files.forEach(function (file) {
    phantomArgs.push(file)
  })

  mkdirp(outputDir, function (err) {
    if (err) {
      throw err
    }
    var phantom = spawn(options.phantomPath, phantomArgs)

    phantom.on('exit', next)

    phantom.stderr.pipe(process.stderr)
    phantom.stdout.pipe(process.stdout)
  })
}
