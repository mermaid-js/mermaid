/* global window */

var dagreD3;

if (require) {
  try {
    dagreD3 = require("dagre-d3");
  } catch (e) {}
}

if (!dagreD3) {
  dagreD3 = window.dagreD3;
}

module.exports = dagreD3;
