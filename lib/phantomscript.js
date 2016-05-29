/**
 * Credits:
 * - SVG Processing from the NYTimes svg-crowbar, under an MIT license
 *   https://github.com/NYTimes/svg-crowbar
 * - Thanks to the grunticon project for some guidance
 *   https://github.com/filamentgroup/grunticon
 */

phantom.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg]
  if (trace && trace.length) {
    msgStack.push('TRACE:')
    trace.forEach(function(t) {
      msgStack.push(
          ' -> '
        + (t.file || t.sourceURL)
        + ': '
        + t.line
        + (t.function ? ' (in function ' + t.function +')' : '')
      )
    })
  }
  system.stderr.write(msgStack.join('\n'))
  phantom.exit(1)
}

var system = require('system')
  , fs = require('fs')
  , webpage = require('webpage')


var page = webpage.create()
  , files = system.args.slice(9, system.args.length)
  , width = system.args[8]

if(typeof width === 'undefined' || width==='undefined'){
  width = 1200;
}
var options = {
        outputDir: system.args[1]
      , png: system.args[2] === 'true' ? true : false
      , svg: system.args[3] === 'true' ? true : false
      , css: system.args[4] !== '' ? system.args[4] : '* {  margin: 0; padding: 0; }'
      , sequenceConfig: system.args[5]
      , ganttConfig: system.args[6]
      , verbose: system.args[7] === 'true' ? true : false
      , width: width
    }
  , log = logger(options.verbose)

  // If no css is suuplied make sure a fixed witdth is given to the gant renderer
  if(system.args[3] !== ''){
    if(typeof options.ganttConfig === 'undefined'){
      options.ganttConfig = {};
    }
    options.ganttConfig.useWidth = 1200;
  }

page.content = [
    '<html>'
  , '<head>'
  , '<style type="text/css">body {background:white;font-family: Arial;}'
  , options.css
  , '</style>'
  , '</head>'
  , '<body>'
  , '</body>'
  , '</html>'
].join('\n')


page.injectJs('../dist/mermaid.js')
page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

console.log('Num files to execute : ' + files.length)

files.forEach(function(file) {
  var contents = fs.read(file)
    , filename = file.split(fs.separator).slice(-1)
    , oParser = new DOMParser()
    , oDOM
    , svgContent
    , allElements;

  console.log('ready to execute png: ' + filename + '.png ')

  // this JS is executed in this statement is sandboxed, even though it doesn't
  // look like it. we need to serialize then unserialize the svgContent that's
  // taken from the DOM
  svgContent = page.evaluate(executeInPage, {
    contents       : contents,
    ganttConfig    : options.ganttConfig,
    sequenceConfig : options.sequenceConfig,
    confWidth      : options.width
  })

  oDOM = oParser.parseFromString(svgContent, "text/xml")

  resolveSVGElement(oDOM.firstChild)

  // traverse the SVG, and replace all foreignObject elements
  // can be removed when https://github.com/knsv/mermaid/issues/58 is resolved
  allElements = traverse(oDOM)
  for (var i = 0, len = allElements.length; i < len; i++) {
    resolveForeignObjects(allElements[i])
  }

  if (options.png) {
    page.viewportSize = {
        width: ~~oDOM.documentElement.attributes.getNamedItem('width').value
      , height: ~~oDOM.documentElement.attributes.getNamedItem('height').value
    }

    page.render(options.outputDir + fs.separator + filename + '.png')
    console.log('saved png: ' + filename + '.png')
  }

  if (options.svg) {
    var serialize = new XMLSerializer();
    fs.write(
        options.outputDir + fs.separator + filename + '.svg'
      , serialize.serializeToString(oDOM)
      , 'w'
    )
    log('saved svg: ' + filename + '.svg')
  }
})

phantom.exit()

function logger(_verbose) {
  var verbose = _verbose

  return function(_message, _level) {
    var level = level
      , message = _message
      , log

    log = level === 'error' ? system.stderr : system.stdout

    if (verbose) {
      log.write(message + '\n')
    }
  }
}

function traverse(obj){
  var tree = []

  tree.push(obj)
  visit(obj)

  function visit(node) {
    if (node && node.hasChildNodes()) {
      var child = node.firstChild
      while (child) {
        if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
          tree.push(child)
          visit(child)
        }
        child = child.nextSibling
      }
    }
  }

  return tree
}

function resolveSVGElement(element) {
  var prefix = {
          xmlns: "http://www.w3.org/2000/xmlns/"
        , xlink: "http://www.w3.org/1999/xlink"
        , svg: "http://www.w3.org/2000/svg"
      }
    , doctype = '<!DOCTYPE svg:svg PUBLIC'
        + ' "-//W3C//DTD XHTML 1.1 plus MathML 2.0 plus SVG 1.1//EN"'
        + ' "http://www.w3.org/2002/04/xhtml-math-svg/xhtml-math-svg.dtd">'

  element.setAttribute("version", "1.1")
  // removing attributes so they aren't doubled up
  element.removeAttribute("xmlns")
  element.removeAttribute("xlink")
  // These are needed for the svg
  if (!element.hasAttributeNS(prefix.xmlns, "xmlns")) {
    element.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg)
  }
  if (!element.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    element.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink)
  }
}

function resolveForeignObjects(element) {
    return;
  var children
    , textElement
    , textSpan

  if (element.tagName === 'foreignObject') {
    textElement = document.createElement('text')
    textSpan = document.createElement('tspan')
    textSpan.setAttribute(
        'style'
      , 'font-size: 11.5pt; font-family: "sans-serif";'
    )
    textSpan.setAttribute('x', 0)
    textSpan.setAttribute('y', 14.5)
    textSpan.textContent = element.textContent

    textElement.appendChild(textSpan)
    element.parentElement.appendChild(textElement)
    element.parentElement.removeChild(element)
  }
}

// The sandboxed function that's executed in-page by phantom
function executeInPage(data) {
  var xmlSerializer = new XMLSerializer()
    , contents = data.contents
    , sequenceConfig = data.sequenceConfig
    , ganttConfig = data.ganttConfig
    , toRemove
    , el
    , elContent
    , svg
    , svgValue
    , boundingBox
    , width
    , height
    , confWidth = data.confWidth

  toRemove = document.getElementsByClassName('mermaid')
  if (toRemove && toRemove.length) {
    for (var i = 0, len = toRemove.length; i < len; i++) {
      toRemove[i].parentNode.removeChild(toRemove[i])
    }
  }

  el = document.createElement("div")
  el.className = 'mermaid'
  elContent = document.createTextNode(contents)
  el.appendChild(elContent)
  //el.innerText = '<b>hello</b>\uD800' //contents;

  document.body.appendChild(el)

  mermaid.initialize({
    sequenceDiagram:{useMaxWidth:false},
    flowchart:{useMaxWidth:false},
    logLevel:1
  });
  //console.log('after initialize',sequenceConfig);

    if(typeof sequenceConfig !== undefined && sequenceConfig !== 'undefined'){
        //sc = document.createElement("script")
        //scContent = document.createTextNode('mermaid.sequenceConfig = JSON.parse(' + JSON.stringify(sequenceConfig) + ');')
        //sc.appendChild(scContent)

        //document.body.appendChild(sc)
      mermaid.initialize({
        sequenceDiagram:JSON.parse(sequenceConfig)
      });
    }

  //console.log('after initialize 2');
    if(typeof ganttConfig !== undefined && ganttConfig !== 'undefined'){
        sc = document.createElement("script")
        scContent = document.createTextNode('mermaid.ganttConfig = JSON.parse(' + JSON.stringify(ganttConfig) + ');')
        sc.appendChild(scContent)

        document.body.appendChild(sc)
    }else{
        sc = document.createElement("script")
        scContent = document.createTextNode('mermaid.ganttConfig = {useWidth:1200};')
        sc.appendChild(scContent)

        document.body.appendChild(sc)
    }

  mermaid.init();

  svg = document.querySelector('svg')

  boundingBox = svg.getBoundingClientRect(); // the initial bonding box of the svg
  width = boundingBox.width * 1.5; // adding the scale factor for consistency with output in chrome browser
  height = boundingBox.height * 1.5; // adding the scale factor for consistency with output in chrome browser


  var scalefactor = confWidth/(width-8);

  // resizing the body to fit the svg
  document.body.setAttribute(
    'style'
    , 'width: ' + (confWidth-8) + '; height: ' + (height*scalefactor) + ';'
  )
  // resizing the svg via css for consistent display
  svg.setAttribute(
    'style'
    , 'width: ' + (confWidth-8) + '; height: ' + (height*scalefactor) + ';'
  )

  // set witdth and height attributes used to set the viewport when rending png image
  svg.setAttribute(
    'width'
    , confWidth
  )
  svg.setAttribute(
    'height'
    , height*scalefactor
  )

  svgValue = xmlSerializer.serializeToString(svg)
  //console.log('confWidth: '+document.head.outerHTML);
  return svgValue
}
