/* global window */

var dagreD3;
//console.log('setting up dagre-d3');
if (require) {
  try {
    dagreD3 = require("dagre-d3");
      //console.log('Got it (dagre-d3)');
  } catch (e) {console.log('Could not load dagre-d3');}
}

if (!dagreD3) {
  dagreD3 = window.dagreD3;
}

module.exports = dagreD3;
