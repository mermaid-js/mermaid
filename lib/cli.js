var fs = require('fs')
  , exec = require('child_process').exec
  , chalk = require('chalk')
  , which = require('which')
  , parseArgs = require('minimist')
  , semver = require('semver')
  , path = require('path')

var PHANTOM_VERSION = "^2.1.0"

var info = chalk.blue.bold
  , note = chalk.green.bold

module.exports = function() {
  return new cli()
}()

function cli(options) {
  this.options = {
      alias: {
          help: 'h'
        , png: 'p'
        , outputDir: 'o'
        , outputSuffix: 'O'
        , svg: 's'
        , verbose: 'v'
        , phantomPath: 'e'
        , sequenceConfig: 'c'
        , ganttConfig: 'g'
        , css: 't'
        , width: 'w'
      }
    , 'boolean': ['help', 'png', 'svg', 'verbose']
    , 'string': ['outputDir', 'outputSuffix']
  }

  this.errors = []
  this.message = null

  this.helpMessage = [
    , info('Usage: mermaid [options] <file>...')
    , ""
    , "file    The mermaid description file to be rendered"
    , ""
    , "Options:"
    , "  -s --svg             Output SVG instead of PNG (experimental)"
    , "  -p --png             If SVG was selected, and you also want PNG, set this flag"
    , "  -o --outputDir       Directory to save files, will be created automatically, defaults to `cwd`"
    , "  -O --outputSuffix    Suffix to output filenames in front of '.svg' or '.png', defaults to ''"
    , "  -e --phantomPath     Specify the path to the phantomjs executable"
    , "  -t --css             Specify the path to a CSS file to be included when processing output"
    , "  -c --sequenceConfig  Specify the path to the file with the configuration to be applied in the sequence diagram"
    , "  -g --ganttConfig     Specify the path to the file with the configuration to be applied in the gantt diagram"
    , "  -h --help            Show this message"
    , "  -v --verbose         Show logging"
    , "  -w --width           width of the generated png (number)"
    , "  --version            Print version and quit"
  ]

  return this
}

cli.prototype.parse = function(argv, next) {
  var options = parseArgs(argv, this.options)
    , phantom

  if (options.version) {
    var pkg = require('../package.json')
    this.message = "" + pkg.version
    next(null, this.message)
  }
  else if (options.help) {
    this.message = this.helpMessage.join('\n')
    next(null, this.message)
  }
  else {
    options.files = options._

    if (!options.files.length) {
      this.errors.push(new Error("You must specify at least one source file."))
    }

    // ensure that parameter-expecting options have parameters
    ;['outputDir', 'outputSuffix', 'phantomPath', 'sequenceConfig', 'ganttConfig', 'css'].forEach(function(i) {
      if(typeof options[i] !== 'undefined') {
        if (typeof options[i] !== 'string' || options[i].length < 1) {
          this.errors.push(new Error(i + " expects a value."))
        }
      }
    }.bind(this))

    // set svg/png flags appropriately
    if (options.svg && !options.png) {
      options.png = false
    }
    else {
      options.png = true
    }
  
    if (options.sequenceConfig) {
      try {
        fs.accessSync(options.sequenceConfig, fs.R_OK)
      
      } catch (err) {
        this.errors.push(err)
      }
    } else {
      options.sequenceConfig = null
    }
  
    if (options.ganttConfig) {
      try {
        fs.accessSync(options.ganttConfig, fs.R_OK)
      
      } catch (err) {
        this.errors.push(err)
      }
    } else {
      options.ganttConfig = null
    }

    if (options.css) {
      try {
        fs.accessSync(options.css, fs.R_OK)

      } catch (err) {
        this.errors.push(err)
      }
    } else {
        options.css = path.join(__dirname, '..', 'dist', 'mermaid.css')
    }

    // set svg/png flags appropriately
    if(!options.width){
      options.width = 1200;
    }

    this.checkPhantom = createCheckPhantom(options.phantomPath)

    this.checkPhantom(function(err, path) {
      if(err) {
        this.errors.push(err)
      }
      options.phantomPath = path
      next(
          this.errors.length > 0 ? this.errors : null
        , this.message
        , options
      )
    }.bind(this))
  }
}

function createCheckPhantom(_phantomPath) {
  var phantomPath = _phantomPath
    , phantomVersion

  return function checkPhantom(_next) {
    var next = _next || function() {}
      , err

    if (typeof phantomPath === 'undefined') {
      try {
        var phantom = require('phantomjs')
        phantomPath = phantom.path
      } catch (e) {
        try {
          phantomPath = which.sync('phantomjs')
        } catch (e) {
          if (!phantomPath) {
            phantomPath = null
            err = new Error(
              [
                  "Cannot find phantomjs in your PATH. If phantomjs is installed"
                , "you may need to specify its path manually with the '-e' option."
                , "Run this executable with '--help' or view the README for more"
                , "details."
              ].join('\n')
            )

            next(err)
            return
          }
        }
      }
    }

    // If we have phantompath, see if its version satisfies our requirements
    exec('"' + phantomPath + '" --version', function(err, stdout, stderr) {
      if (err) {
        next(new Error("Could not find phantomjs at the specified path."))
      }
      else if (!semver.satisfies(stdout, PHANTOM_VERSION)) {
        next(new Error(
            'mermaid requires phantomjs '
          + PHANTOM_VERSION
          + ' to be installed, found version '
          + stdout
        ))
      }
      else {
        next(null, phantomPath)
      }
    })
  }
}
