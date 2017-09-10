import d3 from 'd3'

/*
 D3 Text Wrap
 By Vijith Assar
 http://www.vijithassar.com
 http://www.github.com/vijithassar
 @vijithassar

 Detailed instructions at http://www.github.com/vijithassar/d3textwrap
 */

(function () {
  // set this variable to a string value to always force a particular
  // wrap method for development purposes, for example to check tspan
  // rendering using a foreignobject-enabled browser. set to 'tspan' to
  // use tspans and 'foreignobject' to use foreignobject
  var forceWrapMethod = false // by default no wrap method is forced
  forceWrapMethod = 'tspans' // uncomment this statement to force tspans
  // force_wrap_method = 'foreignobjects'; // uncomment this statement to force foreignobjects

  // exit immediately if something in this location
  // has already been defined; the plugin will defer to whatever
  // else you're doing in your code
  if (d3.selection.prototype.textwrap) {
    return false
  }

  // double check the force_wrap_method flag
  // and reset if someone screwed up the above
  // settings
  if (typeof forceWrapMethod === 'undefined') {
    forceWrapMethod = false
  }

  // create the plugin method twice, both for regular use
  // and again for use inside the enter() selection
  d3.selection.prototype.textwrap = d3.selection.enter.prototype.textwrap = function (bounds, padding) {
    // default value of padding is zero if it's undefined
    padding = parseInt(padding) || 0

    // save callee into a variable so we can continue to refer to it
    // as the function scope changes
    var selection = this

    // create a variable to store desired return values in
    var returnValue

    // extract wrap boundaries from any d3-selected rect and return them
    // in a format that matches the simpler object argument option
    var extractBounds = function (bounds) {
      // discard the nested array wrappers added by d3
      var boundingRect = bounds[0][0]
      // sanitize the svg element name so we can test against it
      var elementType = boundingRect.tagName.toString()
      // if it's not a rect, exit
      if (elementType !== 'rect') {
        return false
        // if it's a rect, proceed to extracting the position attributes
      } else {
        var boundsExtracted = {}
        boundsExtracted.x = d3.select(boundingRect).attr('x') || 0
        boundsExtracted.y = d3.select(boundingRect).attr('y') || 0
        boundsExtracted.width = d3.select(boundingRect).attr('width') || 0
        boundsExtracted.height = d3.select(boundingRect).attr('height') || 0
        // also pass along the getter function
        boundsExtracted.attr = bounds.attr
      }
      return boundsExtracted
    }

    // double check the input argument for the wrapping
    // boundaries to make sure it actually contains all
    // the information we'll need in order to wrap successfully
    var verifyBounds = function (bounds) {
      // quickly add a simple getter method so you can use either
      // bounds.x or bounds.attr('x') as your notation,
      // the latter being a common convention among D3
      // developers
      if (!bounds.attr) {
        bounds.attr = function (property) {
          if (this[property]) {
            return this[property]
          }
        }
      }
      // if it's an associative array, make sure it has all the
      // necessary properties represented directly
      if (
        (typeof bounds === 'object') &&
        (typeof bounds.x !== 'undefined') &&
        (typeof bounds.y !== 'undefined') &&
        (typeof bounds.width !== 'undefined') &&
        (typeof bounds.height !== 'undefined')
        // if that's the case, then the bounds are fine
      ) {
        // return the lightly modified bounds
        return bounds
        // if it's a numerically indexed array, assume it's a
        // d3-selected rect and try to extract the positions
      } else if (
        // first try to make sure it's an array using Array.isArray
        (
          (typeof Array.isArray === 'function') &&
          (Array.isArray(bounds))
        ) ||
        // but since Array.isArray isn't always supported, fall
        // back to casting to the object to string when it's not
        (Object.prototype.toString.call(bounds) === '[object Array]')
      ) {
        // once you're sure it's an array, extract the boundaries
        // from the rect
        var extractedBounds = extractBounds(bounds)
        return extractedBounds
      } else {
        // but if the bounds are neither an object nor a numerical
        // array, then the bounds argument is invalid and you'll
        // need to fix it
        return false
      }
    }

    var applyPadding = function (bounds, padding) {
      var paddedBounds = bounds
      if (padding !== 0) {
        paddedBounds.x = parseInt(paddedBounds.x) + padding
        paddedBounds.y = parseInt(paddedBounds.y) + padding
        paddedBounds.width -= padding * 2
        paddedBounds.height -= padding * 2
      }
      return paddedBounds
    }

    // verify bounds
    var verifiedBounds = verifyBounds(bounds)

    // modify bounds if a padding value is provided
    if (padding) {
      verifiedBounds = applyPadding(verifiedBounds, padding)
    }

    // check that we have the necessary conditions for this function to operate properly
    if (
      // selection it's operating on cannot be not empty
      (selection.length === 0) ||
      // d3 must be available
      (!d3) ||
      // desired wrapping bounds must be provided as an input argument
      (!bounds) ||
      // input bounds must validate
      (!verifiedBounds)
    ) {
      // try to return the calling selection if possible
      // so as not to interfere with methods downstream in the
      // chain
      if (selection) {
        return selection
        // if all else fails, just return false. if you hit this point then you're
        // almost certainly trying to call the textwrap() method on something that
        // doesn't make sense!
      } else {
        return false
      }
      // if we've validated everything then we can finally proceed
      // to the meat of this operation
    } else {
      // reassign the verified bounds as the set we want
      // to work with from here on; this ensures that we're
      // using the same data structure for our bounds regardless
      // of whether the input argument was a simple object or
      // a d3 selection
      bounds = verifiedBounds

      // wrap using html and foreignObjects if they are supported
      var wrapWithForeignobjects = function (item) {
        // establish variables to quickly reference target nodes later
        var parent = d3.select(item[0].parentNode)
        var textNode = parent.select('text')
        var styledLineHeight = textNode.style('line-height')
        // extract our desired content from the single text element
        var textToWrap = textNode.text()
        // remove the text node and replace with a foreign object
        textNode.remove()
        var foreignObject = parent.append('foreignObject')
        // add foreign object and set dimensions, position, etc
        foreignObject
          .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
          .attr('x', bounds.x)
          .attr('y', bounds.y)
          .attr('width', bounds.width)
          .attr('height', bounds.height)
        // insert an HTML div
        var wrapDiv = foreignObject
          .append('xhtml:div')
          // this class is currently hardcoded
          // probably not necessary but easy to
          // override using .classed() and for now
          // it's nice to avoid a litany of input
          // arguments
          .attr('class', 'wrapped')
        // set div to same dimensions as foreign object
        wrapDiv
          .style('height', bounds.height)
          .style('width', bounds.width)
          // insert text content
          .html(textToWrap)
        if (styledLineHeight) {
          wrapDiv.style('line-height', styledLineHeight)
        }
        returnValue = parent.select('foreignObject')
      }

      // wrap with tspans if foreignObject is undefined
      var wrapWithTspans = function (item) {
        // operate on the first text item in the selection
        var textNode = item[0]
        var parent = textNode.parentNode
        var textNodeSelected = d3.select(textNode)
        // measure initial size of the text node as rendered
        var textNodeHeight = textNode.getBBox().height
        var textNodeWidth = textNode.getBBox().width
        // figure out the line height, either from rendered height
        // of the font or attached styling
        var lineHeight
        var renderedLineHeight = textNodeHeight
        var styledLineHeight = textNodeSelected.style('line-height')
        if (
          (styledLineHeight) &&
          (parseInt(styledLineHeight))
        ) {
          lineHeight = parseInt(styledLineHeight.replace('px', ''))
        } else {
          lineHeight = renderedLineHeight
        }
        // only fire the rest of this if the text content
        // overflows the desired dimensions
        if (textNodeWidth > bounds.width) {
          // store whatever is inside the text node
          // in a variable and then zero out the
          // initial content; we'll reinsert in a moment
          // using tspan elements.
          var textToWrap = textNodeSelected.text()
          textNodeSelected.text('')
          if (textToWrap) {
            // keep track of whether we are splitting by spaces
            // so we know whether to reinsert those spaces later
            var breakDelimiter
            // split at spaces to create an array of individual words
            var textToWrapArray
            if (textToWrap.indexOf(' ') !== -1) {
              breakDelimiter = ' '
              textToWrapArray = textToWrap.split(' ')
            } else {
              // if there are no spaces, figure out the split
              // points by comparing rendered text width against
              // bounds and translating that into character position
              // cuts
              breakDelimiter = ''
              var stringLength = textToWrap.length
              var numberOfSubstrings = Math.ceil(textNodeWidth / bounds.width)
              var spliceInterval = Math.floor(stringLength / numberOfSubstrings)
              if (
                !(spliceInterval * numberOfSubstrings >= stringLength)
              ) {
                numberOfSubstrings++
              }
              textToWrapArray = []
              var substring
              var startPosition
              for (var i = 0; i < numberOfSubstrings; i++) {
                startPosition = i * spliceInterval
                substring = textToWrap.substr(startPosition, spliceInterval)
                textToWrapArray.push(substring)
              }
            }

            // new array where we'll store the words re-assembled into
            // substrings that have been tested against the desired
            // maximum wrapping width
            var substrings = []
            // computed text length is arguably incorrectly reported for
            // all tspans after the first one, in that they will include
            // the width of previous separate tspans. to compensate we need
            // to manually track the computed text length of all those
            // previous tspans and substrings, and then use that to offset
            // the miscalculation. this then gives us the actual correct
            // position we want to use in rendering the text in the SVG.
            var totalOffset = 0
            // object for storing the results of text length computations later
            var temp = {}
            // loop through the words and test the computed text length
            // of the string against the maximum desired wrapping width
            for (i = 0; i < textToWrapArray.length; i++) {
              var word = textToWrapArray[i]
              var previousString = textNodeSelected.text()
              var previousWidth = textNode.getComputedTextLength()
              // initialize the current word as the first word
              // or append to the previous string if one exists
              var newstring
              if (previousString) {
                newstring = previousString + breakDelimiter + word
              } else {
                newstring = word
              }
              // add the newest substring back to the text node and
              // measure the length
              textNodeSelected.text(newstring)
              var newWidth = textNode.getComputedTextLength()
              // adjust the length by the offset we've tracked
              // due to the misreported length discussed above

              // if our latest version of the string is too
              // big for the bounds, use the previous
              // version of the string (without the newest word
              // added) and use the latest word to restart the
              // process with a new tspan
              if (newWidth > bounds.width) {
                if (
                  (previousString) &&
                  (previousString !== '')
                ) {
                  totalOffset = totalOffset + previousWidth
                  temp = { string: previousString, width: previousWidth, offset: totalOffset }
                  substrings.push(temp)
                  textNodeSelected.text('')
                  textNodeSelected.text(word)
                  // Handle case where there is just one more word to be wrapped
                  if (i === textToWrapArray.length - 1) {
                    newstring = word
                    textNodeSelected.text(newstring)
                    newWidth = textNode.getComputedTextLength()
                  }
                }
              }
              // if we're up to the last word in the array,
              // get the computed length as is without
              // appending anything further to it
              if (i === textToWrapArray.length - 1) {
                textNodeSelected.text('')
                var finalString = newstring
                if (
                  (finalString) &&
                  (finalString !== '')
                ) {
                  if ((newWidth - totalOffset) > 0) { newWidth = newWidth - totalOffset }
                  temp = { string: finalString, width: newWidth, offset: totalOffset }
                  substrings.push(temp)
                }
              }
            }

            // append each substring as a tspan
            var currentTspan
            // var tspanCount
            // double check that the text content has been removed
            // before we start appending tspans
            textNodeSelected.text('')
            for (i = 0; i < substrings.length; i++) {
              substring = substrings[i].string
              // only append if we're sure it won't make the tspans
              // overflow the bounds.
              if ((i) * lineHeight < bounds.height - (lineHeight * 1.5)) {
                currentTspan = textNodeSelected.append('tspan')
                  .text(substring)
                // vertical shift to all tspans after the first one
                currentTspan
                  .attr('dy', function (d) {
                    if (i > 0) {
                      return lineHeight
                    }
                  })
                // shift left from default position, which
                // is probably based on the full length of the
                // text string until we make this adjustment
                currentTspan
                  .attr('x', function () {
                    var xOffset = bounds.x
                    if (padding) { xOffset += padding }
                    return xOffset
                  })
              }
            }
          }
        }
        // position the overall text node, whether wrapped or not
        textNodeSelected.attr('y', function () {
          var yOffset = bounds.y
          // shift by line-height to move the baseline into
          // the bounds – otherwise the text baseline would be
          // at the top of the bounds
          if (lineHeight) { yOffset += lineHeight }
          // shift by padding, if it's there
          if (padding) { yOffset += padding }
          return yOffset
        })
        // shift to the right by the padding value
        textNodeSelected.attr('x', function () {
          var xOffset = bounds.x
          if (padding) { xOffset += padding }
          return xOffset
        })

        // assign our modified text node with tspans
        // to the return value
        returnValue = d3.select(parent).selectAll('text')
      }

      // variable used to hold the functions that let us
      // switch between the wrap methods
      var wrapMethod

      // if a wrap method if being forced, assign that
      // function
      if (forceWrapMethod) {
        if (forceWrapMethod === 'foreignobjects') {
          wrapMethod = wrapWithForeignobjects
        } else if (forceWrapMethod === 'tspans') {
          wrapMethod = wrapWithTspans
        }
      }

      // if no wrap method is being forced, then instead
      // test for browser support of foreignobject and
      // use whichever wrap method makes sense accordingly
      if (!forceWrapMethod) {
        if (typeof SVGForeignObjectElement !== 'undefined') {
          wrapMethod = wrapWithForeignobjects
        } else {
          wrapMethod = wrapWithTspans
        }
      }

      // run the desired wrap function for each item
      // in the d3 selection that called .textwrap()
      for (var i = 0; i < selection.length; i++) {
        var item = selection[i]
        wrapMethod(item)
      }

      // return the modified nodes so we can chain other
      // methods to them.
      return returnValue
    }
  }
})()

export default d3
