/* global window */
//log.debug('Setting up d3');
var d3;

if (typeof require!=='undefined') {
  try {
    d3 = require('d3');
  } catch (e) {
  	//log.debug('Exception ... but ok');
  	//log.debug(e);
  }
}

//log.debug(d3);

if (!d3) {
  //if(typeof window !== 'undefined')
    d3 = window.d3;
}

//if(typeof window === 'undefined'){
//    window = {};
//    window.d3 = d3;
//}
//log.debug('window');
//log.debug(window);
module.exports = d3;
/* jshint ignore:start */
/*

 D3 Text Wrap
 By Vijith Assar
 http://www.vijithassar.com
 http://www.github.com/vijithassar
 @vijithassar

 Detailed instructions at http://www.github.com/vijithassar/d3textwrap

 */

(function() {

    // set this variable to a string value to always force a particular
    // wrap method for development purposes, for example to check tspan
    // rendering using a foreignobject-enabled browser. set to 'tspan' to
    // use tspans and 'foreignobject' to use foreignobject
    var force_wrap_method = false; // by default no wrap method is forced
    force_wrap_method = 'tspans'; // uncomment this statement to force tspans
    // force_wrap_method = 'foreignobjects'; // uncomment this statement to force foreignobjects

    // exit immediately if something in this location
    // has already been defined; the plugin will defer to whatever
    // else you're doing in your code
    if(d3.selection.prototype.textwrap) {
        return false;
    }

    // double check the force_wrap_method flag
    // and reset if someone screwed up the above
    // settings
    if(typeof force_wrap_method == 'undefined') {
        var force_wrap_method = false;
    }

    // create the plugin method twice, both for regular use
    // and again for use inside the enter() selection
    d3.selection.prototype.textwrap = d3.selection.enter.prototype.textwrap = function(bounds, padding) {

        // default value of padding is zero if it's undefined
        var padding = parseInt(padding) || 0;

        // save callee into a variable so we can continue to refer to it
        // as the function scope changes
        var selection = this;

        // create a variable to store desired return values in
        var return_value;

        // extract wrap boundaries from any d3-selected rect and return them
        // in a format that matches the simpler object argument option
        var extract_bounds = function(bounds) {
            // discard the nested array wrappers added by d3
            var bounding_rect = bounds[0][0];
            // sanitize the svg element name so we can test against it
            var element_type = bounding_rect.tagName.toString();
            // if it's not a rect, exit
            if(element_type !== 'rect') {
                return false;
                // if it's a rect, proceed to extracting the position attributes
            } else {
                var bounds_extracted = {};
                bounds_extracted.x = d3.select(bounding_rect).attr('x') || 0;
                bounds_extracted.y = d3.select(bounding_rect).attr('y') || 0;
                bounds_extracted.width = d3.select(bounding_rect).attr('width') || 0;
                bounds_extracted.height = d3.select(bounding_rect).attr('height') || 0;
                // also pass along the getter function
                bounds_extracted.attr = bounds.attr;
            }
            return bounds_extracted;
        }

        // double check the input argument for the wrapping
        // boundaries to make sure it actually contains all
        // the information we'll need in order to wrap successfully
        var verify_bounds = function(bounds) {
            // quickly add a simple getter method so you can use either
            // bounds.x or bounds.attr('x') as your notation,
            // the latter being a common convention among D3
            // developers
            if(!bounds.attr) {
                bounds.attr = function(property) {
                    if(this[property]) {
                        return this[property];
                    }
                }
            }
            // if it's an associative array, make sure it has all the
            // necessary properties represented directly
            if(
                (typeof bounds == 'object') &&
                (typeof bounds.x !== 'undefined') &&
                (typeof bounds.y !== 'undefined') &&
                (typeof bounds.width !== 'undefined') &&
                (typeof bounds.height !== 'undefined')
            // if that's the case, then the bounds are fine
            ) {
                // return the lightly modified bounds
                return bounds;
                // if it's a numerically indexed array, assume it's a
                // d3-selected rect and try to extract the positions
            } else if (
                // first try to make sure it's an array using Array.isArray
            (
            (typeof Array.isArray == 'function') &&
            (Array.isArray(bounds))
            ) ||
                // but since Array.isArray isn't always supported, fall
                // back to casting to the object to string when it's not
            (Object.prototype.toString.call(bounds) === '[object Array]')
            ) {
                // once you're sure it's an array, extract the boundaries
                // from the rect
                var extracted_bounds = extract_bounds(bounds);
                return extracted_bounds;
            } else {
                // but if the bounds are neither an object nor a numerical
                // array, then the bounds argument is invalid and you'll
                // need to fix it
                return false;
            }
        }

        var apply_padding = function(bounds, padding) {
            var padded_bounds = bounds;
            if(padding !== 0) {
                padded_bounds.x = parseInt(padded_bounds.x) + padding;
                padded_bounds.y = parseInt(padded_bounds.y) + padding;
                padded_bounds.width -= padding * 2;
                padded_bounds.height -= padding * 2;
            }
            return padded_bounds;
        }

        // verify bounds
        var verified_bounds = verify_bounds(bounds);

        // modify bounds if a padding value is provided
        if(padding) {
            verified_bounds = apply_padding(verified_bounds, padding);
        }

        // check that we have the necessary conditions for this function to operate properly
        if(
            // selection it's operating on cannot be not empty
        (selection.length == 0) ||
            // d3 must be available
        (!d3) ||
            // desired wrapping bounds must be provided as an input argument
        (!bounds) ||
            // input bounds must validate
        (!verified_bounds)
        ) {
            // try to return the calling selection if possible
            // so as not to interfere with methods downstream in the
            // chain
            if(selection) {
                return selection;
                // if all else fails, just return false. if you hit this point then you're
                // almost certainly trying to call the textwrap() method on something that
                // doesn't make sense!
            } else {
                return false;
            }
            // if we've validated everything then we can finally proceed
            // to the meat of this operation
        } else {

            // reassign the verified bounds as the set we want
            // to work with from here on; this ensures that we're
            // using the same data structure for our bounds regardless
            // of whether the input argument was a simple object or
            // a d3 selection
            bounds = verified_bounds;

            // wrap using html and foreignObjects if they are supported
            var wrap_with_foreignobjects = function(item) {
                // establish variables to quickly reference target nodes later
                var parent = d3.select(item[0].parentNode);
                var text_node = parent.select('text');
                var styled_line_height = text_node.style('line-height');
                // extract our desired content from the single text element
                var text_to_wrap = text_node.text();
                // remove the text node and replace with a foreign object
                text_node.remove();
                var foreign_object = parent.append('foreignObject');
                // add foreign object and set dimensions, position, etc
                foreign_object
                    .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
                    .attr('x', bounds.x)
                    .attr('y', bounds.y)
                    .attr('width', bounds.width)
                    .attr('height', bounds.height);
                // insert an HTML div
                var wrap_div = foreign_object
                    .append('xhtml:div')
                    // this class is currently hardcoded
                    // probably not necessary but easy to
                    // override using .classed() and for now
                    // it's nice to avoid a litany of input
                    // arguments
                    .attr('class', 'wrapped');
                // set div to same dimensions as foreign object
                wrap_div
                    .style('height', bounds.height)
                    .style('width', bounds.width)
                    // insert text content
                    .html(text_to_wrap);
                if(styled_line_height) {
                    wrap_div.style('line-height', styled_line_height);
                }
                return_value = parent.select('foreignObject');
            }


            // wrap with tspans if foreignObject is undefined
            var wrap_with_tspans = function(item) {
                // operate on the first text item in the selection
                var text_node = item[0];
                var parent = text_node.parentNode;
                var text_node_selected = d3.select(text_node);
                // measure initial size of the text node as rendered
                var text_node_height = text_node.getBBox().height;
                var text_node_width = text_node.getBBox().width;
                // figure out the line height, either from rendered height
                // of the font or attached styling
                var line_height;
                var rendered_line_height = text_node_height;
                var styled_line_height = text_node_selected.style('line-height');
                if(
                    (styled_line_height) &&
                    (parseInt(styled_line_height))
                ) {
                    line_height = parseInt(styled_line_height.replace('px', ''));
                } else {
                    line_height = rendered_line_height;
                }
                // only fire the rest of this if the text content
                // overflows the desired dimensions
                if(text_node_width > bounds.width) {
                    // store whatever is inside the text node
                    // in a variable and then zero out the
                    // initial content; we'll reinsert in a moment
                    // using tspan elements.
                    var text_to_wrap = text_node_selected.text();
                    text_node_selected.text('');
                    if(text_to_wrap) {
                        // keep track of whether we are splitting by spaces
                        // so we know whether to reinsert those spaces later
                        var break_delimiter;
                        // split at spaces to create an array of individual words
                        var text_to_wrap_array;
                        if(text_to_wrap.indexOf(' ') !== -1) {
                            var break_delimiter = ' ';
                            text_to_wrap_array = text_to_wrap.split(' ');
                        } else {
                            // if there are no spaces, figure out the split
                            // points by comparing rendered text width against
                            // bounds and translating that into character position
                            // cuts
                            break_delimiter = '';
                            var string_length = text_to_wrap.length;
                            var number_of_substrings = Math.ceil(text_node_width / bounds.width);
                            var splice_interval = Math.floor(string_length / number_of_substrings);
                            if(
                                !(splice_interval * number_of_substrings >= string_length)
                            ) {
                                number_of_substrings++;
                            }
                            var text_to_wrap_array = [];
                            var substring;
                            var start_position;
                            for(var i = 0; i < number_of_substrings; i++) {
                                start_position = i * splice_interval;
                                substring = text_to_wrap.substr(start_position, splice_interval);
                                text_to_wrap_array.push(substring);
                            }
                        }

                        // new array where we'll store the words re-assembled into
                        // substrings that have been tested against the desired
                        // maximum wrapping width
                        var substrings = [];
                        // computed text length is arguably incorrectly reported for
                        // all tspans after the first one, in that they will include
                        // the width of previous separate tspans. to compensate we need
                        // to manually track the computed text length of all those
                        // previous tspans and substrings, and then use that to offset
                        // the miscalculation. this then gives us the actual correct
                        // position we want to use in rendering the text in the SVG.
                        var total_offset = 0;
                        // object for storing the results of text length computations later
                        var temp = {};
                        // loop through the words and test the computed text length
                        // of the string against the maximum desired wrapping width
                        for(var i = 0; i < text_to_wrap_array.length; i++) {
                            var word = text_to_wrap_array[i];
                            var previous_string = text_node_selected.text();
                            var previous_width = text_node.getComputedTextLength();
                            // initialize the current word as the first word
                            // or append to the previous string if one exists
                            var new_string;
                            if(previous_string) {
                                new_string = previous_string + break_delimiter + word;
                            } else {
                                new_string = word;
                            }
                            // add the newest substring back to the text node and
                            // measure the length
                            text_node_selected.text(new_string);
                            var new_width = text_node.getComputedTextLength();
                            // adjust the length by the offset we've tracked
                            // due to the misreported length discussed above
                            var test_width = new_width - total_offset;
                            // if our latest version of the string is too
                            // big for the bounds, use the previous
                            // version of the string (without the newest word
                            // added) and use the latest word to restart the
                            // process with a new tspan
                            if(new_width > bounds.width) {
                                if(
                                    (previous_string) &&
                                    (previous_string !== '')
                                ) {
                                    total_offset = total_offset + previous_width;
                                    temp = {string: previous_string, width: previous_width, offset: total_offset};
                                    substrings.push(temp);
                                    text_node_selected.text('');
                                    text_node_selected.text(word);
                                    // Handle case where there is just one more word to be wrapped
                                    if(i == text_to_wrap_array.length - 1) {
                                        new_string = word;
                                        text_node_selected.text(new_string);
                                        new_width = text_node.getComputedTextLength();
                                    }
                                }
                            }
                            // if we're up to the last word in the array,
                            // get the computed length as is without
                            // appending anything further to it
                            if(i == text_to_wrap_array.length - 1) {
                                text_node_selected.text('');
                                var final_string = new_string;
                                if(
                                    (final_string) &&
                                    (final_string !== '')
                                ) {
                                    if((new_width - total_offset) > 0) {new_width = new_width - total_offset}
                                    temp = {string: final_string, width: new_width, offset: total_offset};
                                    substrings.push(temp);
                                }
                            }
                        }

                        // append each substring as a tspan
                        var current_tspan;
                        var tspan_count;
                        // double check that the text content has been removed
                        // before we start appending tspans
                        text_node_selected.text('');
                        for(var i = 0; i < substrings.length; i++) {
                            var substring = substrings[i].string;
                            if(i > 0) {
                                var previous_substring = substrings[i - 1];
                            }
                            // only append if we're sure it won't make the tspans
                            // overflow the bounds.
                            if((i) * line_height < bounds.height - (line_height * 1.5)) {
                                current_tspan = text_node_selected.append('tspan')
                                    .text(substring);
                                // vertical shift to all tspans after the first one
                                current_tspan
                                    .attr('dy', function(d) {
                                        if(i > 0) {
                                            return line_height;
                                        }
                                    });
                                // shift left from default position, which
                                // is probably based on the full length of the
                                // text string until we make this adjustment
                                current_tspan
                                    .attr('x', function() {
                                        var x_offset = bounds.x;
                                        if(padding) {x_offset += padding;}
                                        return x_offset;
                                    });
//                                    .attr('dx', function() {
//                                        if(i == 0) {
//                                            var render_offset = 0;
//                                        } else if(i > 0) {
//                                            render_offset = substrings[i - 1].width;
//                                            render_offset = render_offset * -1;
//                                        }
//                                        return render_offset;
//                                    });
                            }
                        }
                    }
                }
                // position the overall text node, whether wrapped or not
                text_node_selected.attr('y', function() {
                    var y_offset = bounds.y;
                    // shift by line-height to move the baseline into
                    // the bounds – otherwise the text baseline would be
                    // at the top of the bounds
                    if(line_height) {y_offset += line_height;}
                    // shift by padding, if it's there
                    if(padding) {y_offset += padding;}
                    return y_offset;
                });
                // shift to the right by the padding value
                text_node_selected.attr('x', function() {
                    var x_offset = bounds.x;
                    if(padding) {x_offset += padding;}
                    return x_offset;
                });


                // assign our modified text node with tspans
                // to the return value
                return_value = d3.select(parent).selectAll('text');
            }

            // variable used to hold the functions that let us
            // switch between the wrap methods
            var wrap_method;

            // if a wrap method if being forced, assign that
            // function
            if(force_wrap_method) {
                if(force_wrap_method == 'foreignobjects') {
                    wrap_method = wrap_with_foreignobjects;
                } else if (force_wrap_method == 'tspans') {
                    wrap_method = wrap_with_tspans;
                }
            }

            // if no wrap method is being forced, then instead
            // test for browser support of foreignobject and
            // use whichever wrap method makes sense accordingly
            if(!force_wrap_method) {
                if(typeof SVGForeignObjectElement !== 'undefined') {
                    wrap_method = wrap_with_foreignobjects;
                } else {
                    wrap_method = wrap_with_tspans;
                }
            }

            // run the desired wrap function for each item
            // in the d3 selection that called .textwrap()
            for(var i = 0; i < selection.length; i++) {
                var item = selection[i];
                wrap_method(item);
            }

            // return the modified nodes so we can chain other
            // methods to them.
            return return_value;

        }

    }

})();
/* jshint ignore:end */
