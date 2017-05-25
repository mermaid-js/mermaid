/**
 * Credits:
 * - SVG Processing from the NYTimes svg-crowbar, under an MIT license
 *   https://github.com/NYTimes/svg-crowbar
 * - Thanks to the grunticon project for some guidance
 *   https://github.com/filamentgroup/grunticon
 */

window.phantom.onError = function (msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg]
  if (trace && trace.length) {
    msgStack.push('TRACE:')
    trace.forEach(function (t) {
      msgStack.push(
        ' -> ' +
        (t.file || t.sourceURL) +
        ': ' +
        t.line +
        (t.function ? ' (in function ' + t.function + ')' : '')
      )
    })
  }
  system.stderr.write(msgStack.join('\n'))
  window.phantom.exit(1)
}

var system = require('system')
var fs = require('fs')
var webpage = require('webpage')

var page = webpage.create()
var files = system.args.slice(10, system.args.length)
var width = system.args[8]

if (typeof width === 'undefined' || width === 'undefined') {
  width = 1200
}
var options = {
  outputDir: system.args[1],
  png: system.args[2] === 'true',
  svg: system.args[3] === 'true',
  css: fs.read(system.args[4]),
  sequenceConfig: system.args[5] !== 'null' ? JSON.parse(fs.read(system.args[5])) : {},
  ganttConfig: system.args[6] !== 'null' ? JSON.parse(fs.read(system.args[6])) : {},
  verbose: system.args[7] === 'true',
  width: width,
  outputSuffix: system.args[9]
}
var log = logger(options.verbose)
options.sequenceConfig.useMaxWidth = false

page.content = [
  '<html>',
  '<head>',
  '<style type="text/css">body {background:white;font-family: Arial;}',
  options.css,
  '</style>',
  '</head>',
  '<body>',
  '</body>',
  '</html>'
].join('\n')

page.injectJs('../dist/mermaid.js')
page.onConsoleMessage = function (msg, lineNum, sourceId) {
  log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")')
}

log('Num files to execute : ' + files.length)

files.forEach(function (file) {
  var contents = fs.read(file)
  var filename = file.split(fs.separator).slice(-1)
  var oParser = new window.DOMParser()
  var oDOM
  var svgContent

  log('ready to execute: ' + file)

  // this JS is executed in this statement is sandboxed, even though it doesn't
  // look like it. we need to serialize then unserialize the svgContent that's
  // taken from the DOM
  svgContent = page.evaluate(executeInPage, {
    contents: contents,
    ganttConfig: options.ganttConfig,
    sequenceConfig: options.sequenceConfig,
    confWidth: options.width
  })

  oDOM = oParser.parseFromString(svgContent, 'text/xml')

  resolveSVGElement(oDOM.firstChild)
  setSVGStyle(oDOM.firstChild, options.css)

  var outputPath = options.outputDir + fs.separator + filename + options.outputSuffix
  if (options.png) {
    page.viewportSize = {
      width: ~~oDOM.documentElement.attributes.getNamedItem('width').value,
      height: ~~oDOM.documentElement.attributes.getNamedItem('height').value
    }

    page.render(outputPath + '.png')
    log('saved png: ' + outputPath + '.png')
  }

  if (options.svg) {
    var serialize = new window.XMLSerializer()
    fs.write(outputPath + '.svg'
      , serialize.serializeToString(oDOM) + '\n'
      , 'w'
    )
    log('saved svg: ' + outputPath + '.svg')
  }
})

window.phantom.exit()

function logger (_verbose) {
  var verbose = _verbose

  return function (_message, _level) {
    var level = _level
    var message = _message
    var log

    log = level === 'error' ? system.stderr : system.stdout

    if (verbose) {
      log.write(message + '\n')
    }
  }
}

function resolveSVGElement (element) {
  var prefix = {
    xmlns: 'http://www.w3.org/2000/xmlns/',
    xlink: 'http://www.w3.org/1999/xlink',
    svg: 'http://www.w3.org/2000/svg'
  }

  element.setAttribute('version', '1.1')
  // removing attributes so they aren't doubled up
  element.removeAttribute('xmlns')
  element.removeAttribute('xlink')
  // These are needed for the svg
  if (!element.hasAttributeNS(prefix.xmlns, 'xmlns')) {
    element.setAttributeNS(prefix.xmlns, 'xmlns', prefix.svg)
  }
  if (!element.hasAttributeNS(prefix.xmlns, 'xmlns:xlink')) {
    element.setAttributeNS(prefix.xmlns, 'xmlns:xlink', prefix.xlink)
  }
}

function setSVGStyle (svg, css) {
  if (!css || !svg) { return }
  var styles = svg.getElementsByTagName('style')
  if (!styles || styles.length === 0) { return }
  styles[0].textContent = css
}

// The sandboxed function that's executed in-page by phantom
function executeInPage (data) {
  var xmlSerializer = new window.XMLSerializer()
  var contents = data.contents
  var sequenceConfig = JSON.stringify(data.sequenceConfig)
  var ganttConfig = JSON.stringify(data.ganttConfig).replace(/"(function.*})"/, '$1')
  var svg
  var svgValue
  var boundingBox
  var width
  var height
  var confWidth = data.confWidth

  var toRemove = document.getElementsByClassName('mermaid')
  if (toRemove && toRemove.length) {
    for (var i = 0, len = toRemove.length; i < len; i++) {
      toRemove[i].parentNode.removeChild(toRemove[i])
    }
  }

  var el = document.createElement('div')
  el.className = 'mermaid'
  el.appendChild(document.createTextNode(contents))
  document.body.appendChild(el)

  var config = {
    sequenceDiagram: JSON.parse(sequenceConfig),
    flowchart: { useMaxWidth: false },
    logLevel: 1
  }

  window.mermaid.initialize(config)

  var sc = document.createElement('script')
  sc.appendChild(document.createTextNode('mermaid.ganttConfig = ' + ganttConfig + ';'))
  document.body.appendChild(sc)

  window.mermaid.init()

  svg = document.querySelector('svg')

  boundingBox = svg.getBoundingClientRect() // the initial bonding box of the svg
  width = boundingBox.width * 1.5 // adding the scale factor for consistency with output in chrome browser
  height = boundingBox.height * 1.5 // adding the scale factor for consistency with output in chrome browser

  var scalefactor = confWidth / (width - 8)

  // resizing the body to fit the svg
  document.body.setAttribute(
    'style'
    , 'width: ' + (confWidth - 8) + '; height: ' + (height * scalefactor) + ';'
  )
  // resizing the svg via css for consistent display
  svg.setAttribute(
    'style'
    , 'width: ' + (confWidth - 8) + '; height: ' + (height * scalefactor) + ';'
  )

  // set witdth and height attributes used to set the viewport when rending png image
  svg.setAttribute(
    'width'
    , confWidth
  )
  svg.setAttribute(
    'height'
    , height * scalefactor
  )

  svgValue = xmlSerializer.serializeToString(svg) + '\n'
  return svgValue
}
