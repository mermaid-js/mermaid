var fs = require('fs')
  , exec = require('child_process').exec
  , chalk = require('chalk')
  , which = require('which')
  , parseArgs = require('minimist')
  , semver = require('semver')

var PHANTOM_VERSION = "^1.9.0"

var info = chalk.blue.bold
  , note = chalk.green.bold

var cli = function(options) {
  this.options = {
      alias: {
          help: 'h'
        , png: 'p'
        , outputDir: 'o'
        , svg: 's'
        , verbose: 'v'
        , phantomPath: 'e'
      }
    , 'boolean': ['help', 'png', 'svg']
    , 'string': ['outputDir']
  }

  this.errors = []
  this.message = null

  this.helpMessage = [
    , info('Usage: mermaid [options] <file>...')
    , ""
    , "file    The mermaid description file to be rendered"
    , ""
    , "Options:"
    , "  -s --svg          Output SVG instead of PNG (experimental)"
    , "  -p --png          If SVG was selected, and you also want PNG, set this flag"
    , "  -o --outputDir    Directory to save files, will be created automatically, defaults to `cwd`"
    , "  -e --phantomPath  Specify the path to the phantomjs executable"
    , "  -h --help         Show this message"
    , "  -v --verbose      Show logging"
    , "  --version         Print version and quit"
  ]

  return this
}

cli.prototype.parse = function(argv, next) {
  var options = parseArgs(argv, this.options)
    , phantom

  if (options.version) {
    var pkg = require('../package.json')
    this.message = "" + pkg.version
  }
  else if (options.help) {
    this.message = this.helpMessage.join('\n')
  }
  else {
    options.files = options._

    if (!options.files.length) {
      this.errors.push(new Error("You must specify at least one source file."))
    }

    // ensure that parameter-expecting options have parameters
    ;['outputDir', 'phantomPath'].forEach(function(i) {
      if(typeof options[i] !== 'undefined') {
        if (typeof options[i] !== 'string' || options[i].length < 1) {
          this.errors.push(new Error(i + " expects a value."))
        }
      }
    }.bind(this))
  }

  if (options.svg && !options.png) {
    options.png = false
  }
  else {
    options.png = true
  }

  // If phantom hasn't been specified, see if we can find it
  if (!options.phantomPath) {
    try {
      var phantom = require('phantomjs')
      options.phantomPath = phantom.path
    } catch (e) {
      try {
        options.phantomPath = which.sync('phantomjs')
      } catch (e) {
        if (!options.phantomPath) {
          var err = [
              "Cannot find phantomjs in your PATH. If phantomjs is installed"
            , "you may need to specify its path manually with the '-e' option."
            , "If it is not installed, you should view the README for further"
            , "details."
          ]

          this.errors.push(new Error(err.join('\n')))
          next(
              this.errors.length > 0 ? this.errors : null
            , this.message
            , options)

          return
        }
      }
    }
  }

  // If we have phantompath, see if its version satisfies our requirements
  exec(options.phantomPath + ' --version', function(err, stdout, stderr) {
    if (err) {
      this.errors.push(
        new Error("Could not find phantomjs at the specified path.")
      )
    }
    else if (!semver.satisfies(stdout, PHANTOM_VERSION)) {
      this.message = note(
          'mermaid requires phantomjs '
        + PHANTOM_VERSION
        + ' to be installed, found version '
        + stdout
      )
    }
    next(this.errors.length > 0 ? this.errors : null, this.message, options)
  }.bind(this))

}


module.exports = function() {
  return new cli()
}()
