/* global window */
//console.log('Setting up d3');
var d3;

if (require) {
  try {
    d3 = require("d3");
  } catch (e) {
  	console.log('Exception ... but ok');
  	//console.log(e);
  }
}

//console.log(d3);

if (!d3) {
  //if(typeof window !== 'undefined')
    d3 = window.d3;
}

//if(typeof window === 'undefined'){
//    window = {};
//    window.d3 = d3;
//}
//console.log('window');
//console.log(window);
module.exports = d3;
