(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["mermaid"] = factory();
	else
		root["mermaid"] = factory();
})(typeof self !== "undefined" ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/mermaid.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss":
/*!*****************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss ***!
  \*****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  fill: #F9FFFE;\n  color: #F9FFFE; }\n\n.label text {\n  fill: #F9FFFE; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon,\n.node path {\n  fill: #1f2020;\n  stroke: #81B1DB;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center;\n  fill: #F9FFFE; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: lightgrey; }\n\n.edgePath .path {\n  stroke: lightgrey;\n  stroke-width: 1.5px; }\n\n.flowchart-link {\n  stroke: lightgrey;\n  fill: none; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n  .edgeLabel rect {\n    opacity: 0.9; }\n  .edgeLabel span {\n    color: #333; }\n\n.cluster rect {\n  fill: #474949;\n  stroke: rgba(255, 255, 255, 0.25);\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #F9FFFE; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #474949;\n  border: 1px solid rgba(255, 255, 255, 0.25);\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #81B1DB;\n  fill: #1f2020; }\n\ntext.actor > tspan {\n  fill: lightgrey;\n  stroke: none; }\n\n.actor-line {\n  stroke: lightgrey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: none;\n  stroke: lightgrey; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: 2, 2;\n  stroke: lightgrey; }\n\n#arrowhead path {\n  fill: lightgrey;\n  stroke: lightgrey; }\n\n.sequenceNumber {\n  fill: black; }\n\n#sequencenumber {\n  fill: lightgrey; }\n\n#crosshead path {\n  fill: lightgrey;\n  stroke: lightgrey; }\n\n.messageText {\n  fill: lightgrey;\n  stroke: lightgrey; }\n\n.labelBox {\n  stroke: #81B1DB;\n  fill: #1f2020; }\n\n.labelText, .labelText > tspan {\n  fill: lightgrey;\n  stroke: none; }\n\n.loopText, .loopText > tspan {\n  fill: lightgrey;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2px;\n  stroke-dasharray: 2, 2;\n  stroke: #81B1DB;\n  fill: #81B1DB; }\n\n.note {\n  stroke: rgba(255, 255, 255, 0.25);\n  fill: #fff5ad; }\n\n.noteText, .noteText > tspan {\n  fill: #1f2020;\n  stroke: none; }\n\n.activation0 {\n  fill: #474949;\n  stroke: #81B1DB; }\n\n.activation1 {\n  fill: #474949;\n  stroke: #81B1DB; }\n\n.activation2 {\n  fill: #474949;\n  stroke: #81B1DB; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: rgba(255, 255, 255, 0.3); }\n\n.section2 {\n  fill: #EAE8B9; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #F9FFFE; }\n\n.sectionTitle1 {\n  fill: #F9FFFE; }\n\n.sectionTitle2 {\n  fill: #F9FFFE; }\n\n.sectionTitle3 {\n  fill: #F9FFFE; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.8;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: #DB5757;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: #fefefe;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: #fefefe;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: #fefefe; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #1f2020;\n  stroke: rgba(255, 255, 255, 0.5); }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: lightgrey; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: lightgrey; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #81B1DB;\n  stroke: rgba(255, 255, 255, 0.5); }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: #fefefe !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: #fefefe !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #E83737;\n  fill: #E83737;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #E83737;\n  fill: #81B1DB;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #E83737;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: #fefefe !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: #fefefe !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: #fefefe;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #81B1DB;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.clickable {\n  cursor: pointer; }\n\ng.classGroup rect {\n  fill: #1f2020;\n  stroke: #81B1DB; }\n\ng.classGroup line {\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #1f2020;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #81B1DB;\n  font-size: 10px; }\n\n.relation {\n  stroke: #81B1DB;\n  stroke-width: 1;\n  fill: none; }\n\n.dashed-line {\n  stroke-dasharray: 3; }\n\n#compositionStart {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #1f2020;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #1f2020;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #81B1DB;\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: #fefefe;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #81B1DB;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #81B1DB;\n  fill: #F9FFFE;\n  stroke: none;\n  font-size: 10px; }\n\ng.statediagram-cluster .cluster-label text {\n  fill: #F9FFFE; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: #f4f4f4; }\n\ng.stateGroup rect {\n  fill: #1f2020;\n  stroke: #81B1DB; }\n\ng.stateGroup line {\n  stroke: #81B1DB;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #81B1DB;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: rgba(255, 255, 255, 0.25);\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #1f2020;\n  opacity: 0.7; }\n\n.edgeLabel text {\n  fill: #333; }\n\n.stateLabel text {\n  fill: #f4f4f4;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.node circle.state-start {\n  fill: black;\n  stroke: black; }\n\n.node circle.state-end {\n  fill: black;\n  stroke: white;\n  stroke-width: 1.5; }\n\n#statediagram-barbEnd {\n  fill: #81B1DB; }\n\n.statediagram-cluster rect {\n  fill: #1f2020;\n  stroke: #81B1DB;\n  stroke-width: 1px; }\n\n.statediagram-cluster rect.outer {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state .divider {\n  stroke: #81B1DB; }\n\n.statediagram-state .title-state {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-cluster.statediagram-cluster .inner {\n  fill: white; }\n\n.statediagram-cluster.statediagram-cluster-alt .inner {\n  fill: #e0e0e0; }\n\n.statediagram-cluster .inner {\n  rx: 0;\n  ry: 0; }\n\n.statediagram-state rect.basic {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state rect.divider {\n  stroke-dasharray: 10,10;\n  fill: #efefef; }\n\n.note-edge {\n  stroke-dasharray: 5; }\n\n.statediagram-note rect {\n  fill: #fff5ad;\n  stroke: rgba(255, 255, 255, 0.25);\n  stroke-width: 1px;\n  rx: 0;\n  ry: 0; }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n\n/* Classes common for multiple diagrams */\n.error-icon {\n  fill: #a44141; }\n\n.error-text {\n  fill: #ddd;\n  stroke: #ddd; }\n\n.edge-thickness-normal {\n  stroke-width: 2px; }\n\n.edge-thickness-thick {\n  stroke-width: 3.5px; }\n\n.edge-pattern-solid {\n  stroke-dasharray: 0; }\n\n.edge-pattern-dashed {\n  stroke-dasharray: 3; }\n\n.edge-pattern-dotted {\n  stroke-dasharray: 2; }\n\n.marker {\n  fill: lightgrey; }\n\n.marker.cross {\n  stroke: lightgrey; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  fill: #333;\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon,\n.node path {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center;\n  fill: #333; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: #333333; }\n\n.edgePath .path {\n  stroke: #333333;\n  stroke-width: 1.5px; }\n\n.flowchart-link {\n  stroke: #333333;\n  fill: none; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n  .edgeLabel rect {\n    opacity: 0.9; }\n  .edgeLabel span {\n    color: #333; }\n\n.cluster rect {\n  fill: #ffffde;\n  stroke: #aaaa33;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #ffffde;\n  border: 1px solid #aaaa33;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #CCCCFF;\n  fill: #ECECFF; }\n\ntext.actor > tspan {\n  fill: black;\n  stroke: none; }\n\n.actor-line {\n  stroke: grey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: none;\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: 2, 2;\n  stroke: #333; }\n\n#arrowhead path {\n  fill: #333;\n  stroke: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333;\n  stroke: #333; }\n\n.messageText {\n  fill: #333;\n  stroke: #333; }\n\n.labelBox {\n  stroke: #CCCCFF;\n  fill: #ECECFF; }\n\n.labelText, .labelText > tspan {\n  fill: black;\n  stroke: none; }\n\n.loopText, .loopText > tspan {\n  fill: black;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2px;\n  stroke-dasharray: 2, 2;\n  stroke: #CCCCFF;\n  fill: #CCCCFF; }\n\n.note {\n  stroke: #aaaa33;\n  fill: #fff5ad; }\n\n.noteText, .noteText > tspan {\n  fill: black;\n  stroke: none; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: rgba(102, 102, 255, 0.49); }\n\n.section2 {\n  fill: #fff400; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.8;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: red;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: black;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: black;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #8a90dd;\n  stroke: #534fbc; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: black; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: black; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #bfc7ff;\n  stroke: #534fbc; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: black !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: black !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #ff8888;\n  fill: red;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #ff8888;\n  fill: #bfc7ff;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #ff8888;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: black !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: black !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #9370DB;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.clickable {\n  cursor: pointer; }\n\ng.classGroup rect {\n  fill: #ECECFF;\n  stroke: #9370DB; }\n\ng.classGroup line {\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #ECECFF;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #9370DB;\n  font-size: 10px; }\n\n.relation {\n  stroke: #9370DB;\n  stroke-width: 1;\n  fill: none; }\n\n.dashed-line {\n  stroke-dasharray: 3; }\n\n#compositionStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #9370DB;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #9370DB;\n  fill: #333;\n  stroke: none;\n  font-size: 10px; }\n\ng.statediagram-cluster .cluster-label text {\n  fill: #333; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #ECECFF;\n  stroke: #9370DB; }\n\ng.stateGroup line {\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #9370DB;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #aaaa33;\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #ECECFF;\n  opacity: 0.7; }\n\n.edgeLabel text {\n  fill: #333; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.node circle.state-start {\n  fill: black;\n  stroke: black; }\n\n.node circle.state-end {\n  fill: black;\n  stroke: white;\n  stroke-width: 1.5; }\n\n#statediagram-barbEnd {\n  fill: #9370DB; }\n\n.statediagram-cluster rect {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1px; }\n\n.statediagram-cluster rect.outer {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state .divider {\n  stroke: #9370DB; }\n\n.statediagram-state .title-state {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-cluster.statediagram-cluster .inner {\n  fill: white; }\n\n.statediagram-cluster.statediagram-cluster-alt .inner {\n  fill: #e0e0e0; }\n\n.statediagram-cluster .inner {\n  rx: 0;\n  ry: 0; }\n\n.statediagram-state rect.basic {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state rect.divider {\n  stroke-dasharray: 10,10;\n  fill: #efefef; }\n\n.note-edge {\n  stroke-dasharray: 5; }\n\n.statediagram-note rect {\n  fill: #fff5ad;\n  stroke: #aaaa33;\n  stroke-width: 1px;\n  rx: 0;\n  ry: 0; }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n\n/* Classes common for multiple diagrams */\n.error-icon {\n  fill: #552222; }\n\n.error-text {\n  fill: #552222;\n  stroke: #552222; }\n\n.edge-thickness-normal {\n  stroke-width: 2px; }\n\n.edge-thickness-thick {\n  stroke-width: 3.5px; }\n\n.edge-pattern-solid {\n  stroke-dasharray: 0; }\n\n.edge-pattern-dashed {\n  stroke-dasharray: 3; }\n\n.edge-pattern-dotted {\n  stroke-dasharray: 2; }\n\n.marker {\n  fill: #333333; }\n\n.marker.cross {\n  stroke: #333333; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss":
/*!*******************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  fill: #333;\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon,\n.node path {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center;\n  fill: #333; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: green; }\n\n.edgePath .path {\n  stroke: green;\n  stroke-width: 1.5px; }\n\n.flowchart-link {\n  stroke: green;\n  fill: none; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n  .edgeLabel rect {\n    opacity: 0.9; }\n  .edgeLabel span {\n    color: #333; }\n\n.cluster rect {\n  fill: #cdffb2;\n  stroke: #6eaa49;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #cdffb2;\n  border: 1px solid #6eaa49;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #13540c;\n  fill: #cde498; }\n\ntext.actor > tspan {\n  fill: black;\n  stroke: none; }\n\n.actor-line {\n  stroke: grey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: none;\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: 2, 2;\n  stroke: #333; }\n\n#arrowhead path {\n  fill: #333;\n  stroke: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333;\n  stroke: #333; }\n\n.messageText {\n  fill: #333;\n  stroke: #333; }\n\n.labelBox {\n  stroke: #326932;\n  fill: #cde498; }\n\n.labelText, .labelText > tspan {\n  fill: black;\n  stroke: none; }\n\n.loopText, .loopText > tspan {\n  fill: black;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2px;\n  stroke-dasharray: 2, 2;\n  stroke: #326932;\n  fill: #326932; }\n\n.note {\n  stroke: #6eaa49;\n  fill: #fff5ad; }\n\n.noteText, .noteText > tspan {\n  fill: black;\n  stroke: none; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: #6eaa49; }\n\n.section2 {\n  fill: #6eaa49; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.8;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: red;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: black;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: black;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #487e3a;\n  stroke: #13540c; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: black; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: black; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #cde498;\n  stroke: #13540c; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: black !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: black !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #ff8888;\n  fill: red;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #ff8888;\n  fill: #cde498;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #ff8888;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: black !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: black !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #13540c;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.clickable {\n  cursor: pointer; }\n\ng.classGroup rect {\n  fill: #cde498;\n  stroke: #13540c; }\n\ng.classGroup line {\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #cde498;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #13540c;\n  font-size: 10px; }\n\n.relation {\n  stroke: #13540c;\n  stroke-width: 1;\n  fill: none; }\n\n.dashed-line {\n  stroke-dasharray: 3; }\n\n#compositionStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #13540c;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #13540c;\n  fill: #333;\n  stroke: none;\n  font-size: 10px; }\n\ng.statediagram-cluster .cluster-label text {\n  fill: #333; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #cde498;\n  stroke: #13540c; }\n\ng.stateGroup line {\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #13540c;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #6eaa49;\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #cde498;\n  opacity: 0.7; }\n\n.edgeLabel text {\n  fill: #333; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.node circle.state-start {\n  fill: black;\n  stroke: black; }\n\n.node circle.state-end {\n  fill: black;\n  stroke: white;\n  stroke-width: 1.5; }\n\n#statediagram-barbEnd {\n  fill: #13540c; }\n\n.statediagram-cluster rect {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1px; }\n\n.statediagram-cluster rect.outer {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state .divider {\n  stroke: #13540c; }\n\n.statediagram-state .title-state {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-cluster.statediagram-cluster .inner {\n  fill: white; }\n\n.statediagram-cluster.statediagram-cluster-alt .inner {\n  fill: #e0e0e0; }\n\n.statediagram-cluster .inner {\n  rx: 0;\n  ry: 0; }\n\n.statediagram-state rect.basic {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state rect.divider {\n  stroke-dasharray: 10,10;\n  fill: #efefef; }\n\n.note-edge {\n  stroke-dasharray: 5; }\n\n.statediagram-note rect {\n  fill: #fff5ad;\n  stroke: #6eaa49;\n  stroke-width: 1px;\n  rx: 0;\n  ry: 0; }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n\n/* Classes common for multiple diagrams */\n.error-icon {\n  fill: #552222; }\n\n.error-text {\n  fill: #552222;\n  stroke: #552222; }\n\n.edge-thickness-normal {\n  stroke-width: 2px; }\n\n.edge-thickness-thick {\n  stroke-width: 3.5px; }\n\n.edge-pattern-solid {\n  stroke-dasharray: 0; }\n\n.edge-pattern-dashed {\n  stroke-dasharray: 3; }\n\n.edge-pattern-dotted {\n  stroke-dasharray: 2; }\n\n.marker {\n  fill: green; }\n\n.marker.cross {\n  stroke: green; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  fill: #333;\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon,\n.node path {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center;\n  fill: #333; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: #333333; }\n\n.edgePath .path {\n  stroke: #666;\n  stroke-width: 1.5px; }\n\n.flowchart-link {\n  stroke: #666;\n  fill: none; }\n\n.edgeLabel {\n  background-color: white;\n  text-align: center; }\n  .edgeLabel rect {\n    opacity: 0.9; }\n  .edgeLabel span {\n    color: #333; }\n\n.cluster rect {\n  fill: #eaf2fb;\n  stroke: #26a;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #eaf2fb;\n  border: 1px solid #26a;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #999;\n  fill: #eee; }\n\ntext.actor > tspan {\n  fill: #333;\n  stroke: none; }\n\n.actor-line {\n  stroke: #666; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: none;\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: 2, 2;\n  stroke: #333; }\n\n#arrowhead path {\n  fill: #333;\n  stroke: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333;\n  stroke: #333; }\n\n.messageText {\n  fill: #333;\n  stroke: #333; }\n\n.labelBox {\n  stroke: #999;\n  fill: #eee; }\n\n.labelText, .labelText > tspan {\n  fill: #333;\n  stroke: none; }\n\n.loopText, .loopText > tspan {\n  fill: #333;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2px;\n  stroke-dasharray: 2, 2;\n  stroke: #999;\n  fill: #999; }\n\n.note {\n  stroke: #777700;\n  fill: #ffa; }\n\n.noteText, .noteText > tspan {\n  fill: #333;\n  stroke: none; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: #80b3e6; }\n\n.section2 {\n  fill: #80b3e6; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: #e6e6e6;\n  opacity: 0.8;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: #d42;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: #333;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: #333;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #26a;\n  stroke: #1a4d80; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: #333; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: #333; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #eee;\n  stroke: #1a4d80; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: #333 !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: #666;\n  fill: #bbb;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: #333 !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #b1361b;\n  fill: #d42;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #b1361b;\n  fill: #eee;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #b1361b;\n  fill: #bbb;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: #333 !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: #333 !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: #333;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #999;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.clickable {\n  cursor: pointer; }\n\ng.classGroup rect {\n  fill: #eee;\n  stroke: #999; }\n\ng.classGroup line {\n  stroke: #999;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #eee;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #999;\n  font-size: 10px; }\n\n.relation {\n  stroke: #999;\n  stroke-width: 1;\n  fill: none; }\n\n.dashed-line {\n  stroke-dasharray: 3; }\n\n#compositionStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: #333;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #999;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #999;\n  fill: #333;\n  stroke: none;\n  font-size: 10px; }\n\ng.statediagram-cluster .cluster-label text {\n  fill: #333; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #eee;\n  stroke: #999; }\n\ng.stateGroup line {\n  stroke: #999;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #999;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #777700;\n  fill: #ffa; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #eee;\n  opacity: 0.7; }\n\n.edgeLabel text {\n  fill: #333; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.node circle.state-start {\n  fill: black;\n  stroke: black; }\n\n.node circle.state-end {\n  fill: black;\n  stroke: white;\n  stroke-width: 1.5; }\n\n#statediagram-barbEnd {\n  fill: #999; }\n\n.statediagram-cluster rect {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1px; }\n\n.statediagram-cluster rect.outer {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state .divider {\n  stroke: #999; }\n\n.statediagram-state .title-state {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-cluster.statediagram-cluster .inner {\n  fill: white; }\n\n.statediagram-cluster.statediagram-cluster-alt .inner {\n  fill: #e0e0e0; }\n\n.statediagram-cluster .inner {\n  rx: 0;\n  ry: 0; }\n\n.statediagram-state rect.basic {\n  rx: 5px;\n  ry: 5px; }\n\n.statediagram-state rect.divider {\n  stroke-dasharray: 10,10;\n  fill: #efefef; }\n\n.note-edge {\n  stroke-dasharray: 5; }\n\n.statediagram-note rect {\n  fill: #ffa;\n  stroke: #777700;\n  stroke-width: 1px;\n  rx: 0;\n  ry: 0; }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n\n/* Classes common for multiple diagrams */\n.error-icon {\n  fill: #552222; }\n\n.error-text {\n  fill: #552222;\n  stroke: #552222; }\n\n.edge-thickness-normal {\n  stroke-width: 2px; }\n\n.edge-thickness-thick {\n  stroke-width: 3.5px; }\n\n.edge-pattern-solid {\n  stroke-dasharray: 0; }\n\n.edge-pattern-dashed {\n  stroke-dasharray: 3; }\n\n.edge-pattern-dotted {\n  stroke-dasharray: 2; }\n\n.marker {\n  fill: #666; }\n\n.marker.cross {\n  stroke: #666; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return '@media ' + item[2] + '{' + content + '}';
      } else {
        return content;
      }
    }).join('');
  }; // import a list of modules into the list


  list.i = function (modules, mediaQuery) {
    if (typeof modules === 'string') {
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    for (var i = 0; i < this.length; i++) {
      var id = this[i][0];

      if (id != null) {
        alreadyImportedModules[id] = true;
      }
    }

    for (i = 0; i < modules.length; i++) {
      var item = modules[i]; // skip already imported module
      // this implementation is not 100% perfect for weird media query combinations
      // when a module is imported multiple times with different media queries.
      // I hope this will never occur (Hey this way we have smaller bundles)

      if (item[0] == null || !alreadyImportedModules[item[0]]) {
        if (mediaQuery && !item[2]) {
          item[2] = mediaQuery;
        } else if (mediaQuery) {
          item[2] = '(' + item[2] + ') and (' + mediaQuery + ')';
        }

        list.push(item);
      }
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || '';
  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */';
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;
  return '/*# ' + data + ' */';
}

/***/ }),

/***/ "./node_modules/node-libs-browser/mock/empty.js":
/*!******************************************************!*\
  !*** ./node_modules/node-libs-browser/mock/empty.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),

/***/ "./node_modules/path-browserify/index.js":
/*!***********************************************!*\
  !*** ./node_modules/path-browserify/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/*! exports provided: name, version, description, main, keywords, scripts, repository, author, license, standard, dependencies, devDependencies, files, yarn-upgrade-all, sideEffects, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"name\":\"mermaid\",\"version\":\"8.6.4\",\"description\":\"Markdownish syntax for generating flowcharts, sequence diagrams, class diagrams, gantt charts and git graphs.\",\"main\":\"dist/mermaid.core.js\",\"keywords\":[\"diagram\",\"markdown\",\"flowchart\",\"sequence diagram\",\"gantt\",\"class diagram\",\"git graph\"],\"scripts\":{\"build:development\":\"webpack --progress --colors\",\"build:production\":\"yarn build:development -p --config webpack.config.prod.babel.js\",\"build\":\"yarn build:development && yarn build:production\",\"postbuild\":\"documentation build src/mermaidAPI.js src/config.js --shallow -f md --markdown-toc false -o docs/Setup.md\",\"build:watch\":\"yarn build --watch\",\"minify\":\"minify ./dist/mermaid.js > ./dist/mermaid.min.js\",\"release\":\"yarn build\",\"lint\":\"eslint src\",\"e2e:depr\":\"yarn lint && jest e2e --config e2e/jest.config.js\",\"cypress\":\"percy exec -- cypress run\",\"e2e\":\"start-server-and-test dev http://localhost:9000/ cypress\",\"e2e-upd\":\"yarn lint && jest e2e -u --config e2e/jest.config.js\",\"dev\":\"webpack-dev-server --config webpack.config.e2e.js\",\"test\":\"yarn lint && jest src/.*\",\"test:watch\":\"jest --watch src\",\"prepublishOnly\":\"yarn build && yarn test && yarn e2e\",\"prepush\":\"yarn test\",\"prepare\":\"yarn build\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/knsv/mermaid\"},\"author\":\"Knut Sveidqvist\",\"license\":\"MIT\",\"standard\":{\"ignore\":[\"**/parser/*.js\",\"dist/**/*.js\",\"cypress/**/*.js\"],\"globals\":[\"page\"]},\"dependencies\":{\"@braintree/sanitize-url\":\"^3.1.0\",\"crypto-random-string\":\"^3.0.1\",\"d3\":\"^5.7.0\",\"dagre\":\"^0.8.4\",\"dagre-d3\":\"^0.6.4\",\"entity-decode\":\"^2.0.2\",\"graphlib\":\"^2.1.7\",\"he\":\"^1.2.0\",\"minify\":\"^4.1.1\",\"moment-mini\":\"^2.22.1\",\"scope-css\":\"^1.2.1\"},\"devDependencies\":{\"@babel/core\":\"^7.2.2\",\"@babel/preset-env\":\"^7.8.4\",\"@babel/register\":\"^7.0.0\",\"@percy/cypress\":\"*\",\"babel-core\":\"7.0.0-bridge.0\",\"babel-jest\":\"^24.9.0\",\"babel-loader\":\"^8.0.4\",\"coveralls\":\"^3.0.2\",\"css-loader\":\"^2.0.1\",\"css-to-string-loader\":\"^0.1.3\",\"cypress\":\"4.0.1\",\"documentation\":\"^12.0.1\",\"eslint\":\"^6.3.0\",\"eslint-config-prettier\":\"^6.3.0\",\"eslint-plugin-prettier\":\"^3.1.0\",\"husky\":\"^1.2.1\",\"identity-obj-proxy\":\"^3.0.0\",\"jest\":\"^24.9.0\",\"jison\":\"^0.4.18\",\"moment\":\"^2.23.0\",\"node-sass\":\"^4.12.0\",\"prettier\":\"^1.18.2\",\"puppeteer\":\"^1.17.0\",\"sass-loader\":\"^7.1.0\",\"start-server-and-test\":\"^1.10.6\",\"terser-webpack-plugin\":\"^2.2.2\",\"webpack\":\"^4.41.2\",\"webpack-bundle-analyzer\":\"^3.7.0\",\"webpack-cli\":\"^3.1.2\",\"webpack-dev-server\":\"^3.4.1\",\"webpack-node-externals\":\"^1.7.2\",\"yarn-upgrade-all\":\"^0.5.0\"},\"files\":[\"dist\"],\"yarn-upgrade-all\":{\"ignore\":[\"babel-core\"]},\"sideEffects\":[\"**/*.css\",\"**/*.scss\"]}");

/***/ }),

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/*! exports provided: defaultConfig, setSiteConfig, getSiteConfig, setConfig, getConfig, sanitize, reset, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultConfig", function() { return defaultConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setSiteConfig", function() { return setSiteConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSiteConfig", function() { return getSiteConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConfig", function() { return setConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getConfig", function() { return getConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sanitize", function() { return sanitize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reset", function() { return reset; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/logger.js");


/**
 * **Configuration methods in Mermaid version 8.6.0 have been updated, to learn more[[click here](8.6.0_docs.md)].**
 *
 * ## **What follows are config instructions for older versions**
 * These are the default options which can be overridden with the initialization call like so:
 * **Example 1:**
 * <pre>
 * mermaid.initialize({
 *   flowchart:{
 *     htmlLabels: false
 *   }
 * });
 * </pre>
 *
 * **Example 2:**
 * <pre>
 * &lt;script>
 *   var config = {
 *     startOnLoad:true,
 *     flowchart:{
 *       useMaxWidth:true,
 *       htmlLabels:true,
 *       curve:'cardinal',
 *     },
 *
 *     securityLevel:'loose',
 *   };
 *   mermaid.initialize(config);
 * &lt;/script>
 * </pre>
 * A summary of all options and their defaults is found [here](#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */

var config = {
  /** theme , the CSS style sheet
   *
   * theme , the CSS style sheet
   *
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| Theme |Built in Themes| String | Optional | Values include, default, forest, dark, neutral, null|
   *
   ***Notes:**To disable any pre-defined mermaid theme, use "null".
   * <pre>
   *  "theme": "forest",
   *  "themeCSS": ".node rect { fill: red; }"
   * </pre>
   */
  theme: 'default',
  themeCSS: undefined,

  /* **maxTextSize** - The maximum allowed size of the users text diamgram */
  maxTextSize: 50000,

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *|fontFamily | specifies the font to be used in the rendered diagrams| String | Required | Verdana, Arial, Trebuchet MS,|
   *
   ***notes: Default value is \\"trebuchet ms\\".
   */
  fontFamily: '"trebuchet ms", verdana, arial;',

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| logLevel |This option decides the amount of logging to be used.| String | Required | 1, 2, 3, 4, 5 |
   *
   *
   ***Notes:**
   *-   debug: 1.
   *-   info: 2.
   *-   warn: 3.
   *-   error: 4.
   *-   fatal: 5(default).
   */
  logLevel: 5,

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| securitylevel | Level of trust for parsed diagram|String | Required | Strict, Loose |
   *
   ***Notes:
   *-   **strict**: (**default**) tags in text are encoded, click functionality is disabeled
   *-   **loose**: tags in text are allowed, click functionality is enabled
   */
  securityLevel: 'strict',

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| startOnLoad| Dictates whether mermaind starts on Page load | Boolean | Required | True, False |
   *
   ***Notes:**
   ***Default value: true**
   */
  startOnLoad: true,

  /**
   *| Parameter | Description |Type | Required |Values|
   *| --- | --- | --- | --- | --- |
   *| arrowMarkerAbsolute | Controls whether or arrow markers in html code are absolute paths or anchors | Boolean | Required |  True, False |
   *
   *
   *## Notes**: This matters if you are using base tag settings.
   ***Default value: false**.
   */
  arrowMarkerAbsolute: false,

  /**
   * This option controls which currentConfig keys are considered _secure_ and can only be changed via
   * call to mermaidAPI.initialize. Calls to mermaidAPI.reinitialize cannot make changes to
   * the `secure` keys in the current currentConfig. This prevents malicious graph directives from
   * overriding a site's default security.
   */
  secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],

  /**
   * The object containing configurations specific for flowcharts
   */
  flowchart: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| htmlLabels | Flag for setting whether or not a html tag should be used for rendering labels on the edges. | Boolean| Required | True, False|
     *
     ***Notes: Default value: true**.
     */
    htmlLabels: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| nodeSpacing | Defines the spacing between nodes on the same level | Integer| Required | Any positive Numbers |
     *
     ***Notes:
     *Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs, and the vertical spacing for LR as well as RL graphs.**
     ***Default value 50**.
     */
    nodeSpacing: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rankSpacing | Defines the spacing between nodes on different levels | Integer | Required| Any Positive Numbers |
     *
     ***Notes: pertains to vertical spacing for TB (top to bottom) or BT (bottom to top), and the horizontal spacing for LR as well as RL graphs.
     ***Default value 50**.
     */
    rankSpacing: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| curve | Defines how mermaid renders curves for flowcharts. | String | Required | Basis, Linear, Cardinal|
     *
     ***Notes:
     *Default Vaue: Linear**
     */
    curve: 'linear',
    // Only used in new experimental rendering
    // repreesents the padding between the labels and the shape
    padding: 15
  },

  /**
   * The object containing configurations specific for sequence diagrams
   */
  sequence: {
    /**
     * widt of the activation rect
     * **Default value 10**.
     */
    activationWidth: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginX | margin to the right and left of the sequence diagram | Integer | Required | Any Positive Values |
     *
     ***Notes:**
     ***Default value 50**.
     */
    diagramMarginX: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginY | Margin to the over and under the sequence diagram | Integer | Required | Any Positive Values|
     *
     ***Notes:**
     ***Default value 10**.
     */
    diagramMarginY: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorMargin | Margin between actors. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    actorMargin: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 150**.
     */
    width: 150,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| height | Height of actor boxes | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 65**..
     */
    height: 65,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     ***Default value 10**.
     */
    boxMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxTextMargin| margin around the text in loop/alt/opt boxes | Integer | Required| Any Positive Value|
     *
     ***Notes:**
     *
     ***Default value 5**.
     */
    boxTextMargin: 5,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteMargin | margin around notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     ***Default value 10**.
     */
    noteMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageMargin | Space between messages. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     *Space between messages.
     ***Default value 35**.
     */
    messageMargin: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageAlign | Multiline message alignment | Integer | Required | left, center, right |
     *
     ***Notes:**center **default**
     */
    messageAlign: 'center',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| mirrorActors | mirror actors under diagram. | Boolean| Required | True, False |
     *
     ***Notes:**
     *
     ***Default value true**.
     */
    mirrorActors: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| bottomMarginAdj | Prolongs the edge of the diagram downwards. | Integer | Required | Any Positive Value |
     *
     ***Notes:**Depending on css styling this might need adjustment.
     ***Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| useMaxWidth | See Notes | Boolean | Required | True, False |
     *
     ***Notes:**
     *when this flag is set to true, the height and width is set to 100% and is then scaling with the
     *available space. If set to false, the absolute space required is used.
     ***Default value: True**.
     */
    useMaxWidth: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rightAngles | display curve arrows as right angles| Boolean | Required | True, False |
     *
     ***Notes:**
     *
     *This will display arrows that start and begin at the same node as right angles, rather than a curve
     ***Default value false**.
     */
    rightAngles: false,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| showSequenceNumbers | This will show the node numbers | Boolean | Required | True, False |
     *
     ***Notes:**
     ***Default value false**.
     */
    showSequenceNumbers: false,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorFontSize| This sets the font size of the actor's description | Integer | Require | Any Positive Value |
     *
     ***Notes:**
     ***Default value 14**..
     */
    actorFontSize: 14,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorFontFamily |This sets the font family of the actor's description | 3 | 4 | Open-Sans, Sans-Serif |
     *
     ***Notes:**
     ***Default value "Open-Sans", "sans-serif"**.
     */
    actorFontFamily: '"Open-Sans", "sans-serif"',

    /**
     * This sets the font weight of the actor's description
     * **Default value 400.
     */
    actorFontWeight: 400,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteFontSize |This sets the font size of actor-attached notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 14**..
     */
    noteFontSize: 14,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteFontFamily| This sets the font family of actor-attached notes. | String | Required |  trebuchet ms, verdana, arial |
     *
     ***Notes:**
     ***Default value: trebuchet ms **.
     */
    noteFontFamily: '"trebuchet ms", verdana, arial',

    /**
     * This sets the font weight of the note's description
     * **Default value 400.
     */
    noteFontWeight: 400,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteAlign | This sets the text alignment of actor-attached notes. | string | required | left, center, right|
     *
     ***Notes:**
     ***Default value center**.
     */
    noteAlign: 'center',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageFontSize | This sets the font size of actor messages. | Integer | Required | Any Positive Number |
     *
     ***Notes:**
     ***Default value 16**.
     */
    messageFontSize: 16,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageFontFamily | This sets the font family of actor messages. | String| Required | trebuchet ms", verdana, aria |
     *
     ***Notes:**
     ***Default value:"trebuchet ms**.
     */
    messageFontFamily: '"trebuchet ms", verdana, arial',

    /**
     * This sets the font weight of the message's description
     * **Default value 400.
     */
    messageFontWeight: 400,

    /**
     * This sets the auto-wrap state for the diagram
     * **Default value false.
     */
    wrap: false,

    /**
     * This sets the auto-wrap padding for the diagram (sides only)
     * **Default value 10.
     */
    wrapPadding: 10,

    /**
     * This sets the width of the loop-box (loop, alt, opt, par)
     * **Default value 50.
     */
    labelBoxWidth: 50,

    /**
     * This sets the height of the loop-box (loop, alt, opt, par)
     * **Default value 20.
     */
    labelBoxHeight: 20,
    messageFont: function messageFont() {
      return {
        fontFamily: this.messageFontFamily,
        fontSize: this.messageFontSize,
        fontWeight: this.messageFontWeight
      };
    },
    noteFont: function noteFont() {
      return {
        fontFamily: this.noteFontFamily,
        fontSize: this.noteFontSize,
        fontWeight: this.noteFontWeight
      };
    },
    actorFont: function actorFont() {
      return {
        fontFamily: this.actorFontFamily,
        fontSize: this.actorFontSize,
        fontWeight: this.actorFontWeight
      };
    }
  },

  /**
   * The object containing configurations specific for gantt diagrams*
   */
  gantt: {
    /**
     *### titleTopMargin
     *
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| titleTopMargin | Margin top for the text over the gantt diagram | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 25**.
     */
    titleTopMargin: 25,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| barHeight | The height of the bars in the graph | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 20**.
     */
    barHeight: 20,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| barGap | The margin between the different activities in the gantt diagram. | Integer | Optional |Any Positive Value |
     *
     ***Notes:**
     ***Default value 4**.
     */
    barGap: 4,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| topPadding | Margin between title and gantt diagram and between axis and gantt diagram. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    topPadding: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| leftPadding | The space allocated for the section name to the left of the activities. | Integer| Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 75**.
     */
    leftPadding: 75,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| gridLineStartPadding | Vertical starting position of the grid lines. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 35**.
     */
    gridLineStartPadding: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontSize | Font size| Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 11**.
     */
    fontSize: 11,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontFamily | font Family | string | required |"Open-Sans", "sans-serif" |
     *
     ***Notes:**
     *
     ***Default value '"Open-Sans", "sans-serif"'**.
     */
    fontFamily: '"Open-Sans", "sans-serif"',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| numberSectionStyles | The number of alternating section styles | Integer | 4 | Any Positive Value |
     *
     ***Notes:**
     ***Default value 4**.
     */
    numberSectionStyles: 4,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| axisFormat | Datetime format of the axis. | 3 | Required | Date in yy-mm-dd |
     *
     ***Notes:**
     *
     * This might need adjustment to match your locale and preferences
     ***Default value '%Y-%m-%d'**.
     */
    axisFormat: '%Y-%m-%d'
  },

  /**
   * The object containing configurations specific for sequence diagrams
   */
  journey: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginX | margin to the right and left of the sequence diagram | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    diagramMarginX: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginY | margin to the over and under the sequence diagram. | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 10**..
     */
    diagramMarginY: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorMargin | Margin between actors. | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 50**.
     */
    actorMargin: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 150**.
     */
    width: 150,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| height | Height of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 65**.
     */
    height: 65,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 10**.
     */
    boxMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxTextMargin | margin around the text in loop/alt/opt boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     */
    boxTextMargin: 5,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteMargin | margin around notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 10**.
     */
    noteMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageMargin |Space between messages. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     *Space between messages.
     ***Default value 35**.
     */
    messageMargin: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageAlign |Multiline message alignment | 3 | 4 | left, center, right |
     *
     ***Notes:**default:center**
     */
    messageAlign: 'center',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| bottomMarginAdj | Prolongs the edge of the diagram downwards. | Integer | 4 | Any Positive Value |
     *
     ***Notes:**Depending on css styling this might need adjustment.
     ***Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| useMaxWidth | See notes | Boolean | 4 | True, False |
     *
     ***Notes:**when this flag is set the height and width is set to 100% and is then scaling with the
     *available space if not the absolute space required is used.
     *
     ***Default value true**.
     */
    useMaxWidth: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rightAngles | Curved Arrows become Right Angles,  | 3 | 4 | True, False |
     *
     ***Notes:**This will display arrows that start and begin at the same node as right angles, rather than a curves
     ***Default value false**.
     */
    rightAngles: false
  },
  class: {
    arrowMarkerAbsolute: false
  },
  git: {
    arrowMarkerAbsolute: false
  },
  state: {
    dividerMargin: 10,
    sizeUnit: 5,
    padding: 8,
    textHeight: 10,
    titleShift: -15,
    noteMargin: 10,
    forkWidth: 70,
    forkHeight: 7,
    // Used
    miniPadding: 2,
    // Font size factor, this is used to guess the width of the edges labels before rendering by dagre
    // layout. This might need updating if/when switching font
    fontSizeFactor: 5.02,
    fontSize: 24,
    labelHeight: 16,
    edgeLengthFactor: '20',
    compositTitleSize: 35,
    radius: 5
  },

  /**
   * The object containing configurations specific for entity relationship diagrams
   */
  er: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramPadding | amount of padding around the diagram as a whole | Integer | Required | Any Positive Value |
     *
     ***Notes:**The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     ***Default value: 20**.
     */
    diagramPadding: 20,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| layoutDirection | Directional bias for layout of entities. | String | Required | "TB", "BT","LR","RL" |
     *
     ***Notes:**
     *'TB' for Top-Bottom, 'BT'for Bottom-Top, 'LR' for Left-Right, or 'RL' for Right to Left.
     * T = top, B = bottom, L = left, and R = right.
     ***Default value: TB **.
     */
    layoutDirection: 'TB',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| minEntityWidth | The mimimum width of an entity box, | Integer | Required| Any Positive Value  |
     *
     ***Notes:**expressed in pixels
     ***Default value: 100**.
     */
    minEntityWidth: 100,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| minEntityHeight| The minimum height of an entity box, | Integer | 4 | Any Positive Value |
     *
     ***Notes:**expressed in pixels
     ***Default value: 75 **
     */
    minEntityHeight: 75,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| entityPadding|minimum internal padding betweentext in box and  box borders| Integer | 4 | Any Positive Value |
     *
     ***Notes:**The minimum internal padding betweentext in an entity box and the enclosing box borders, expressed in pixels.
     ***Default value: 15 **
     */
    entityPadding: 15,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| stroke | Stroke color of box edges and lines | String | 4 | Any recognized color |
     ***Default value: gray **
     */
    stroke: 'gray',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fill | Fill color of entity boxes | String | 4 | Any recognized color |
     *
     ***Notes:**
     ***Default value:'honeydew'**
     */
    fill: 'honeydew',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontSize| Font Size in pixels| Integer |  | Any Positive Value |
     *
     ***Notes:**Font size (expressed as an integer representing a number of  pixels)
     ***Default value: 12 **
     */
    fontSize: 12
  }
};
config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
config.git.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
var defaultConfig = Object.freeze(config);
var siteConfig = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])({}, defaultConfig);
var currentConfig = Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])({}, defaultConfig);
/**
 *## setSiteConfig
  
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request | Any Values, except ones in secure array|
 
 ***Notes:**
 *Sets the siteConfig. The siteConfig is a protected configuration for repeat use. Calls to reset() will reset
 *the currentConfig to siteConfig. Calls to reset(configApi.defaultConfig) will reset siteConfig and currentConfig
 *to the defaultConfig
 *Note: currentConfig is set in this function
  
 **Default value: At default, will mirror Global Config**
 * @param conf - the base currentConfig to use as siteConfig
 * @returns {*} - the siteConfig
 */

var setSiteConfig = function setSiteConfig(conf) {
  Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])(currentConfig, conf, {
    clobber: true
  });
  Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])(siteConfig, conf);
  return getSiteConfig();
};
/**
 *## getSiteConfig
 *| Function | Description         | Type    |  Values             |
 *| --------- | ------------------- | ------- |  ------------------ |
 *| setSiteConfig|Returns the current siteConfig base configuration | Get Request | Returns Any Values  in siteConfig|
  
 ***Notes**:
 *Returns **any** values in siteConfig.
 * @returns {*}
 */

var getSiteConfig = function getSiteConfig() {
  return Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])({}, siteConfig);
};
/**
 *## setConfig
 *| Function  | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request| Any Values, except ones in secure array|
  
  
 ***Notes**:
 *Sets the currentConfig. The parameter conf is sanitized based on the siteConfig.secure keys. Any
 *values found in conf with key found in siteConfig.secure will be replaced with the corresponding
 *siteConfig value.
 * @param conf - the potential currentConfig
 * @returns {*} - the currentConfig merged with the sanitized conf
 */

var setConfig = function setConfig(conf) {
  sanitize(conf);
  Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])(currentConfig, conf);
  return getConfig();
};
/**
 *   ## getConfig
 *| Function  | Description         | Type    | Return Values            |
 *| --------- | ------------------- | ------- | ------------------ |
 *| getConfig |Obtains the currentConfig | Get Request | Any Values from currentConfig|
  
 ***Notes**:
 *Returns **any** the currentConfig
 * @returns {*} - the currentConfig
 */

var getConfig = function getConfig() {
  return Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])({}, currentConfig);
};
/**
 *## sanitize
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| sanitize  |Sets the siteConfig to desired values. | Put Request |None|
  
 *Ensures options parameter does not attempt to override siteConfig secure keys
 *Note: modifies options in-place
 * @param options - the potential setConfig parameter
 */

var sanitize = function sanitize(options) {
  Object.keys(siteConfig.secure).forEach(function (key) {
    if (typeof options[siteConfig.secure[key]] !== 'undefined') {
      // DO NOT attempt to print options[siteConfig.secure[key]] within `${}` as a malicious script
      // can exploit the logger's attempt to stringify the value and execute arbitrary code
      _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].warn("Denied attempt to modify a secure key ".concat(siteConfig.secure[key]), options[siteConfig.secure[key]]);
      delete options[siteConfig.secure[key]];
    }
  });
};
/**
 *## reset
  
 *| Function | Description         | Type    | Required | Values             |
 *| --------- | ------------------- | ------- | -------- | ------------------ |
 *| reset|Resets currentConfig to conf| Put Request | Required | None|
 *
 *| Parameter | Description |Type | Required | Values|
 *| --- | --- | --- | --- | --- |
 *| conf| base set of values, which currentConfig coul be **reset** to.| Dictionary | Required | Any Values, with respect to the secure Array|
 *
 **Notes :
 (default: current siteConfig ) (optional, default `getSiteConfig()`)
 * @param conf - the base currentConfig to reset to (default: current siteConfig )
 */

var reset = function reset() {
  var conf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getSiteConfig();
  Object.keys(siteConfig).forEach(function (key) {
    return delete siteConfig[key];
  });
  Object.keys(currentConfig).forEach(function (key) {
    return delete currentConfig[key];
  });
  Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])(siteConfig, conf, {
    clobber: true
  });
  Object(_utils__WEBPACK_IMPORTED_MODULE_0__["assignWithDepth"])(currentConfig, conf, {
    clobber: true
  });
};
var configApi = Object.freeze({
  sanitize: sanitize,
  setSiteConfig: setSiteConfig,
  getSiteConfig: getSiteConfig,
  setConfig: setConfig,
  getConfig: getConfig,
  reset: reset,
  defaultConfig: defaultConfig
});
/* harmony default export */ __webpack_exports__["default"] = (configApi);

/***/ }),

/***/ "./src/dagre-wrapper/clusters.js":
/*!***************************************!*\
  !*** ./src/dagre-wrapper/clusters.js ***!
  \***************************************/
/*! exports provided: insertCluster, getClusterTitleWidth, clear, positionCluster */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertCluster", function() { return insertCluster; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClusterTitleWidth", function() { return getClusterTitleWidth; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "positionCluster", function() { return positionCluster; });
/* harmony import */ var _intersect_intersect_rect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intersect/intersect-rect */ "./src/dagre-wrapper/intersect/intersect-rect.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/* harmony import */ var _createLabel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./createLabel */ "./src/dagre-wrapper/createLabel.js");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config */ "./src/config.js");

 // eslint-disable-line





var rect = function rect(parent, node) {
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].trace('Creating subgraph rect for ', node.id, node); // Add outer g element

  var shapeSvg = parent.insert('g').attr('class', 'cluster').attr('id', node.id); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child'); // Create the label and insert it after the rect

  var label = shapeSvg.insert('g').attr('class', 'cluster-label');
  var text = label.node().appendChild(Object(_createLabel__WEBPACK_IMPORTED_MODULE_2__["default"])(node.labelText, node.labelStyle, undefined, true)); // Get the size of the label

  var bbox = text.getBBox();

  if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
    var div = text.children[0];
    var dv = Object(d3__WEBPACK_IMPORTED_MODULE_3__["select"])(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  var padding = 0 * node.padding;
  var halfPadding = padding / 2;
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].trace('Data ', node, JSON.stringify(node)); // center the rect around its coordinate

  rect.attr('rx', node.rx).attr('ry', node.ry).attr('x', node.x - node.width / 2 - halfPadding).attr('y', node.y - node.height / 2 - halfPadding).attr('width', node.width + padding).attr('height', node.height + padding); // Center the label

  label.attr('transform', 'translate(' + (node.x - bbox.width / 2) + ', ' + (node.y - node.height / 2 - node.padding / 3 + 3) + ')');
  var rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return Object(_intersect_intersect_rect__WEBPACK_IMPORTED_MODULE_0__["default"])(node, point);
  };

  return shapeSvg;
};
/**
 * Non visiable cluster where the note is group with its
 */


var noteGroup = function noteGroup(parent, node) {
  // Add outer g element
  var shapeSvg = parent.insert('g').attr('class', 'note-cluster').attr('id', node.id); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child');
  var padding = 0 * node.padding;
  var halfPadding = padding / 2; // center the rect around its coordinate

  rect.attr('rx', node.rx).attr('ry', node.ry).attr('x', node.x - node.width / 2 - halfPadding).attr('y', node.y - node.height / 2 - halfPadding).attr('width', node.width + padding).attr('height', node.height + padding).attr('fill', 'none');
  var rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return Object(_intersect_intersect_rect__WEBPACK_IMPORTED_MODULE_0__["default"])(node, point);
  };

  return shapeSvg;
};

var roundedWithTitle = function roundedWithTitle(parent, node) {
  // Add outer g element
  var shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child'); // Create the label and insert it after the rect

  var label = shapeSvg.insert('g').attr('class', 'cluster-label');
  var innerRect = shapeSvg.append('rect');
  var text = label.node().appendChild(Object(_createLabel__WEBPACK_IMPORTED_MODULE_2__["default"])(node.labelText, node.labelStyle, undefined, true)); // Get the size of the label

  var bbox = text.getBBox();

  if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
    var div = text.children[0];
    var dv = Object(d3__WEBPACK_IMPORTED_MODULE_3__["select"])(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  bbox = text.getBBox();
  var padding = 0 * node.padding;
  var halfPadding = padding / 2; // center the rect around its coordinate

  rect.attr('class', 'outer').attr('x', node.x - node.width / 2 - halfPadding).attr('y', node.y - node.height / 2 - halfPadding).attr('width', node.width + padding).attr('height', node.height + padding);
  innerRect.attr('class', 'inner').attr('x', node.x - node.width / 2 - halfPadding).attr('y', node.y - node.height / 2 - halfPadding + bbox.height - 1).attr('width', node.width + padding).attr('height', node.height + padding - bbox.height - 3); // Center the label

  label.attr('transform', 'translate(' + (node.x - bbox.width / 2) + ', ' + (node.y - node.height / 2 - node.padding / 3 + (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels ? 5 : 3)) + ')');
  var rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return Object(_intersect_intersect_rect__WEBPACK_IMPORTED_MODULE_0__["default"])(node, point);
  };

  return shapeSvg;
};

var divider = function divider(parent, node) {
  // Add outer g element
  var shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child');
  var padding = 0 * node.padding;
  var halfPadding = padding / 2; // center the rect around its coordinate

  rect.attr('class', 'divider').attr('x', node.x - node.width / 2 - halfPadding).attr('y', node.y - node.height / 2).attr('width', node.width + padding).attr('height', node.height + padding);
  var rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return Object(_intersect_intersect_rect__WEBPACK_IMPORTED_MODULE_0__["default"])(node, point);
  };

  return shapeSvg;
};

var shapes = {
  rect: rect,
  roundedWithTitle: roundedWithTitle,
  noteGroup: noteGroup,
  divider: divider
};
var clusterElems = {};
var insertCluster = function insertCluster(elem, node) {
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].trace('Inserting cluster');
  var shape = node.shape || 'rect';
  clusterElems[node.id] = shapes[shape](elem, node);
};
var getClusterTitleWidth = function getClusterTitleWidth(elem, node) {
  var label = Object(_createLabel__WEBPACK_IMPORTED_MODULE_2__["default"])(node.labelText, node.labelStyle, undefined, true);
  elem.node().appendChild(label);
  var width = label.getBBox().width;
  elem.node().removeChild(label);
  return width;
};
var clear = function clear() {
  clusterElems = {};
};
var positionCluster = function positionCluster(node) {
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].info('Position cluster');
  var el = clusterElems[node.id];
  el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};

/***/ }),

/***/ "./src/dagre-wrapper/createLabel.js":
/*!******************************************!*\
  !*** ./src/dagre-wrapper/createLabel.js ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config.js");

 // eslint-disable-line
// let vertexNode;
// if (getConfig().flowchart.htmlLabels) {
//   // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
//   const node = {
//     label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, s => `<i class='${s.replace(':', ' ')}'></i>`)
//   };
//   vertexNode = addHtmlLabel(svg, node).node();
//   vertexNode.parentNode.removeChild(vertexNode);
// } else {
//   const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//   svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
//   const rows = vertexText.split(common.lineBreakRegex);
//   for (let j = 0; j < rows.length; j++) {
//     const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//     tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
//     tspan.setAttribute('dy', '1em');
//     tspan.setAttribute('x', '1');
//     tspan.textContent = rows[j];
//     svgLabel.appendChild(tspan);
//   }
//   vertexNode = svgLabel;
// }



function applyStyle(dom, styleFn) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

function addHtmlLabel(node) {
  // var fo = root.append('foreignObject').attr('width', '100000');
  // var div = fo.append('xhtml:div');
  // div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  // var label = node.label;
  // switch (typeof label) {
  //   case 'function':
  //     div.insert(label);
  //     break;
  //   case 'object':
  //     // Currently we assume this is a DOM object.
  //     div.insert(function() {
  //       return label;
  //     });
  //     break;
  //   default:
  //     div.html(label);
  // }
  // applyStyle(div, node.labelStyle);
  // div.style('display', 'inline-block');
  // // Fix for firefox
  // div.style('white-space', 'nowrap');
  // var client = div.node().getBoundingClientRect();
  // fo.attr('width', client.width).attr('height', client.height);
  var fo = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
  var div = fo.append('xhtml:div');
  var label = node.label;
  var labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  div.html('<span class="' + labelClass + '">' + label + '</span>');
  applyStyle(div, node.labelStyle);
  div.style('display', 'inline-block'); // Fix for firefox

  div.style('white-space', 'nowrap');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  return fo.node();
}

var createLabel = function createLabel(_vertexText, style, isTitle, isNode) {
  var vertexText = _vertexText || '';

  if (Object(_config__WEBPACK_IMPORTED_MODULE_2__["getConfig"])().flowchart.htmlLabels) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    vertexText = vertexText.replace(/\\n|\n/g, '<br />');
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].info('vertexText' + vertexText);
    var node = {
      isNode: isNode,
      label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, function (s) {
        return "<i class='".concat(s.replace(':', ' '), "'></i>");
      })
    };
    var vertexNode = addHtmlLabel(node); // vertexNode.parentNode.removeChild(vertexNode);

    return vertexNode;
  } else {
    var svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
    var rows = [];

    if (typeof vertexText === 'string') {
      rows = vertexText.split(/\\n|\n|<br\s*\/?>/gi);
    } else if (Array.isArray(vertexText)) {
      rows = vertexText;
    } else {
      rows = [];
    }

    for (var j = 0; j < rows.length; j++) {
      var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      tspan.setAttribute('dy', '1em');
      tspan.setAttribute('x', '0');

      if (isTitle) {
        tspan.setAttribute('class', 'title-row');
      } else {
        tspan.setAttribute('class', 'row');
      }

      tspan.textContent = rows[j].trim();
      svgLabel.appendChild(tspan);
    }

    return svgLabel;
  }
};

/* harmony default export */ __webpack_exports__["default"] = (createLabel);

/***/ }),

/***/ "./src/dagre-wrapper/edges.js":
/*!************************************!*\
  !*** ./src/dagre-wrapper/edges.js ***!
  \************************************/
/*! exports provided: clear, insertEdgeLabel, positionEdgeLabel, intersection, insertEdge */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertEdgeLabel", function() { return insertEdgeLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "positionEdgeLabel", function() { return positionEdgeLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intersection", function() { return intersection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertEdge", function() { return insertEdge; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/* harmony import */ var _createLabel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./createLabel */ "./src/dagre-wrapper/createLabel.js");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../config */ "./src/config.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
 // eslint-disable-line




 // import { calcLabelPosition } from '../utils';

var edgeLabels = {};
var clear = function clear() {
  edgeLabels = {};
};
var insertEdgeLabel = function insertEdgeLabel(elem, edge) {
  // Create the actual text element
  var labelElement = Object(_createLabel__WEBPACK_IMPORTED_MODULE_1__["default"])(edge.label, edge.labelStyle); // Create outer g, edgeLabel, this will be positioned after graph layout

  var edgeLabel = elem.insert('g').attr('class', 'edgeLabel'); // Create inner g, label, this will be positioned now for centering the text

  var label = edgeLabel.insert('g').attr('class', 'label');
  label.node().appendChild(labelElement); // Center the label

  var bbox = labelElement.getBBox();

  if (Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().flowchart.htmlLabels) {
    var div = labelElement.children[0];
    var dv = Object(d3__WEBPACK_IMPORTED_MODULE_2__["select"])(labelElement);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')'); // Make element accessible by id for positioning

  edgeLabels[edge.id] = edgeLabel; // Update the abstract data of the edge with the new information about its width and height

  edge.width = bbox.width;
  edge.height = bbox.height;
};
var positionEdgeLabel = function positionEdgeLabel(edge, points) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Moving label', edge.id, edge.label, edgeLabels[edge.id]);

  if (edge.label) {
    var el = edgeLabels[edge.id];
    var x = edge.x;
    var y = edge.y;

    if (points) {
      // debugger;
      var pos = _utils__WEBPACK_IMPORTED_MODULE_4__["default"].calcLabelPosition(points);
      x = pos.x;
      y = pos.y;
    }

    el.attr('transform', 'translate(' + x + ', ' + y + ')');
  }
}; // const getRelationType = function(type) {
//   switch (type) {
//     case stateDb.relationType.AGGREGATION:
//       return 'aggregation';
//     case stateDb.relationType.EXTENSION:
//       return 'extension';
//     case stateDb.relationType.COMPOSITION:
//       return 'composition';
//     case stateDb.relationType.DEPENDENCY:
//       return 'dependency';
//   }
// };

var outsideNode = function outsideNode(node, point) {
  // logger.warn('Checking bounds ', node, point);
  var x = node.x;
  var y = node.y;
  var dx = Math.abs(point.x - x);
  var dy = Math.abs(point.y - y);
  var w = node.width / 2;
  var h = node.height / 2;

  if (dx >= w || dy >= h) {
    return true;
  }

  return false;
};

var intersection = function intersection(node, outsidePoint, insidePoint) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('intersection calc o:', outsidePoint, ' i:', insidePoint, node);
  var x = node.x;
  var y = node.y;
  var dx = Math.abs(x - insidePoint.x);
  var w = node.width / 2;
  var r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  var h = node.height / 2;
  var edges = {
    x1: x - w,
    x2: x + w,
    y1: y - h,
    y2: y + h
  };

  if (outsidePoint.x === edges.x1 || outsidePoint.x === edges.x2 || outsidePoint.y === edges.y1 || outsidePoint.y === edges.y2) {
    // logger.warn('calc equals on edge');
    return outsidePoint;
  }

  var Q = Math.abs(outsidePoint.y - insidePoint.y);
  var R = Math.abs(outsidePoint.x - insidePoint.x); // log.warn();

  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) {
    // eslint-disable-line
    // Intersection is top or bottom of rect.
    // let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    var q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    r = R * q / Q;
    var res = {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - r,
      y: outsidePoint.y + q
    };
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn("topp/bott calc, Q ".concat(Q, ", q ").concat(q, ", R ").concat(R, ", r ").concat(r), res);
    return res;
  } else {
    // Intersection onn sides of rect
    // q = (Q * r) / R;
    // q = 2;
    // r = (R * q) / Q;
    if (insidePoint.x < outsidePoint.x) {
      r = outsidePoint.x - w - x;
    } else {
      // r = outsidePoint.x - w - x;
      r = x - w - outsidePoint.x;
    }

    var _q = _q = Q * r / R;

    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn("sides calc, Q ".concat(Q, ", q ").concat(_q, ", R ").concat(R, ", r ").concat(r), {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + _q : insidePoint.y - _q
    });
    return {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + _q : insidePoint.y - _q
    };
  }
}; //(edgePaths, e, edge, clusterDb, diagramtype, graph)

var insertEdge = function insertEdge(elem, e, edge, clusterDb, diagramType, graph) {
  var points = edge.points;
  var pointsHasChanged = false;
  var tail = graph.node(e.v);
  var head = graph.node(e.w);

  if (head.intersect && tail.intersect) {
    points = points.slice(1, edge.points.length - 1);
    points.unshift(tail.intersect(points[0]));
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Last point', points[points.length - 1], head, head.intersect(points[points.length - 1]));
    points.push(head.intersect(points[points.length - 1]));
  }

  if (edge.toCluster) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('edge', edge);
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('to cluster', clusterDb[edge.toCluster]);
    points = [];
    var lastPointOutside;
    var isInside = false;
    edge.points.forEach(function (point) {
      var node = clusterDb[edge.toCluster].node;

      if (!outsideNode(node, point) && !isInside) {
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('inside', edge.toCluster, point, lastPointOutside); // First point inside the rect

        var insterection = intersection(node, lastPointOutside, point);
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('intersect', insterection);
        points.push(insterection);
        isInside = true;
      } else {
        if (!isInside) points.push(point);
      }

      lastPointOutside = point;
    });
    pointsHasChanged = true;
  }

  if (edge.fromCluster) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('edge', edge);
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('from cluster', clusterDb[edge.fromCluster]);
    var updatedPoints = [];

    var _lastPointOutside;

    var _isInside = false;

    for (var i = points.length - 1; i >= 0; i--) {
      var point = points[i];
      var node = clusterDb[edge.fromCluster].node;

      if (!outsideNode(node, point) && !_isInside) {
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('inside', edge.fromCluster, point, node); // First point inside the rect

        var insterection = intersection(node, _lastPointOutside, point); // logger.trace('intersect', intersection(node, lastPointOutside, point));

        updatedPoints.unshift(insterection); // points.push(insterection);

        _isInside = true;
      } else {
        // at the outside
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Outside point', point);
        if (!_isInside) updatedPoints.unshift(point);
      }

      _lastPointOutside = point;
    }

    points = updatedPoints;
    pointsHasChanged = true;
  } // The data for our line


  var lineData = points.filter(function (p) {
    return !Number.isNaN(p.y);
  }); // This is the accessor function we talked about above

  var lineFunction = Object(d3__WEBPACK_IMPORTED_MODULE_2__["line"])().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_2__["curveBasis"]); // Contruct stroke classes based on properties

  var strokeClasses;

  switch (edge.thickness) {
    case 'normal':
      strokeClasses = 'edge-thickness-normal';
      break;

    case 'thick':
      strokeClasses = 'edge-thickness-thick';
      break;

    default:
      strokeClasses = '';
  }

  switch (edge.pattern) {
    case 'solid':
      strokeClasses += ' edge-pattern-solid';
      break;

    case 'dotted':
      strokeClasses += ' edge-pattern-dotted';
      break;

    case 'dashed':
      strokeClasses += ' edge-pattern-dashed';
      break;
  }

  var svgPath = elem.append('path').attr('d', lineFunction(lineData)).attr('id', edge.id).attr('class', ' ' + strokeClasses + (edge.classes ? ' ' + edge.classes : '')); // DEBUG code, adds a red circle at each edge coordinate
  // edge.points.forEach(point => {
  //   elem
  //     .append('circle')
  //     .style('stroke', 'red')
  //     .style('fill', 'red')
  //     .attr('r', 1)
  //     .attr('cx', point.x)
  //     .attr('cy', point.y);
  // });

  var url = '';

  if (Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().state.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('arrowType', edge.arrowType);

  switch (edge.arrowType) {
    case 'arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      break;

    case 'double_arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-crossStart' + ')');
      break;

    case 'arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      break;

    case 'double_arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-pointStart' + ')');
      break;

    case 'arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barbEnd' + ')');
      break;

    case 'double_arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barnEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-barbStart' + ')');
      break;

    case 'arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      break;

    case 'double_arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-circleStart' + ')');
      break;

    default:
  }

  if (pointsHasChanged) {
    return points;
  }
};

/***/ }),

/***/ "./src/dagre-wrapper/index.js":
/*!************************************!*\
  !*** ./src/dagre-wrapper/index.js ***!
  \************************************/
/*! exports provided: render */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _markers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./markers */ "./src/dagre-wrapper/markers.js");
/* harmony import */ var _shapes_util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shapes/util */ "./src/dagre-wrapper/shapes/util.js");
/* harmony import */ var _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./mermaid-graphlib */ "./src/dagre-wrapper/mermaid-graphlib.js");
/* harmony import */ var _nodes__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./nodes */ "./src/dagre-wrapper/nodes.js");
/* harmony import */ var _clusters__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./clusters */ "./src/dagre-wrapper/clusters.js");
/* harmony import */ var _edges__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./edges */ "./src/dagre-wrapper/edges.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../logger */ "./src/logger.js");










var recursiveRender = function recursiveRender(_elem, graph, diagramtype, parentCluster) {
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('Graph in recursive render:', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph), parentCluster);
  var dir = graph.graph().rankdir;
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].warn('Dir in recursive render - dir:', dir);

  var elem = _elem.insert('g').attr('class', 'root'); // eslint-disable-line


  if (!graph.nodes()) {
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('No nodes found for', graph);
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Recursive render', graph.nodes());
  }

  if (graph.edges().length > 0) {
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Recursive edges', graph.edge(graph.edges()[0]));
  }

  var clusters = elem.insert('g').attr('class', 'clusters'); // eslint-disable-line

  var edgePaths = elem.insert('g').attr('class', 'edgePaths');
  var edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  var nodes = elem.insert('g').attr('class', 'nodes'); // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout

  graph.nodes().forEach(function (v) {
    var node = graph.node(v);

    if (typeof parentCluster !== 'undefined') {
      var data = JSON.parse(JSON.stringify(parentCluster.clusterData)); // data.clusterPositioning = true;

      _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Setting data for cluster', data);
      graph.setNode(parentCluster.id, data);
      graph.setParent(v, parentCluster.id, data);
    }

    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('(Insert) Node ' + v + ': ' + JSON.stringify(graph.node(v)));

    if (node && node.clusterNode) {
      // const children = graph.children(v);
      _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Cluster identified', v, node, graph.node(v));
      var newEl = recursiveRender(nodes, node.graph, diagramtype, graph.node(v));
      Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, newEl);
      Object(_nodes__WEBPACK_IMPORTED_MODULE_5__["setNodeElem"])(newEl, node);
      _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].warn('Recursive render complete', newEl, node);
    } else {
      if (graph.children(v).length > 0) {
        // This is a cluster but not to be rendered recusively
        // Render as before
        _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Cluster - the non recursive path', v, node.id, node, graph);
        _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace(Object(_mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["findNonClusterChild"])(node.id, graph));
        _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"][node.id] = {
          id: Object(_mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["findNonClusterChild"])(node.id, graph),
          node: node
        }; // insertCluster(clusters, graph.node(v));
      } else {
        _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Node - the non recursive path', v, node.id, node);
        Object(_nodes__WEBPACK_IMPORTED_MODULE_5__["insertNode"])(nodes, graph.node(v), dir);
      }
    }
  }); // Insert labels, this will insert them into the dom so that the width can be calculated
  // Also figure out which edges point to/from clusters and adjust them accordingly
  // Edges from/to clusters really points to the first child in the cluster.
  // TODO: pick optimal child in the cluster to us as link anchor

  graph.edges().forEach(function (e) {
    var edge = graph.edge(e.v, e.w, e.name);
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Edge ' + e.v + ' -> ' + e.w + ': ', e, ' ', JSON.stringify(graph.edge(e))); // Check if link is either from or to a cluster

    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Fix', _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"], 'ids:', e.v, e.w, 'Translateing: ', _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"][e.v], _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"][e.w]);
    Object(_edges__WEBPACK_IMPORTED_MODULE_7__["insertEdgeLabel"])(edgeLabels, edge);
  });
  graph.edges().forEach(function (e) {
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
  });
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('#############################################');
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('###                Layout                 ###');
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('#############################################');
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info(graph);
  dagre__WEBPACK_IMPORTED_MODULE_0___default.a.layout(graph);
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Graph after layout:', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph)); // Move the nodes to the correct place

  graph.nodes().forEach(function (v) {
    var node = graph.node(v);
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].trace('Position ' + v + ': ' + JSON.stringify(graph.node(v)));
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('Position ' + v + ': (' + node.x, ',' + node.y, ') width: ', node.width, ' height: ', node.height);

    if (node && node.clusterNode) {
      // clusterDb[node.id].node = node;
      Object(_nodes__WEBPACK_IMPORTED_MODULE_5__["positionNode"])(node);
    } else {
      // Non cluster node
      if (graph.children(v).length > 0) {
        // A cluster in the non-recurive way
        // positionCluster(node);
        Object(_clusters__WEBPACK_IMPORTED_MODULE_6__["insertCluster"])(clusters, node);
        _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"][node.id].node = node;
      } else {
        Object(_nodes__WEBPACK_IMPORTED_MODULE_5__["positionNode"])(node);
      }
    }
  }); // Move the edge labels to the correct place after layout

  graph.edges().forEach(function (e) {
    var edge = graph.edge(e);
    _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);
    var updatedPath = Object(_edges__WEBPACK_IMPORTED_MODULE_7__["insertEdge"])(edgePaths, e, edge, _mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clusterDb"], diagramtype, graph);
    Object(_edges__WEBPACK_IMPORTED_MODULE_7__["positionEdgeLabel"])(edge, updatedPath);
  });
  return elem;
};

var render = function render(elem, graph, markers, diagramtype, id) {
  Object(_markers__WEBPACK_IMPORTED_MODULE_2__["default"])(elem, markers, diagramtype, id);
  Object(_nodes__WEBPACK_IMPORTED_MODULE_5__["clear"])();
  Object(_edges__WEBPACK_IMPORTED_MODULE_7__["clear"])();
  Object(_clusters__WEBPACK_IMPORTED_MODULE_6__["clear"])();
  Object(_mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["clear"])();
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].warn('Graph before:', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph));
  Object(_mermaid_graphlib__WEBPACK_IMPORTED_MODULE_4__["adjustClustersAndEdges"])(graph);
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].warn('Graph after:', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph));
  _logger__WEBPACK_IMPORTED_MODULE_8__["logger"].warn('Graph ever  after:', graph.graph());
  recursiveRender(elem, graph, diagramtype);
}; // const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };
// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };

/***/ }),

/***/ "./src/dagre-wrapper/intersect/index.js":
/*!**********************************************!*\
  !*** ./src/dagre-wrapper/intersect/index.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _intersect_node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intersect-node.js */ "./src/dagre-wrapper/intersect/intersect-node.js");
/* harmony import */ var _intersect_node_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_intersect_node_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _intersect_circle_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./intersect-circle.js */ "./src/dagre-wrapper/intersect/intersect-circle.js");
/* harmony import */ var _intersect_ellipse_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./intersect-ellipse.js */ "./src/dagre-wrapper/intersect/intersect-ellipse.js");
/* harmony import */ var _intersect_polygon_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./intersect-polygon.js */ "./src/dagre-wrapper/intersect/intersect-polygon.js");
/* harmony import */ var _intersect_rect_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./intersect-rect.js */ "./src/dagre-wrapper/intersect/intersect-rect.js");
/*
 * Borrowed with love from from dagrge-d3. Many thanks to cpettitt!
 */





/* harmony default export */ __webpack_exports__["default"] = ({
  node: _intersect_node_js__WEBPACK_IMPORTED_MODULE_0___default.a,
  circle: _intersect_circle_js__WEBPACK_IMPORTED_MODULE_1__["default"],
  ellipse: _intersect_ellipse_js__WEBPACK_IMPORTED_MODULE_2__["default"],
  polygon: _intersect_polygon_js__WEBPACK_IMPORTED_MODULE_3__["default"],
  rect: _intersect_rect_js__WEBPACK_IMPORTED_MODULE_4__["default"]
});

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-circle.js":
/*!*********************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-circle.js ***!
  \*********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _intersect_ellipse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intersect-ellipse */ "./src/dagre-wrapper/intersect/intersect-ellipse.js");


function intersectCircle(node, rx, point) {
  return Object(_intersect_ellipse__WEBPACK_IMPORTED_MODULE_0__["default"])(node, rx, rx, point);
}

/* harmony default export */ __webpack_exports__["default"] = (intersectCircle);

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-ellipse.js":
/*!**********************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-ellipse.js ***!
  \**********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function intersectEllipse(node, rx, ry, point) {
  // Formulae from: http://mathworld.wolfram.com/Ellipse-LineIntersection.html
  var cx = node.x;
  var cy = node.y;
  var px = cx - point.x;
  var py = cy - point.y;
  var det = Math.sqrt(rx * rx * py * py + ry * ry * px * px);
  var dx = Math.abs(rx * ry * px / det);

  if (point.x < cx) {
    dx = -dx;
  }

  var dy = Math.abs(rx * ry * py / det);

  if (point.y < cy) {
    dy = -dy;
  }

  return {
    x: cx + dx,
    y: cy + dy
  };
}

/* harmony default export */ __webpack_exports__["default"] = (intersectEllipse);

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-line.js":
/*!*******************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-line.js ***!
  \*******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/*
 * Returns the point at which two lines, p and q, intersect or returns
 * undefined if they do not intersect.
 */
function intersectLine(p1, p2, q1, q2) {
  // Algorithm from J. Avro, (ed.) Graphics Gems, No 2, Morgan Kaufmann, 1994,
  // p7 and p473.
  var a1, a2, b1, b2, c1, c2;
  var r1, r2, r3, r4;
  var denom, offset, num;
  var x, y; // Compute a1, b1, c1, where line joining points 1 and 2 is F(x,y) = a1 x +
  // b1 y + c1 = 0.

  a1 = p2.y - p1.y;
  b1 = p1.x - p2.x;
  c1 = p2.x * p1.y - p1.x * p2.y; // Compute r3 and r4.

  r3 = a1 * q1.x + b1 * q1.y + c1;
  r4 = a1 * q2.x + b1 * q2.y + c1; // Check signs of r3 and r4. If both point 3 and point 4 lie on
  // same side of line 1, the line segments do not intersect.

  if (r3 !== 0 && r4 !== 0 && sameSign(r3, r4)) {
    return;
  } // Compute a2, b2, c2 where line joining points 3 and 4 is G(x,y) = a2 x + b2 y + c2 = 0


  a2 = q2.y - q1.y;
  b2 = q1.x - q2.x;
  c2 = q2.x * q1.y - q1.x * q2.y; // Compute r1 and r2

  r1 = a2 * p1.x + b2 * p1.y + c2;
  r2 = a2 * p2.x + b2 * p2.y + c2; // Check signs of r1 and r2. If both point 1 and point 2 lie
  // on same side of second line segment, the line segments do
  // not intersect.

  if (r1 !== 0 && r2 !== 0 && sameSign(r1, r2)) {
    return;
  } // Line segments intersect: compute intersection point.


  denom = a1 * b2 - a2 * b1;

  if (denom === 0) {
    return;
  }

  offset = Math.abs(denom / 2); // The denom/2 is to get rounding instead of truncating. It
  // is added or subtracted to the numerator, depending upon the
  // sign of the numerator.

  num = b1 * c2 - b2 * c1;
  x = num < 0 ? (num - offset) / denom : (num + offset) / denom;
  num = a2 * c1 - a1 * c2;
  y = num < 0 ? (num - offset) / denom : (num + offset) / denom;
  return {
    x: x,
    y: y
  };
}

function sameSign(r1, r2) {
  return r1 * r2 > 0;
}

/* harmony default export */ __webpack_exports__["default"] = (intersectLine);

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-node.js":
/*!*******************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-node.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = intersectNode;

function intersectNode(node, point) {
  console.info('Intersect Node');
  return node.intersect(point);
}

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-polygon.js":
/*!**********************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-polygon.js ***!
  \**********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _intersect_line__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intersect-line */ "./src/dagre-wrapper/intersect/intersect-line.js");
/* eslint "no-console": off */

/* harmony default export */ __webpack_exports__["default"] = (intersectPolygon);
/*
 * Returns the point ({x, y}) at which the point argument intersects with the
 * node argument assuming that it has the shape specified by polygon.
 */

function intersectPolygon(node, polyPoints, point) {
  var x1 = node.x;
  var y1 = node.y;
  var intersections = [];
  var minX = Number.POSITIVE_INFINITY;
  var minY = Number.POSITIVE_INFINITY;
  polyPoints.forEach(function (entry) {
    minX = Math.min(minX, entry.x);
    minY = Math.min(minY, entry.y);
  });
  var left = x1 - node.width / 2 - minX;
  var top = y1 - node.height / 2 - minY;

  for (var i = 0; i < polyPoints.length; i++) {
    var p1 = polyPoints[i];
    var p2 = polyPoints[i < polyPoints.length - 1 ? i + 1 : 0];
    var intersect = Object(_intersect_line__WEBPACK_IMPORTED_MODULE_0__["default"])(node, point, {
      x: left + p1.x,
      y: top + p1.y
    }, {
      x: left + p2.x,
      y: top + p2.y
    });

    if (intersect) {
      intersections.push(intersect);
    }
  }

  if (!intersections.length) {
    console.log('NO INTERSECTION FOUND, RETURN NODE CENTER', node);
    return node;
  }

  if (intersections.length > 1) {
    // More intersections, find the one nearest to edge end point
    intersections.sort(function (p, q) {
      var pdx = p.x - point.x;
      var pdy = p.y - point.y;
      var distp = Math.sqrt(pdx * pdx + pdy * pdy);
      var qdx = q.x - point.x;
      var qdy = q.y - point.y;
      var distq = Math.sqrt(qdx * qdx + qdy * qdy);
      return distp < distq ? -1 : distp === distq ? 0 : 1;
    });
  }

  return intersections[0];
}

/***/ }),

/***/ "./src/dagre-wrapper/intersect/intersect-rect.js":
/*!*******************************************************!*\
  !*** ./src/dagre-wrapper/intersect/intersect-rect.js ***!
  \*******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var intersectRect = function intersectRect(node, point) {
  var x = node.x;
  var y = node.y; // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes

  var dx = point.x - x;
  var dy = point.y - y;
  var w = node.width / 2;
  var h = node.height / 2;
  var sx, sy;

  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }

    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }

    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {
    x: x + sx,
    y: y + sy
  };
};

/* harmony default export */ __webpack_exports__["default"] = (intersectRect);

/***/ }),

/***/ "./src/dagre-wrapper/markers.js":
/*!**************************************!*\
  !*** ./src/dagre-wrapper/markers.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
 // Only add the number of markers that the diagram needs

var insertMarkers = function insertMarkers(elem, markerArray, type, id) {
  markerArray.forEach(function (markerName) {
    markers[markerName](elem, type, id);
  });
};

var extension = function extension(elem, type, id) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Making markers for ', id);
  elem.append('defs').append('marker').attr('id', type + '-extensionStart').attr('class', 'marker extension ' + type).attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 1,7 L18,13 V 1 Z');
  elem.append('defs').append('marker').attr('id', type + '-extensionEnd ' + type).attr('class', 'marker extension ' + type).attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead
};

var composition = function composition(elem, type) {
  elem.append('defs').append('marker').attr('id', type + '-compositionStart').attr('class', 'marker extension ' + type).attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', type + '-compositionEnd').attr('class', 'marker extension ' + type).attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};

var aggregation = function aggregation(elem, type) {
  elem.append('defs').append('marker').attr('id', type + '-aggregationStart').attr('class', 'marker extension ' + type).attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', type + '-aggregationEnd').attr('class', 'marker ' + type).attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
};

var dependency = function dependency(elem, type) {
  elem.append('defs').append('marker').attr('id', type + '-dependencyStart').attr('class', 'marker extension ' + type).attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', type + '-dependencyEnd').attr('class', 'marker ' + type).attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

var point = function point(elem, type) {
  elem.append('marker').attr('id', type + '-pointEnd').attr('class', 'marker ' + type).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 12).attr('markerHeight', 12).attr('orient', 'auto').append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('class', 'arrowMarkerPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
  elem.append('marker').attr('id', type + '-pointStart').attr('class', 'marker ' + type).attr('viewBox', '0 0 10 10').attr('refX', 0).attr('refY', 5).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 12).attr('markerHeight', 12).attr('orient', 'auto').append('path').attr('d', 'M 0 5 L 10 10 L 10 0 z').attr('class', 'arrowMarkerPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
};

var circle = function circle(elem, type) {
  elem.append('marker').attr('id', type + '-circleEnd').attr('class', 'marker ' + type).attr('viewBox', '0 0 10 10').attr('refX', 11).attr('refY', 5).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 11).attr('markerHeight', 11).attr('orient', 'auto').append('circle').attr('cx', '5').attr('cy', '5').attr('r', '5').attr('class', 'arrowMarkerPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
  elem.append('marker').attr('id', type + '-circleStart').attr('class', 'marker ' + type).attr('viewBox', '0 0 10 10').attr('refX', -1).attr('refY', 5).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 11).attr('markerHeight', 11).attr('orient', 'auto').append('circle').attr('cx', '5').attr('cy', '5').attr('r', '5').attr('class', 'arrowMarkerPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
};

var cross = function cross(elem, type) {
  elem.append('marker').attr('id', type + '-crossEnd').attr('class', 'marker cross ' + type).attr('viewBox', '0 0 11 11').attr('refX', 12).attr('refY', 5.2).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 11).attr('markerHeight', 11).attr('orient', 'auto').append('path') // .attr('stroke', 'black')
  .attr('d', 'M 1,1 l 9,9 M 10,1 l -9,9').attr('class', 'arrowMarkerPath').style('stroke-width', 2).style('stroke-dasharray', '1,0');
  elem.append('marker').attr('id', type + '-crossStart').attr('class', 'marker cross ' + type).attr('viewBox', '0 0 11 11').attr('refX', -1).attr('refY', 5.2).attr('markerUnits', 'userSpaceOnUse').attr('markerWidth', 11).attr('markerHeight', 11).attr('orient', 'auto').append('path') // .attr('stroke', 'black')
  .attr('d', 'M 1,1 l 9,9 M 10,1 l -9,9').attr('class', 'arrowMarkerPath').style('stroke-width', 2).style('stroke-dasharray', '1,0');
};

var barb = function barb(elem, type) {
  elem.append('defs').append('marker').attr('id', type + '-barbEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 14).attr('markerUnits', 0).attr('orient', 'auto').append('path').attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
}; // TODO rename the class diagram markers to something shape descriptive and semanitc free


var markers = {
  extension: extension,
  composition: composition,
  aggregation: aggregation,
  dependency: dependency,
  point: point,
  circle: circle,
  cross: cross,
  barb: barb
};
/* harmony default export */ __webpack_exports__["default"] = (insertMarkers);

/***/ }),

/***/ "./src/dagre-wrapper/mermaid-graphlib.js":
/*!***********************************************!*\
  !*** ./src/dagre-wrapper/mermaid-graphlib.js ***!
  \***********************************************/
/*! exports provided: clusterDb, clear, extractDecendants, validate, findNonClusterChild, adjustClustersAndEdges, extractor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clusterDb", function() { return clusterDb; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extractDecendants", function() { return extractDecendants; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "validate", function() { return validate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "findNonClusterChild", function() { return findNonClusterChild; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "adjustClustersAndEdges", function() { return adjustClustersAndEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extractor", function() { return extractor; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Decorates with functions required by mermaids dagre-wrapper.
 */


var clusterDb = {};
var decendants = {};
var parents = {};
var clear = function clear() {
  decendants = {};
  parents = {};
  clusterDb = {};
};

var isDecendant = function isDecendant(id, ancenstorId) {
  // if (id === ancenstorId) return true;
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('In isDecendant', ancenstorId, ' ', id, ' = ', decendants[ancenstorId].indexOf(id) >= 0);
  if (decendants[ancenstorId].indexOf(id) >= 0) return true;
  return false;
};

var edgeInCluster = function edgeInCluster(edge, clusterId) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Decendants of ', clusterId, ' is ', decendants[clusterId]);
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Edge is ', edge); // Edges to/from the cluster is not in the cluster, they are in the parent

  if (edge.v === clusterId) return false;
  if (edge.w === clusterId) return false;

  if (!decendants[clusterId]) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Tilt, ', clusterId, ',not in decendants');
    return false;
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Here ');
  if (decendants[clusterId].indexOf(edge.v) >= 0) return true;
  if (isDecendant(edge.v, clusterId)) return true;
  if (isDecendant(edge.w, clusterId)) return true;
  if (decendants[clusterId].indexOf(edge.w) >= 0) return true;
  return false;
};

var copy = function copy(clusterId, graph, newGraph, rootId) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Copying children of ', clusterId, 'root', rootId, 'data', graph.node(clusterId), rootId);
  var nodes = graph.children(clusterId) || []; // Include cluster node if it is not the root

  if (clusterId !== rootId) {
    nodes.push(clusterId);
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Copying (nodes) clusterId', clusterId, 'nodes', nodes);
  nodes.forEach(function (node) {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      var data = graph.node(node);
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('cp ', node, ' to ', rootId, ' with parent ', clusterId); //,node, data, ' parent is ', clusterId);

      newGraph.setNode(node, data);
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Setting parent', node, graph.parent(node));

      if (rootId !== graph.parent(node)) {
        newGraph.setParent(node, graph.parent(node));
      }

      if (clusterId !== rootId && node !== clusterId) {
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Setting parent', node, clusterId);
        newGraph.setParent(node, clusterId);
      } else {
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('In copy ', clusterId, 'root', rootId, 'data', graph.node(clusterId), rootId);
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Not Setting parent for node=', node, 'cluster!==rootId', clusterId !== rootId, 'node!==clusterId', node !== clusterId);
      }

      var edges = graph.edges(node);
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Copying Edges', edges);
      edges.forEach(function (edge) {
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Edge', edge);
        var data = graph.edge(edge.v, edge.w, edge.name);
        _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Edge data', data, rootId);

        try {
          // Do not copy edges in and out of the root cluster, they belong to the parent graph
          if (edgeInCluster(edge, rootId)) {
            _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Copying as ', edge.v, edge.w, data, edge.name);
            newGraph.setEdge(edge.v, edge.w, data, edge.name);
            _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
          } else {
            _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Skipping copy of edge ', edge.v, '-->', edge.w, ' rootId: ', rootId, ' clusterId:', clusterId);
          }
        } catch (e) {
          _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].error(e);
        }
      });
    }

    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Removing node', node);
    graph.removeNode(node);
  });
};

var extractDecendants = function extractDecendants(id, graph) {
  // log.debug('Extracting ', id);
  var children = graph.children(id);
  var res = [].concat(children);

  for (var i = 0; i < children.length; i++) {
    parents[children[i]] = id;
    res = res.concat(extractDecendants(children[i], graph));
  }

  return res;
};
/**
 * Validates the graph, checking that all parent child relation points to existing nodes and that
 * edges between nodes also ia correct. When not correct the function logs the discrepancies.
 * @param {graphlib graph} g
 */

var validate = function validate(graph) {
  var edges = graph.edges();
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Edges: ', edges);

  for (var i = 0; i < edges.length; i++) {
    if (graph.children(edges[i].v).length > 0) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('The node ', edges[i].v, ' is part of and edge even though it has children');
      return false;
    }

    if (graph.children(edges[i].w).length > 0) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('The node ', edges[i].w, ' is part of and edge even though it has children');
      return false;
    }
  }

  return true;
};
/**
 * Finds a child that is not a cluster. When faking a edge between a node and a cluster.
 * @param {Finds a } id
 * @param {*} graph
 */

var findNonClusterChild = function findNonClusterChild(id, graph) {
  // const node = graph.node(id);
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Searching', id); // const children = graph.children(id).reverse();

  var children = graph.children(id); //.reverse();

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Searching children of id ', id, children);

  if (children.length < 1) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('This is a valid node', id);
    return id;
  }

  for (var i = 0; i < children.length; i++) {
    var _id = findNonClusterChild(children[i], graph);

    if (_id) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Found replacement for', id, ' => ', _id);
      return _id;
    }
  }
};

var getAnchorId = function getAnchorId(id) {
  if (!clusterDb[id]) {
    return id;
  } // If the cluster has no external connections


  if (!clusterDb[id].externalConnections) {
    return id;
  } // Return the replacement node


  if (clusterDb[id]) {
    return clusterDb[id].id;
  }

  return id;
};

var adjustClustersAndEdges = function adjustClustersAndEdges(graph, depth) {
  if (!graph || depth > 10) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Opting out, no graph ');
    return;
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Opting in, graph ');
  } // Go through the nodes and for each cluster found, save a replacment node, this can be used when
  // faking a link to a cluster


  graph.nodes().forEach(function (id) {
    var children = graph.children(id);

    if (children.length > 0) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('Cluster identified', id, ' Replacement id in edges: ', findNonClusterChild(id, graph));
      decendants[id] = extractDecendants(id, graph);
      clusterDb[id] = {
        id: findNonClusterChild(id, graph),
        clusterData: graph.node(id)
      };
    }
  }); // Check incoming and outgoing edges for each cluster

  graph.nodes().forEach(function (id) {
    var children = graph.children(id);
    var edges = graph.edges();

    if (children.length > 0) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Cluster identified', id, decendants);
      edges.forEach(function (edge) {
        // log.debug('Edge, decendants: ', edge, decendants[id]);
        // Check if any edge leaves the cluster (not the actual cluster, thats a link from the box)
        if (edge.v !== id && edge.w !== id) {
          // Any edge where either the one of the nodes is decending to the cluster but not the other
          // if (decendants[id].indexOf(edge.v) < 0 && decendants[id].indexOf(edge.w) < 0) {
          var d1 = isDecendant(edge.v, id);
          var d2 = isDecendant(edge.w, id); // d1 xor d2 - if either d1 is true and d2 is false or the other way around

          if (d1 ^ d2) {
            _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Edge: ', edge, ' leaves cluster ', id);
            _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Decendants of ', id, ': ', decendants[id]);
            clusterDb[id].externalConnections = true;
          }
        }
      });
    }
  });
  extractor(graph, 0); // For clusters with incoming and/or outgoing edges translate those edges to a real node
  // in the cluster inorder to fake the edge

  graph.edges().forEach(function (e) {
    var edge = graph.edge(e);
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
    var v = e.v;
    var w = e.w; // Check if link is either from or to a cluster

    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace('Fix', clusterDb, 'ids:', e.v, e.w, 'Translateing: ', clusterDb[e.v], clusterDb[e.w]);

    if (clusterDb[e.v] || clusterDb[e.w]) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('Fixing and trixing - removing', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('Replacing with', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn('Adjusted Graph', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph));
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].trace(clusterDb); // Remove references to extracted cluster
  // graph.edges().forEach(edge => {
  //   if (isDecendant(edge.v, clusterId) || isDecendant(edge.w, clusterId)) {
  //     graph.removeEdge(edge);
  //   }
  // });
};
var extractor = function extractor(graph, depth) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('extractor - ', depth, graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph), graph.children('D'));

  if (depth > 10) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].error('Bailing out');
    return;
  } // For clusters without incoming and/or outgoing edges, create a new cluster-node
  // containing the nodes and edges in the custer in a new graph
  // for (let i = 0;)


  var nodes = graph.nodes();
  var hasChildren = false;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var children = graph.children(node);
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Done, no node has children', graph.nodes());
    return;
  } // const clusters = Object.keys(clusterDb);
  // clusters.forEach(clusterId => {


  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Nodes = ', nodes, depth);

  for (var _i = 0; _i < nodes.length; _i++) {
    var _node = nodes[_i];
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Extracting node', _node, clusterDb, clusterDb[_node] && !clusterDb[_node].externalConnections, !graph.parent(_node), graph.node(_node), graph.children('D'), ' Depth ', depth); // Note that the node might have been removed after the Object.keys call so better check
    // that it still is in the game

    if (!clusterDb[_node]) {
      // Skip if the node is not a cluster
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Not a cluster', _node, depth); // break;
    } else if (!clusterDb[_node].externalConnections && !graph.parent(_node) && graph.children(_node) && graph.children(_node).length > 0) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Cluster without external connections, without a parent and with children', _node, depth);
      var graphSettings = graph.graph();
      var clusterGraph = new graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.Graph({
        multigraph: true,
        compound: true
      }).setGraph({
        rankdir: graphSettings.rankdir === 'TB' ? 'LR' : 'TB',
        // Todo: set proper spacing
        nodesep: 50,
        ranksep: 50,
        marginx: 8,
        marginy: 8
      }).setDefaultEdgeLabel(function () {
        return {};
      });
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Old graph before copy', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph));
      copy(_node, graph, clusterGraph, _node);
      graph.setNode(_node, {
        clusterNode: true,
        id: _node,
        clusterData: clusterDb[_node].clusterData,
        labelText: clusterDb[_node].labelText,
        graph: clusterGraph
      });
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('New graph after copy', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(clusterGraph));
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Old graph after copy', graphlib__WEBPACK_IMPORTED_MODULE_1___default.a.json.write(graph));
    } else {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Cluster ** ', _node, ' **not meeting the criteria !externalConnections:', !clusterDb[_node].externalConnections, ' no parent: ', !graph.parent(_node), ' children ', graph.children(_node) && graph.children(_node).length > 0, graph.children('D'), depth);
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(clusterDb);
    }
  }

  nodes = graph.nodes();
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('New list of nodes', nodes);

  for (var _i2 = 0; _i2 < nodes.length; _i2++) {
    var _node2 = nodes[_i2];
    var data = graph.node(_node2);
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(' Now next leveö', _node2, data);

    if (data.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};

/***/ }),

/***/ "./src/dagre-wrapper/nodes.js":
/*!************************************!*\
  !*** ./src/dagre-wrapper/nodes.js ***!
  \************************************/
/*! exports provided: insertNode, setNodeElem, clear, positionNode */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertNode", function() { return insertNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setNodeElem", function() { return setNodeElem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "positionNode", function() { return positionNode; });
/* harmony import */ var _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./intersect/index.js */ "./src/dagre-wrapper/intersect/index.js");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../logger */ "./src/logger.js");
/* harmony import */ var _shapes_util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shapes/util */ "./src/dagre-wrapper/shapes/util.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config */ "./src/config.js");
/* harmony import */ var _createLabel__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./createLabel */ "./src/dagre-wrapper/createLabel.js");
/* harmony import */ var _shapes_note__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./shapes/note */ "./src/dagre-wrapper/shapes/note.js");


 // eslint-disable-line






var question = function question(parent, node) {
  var _labelHelper = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper.shapeSvg,
      bbox = _labelHelper.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var s = w + h;
  var points = [{
    x: s / 2,
    y: 0
  }, {
    x: s,
    y: -s / 2
  }, {
    x: s / 2,
    y: -s
  }, {
    x: 0,
    y: -s / 2
  }];
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Question main (Circle)');
  var questionElem = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, s, s, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, questionElem);

  node.intersect = function (point) {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].warn('Intersect called');
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, points, point);
  };

  return shapeSvg;
};

var hexagon = function hexagon(parent, node) {
  var _labelHelper2 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper2.shapeSvg,
      bbox = _labelHelper2.bbox;

  var f = 4;
  var h = bbox.height + node.padding;
  var m = h / f;
  var w = bbox.width + 2 * m + node.padding;
  var points = [{
    x: m,
    y: 0
  }, {
    x: w - m,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w - m,
    y: -h
  }, {
    x: m,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var hex = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, hex);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var rect_left_inv_arrow = function rect_left_inv_arrow(parent, node) {
  var _labelHelper3 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper3.shapeSvg,
      bbox = _labelHelper3.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: -h / 2,
    y: 0
  }, {
    x: w,
    y: 0
  }, {
    x: w,
    y: -h
  }, {
    x: -h / 2,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var lean_right = function lean_right(parent, node) {
  var _labelHelper4 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper4.shapeSvg,
      bbox = _labelHelper4.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var lean_left = function lean_left(parent, node) {
  var _labelHelper5 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper5.shapeSvg,
      bbox = _labelHelper5.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: 2 * h / 6,
    y: 0
  }, {
    x: w + h / 6,
    y: 0
  }, {
    x: w - 2 * h / 6,
    y: -h
  }, {
    x: -h / 6,
    y: -h
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var trapezoid = function trapezoid(parent, node) {
  var _labelHelper6 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper6.shapeSvg,
      bbox = _labelHelper6.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var inv_trapezoid = function inv_trapezoid(parent, node) {
  var _labelHelper7 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper7.shapeSvg,
      bbox = _labelHelper7.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: -2 * h / 6,
    y: -h
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var rect_right_inv_arrow = function rect_right_inv_arrow(parent, node) {
  var _labelHelper8 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper8.shapeSvg,
      bbox = _labelHelper8.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: 0,
    y: 0
  }, {
    x: w + h / 2,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w + h / 2,
    y: -h
  }, {
    x: 0,
    y: -h
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var cylinder = function cylinder(parent, node) {
  var _labelHelper9 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper9.shapeSvg,
      bbox = _labelHelper9.bbox;

  var w = bbox.width + node.padding;
  var rx = w / 2;
  var ry = rx / (2.5 + w / 50);
  var h = bbox.height + ry + node.padding;
  var shape = 'M 0,' + ry + ' a ' + rx + ',' + ry + ' 0,0,0 ' + w + ' 0 a ' + rx + ',' + ry + ' 0,0,0 ' + -w + ' 0 l 0,' + h + ' a ' + rx + ',' + ry + ' 0,0,0 ' + w + ' 0 l 0,' + -h;
  var el = shapeSvg.attr('label-offset-y', ry).insert('path', ':first-child').attr('d', shape).attr('transform', 'translate(' + -w / 2 + ',' + -(h / 2 + ry) + ')');
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    var pos = _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].rect(node, point);
    var x = pos.x - node.x;

    if (rx != 0 && (Math.abs(x) < node.width / 2 || Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry)) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjustion value for pos.y
      var y = ry * ry * (1 - x * x / (rx * rx));
      if (y != 0) y = Math.sqrt(y);
      y = ry - y;
      if (point.y - node.y > 0) y = -y;
      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
};

var rect = function rect(parent, node) {
  var _labelHelper10 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, 'node ' + node.classes, true),
      shapeSvg = _labelHelper10.shapeSvg,
      bbox = _labelHelper10.bbox,
      halfPadding = _labelHelper10.halfPadding;

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].trace('Classes = ', node.classes); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child');
  rect.attr('class', 'basic label-container').attr('rx', node.rx).attr('ry', node.ry).attr('x', -bbox.width / 2 - halfPadding).attr('y', -bbox.height / 2 - halfPadding).attr('width', bbox.width + node.padding).attr('height', bbox.height + node.padding);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, rect);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].rect(node, point);
  };

  return shapeSvg;
};

var rectWithTitle = function rectWithTitle(parent, node) {
  // const { shapeSvg, bbox, halfPadding } = labelHelper(parent, node, 'node ' + node.classes);
  var classes;

  if (!node.classes) {
    classes = 'node default';
  } else {
    classes = 'node ' + node.classes;
  } // Add outer g element


  var shapeSvg = parent.insert('g').attr('class', classes).attr('id', node.id); // Create the title label and insert it after the rect

  var rect = shapeSvg.insert('rect', ':first-child'); // const innerRect = shapeSvg.insert('rect');

  var innerLine = shapeSvg.insert('line');
  var label = shapeSvg.insert('g').attr('class', 'label');
  var text2 = node.labelText.flat();
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Label text', text2[0]);
  var text = label.node().appendChild(Object(_createLabel__WEBPACK_IMPORTED_MODULE_5__["default"])(text2[0], node.labelStyle, true, true));
  var bbox;

  if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
    var div = text.children[0];
    var dv = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Text 2', text2);
  var textRows = text2.slice(1, text2.length);
  var titleBox = text.getBBox();
  var descr = label.node().appendChild(Object(_createLabel__WEBPACK_IMPORTED_MODULE_5__["default"])(textRows.join('<br/>'), node.labelStyle, true, true));

  if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
    var _div = descr.children[0];

    var _dv = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])(descr);

    bbox = _div.getBoundingClientRect();

    _dv.attr('width', bbox.width);

    _dv.attr('height', bbox.height);
  } // bbox = label.getBBox();
  // logger.info(descr);


  var halfPadding = node.padding / 2;
  Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])(descr).attr('transform', 'translate( ' + ( // (titleBox.width - bbox.width) / 2 +
  bbox.width > titleBox.width ? 0 : (titleBox.width - bbox.width) / 2) + ', ' + (titleBox.height + halfPadding + 5) + ')');
  Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])(text).attr('transform', 'translate( ' + ( // (titleBox.width - bbox.width) / 2 +
  bbox.width < titleBox.width ? 0 : -(titleBox.width - bbox.width) / 2) + ', ' + 0 + ')'); // Get the size of the label
  // Bounding box for title and text

  bbox = label.node().getBBox(); // Center the label

  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + (-bbox.height / 2 - halfPadding + 3) + ')');
  rect.attr('class', 'outer title-state').attr('x', -bbox.width / 2 - halfPadding).attr('y', -bbox.height / 2 - halfPadding).attr('width', bbox.width + node.padding).attr('height', bbox.height + node.padding);
  innerLine.attr('class', 'divider').attr('x1', -bbox.width / 2 - halfPadding).attr('x2', bbox.width / 2 + halfPadding).attr('y1', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding).attr('y2', -bbox.height / 2 - halfPadding + titleBox.height + halfPadding);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, rect);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].rect(node, point);
  };

  return shapeSvg;
};

var stadium = function stadium(parent, node) {
  var _labelHelper11 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper11.shapeSvg,
      bbox = _labelHelper11.bbox;

  var h = bbox.height + node.padding;
  var w = bbox.width + h / 4 + node.padding; // add the rect

  var rect = shapeSvg.insert('rect', ':first-child').attr('rx', h / 2).attr('ry', h / 2).attr('x', -w / 2).attr('y', -h / 2).attr('width', w).attr('height', h);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, rect);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].rect(node, point);
  };

  return shapeSvg;
};

var circle = function circle(parent, node) {
  var _labelHelper12 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper12.shapeSvg,
      bbox = _labelHelper12.bbox,
      halfPadding = _labelHelper12.halfPadding;

  var circle = shapeSvg.insert('circle', ':first-child'); // center the circle around its coordinate

  circle.attr('rx', node.rx).attr('ry', node.ry).attr('r', bbox.width / 2 + halfPadding).attr('width', bbox.width + node.padding).attr('height', bbox.height + node.padding);
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Circle main');
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, circle);

  node.intersect = function (point) {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Circle intersect', node, bbox.width / 2 + halfPadding, point);
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].circle(node, bbox.width / 2 + halfPadding, point);
  };

  return shapeSvg;
};

var subroutine = function subroutine(parent, node) {
  var _labelHelper13 = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["labelHelper"])(parent, node, undefined, true),
      shapeSvg = _labelHelper13.shapeSvg,
      bbox = _labelHelper13.bbox;

  var w = bbox.width + node.padding;
  var h = bbox.height + node.padding;
  var points = [{
    x: 0,
    y: 0
  }, {
    x: w,
    y: 0
  }, {
    x: w,
    y: -h
  }, {
    x: 0,
    y: -h
  }, {
    x: 0,
    y: 0
  }, {
    x: -8,
    y: 0
  }, {
    x: w + 8,
    y: 0
  }, {
    x: w + 8,
    y: -h
  }, {
    x: -8,
    y: -h
  }, {
    x: -8,
    y: 0
  }];
  var el = Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["insertPolygonShape"])(shapeSvg, w, h, points);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, el);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].polygon(node, point);
  };

  return shapeSvg;
};

var start = function start(parent, node) {
  var shapeSvg = parent.insert('g').attr('class', 'node default').attr('id', node.id);
  var circle = shapeSvg.insert('circle', ':first-child'); // center the circle around its coordinate

  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, circle);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].circle(node, 7, point);
  };

  return shapeSvg;
};

var forkJoin = function forkJoin(parent, node, dir) {
  var shapeSvg = parent.insert('g').attr('class', 'node default').attr('id', node.id);
  var width = 70;
  var height = 10;

  if (dir === 'LR') {
    width = 10;
    height = 70;
  }

  var shape = shapeSvg.append('rect').style('stroke', 'black').style('fill', 'black').attr('x', -1 * width / 2).attr('y', -1 * height / 2).attr('width', width).attr('height', height).attr('class', 'fork-join');
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, shape);
  node.height = node.height + node.padding / 2;
  node.width = node.width + node.padding / 2;

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].rect(node, point);
  };

  return shapeSvg;
};

var end = function end(parent, node) {
  var shapeSvg = parent.insert('g').attr('class', 'node default').attr('id', node.id);
  var innerCircle = shapeSvg.insert('circle', ':first-child');
  var circle = shapeSvg.insert('circle', ':first-child');
  circle.attr('class', 'state-start').attr('r', 7).attr('width', 14).attr('height', 14);
  innerCircle.attr('class', 'state-end').attr('r', 5).attr('width', 10).attr('height', 10);
  Object(_shapes_util__WEBPACK_IMPORTED_MODULE_3__["updateNodeBounds"])(node, circle);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_0__["default"].circle(node, 7, point);
  };

  return shapeSvg;
};

var shapes = {
  question: question,
  rect: rect,
  rectWithTitle: rectWithTitle,
  circle: circle,
  stadium: stadium,
  hexagon: hexagon,
  rect_left_inv_arrow: rect_left_inv_arrow,
  lean_right: lean_right,
  lean_left: lean_left,
  trapezoid: trapezoid,
  inv_trapezoid: inv_trapezoid,
  rect_right_inv_arrow: rect_right_inv_arrow,
  cylinder: cylinder,
  start: start,
  end: end,
  note: _shapes_note__WEBPACK_IMPORTED_MODULE_6__["default"],
  subroutine: subroutine,
  fork: forkJoin,
  join: forkJoin
};
var nodeElems = {};
var insertNode = function insertNode(elem, node, dir) {
  nodeElems[node.id] = shapes[node.shape](elem, node, dir);
};
var setNodeElem = function setNodeElem(elem, node) {
  nodeElems[node.id] = elem;
};
var clear = function clear() {
  nodeElems = {};
};
var positionNode = function positionNode(node) {
  var el = nodeElems[node.id];
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].trace('Transforming node', node, 'translate(' + (node.x - node.width / 2 - 5) + ', ' + (node.y - node.height / 2 - 5) + ')');
  var padding = 8;

  if (node.clusterNode) {
    el.attr('transform', 'translate(' + (node.x - node.width / 2 - padding) + ', ' + (node.y - node.height / 2 - padding) + ')');
  } else {
    el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
  }
};

/***/ }),

/***/ "./src/dagre-wrapper/shapes/note.js":
/*!******************************************!*\
  !*** ./src/dagre-wrapper/shapes/note.js ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/dagre-wrapper/shapes/util.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _intersect_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../intersect/index.js */ "./src/dagre-wrapper/intersect/index.js");

 // eslint-disable-line



var note = function note(parent, node) {
  var _labelHelper = Object(_util__WEBPACK_IMPORTED_MODULE_0__["labelHelper"])(parent, node, 'node ' + node.classes, true),
      shapeSvg = _labelHelper.shapeSvg,
      bbox = _labelHelper.bbox,
      halfPadding = _labelHelper.halfPadding;

  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].info('Classes = ', node.classes); // add the rect

  var rect = shapeSvg.insert('rect', ':first-child');
  rect.attr('rx', node.rx).attr('ry', node.ry).attr('x', -bbox.width / 2 - halfPadding).attr('y', -bbox.height / 2 - halfPadding).attr('width', bbox.width + node.padding).attr('height', bbox.height + node.padding);
  Object(_util__WEBPACK_IMPORTED_MODULE_0__["updateNodeBounds"])(node, rect);

  node.intersect = function (point) {
    return _intersect_index_js__WEBPACK_IMPORTED_MODULE_2__["default"].rect(node, point);
  };

  return shapeSvg;
};

/* harmony default export */ __webpack_exports__["default"] = (note);

/***/ }),

/***/ "./src/dagre-wrapper/shapes/util.js":
/*!******************************************!*\
  !*** ./src/dagre-wrapper/shapes/util.js ***!
  \******************************************/
/*! exports provided: labelHelper, updateNodeBounds, insertPolygonShape */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "labelHelper", function() { return labelHelper; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateNodeBounds", function() { return updateNodeBounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertPolygonShape", function() { return insertPolygonShape; });
/* harmony import */ var _createLabel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../createLabel */ "./src/dagre-wrapper/createLabel.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_2__);



var labelHelper = function labelHelper(parent, node, _classes, isNode) {
  var classes;

  if (!_classes) {
    classes = 'node default';
  } else {
    classes = _classes;
  } // Add outer g element


  var shapeSvg = parent.insert('g').attr('class', classes).attr('id', node.id); // Create the label and insert it after the rect

  var label = shapeSvg.insert('g').attr('class', 'label');
  var text = label.node().appendChild(Object(_createLabel__WEBPACK_IMPORTED_MODULE_0__["default"])(node.labelText, node.labelStyle, false, isNode)); // Get the size of the label

  var bbox = text.getBBox();

  if (Object(_config__WEBPACK_IMPORTED_MODULE_1__["getConfig"])().flowchart.htmlLabels) {
    var div = text.children[0];
    var dv = Object(d3__WEBPACK_IMPORTED_MODULE_2__["select"])(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  var halfPadding = node.padding / 2; // Center the label

  label.attr('transform', 'translate(' + -bbox.width / 2 + ', ' + -bbox.height / 2 + ')');
  return {
    shapeSvg: shapeSvg,
    bbox: bbox,
    halfPadding: halfPadding,
    label: label
  };
};
var updateNodeBounds = function updateNodeBounds(node, element) {
  var bbox = element.node().getBBox();
  node.width = bbox.width;
  node.height = bbox.height;
};
function insertPolygonShape(parent, w, h, points) {
  return parent.insert('polygon', ':first-child').attr('points', points.map(function (d) {
    return d.x + ',' + d.y;
  }).join(' ')).attr('class', 'label-container').attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}

/***/ }),

/***/ "./src/diagrams/class/classDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/class/classDb.js ***!
  \***************************************/
/*! exports provided: addClass, lookUpDomId, clear, getClass, getClasses, getRelations, addRelation, addAnnotation, addMember, addMembers, cleanupLabel, setCssClass, setLink, setClickEvent, bindFunctions, lineType, relationType, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addClass", function() { return addClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lookUpDomId", function() { return lookUpDomId; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClass", function() { return getClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRelations", function() { return getRelations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addRelation", function() { return addRelation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addAnnotation", function() { return addAnnotation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMember", function() { return addMember; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMembers", function() { return addMembers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cleanupLabel", function() { return cleanupLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setCssClass", function() { return setCssClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLink", function() { return setLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClickEvent", function() { return setClickEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindFunctions", function() { return bindFunctions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lineType", function() { return lineType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "relationType", function() { return relationType; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");





var MERMAID_DOM_ID_PREFIX = 'classid-';
var config = Object(_config__WEBPACK_IMPORTED_MODULE_2__["getConfig"])();
var relations = [];
var classes = {};
var classCounter = 0;
var funs = [];

var splitClassNameAndType = function splitClassNameAndType(id) {
  var genericType = '';
  var className = id;

  if (id.indexOf('~') > 0) {
    var split = id.split('~');
    className = split[0];
    genericType = split[1];
  }

  return {
    className: className,
    type: genericType
  };
};
/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @public
 */


var addClass = function addClass(id) {
  var classId = splitClassNameAndType(id); // Only add class if not exists

  if (typeof classes[classId.className] !== 'undefined') return;
  classes[classId.className] = {
    id: classId.className,
    type: classId.type,
    cssClasses: [],
    methods: [],
    members: [],
    annotations: [],
    domId: MERMAID_DOM_ID_PREFIX + classId.className + '-' + classCounter
  };
  classCounter++;
};
/**
 * Function to lookup domId from id in the graph definition.
 * @param id
 * @public
 */

var lookUpDomId = function lookUpDomId(id) {
  var classKeys = Object.keys(classes);

  for (var i = 0; i < classKeys.length; i++) {
    if (classes[classKeys[i]].id === id) {
      return classes[classKeys[i]].domId;
    }
  }
};
var clear = function clear() {
  relations = [];
  classes = {};
  funs = [];
  funs.push(setupToolTips);
};
var getClass = function getClass(id) {
  return classes[id];
};
var getClasses = function getClasses() {
  return classes;
};
var getRelations = function getRelations() {
  return relations;
};
var addRelation = function addRelation(relation) {
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].debug('Adding relation: ' + JSON.stringify(relation));
  addClass(relation.id1);
  addClass(relation.id2);
  relation.id1 = splitClassNameAndType(relation.id1).className;
  relation.id2 = splitClassNameAndType(relation.id2).className;
  relations.push(relation);
};
/**
 * Adds an annotation to the specified class
 * Annotations mark special properties of the given type (like 'interface' or 'service')
 * @param className The class name
 * @param annotation The name of the annotation without any brackets
 * @public
 */

var addAnnotation = function addAnnotation(className, annotation) {
  var validatedClassName = splitClassNameAndType(className).className;
  classes[validatedClassName].annotations.push(annotation);
};
/**
 * Adds a member to the specified class
 * @param className The class name
 * @param member The full name of the member.
 * If the member is enclosed in <<brackets>> it is treated as an annotation
 * If the member is ending with a closing bracket ) it is treated as a method
 * Otherwise the member will be treated as a normal property
 * @public
 */

var addMember = function addMember(className, member) {
  var validatedClassName = splitClassNameAndType(className).className;
  var theClass = classes[validatedClassName];

  if (typeof member === 'string') {
    // Member can contain white spaces, we trim them out
    var memberString = member.trim();

    if (memberString.startsWith('<<') && memberString.endsWith('>>')) {
      // Remove leading and trailing brackets
      theClass.annotations.push(memberString.substring(2, memberString.length - 2));
    } else if (memberString.indexOf(')') > 0) {
      theClass.methods.push(memberString);
    } else if (memberString) {
      theClass.members.push(memberString);
    }
  }
};
var addMembers = function addMembers(className, members) {
  if (Array.isArray(members)) {
    members.reverse();
    members.forEach(function (member) {
      return addMember(className, member);
    });
  }
};
var cleanupLabel = function cleanupLabel(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(1).trim();
  } else {
    return label.trim();
  }
};
/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */

var setCssClass = function setCssClass(ids, className) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof classes[id] !== 'undefined') {
      classes[id].cssClasses.push(className);
    }
  });
};
/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 * @param tooltip Tooltip for the clickable element
 */

var setLink = function setLink(ids, linkStr, tooltip) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof classes[id] !== 'undefined') {
      classes[id].link = _utils__WEBPACK_IMPORTED_MODULE_4__["default"].formatUrl(linkStr, config);

      if (tooltip) {
        classes[id].tooltip = _common_common__WEBPACK_IMPORTED_MODULE_3__["default"].sanitizeText(tooltip, config);
      }
    }
  });
  setCssClass(ids, 'clickable');
};
/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param tooltip Tooltip for the clickable element
 */

var setClickEvent = function setClickEvent(ids, functionName, tooltip) {
  ids.split(',').forEach(function (id) {
    setClickFunc(id, functionName, tooltip);
  });
  setCssClass(ids, 'clickable');
};

var setClickFunc = function setClickFunc(domId, functionName, tooltip) {
  var id = domId;
  var elemId = lookUpDomId(id);

  if (config.securityLevel !== 'loose') {
    return;
  }

  if (typeof functionName === 'undefined') {
    return;
  }

  if (typeof classes[id] !== 'undefined') {
    if (tooltip) {
      classes[id].tooltip = _common_common__WEBPACK_IMPORTED_MODULE_3__["default"].sanitizeText(tooltip, config);
    }

    funs.push(function () {
      var elem = document.querySelector("[id=\"".concat(elemId, "\"]"));

      if (elem !== null) {
        elem.addEventListener('click', function () {
          _utils__WEBPACK_IMPORTED_MODULE_4__["default"].runFunc(functionName, elemId);
        }, false);
      }
    });
  }
};

var bindFunctions = function bindFunctions(element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
var lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};
var relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};

var setupToolTips = function setupToolTips(element) {
  var tooltipElem = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('.mermaidTooltip');

  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(element).select('svg');
  var nodes = svg.selectAll('g.node');
  nodes.on('mouseover', function () {
    var el = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(this);
    var title = el.attr('title'); // Dont try to draw a tooltip if no data is provided

    if (title === null) {
      return;
    }

    var rect = this.getBoundingClientRect();
    tooltipElem.transition().duration(200).style('opacity', '.9');
    tooltipElem.html(el.attr('title')).style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px').style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
    el.classed('hover', true);
  }).on('mouseout', function () {
    tooltipElem.transition().duration(500).style('opacity', 0);
    var el = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(this);
    el.classed('hover', false);
  });
};

funs.push(setupToolTips);
/* harmony default export */ __webpack_exports__["default"] = ({
  addClass: addClass,
  bindFunctions: bindFunctions,
  clear: clear,
  getClass: getClass,
  getClasses: getClasses,
  addAnnotation: addAnnotation,
  getRelations: getRelations,
  addRelation: addRelation,
  addMember: addMember,
  addMembers: addMembers,
  cleanupLabel: cleanupLabel,
  lineType: lineType,
  relationType: relationType,
  setClickEvent: setClickEvent,
  setCssClass: setCssClass,
  setLink: setLink,
  lookUpDomId: lookUpDomId
});

/***/ }),

/***/ "./src/diagrams/class/classRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/class/classRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _classDb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./classDb */ "./src/diagrams/class/classDb.js");
/* harmony import */ var _parser_classDiagram__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./parser/classDiagram */ "./src/diagrams/class/parser/classDiagram.jison");
/* harmony import */ var _parser_classDiagram__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_parser_classDiagram__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _svgDraw__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./svgDraw */ "./src/diagrams/class/svgDraw.js");







_parser_classDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].yy = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"];
var idCache = {};
var padding = 20;
var conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
}; // Todo optimize

var getGraphId = function getGraphId(label) {
  var keys = Object.keys(idCache);

  for (var i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i];
    }
  }

  return undefined;
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */


var insertMarkers = function insertMarkers(elem) {
  elem.append('defs').append('marker').attr('id', 'extensionStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 1,7 L18,13 V 1 Z');
  elem.append('defs').append('marker').attr('id', 'extensionEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem.append('defs').append('marker').attr('id', 'compositionStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'compositionEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'aggregationStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'aggregationEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'dependencyStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'dependencyEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(text, id) {
  idCache = {};
  _parser_classDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].yy.clear();
  _parser_classDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].parse(text);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering diagram ' + text); // Fetch the default direction, use TD if none was found

  var diagram = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id='".concat(id, "']"));
  insertMarkers(diagram); // Layout graph, Create a new directed graph

  var g = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    multigraph: true
  }); // Set an object for the graph label

  g.setGraph({
    isMultiGraph: true
  }); // Default to assigning a new object as a label for each new edge.

  g.setDefaultEdgeLabel(function () {
    return {};
  });
  var classes = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].getClasses();
  var keys = Object.keys(classes);

  for (var i = 0; i < keys.length; i++) {
    var classDef = classes[keys[i]];
    var node = _svgDraw__WEBPACK_IMPORTED_MODULE_6__["default"].drawClass(diagram, classDef, conf);
    idCache[node.id] = node; // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.

    g.setNode(node.id, node);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Org height: ' + node.height);
  }

  var relations = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRelations();
  relations.forEach(function (relation) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation));
    g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), {
      relation: relation
    }, relation.title || 'DEFAULT');
  });
  dagre__WEBPACK_IMPORTED_MODULE_1___default.a.layout(g);
  g.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + Object(_classDb__WEBPACK_IMPORTED_MODULE_4__["lookUpDomId"])(v)).attr('transform', 'translate(' + (g.node(v).x - g.node(v).width / 2) + ',' + (g.node(v).y - g.node(v).height / 2) + ' )');
    }
  });
  g.edges().forEach(function (e) {
    if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      _svgDraw__WEBPACK_IMPORTED_MODULE_6__["default"].drawEdge(diagram, g.edge(e), g.edge(e).relation, conf);
    }
  });
  var svgBounds = diagram.node().getBBox();
  var width = svgBounds.width + padding * 2;
  var height = svgBounds.height + padding * 2;

  if (conf.useMaxWidth) {
    diagram.attr('width', '100%');
    diagram.attr('style', "max-width: ".concat(width, "px;"));
  } else {
    diagram.attr('height', height);
    diagram.attr('width', width);
  } // Ensure the viewBox includes the whole svgBounds area with extra space for padding


  var vBox = "".concat(svgBounds.x - padding, " ").concat(svgBounds.y - padding, " ").concat(width, " ").concat(height);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug("viewBox ".concat(vBox));
  diagram.attr('viewBox', vBox);
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/class/parser/classDiagram.jison":
/*!******************************************************!*\
  !*** ./src/diagrams/class/parser/classDiagram.jison ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,13],$V1=[1,16],$V2=[1,14],$V3=[1,15],$V4=[1,17],$V5=[1,18],$V6=[1,20],$V7=[1,21],$V8=[1,22],$V9=[6,8],$Va=[1,31],$Vb=[1,32],$Vc=[1,33],$Vd=[1,34],$Ve=[1,35],$Vf=[1,36],$Vg=[6,8,14,20,28,31,32,33,34,35,36],$Vh=[6,8,12,14,20,24,28,31,32,33,34,35,36,52,53,54],$Vi=[28,52,53,54],$Vj=[28,35,36,52,53,54],$Vk=[28,31,32,33,34,52,53,54],$Vl=[6,8,14],$Vm=[1,59];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"mermaidDoc":3,"graphConfig":4,"CLASS_DIAGRAM":5,"NEWLINE":6,"statements":7,"EOF":8,"statement":9,"className":10,"alphaNumToken":11,"GENERICTYPE":12,"relationStatement":13,"LABEL":14,"classStatement":15,"methodStatement":16,"annotationStatement":17,"clickStatement":18,"CLASS":19,"STRUCT_START":20,"members":21,"STRUCT_STOP":22,"ANNOTATION_START":23,"ANNOTATION_END":24,"MEMBER":25,"SEPARATOR":26,"relation":27,"STR":28,"relationType":29,"lineType":30,"AGGREGATION":31,"EXTENSION":32,"COMPOSITION":33,"DEPENDENCY":34,"LINE":35,"DOTTED_LINE":36,"CALLBACK":37,"LINK":38,"commentToken":39,"textToken":40,"graphCodeTokens":41,"textNoTagsToken":42,"TAGSTART":43,"TAGEND":44,"==":45,"--":46,"PCT":47,"DEFAULT":48,"SPACE":49,"MINUS":50,"keywords":51,"UNICODE_TEXT":52,"NUM":53,"ALPHA":54,"$accept":0,"$end":1},
terminals_: {2:"error",5:"CLASS_DIAGRAM",6:"NEWLINE",8:"EOF",12:"GENERICTYPE",14:"LABEL",19:"CLASS",20:"STRUCT_START",22:"STRUCT_STOP",23:"ANNOTATION_START",24:"ANNOTATION_END",25:"MEMBER",26:"SEPARATOR",28:"STR",31:"AGGREGATION",32:"EXTENSION",33:"COMPOSITION",34:"DEPENDENCY",35:"LINE",36:"DOTTED_LINE",37:"CALLBACK",38:"LINK",41:"graphCodeTokens",43:"TAGSTART",44:"TAGEND",45:"==",46:"--",47:"PCT",48:"DEFAULT",49:"SPACE",50:"MINUS",51:"keywords",52:"UNICODE_TEXT",53:"NUM",54:"ALPHA"},
productions_: [0,[3,1],[4,4],[7,1],[7,2],[7,3],[10,2],[10,1],[10,3],[10,2],[9,1],[9,2],[9,1],[9,1],[9,1],[9,1],[15,2],[15,5],[17,4],[21,1],[21,2],[16,1],[16,2],[16,1],[16,1],[13,3],[13,4],[13,4],[13,5],[27,3],[27,2],[27,2],[27,1],[29,1],[29,1],[29,1],[29,1],[30,1],[30,1],[18,3],[18,4],[18,3],[18,4],[39,1],[39,1],[40,1],[40,1],[40,1],[40,1],[40,1],[40,1],[40,1],[42,1],[42,1],[42,1],[42,1],[11,1],[11,1],[11,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 6:
 this.$=$$[$0-1]+$$[$0]; 
break;
case 7:
 this.$=$$[$0]; 
break;
case 8:
 this.$=$$[$0-2]+'~'+$$[$0-1]+$$[$0]; 
break;
case 9:
 this.$=$$[$0-1]+'~'+$$[$0]; 
break;
case 10:
 yy.addRelation($$[$0]); 
break;
case 11:
 $$[$0-1].title =  yy.cleanupLabel($$[$0]); yy.addRelation($$[$0-1]);        
break;
case 16:
yy.addClass($$[$0]);
break;
case 17:
/*console.log($$[$0-3],JSON.stringify($$[$0-1]));*/yy.addClass($$[$0-3]);yy.addMembers($$[$0-3],$$[$0-1]);
break;
case 18:
 yy.addAnnotation($$[$0],$$[$0-2]); 
break;
case 19:
 this.$ = [$$[$0]]; 
break;
case 20:
 $$[$0].push($$[$0-1]);this.$=$$[$0];
break;
case 21:
/*console.log('Rel found',$$[$0]);*/
break;
case 22:
yy.addMember($$[$0-1],yy.cleanupLabel($$[$0]));
break;
case 23:
/*console.warn('Member',$$[$0]);*/
break;
case 24:
/*console.log('sep found',$$[$0]);*/
break;
case 25:
 this.$ = {'id1':$$[$0-2],'id2':$$[$0], relation:$$[$0-1], relationTitle1:'none', relationTitle2:'none'}; 
break;
case 26:
 this.$ = {id1:$$[$0-3], id2:$$[$0], relation:$$[$0-1], relationTitle1:$$[$0-2], relationTitle2:'none'}
break;
case 27:
 this.$ = {id1:$$[$0-3], id2:$$[$0], relation:$$[$0-2], relationTitle1:'none', relationTitle2:$$[$0-1]}; 
break;
case 28:
 this.$ = {id1:$$[$0-4], id2:$$[$0], relation:$$[$0-2], relationTitle1:$$[$0-3], relationTitle2:$$[$0-1]} 
break;
case 29:
 this.$={type1:$$[$0-2],type2:$$[$0],lineType:$$[$0-1]}; 
break;
case 30:
 this.$={type1:'none',type2:$$[$0],lineType:$$[$0-1]}; 
break;
case 31:
 this.$={type1:$$[$0-1],type2:'none',lineType:$$[$0]}; 
break;
case 32:
 this.$={type1:'none',type2:'none',lineType:$$[$0]}; 
break;
case 33:
 this.$=yy.relationType.AGGREGATION;
break;
case 34:
 this.$=yy.relationType.EXTENSION;
break;
case 35:
 this.$=yy.relationType.COMPOSITION;
break;
case 36:
 this.$=yy.relationType.DEPENDENCY;
break;
case 37:
this.$=yy.lineType.LINE;
break;
case 38:
this.$=yy.lineType.DOTTED_LINE;
break;
case 39:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-1], $$[$0], undefined);
break;
case 40:
this.$ = $$[$0-3];yy.setClickEvent($$[$0-2], $$[$0-1], $$[$0]);
break;
case 41:
this.$ = $$[$0-2];yy.setLink($$[$0-1], $$[$0], undefined);
break;
case 42:
this.$ = $$[$0-3];yy.setLink($$[$0-2], $$[$0-1], $$[$0]);
break;
}
},
table: [{3:1,4:2,5:[1,3]},{1:[3]},{1:[2,1]},{6:[1,4]},{7:5,9:6,10:12,11:19,13:7,15:8,16:9,17:10,18:11,19:$V0,23:$V1,25:$V2,26:$V3,37:$V4,38:$V5,52:$V6,53:$V7,54:$V8},{8:[1,23]},{6:[1,24],8:[2,3]},o($V9,[2,10],{14:[1,25]}),o($V9,[2,12]),o($V9,[2,13]),o($V9,[2,14]),o($V9,[2,15]),o($V9,[2,21],{27:26,29:29,30:30,14:[1,28],28:[1,27],31:$Va,32:$Vb,33:$Vc,34:$Vd,35:$Ve,36:$Vf}),{10:37,11:19,52:$V6,53:$V7,54:$V8},o($V9,[2,23]),o($V9,[2,24]),{11:38,52:$V6,53:$V7,54:$V8},{10:39,11:19,52:$V6,53:$V7,54:$V8},{10:40,11:19,52:$V6,53:$V7,54:$V8},o($Vg,[2,7],{11:19,10:41,12:[1,42],52:$V6,53:$V7,54:$V8}),o($Vh,[2,56]),o($Vh,[2,57]),o($Vh,[2,58]),{1:[2,2]},{7:43,8:[2,4],9:6,10:12,11:19,13:7,15:8,16:9,17:10,18:11,19:$V0,23:$V1,25:$V2,26:$V3,37:$V4,38:$V5,52:$V6,53:$V7,54:$V8},o($V9,[2,11]),{10:44,11:19,28:[1,45],52:$V6,53:$V7,54:$V8},{27:46,29:29,30:30,31:$Va,32:$Vb,33:$Vc,34:$Vd,35:$Ve,36:$Vf},o($V9,[2,22]),{30:47,35:$Ve,36:$Vf},o($Vi,[2,32],{29:48,31:$Va,32:$Vb,33:$Vc,34:$Vd}),o($Vj,[2,33]),o($Vj,[2,34]),o($Vj,[2,35]),o($Vj,[2,36]),o($Vk,[2,37]),o($Vk,[2,38]),o($V9,[2,16],{20:[1,49]}),{24:[1,50]},{28:[1,51]},{28:[1,52]},o($Vg,[2,6]),o($Vg,[2,9],{11:19,10:53,52:$V6,53:$V7,54:$V8}),{8:[2,5]},o($Vl,[2,25]),{10:54,11:19,52:$V6,53:$V7,54:$V8},{10:55,11:19,28:[1,56],52:$V6,53:$V7,54:$V8},o($Vi,[2,31],{29:57,31:$Va,32:$Vb,33:$Vc,34:$Vd}),o($Vi,[2,30]),{21:58,25:$Vm},{10:60,11:19,52:$V6,53:$V7,54:$V8},o($V9,[2,39],{28:[1,61]}),o($V9,[2,41],{28:[1,62]}),o($Vg,[2,8]),o($Vl,[2,27]),o($Vl,[2,26]),{10:63,11:19,52:$V6,53:$V7,54:$V8},o($Vi,[2,29]),{22:[1,64]},{21:65,22:[2,19],25:$Vm},o($V9,[2,18]),o($V9,[2,40]),o($V9,[2,42]),o($Vl,[2,28]),o($V9,[2,17]),{22:[2,20]}],
defaultActions: {2:[2,1],23:[2,2],43:[2,5],65:[2,20]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:return 6;
break;
case 2:/* skip whitespace */
break;
case 3:return 5;
break;
case 4: this.begin("struct"); /*console.log('Starting struct');*/return 20;
break;
case 5:return "EOF_IN_STRUCT";
break;
case 6:return "OPEN_IN_STRUCT";
break;
case 7: /*console.log('Ending struct');*/this.popState(); return 22;
break;
case 8:/* nothing */
break;
case 9: /*console.log('lex-member: ' + yy_.yytext);*/  return "MEMBER";
break;
case 10:return 19;
break;
case 11:return 37;
break;
case 12:return 38;
break;
case 13:return 23;
break;
case 14:return 24;
break;
case 15:this.begin("generic");
break;
case 16:this.popState();
break;
case 17:return "GENERICTYPE";
break;
case 18:this.begin("string");
break;
case 19:this.popState();
break;
case 20:return "STR";
break;
case 21:return 32;
break;
case 22:return 32;
break;
case 23:return 34;
break;
case 24:return 34;
break;
case 25:return 33;
break;
case 26:return 31;
break;
case 27:return 35;
break;
case 28:return 36;
break;
case 29:return 14;
break;
case 30:return 50;
break;
case 31:return 'DOT';
break;
case 32:return 'PLUS';
break;
case 33:return 47;
break;
case 34:return 'EQUALS';
break;
case 35:return 'EQUALS';
break;
case 36:return 54;
break;
case 37:return 'PUNCTUATION';
break;
case 38:return 53;
break;
case 39:return 52;
break;
case 40:return 49;
break;
case 41:return 8;
break;
}
},
rules: [/^(?:%%[^\n]*\n*)/,/^(?:\n+)/,/^(?:\s+)/,/^(?:classDiagram\b)/,/^(?:[\{])/,/^(?:$)/,/^(?:[\{])/,/^(?:\})/,/^(?:[\n])/,/^(?:[^\{\}\n]*)/,/^(?:class\b)/,/^(?:callback\b)/,/^(?:link\b)/,/^(?:<<)/,/^(?:>>)/,/^(?:[~])/,/^(?:[~])/,/^(?:[^~]*)/,/^(?:["])/,/^(?:["])/,/^(?:[^"]*)/,/^(?:\s*<\|)/,/^(?:\s*\|>)/,/^(?:\s*>)/,/^(?:\s*<)/,/^(?:\s*\*)/,/^(?:\s*o\b)/,/^(?:--)/,/^(?:\.\.)/,/^(?::[^\n;]+)/,/^(?:-)/,/^(?:\.)/,/^(?:\+)/,/^(?:%)/,/^(?:=)/,/^(?:=)/,/^(?:\w+)/,/^(?:[!"#$%&'*+,-.`?\\/])/,/^(?:[0-9]+)/,/^(?:[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]|[\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377]|[\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5]|[\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA]|[\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE]|[\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA]|[\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0]|[\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977]|[\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2]|[\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A]|[\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39]|[\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8]|[\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C]|[\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C]|[\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99]|[\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0]|[\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D]|[\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3]|[\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10]|[\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1]|[\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81]|[\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3]|[\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6]|[\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A]|[\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081]|[\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D]|[\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0]|[\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310]|[\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C]|[\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711]|[\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7]|[\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C]|[\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16]|[\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF]|[\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC]|[\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D]|[\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D]|[\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3]|[\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F]|[\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128]|[\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184]|[\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3]|[\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6]|[\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE]|[\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C]|[\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D]|[\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC]|[\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B]|[\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788]|[\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805]|[\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB]|[\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28]|[\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5]|[\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4]|[\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E]|[\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D]|[\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36]|[\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D]|[\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]|[\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF]|[\uFFD2-\uFFD7\uFFDA-\uFFDC])/,/^(?:\s)/,/^(?:$)/],
conditions: {"string":{"rules":[19,20],"inclusive":false},"generic":{"rules":[16,17],"inclusive":false},"struct":{"rules":[5,6,7,8,9],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,10,11,12,13,14,15,18,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/class/svgDraw.js":
/*!***************************************!*\
  !*** ./src/diagrams/class/svgDraw.js ***!
  \***************************************/
/*! exports provided: drawEdge, drawClass, parseMember, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawEdge", function() { return drawEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawClass", function() { return drawClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseMember", function() { return parseMember; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _classDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./classDb */ "./src/diagrams/class/classDb.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");




var edgeCount = 0;
var drawEdge = function drawEdge(elem, path, relation, conf) {
  var getRelationType = function getRelationType(type) {
    switch (type) {
      case _classDb__WEBPACK_IMPORTED_MODULE_1__["relationType"].AGGREGATION:
        return 'aggregation';

      case _classDb__WEBPACK_IMPORTED_MODULE_1__["relationType"].EXTENSION:
        return 'extension';

      case _classDb__WEBPACK_IMPORTED_MODULE_1__["relationType"].COMPOSITION:
        return 'composition';

      case _classDb__WEBPACK_IMPORTED_MODULE_1__["relationType"].DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(function (p) {
    return !Number.isNaN(p.y);
  }); // The data for our line

  var lineData = path.points; // This is the accessor function we talked about above

  var lineFunction = Object(d3__WEBPACK_IMPORTED_MODULE_0__["line"])().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var svgPath = elem.append('path').attr('d', lineFunction(lineData)).attr('id', 'edge' + edgeCount).attr('class', 'relation');
  var url = '';

  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  if (relation.relation.lineType == 1) {
    svgPath.attr('class', 'relation dashed-line');
  }

  if (relation.relation.type1 !== 'none') {
    svgPath.attr('marker-start', 'url(' + url + '#' + getRelationType(relation.relation.type1) + 'Start' + ')');
  }

  if (relation.relation.type2 !== 'none') {
    svgPath.attr('marker-end', 'url(' + url + '#' + getRelationType(relation.relation.type2) + 'End' + ')');
  }

  var x, y;
  var l = path.points.length; // Calculate Label position

  var labelPosition = _utils__WEBPACK_IMPORTED_MODULE_2__["default"].calcLabelPosition(path.points);
  x = labelPosition.x;
  y = labelPosition.y;
  var p1_card_x, p1_card_y;
  var p2_card_x, p2_card_y;

  if (l % 2 !== 0 && l > 1) {
    var cardinality_1_point = _utils__WEBPACK_IMPORTED_MODULE_2__["default"].calcCardinalityPosition(relation.relation.type1 !== 'none', path.points, path.points[0]);
    var cardinality_2_point = _utils__WEBPACK_IMPORTED_MODULE_2__["default"].calcCardinalityPosition(relation.relation.type2 !== 'none', path.points, path.points[l - 1]);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('cardinality_1_point ' + JSON.stringify(cardinality_1_point));
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('cardinality_2_point ' + JSON.stringify(cardinality_2_point));
    p1_card_x = cardinality_1_point.x;
    p1_card_y = cardinality_1_point.y;
    p2_card_x = cardinality_2_point.x;
    p2_card_y = cardinality_2_point.y;
  }

  if (typeof relation.title !== 'undefined') {
    var g = elem.append('g').attr('class', 'classLabel');
    var label = g.append('text').attr('class', 'label').attr('x', x).attr('y', y).attr('fill', 'red').attr('text-anchor', 'middle').text(relation.title);
    window.label = label;
    var bounds = label.node().getBBox();
    g.insert('rect', ':first-child').attr('class', 'box').attr('x', bounds.x - conf.padding / 2).attr('y', bounds.y - conf.padding / 2).attr('width', bounds.width + conf.padding).attr('height', bounds.height + conf.padding);
  }

  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering relation ' + JSON.stringify(relation));

  if (typeof relation.relationTitle1 !== 'undefined' && relation.relationTitle1 !== 'none') {
    var _g = elem.append('g').attr('class', 'cardinality');

    _g.append('text').attr('class', 'type1').attr('x', p1_card_x).attr('y', p1_card_y).attr('fill', 'black').attr('font-size', '6').text(relation.relationTitle1);
  }

  if (typeof relation.relationTitle2 !== 'undefined' && relation.relationTitle2 !== 'none') {
    var _g2 = elem.append('g').attr('class', 'cardinality');

    _g2.append('text').attr('class', 'type2').attr('x', p2_card_x).attr('y', p2_card_y).attr('fill', 'black').attr('font-size', '6').text(relation.relationTitle2);
  }

  edgeCount++;
};
var drawClass = function drawClass(elem, classDef, conf) {
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering class ' + classDef);
  var cssClassStr = 'classGroup ';

  if (classDef.cssClasses.length > 0) {
    cssClassStr = cssClassStr + classDef.cssClasses.join(' ');
  }

  var id = classDef.id;
  var classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  }; // add class group

  var g = elem.append('g').attr('id', Object(_classDb__WEBPACK_IMPORTED_MODULE_1__["lookUpDomId"])(id)).attr('class', cssClassStr); // add title

  var title;

  if (classDef.link) {
    title = g.append('svg:a').attr('xlink:href', classDef.link).attr('target', '_blank').append('text').attr('y', conf.textHeight + conf.padding).attr('x', 0);
  } else {
    title = g.append('text').attr('y', conf.textHeight + conf.padding).attr('x', 0);
  } // add annotations


  var isFirst = true;
  classDef.annotations.forEach(function (member) {
    var titleText2 = title.append('tspan').text('«' + member + '»');
    if (!isFirst) titleText2.attr('dy', conf.textHeight);
    isFirst = false;
  });
  var classTitleString = classDef.id;

  if (classDef.type !== undefined && classDef.type !== '') {
    classTitleString += '<' + classDef.type + '>';
  }

  var classTitle = title.append('tspan').text(classTitleString).attr('class', 'title'); // If class has annotations the title needs to have an offset of the text height

  if (!isFirst) classTitle.attr('dy', conf.textHeight);
  var titleHeight = title.node().getBBox().height;
  var membersLine = g.append('line') // text label for the x axis
  .attr('x1', 0).attr('y1', conf.padding + titleHeight + conf.dividerMargin / 2).attr('y2', conf.padding + titleHeight + conf.dividerMargin / 2);
  var members = g.append('text') // text label for the x axis
  .attr('x', conf.padding).attr('y', titleHeight + conf.dividerMargin + conf.textHeight).attr('fill', 'white').attr('class', 'classText');
  isFirst = true;
  classDef.members.forEach(function (member) {
    addTspan(members, member, isFirst, conf);
    isFirst = false;
  });
  var membersBox = members.node().getBBox();
  var methodsLine = g.append('line') // text label for the x axis
  .attr('x1', 0).attr('y1', conf.padding + titleHeight + conf.dividerMargin + membersBox.height).attr('y2', conf.padding + titleHeight + conf.dividerMargin + membersBox.height);
  var methods = g.append('text') // text label for the x axis
  .attr('x', conf.padding).attr('y', titleHeight + 2 * conf.dividerMargin + membersBox.height + conf.textHeight).attr('fill', 'white').attr('class', 'classText');
  isFirst = true;
  classDef.methods.forEach(function (method) {
    addTspan(methods, method, isFirst, conf);
    isFirst = false;
  });
  var classBox = g.node().getBBox();
  var rect = g.insert('rect', ':first-child').attr('x', 0).attr('y', 0).attr('width', classBox.width + 2 * conf.padding).attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin);
  var rectWidth = rect.node().getBBox().width; // Center title
  // We subtract the width of each text element from the class box width and divide it by 2

  title.node().childNodes.forEach(function (x) {
    x.setAttribute('x', (rectWidth - x.getBBox().width) / 2);
  });

  if (classDef.tooltip) {
    title.insert('title').text(classDef.tooltip);
  }

  membersLine.attr('x2', rectWidth);
  methodsLine.attr('x2', rectWidth);
  classInfo.width = rectWidth;
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin;
  return classInfo;
};
var parseMember = function parseMember(text) {
  var fieldRegEx = /(\+|-|~|#)?(\w+)(~\w+~|\[\])?\s+(\w+)/;
  var methodRegEx = /^([+|\-|~|#])?(\w+) *\( *(.*)\) *(\*|\$)? *(\w*[~|[\]]*\s*\w*~?)$/;
  var fieldMatch = text.match(fieldRegEx);
  var methodMatch = text.match(methodRegEx);

  if (fieldMatch && !methodMatch) {
    return buildFieldDisplay(fieldMatch);
  } else if (methodMatch) {
    return buildMethodDisplay(methodMatch);
  } else {
    return buildLegacyDisplay(text);
  }
};

var buildFieldDisplay = function buildFieldDisplay(parsedText) {
  var displayText = '';

  try {
    var visibility = parsedText[1] ? parsedText[1].trim() : '';
    var fieldType = parsedText[2] ? parsedText[2].trim() : '';
    var genericType = parsedText[3] ? parseGenericTypes(parsedText[3].trim()) : '';
    var fieldName = parsedText[4] ? parsedText[4].trim() : '';
    displayText = visibility + fieldType + genericType + ' ' + fieldName;
  } catch (err) {
    displayText = parsedText;
  }

  return {
    displayText: displayText,
    cssStyle: ''
  };
};

var buildMethodDisplay = function buildMethodDisplay(parsedText) {
  var cssStyle = '';
  var displayText = '';

  try {
    var visibility = parsedText[1] ? parsedText[1].trim() : '';
    var methodName = parsedText[2] ? parsedText[2].trim() : '';
    var parameters = parsedText[3] ? parseGenericTypes(parsedText[3].trim()) : '';
    var classifier = parsedText[4] ? parsedText[4].trim() : '';
    var returnType = parsedText[5] ? ' : ' + parseGenericTypes(parsedText[5]).trim() : '';
    displayText = visibility + methodName + '(' + parameters + ')' + returnType;
    cssStyle = parseClassifier(classifier);
  } catch (err) {
    displayText = parsedText;
  }

  return {
    displayText: displayText,
    cssStyle: cssStyle
  };
};

var buildLegacyDisplay = function buildLegacyDisplay(text) {
  // if for some reason we dont have any match, use old format to parse text
  var displayText = '';
  var cssStyle = '';
  var memberText = '';
  var returnType = '';
  var methodStart = text.indexOf('(');
  var methodEnd = text.indexOf(')');

  if (methodStart > 1 && methodEnd > methodStart && methodEnd <= text.length) {
    var visibility = '';
    var methodName = '';
    var firstChar = text.substring(0, 1);

    if (firstChar.match(/\w/)) {
      methodName = text.substring(0, methodStart).trim();
    } else {
      if (firstChar.match(/\+|-|~|#/)) {
        visibility = firstChar;
      }

      methodName = text.substring(1, methodStart).trim();
    }

    var parameters = text.substring(methodStart + 1, methodEnd);
    var classifier = text.substring(methodEnd + 1, 1);
    cssStyle = parseClassifier(classifier);
    displayText = visibility + methodName + '(' + parseGenericTypes(parameters.trim()) + ')';

    if (methodEnd < memberText.length) {
      returnType = text.substring(methodEnd + 2).trim();

      if (returnType !== '') {
        returnType = ' : ' + parseGenericTypes(returnType);
      }
    }
  } else {
    // finally - if all else fails, just send the text back as written (other than parsing for generic types)
    displayText = parseGenericTypes(text);
  }

  return {
    displayText: displayText,
    cssStyle: cssStyle
  };
};

var addTspan = function addTspan(textEl, txt, isFirst, conf) {
  var member = parseMember(txt);
  var tSpan = textEl.append('tspan').attr('x', conf.padding).text(member.displayText);

  if (member.cssStyle !== '') {
    tSpan.attr('style', member.cssStyle);
  }

  if (!isFirst) {
    tSpan.attr('dy', conf.textHeight);
  }
};

var parseGenericTypes = function parseGenericTypes(text) {
  var cleanedText = text;

  if (text.indexOf('~') != -1) {
    cleanedText = cleanedText.replace('~', '<');
    cleanedText = cleanedText.replace('~', '>');
    return parseGenericTypes(cleanedText);
  } else {
    return cleanedText;
  }
};

var parseClassifier = function parseClassifier(classifier) {
  switch (classifier) {
    case '*':
      return 'font-style:italic;';

    case '$':
      return 'text-decoration:underline;';

    default:
      return '';
  }
};

/* harmony default export */ __webpack_exports__["default"] = ({
  drawClass: drawClass,
  drawEdge: drawEdge,
  parseMember: parseMember
});

/***/ }),

/***/ "./src/diagrams/common/common.js":
/*!***************************************!*\
  !*** ./src/diagrams/common/common.js ***!
  \***************************************/
/*! exports provided: getRows, sanitizeText, lineBreakRegex, hasBreaks, splitBreaks, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRows", function() { return getRows; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sanitizeText", function() { return sanitizeText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lineBreakRegex", function() { return lineBreakRegex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hasBreaks", function() { return hasBreaks; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "splitBreaks", function() { return splitBreaks; });
var getRows = function getRows(s) {
  if (!s) return 1;
  var str = breakToPlaceholder(s);
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};
var sanitizeText = function sanitizeText(text, config) {
  var txt = text;
  var htmlLabels = true;
  if (config.flowchart && (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')) htmlLabels = false;

  if (config.securityLevel !== 'loose' && htmlLabels) {
    // eslint-disable-line
    txt = breakToPlaceholder(txt);
    txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    txt = txt.replace(/=/g, '&equals;');
    txt = placeholderToBreak(txt);
  }

  return txt;
};
var lineBreakRegex = /<br\s*\/?>/gi;
var hasBreaks = function hasBreaks(text) {
  return /<br\s*[/]?>/gi.test(text);
};
var splitBreaks = function splitBreaks(text) {
  return text.split(/<br\s*[/]?>/gi);
};

var breakToPlaceholder = function breakToPlaceholder(s) {
  return s.replace(lineBreakRegex, '#br#');
};

var placeholderToBreak = function placeholderToBreak(s) {
  return s.replace(/#br#/g, '<br/>');
};

/* harmony default export */ __webpack_exports__["default"] = ({
  getRows: getRows,
  sanitizeText: sanitizeText,
  hasBreaks: hasBreaks,
  splitBreaks: splitBreaks,
  lineBreakRegex: lineBreakRegex
});

/***/ }),

/***/ "./src/diagrams/er/erDb.js":
/*!*********************************!*\
  !*** ./src/diagrams/er/erDb.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 *
 */

var entities = {};
var relationships = [];
var title = '';
var Cardinality = {
  ZERO_OR_ONE: 'ZERO_OR_ONE',
  ZERO_OR_MORE: 'ZERO_OR_MORE',
  ONE_OR_MORE: 'ONE_OR_MORE',
  ONLY_ONE: 'ONLY_ONE'
};
var Identification = {
  NON_IDENTIFYING: 'NON_IDENTIFYING',
  IDENTIFYING: 'IDENTIFYING'
};

var addEntity = function addEntity(name) {
  if (typeof entities[name] === 'undefined') {
    entities[name] = name;
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Added new entity :', name);
  }
};

var getEntities = function getEntities() {
  return entities;
};
/**
 * Add a relationship
 * @param entA The first entity in the relationship
 * @param rolA The role played by the first entity in relation to the second
 * @param entB The second entity in the relationship
 * @param rSpec The details of the relationship between the two entities
 */


var addRelationship = function addRelationship(entA, rolA, entB, rSpec) {
  var rel = {
    entityA: entA,
    roleA: rolA,
    entityB: entB,
    relSpec: rSpec
  };
  relationships.push(rel);
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Added new relationship :', rel);
};

var getRelationships = function getRelationships() {
  return relationships;
}; // Keep this - TODO: revisit...allow the diagram to have a title


var setTitle = function setTitle(txt) {
  title = txt;
};

var getTitle = function getTitle() {
  return title;
};

var clear = function clear() {
  entities = {};
  relationships = [];
  title = '';
};

/* harmony default export */ __webpack_exports__["default"] = ({
  Cardinality: Cardinality,
  Identification: Identification,
  addEntity: addEntity,
  getEntities: getEntities,
  addRelationship: addRelationship,
  getRelationships: getRelationships,
  clear: clear,
  setTitle: setTitle,
  getTitle: getTitle
});

/***/ }),

/***/ "./src/diagrams/er/erMarkers.js":
/*!**************************************!*\
  !*** ./src/diagrams/er/erMarkers.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var ERMarkers = {
  ONLY_ONE_START: 'ONLY_ONE_START',
  ONLY_ONE_END: 'ONLY_ONE_END',
  ZERO_OR_ONE_START: 'ZERO_OR_ONE_START',
  ZERO_OR_ONE_END: 'ZERO_OR_ONE_END',
  ONE_OR_MORE_START: 'ONE_OR_MORE_START',
  ONE_OR_MORE_END: 'ONE_OR_MORE_END',
  ZERO_OR_MORE_START: 'ZERO_OR_MORE_START',
  ZERO_OR_MORE_END: 'ZERO_OR_MORE_END'
};
/**
 * Put the markers into the svg DOM for later use with edge paths
 */

var insertMarkers = function insertMarkers(elem, conf) {
  var marker;
  elem.append('defs').append('marker').attr('id', ERMarkers.ONLY_ONE_START).attr('refX', 0).attr('refY', 9).attr('markerWidth', 18).attr('markerHeight', 18).attr('orient', 'auto').append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M9,0 L9,18 M15,0 L15,18');
  elem.append('defs').append('marker').attr('id', ERMarkers.ONLY_ONE_END).attr('refX', 18).attr('refY', 9).attr('markerWidth', 18).attr('markerHeight', 18).attr('orient', 'auto').append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M3,0 L3,18 M9,0 L9,18');
  marker = elem.append('defs').append('marker').attr('id', ERMarkers.ZERO_OR_ONE_START).attr('refX', 0).attr('refY', 9).attr('markerWidth', 30).attr('markerHeight', 18).attr('orient', 'auto');
  marker.append('circle').attr('stroke', conf.stroke).attr('fill', 'white').attr('cx', 21).attr('cy', 9).attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M9,0 L9,18');
  marker = elem.append('defs').append('marker').attr('id', ERMarkers.ZERO_OR_ONE_END).attr('refX', 30).attr('refY', 9).attr('markerWidth', 30).attr('markerHeight', 18).attr('orient', 'auto');
  marker.append('circle').attr('stroke', conf.stroke).attr('fill', 'white').attr('cx', 9).attr('cy', 9).attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M21,0 L21,18');
  elem.append('defs').append('marker').attr('id', ERMarkers.ONE_OR_MORE_START).attr('refX', 18).attr('refY', 18).attr('markerWidth', 45).attr('markerHeight', 36).attr('orient', 'auto').append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M0,18 Q 18,0 36,18 Q 18,36 0,18 M42,9 L42,27');
  elem.append('defs').append('marker').attr('id', ERMarkers.ONE_OR_MORE_END).attr('refX', 27).attr('refY', 18).attr('markerWidth', 45).attr('markerHeight', 36).attr('orient', 'auto').append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M3,9 L3,27 M9,18 Q27,0 45,18 Q27,36 9,18');
  marker = elem.append('defs').append('marker').attr('id', ERMarkers.ZERO_OR_MORE_START).attr('refX', 18).attr('refY', 18).attr('markerWidth', 57).attr('markerHeight', 36).attr('orient', 'auto');
  marker.append('circle').attr('stroke', conf.stroke).attr('fill', 'white').attr('cx', 48).attr('cy', 18).attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M0,18 Q18,0 36,18 Q18,36 0,18');
  marker = elem.append('defs').append('marker').attr('id', ERMarkers.ZERO_OR_MORE_END).attr('refX', 39).attr('refY', 18).attr('markerWidth', 57).attr('markerHeight', 36).attr('orient', 'auto');
  marker.append('circle').attr('stroke', conf.stroke).attr('fill', 'white').attr('cx', 9).attr('cy', 18).attr('r', 6);
  marker.append('path').attr('stroke', conf.stroke).attr('fill', 'none').attr('d', 'M21,18 Q39,0 57,18 Q39,36 21,18');
  return;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  ERMarkers: ERMarkers,
  insertMarkers: insertMarkers
});

/***/ }),

/***/ "./src/diagrams/er/erRenderer.js":
/*!***************************************!*\
  !*** ./src/diagrams/er/erRenderer.js ***!
  \***************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _erDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./erDb */ "./src/diagrams/er/erDb.js");
/* harmony import */ var _parser_erDiagram__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/erDiagram */ "./src/diagrams/er/parser/erDiagram.jison");
/* harmony import */ var _parser_erDiagram__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_erDiagram__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _erMarkers__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./erMarkers */ "./src/diagrams/er/erMarkers.js");








var conf = {};
/**
 * Allows the top-level API module to inject config specific to this renderer,
 * storing it in the local conf object. Note that generic config still needs to be
 * retrieved using getConfig() imported from the config module
 */

var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);

  for (var i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};
/**
 * Use D3 to construct the svg elements for the entities
 * @param svgNode the svg node that contains the diagram
 * @param entities The entities to be drawn
 * @param graph The graph that contains the vertex and edge definitions post-layout
 * @return The first entity that was inserted
 */

var drawEntities = function drawEntities(svgNode, entities, graph) {
  var keys = Object.keys(entities);
  var firstOne;
  keys.forEach(function (id) {
    // Create a group for each entity
    var groupNode = svgNode.append('g').attr('id', id);
    firstOne = firstOne === undefined ? id : firstOne; // Label the entity - this is done first so that we can get the bounding box
    // which then determines the size of the rectangle

    var textId = 'entity-' + id;
    var textNode = groupNode.append('text').attr('id', textId).attr('x', 0).attr('y', 0).attr('dominant-baseline', 'middle').attr('text-anchor', 'middle').attr('style', 'font-family: ' + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().fontFamily + '; font-size: ' + conf.fontSize + 'px').text(id); // Calculate the width and height of the entity

    var textBBox = textNode.node().getBBox();
    var entityWidth = Math.max(conf.minEntityWidth, textBBox.width + conf.entityPadding * 2);
    var entityHeight = Math.max(conf.minEntityHeight, textBBox.height + conf.entityPadding * 2); // Make sure the text gets centred relative to the entity box

    textNode.attr('transform', 'translate(' + entityWidth / 2 + ',' + entityHeight / 2 + ')'); // Draw the rectangle - insert it before the text so that the text is not obscured

    var rectNode = groupNode.insert('rect', '#' + textId).attr('fill', conf.fill).attr('fill-opacity', '100%').attr('stroke', conf.stroke).attr('x', 0).attr('y', 0).attr('width', entityWidth).attr('height', entityHeight);
    var rectBBox = rectNode.node().getBBox(); // Add the entity to the graph

    graph.setNode(id, {
      width: rectBBox.width,
      height: rectBBox.height,
      shape: 'rect',
      id: id
    });
  });
  return firstOne;
}; // drawEntities


var adjustEntities = function adjustEntities(svgNode, graph) {
  graph.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      svgNode.select('#' + v).attr('transform', 'translate(' + (graph.node(v).x - graph.node(v).width / 2) + ',' + (graph.node(v).y - graph.node(v).height / 2) + ' )');
    }
  });
  return;
};

var getEdgeName = function getEdgeName(rel) {
  return (rel.entityA + rel.roleA + rel.entityB).replace(/\s/g, '');
};
/**
 * Add each relationship to the graph
 * @param relationships the relationships to be added
 * @param g the graph
 * @return {Array} The array of relationships
 */


var addRelationships = function addRelationships(relationships, g) {
  relationships.forEach(function (r) {
    g.setEdge(r.entityA, r.entityB, {
      relationship: r
    }, getEdgeName(r));
  });
  return relationships;
}; // addRelationships


var relCnt = 0;
/**
 * Draw a relationship using edge information from the graph
 * @param svg the svg node
 * @param rel the relationship to draw in the svg
 * @param g the graph containing the edge information
 * @param insert the insertion point in the svg DOM (because relationships have markers that need to sit 'behind' opaque entity boxes)
 */

var drawRelationshipFromLayout = function drawRelationshipFromLayout(svg, rel, g, insert) {
  relCnt++; // Find the edge relating to this relationship

  var edge = g.edge(rel.entityA, rel.entityB, getEdgeName(rel)); // Get a function that will generate the line path

  var lineFunction = Object(d3__WEBPACK_IMPORTED_MODULE_1__["line"])().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_1__["curveBasis"]); // Insert the line at the right place

  var svgPath = svg.insert('path', '#' + insert).attr('d', lineFunction(edge.points)).attr('stroke', conf.stroke).attr('fill', 'none'); // ...and with dashes if necessary

  if (rel.relSpec.relType === _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Identification.NON_IDENTIFYING) {
    svgPath.attr('stroke-dasharray', '8,8');
  } // TODO: Understand this better


  var url = '';

  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  } // Decide which start and end markers it needs. It may be possible to be more concise here
  // by reversing a start marker to make an end marker...but this will do for now
  // Note that the 'A' entity's marker is at the end of the relationship and the 'B' entity's marker is at the start


  switch (rel.relSpec.cardA) {
    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ZERO_OR_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ZERO_OR_ONE_END + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ZERO_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ZERO_OR_MORE_END + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ONE_OR_MORE:
      svgPath.attr('marker-end', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ONE_OR_MORE_END + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ONLY_ONE:
      svgPath.attr('marker-end', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ONLY_ONE_END + ')');
      break;
  }

  switch (rel.relSpec.cardB) {
    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ZERO_OR_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ZERO_OR_ONE_START + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ZERO_OR_MORE:
      svgPath.attr('marker-start', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ZERO_OR_MORE_START + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ONE_OR_MORE:
      svgPath.attr('marker-start', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ONE_OR_MORE_START + ')');
      break;

    case _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].Cardinality.ONLY_ONE:
      svgPath.attr('marker-start', 'url(' + url + '#' + _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].ERMarkers.ONLY_ONE_START + ')');
      break;
  } // Now label the relationship
  // Find the half-way point


  var len = svgPath.node().getTotalLength();
  var labelPoint = svgPath.node().getPointAtLength(len * 0.5); // Append a text node containing the label

  var labelId = 'rel' + relCnt;
  var labelNode = svg.append('text').attr('id', labelId).attr('x', labelPoint.x).attr('y', labelPoint.y).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('style', 'font-family: ' + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().fontFamily + '; font-size: ' + conf.fontSize + 'px').text(rel.roleA); // Figure out how big the opaque 'container' rectangle needs to be

  var labelBBox = labelNode.node().getBBox(); // Insert the opaque rectangle before the text label

  svg.insert('rect', '#' + labelId).attr('x', labelPoint.x - labelBBox.width / 2).attr('y', labelPoint.y - labelBBox.height / 2).attr('width', labelBBox.width).attr('height', labelBBox.height).attr('fill', 'white').attr('fill-opacity', '85%');
  return;
};
/**
 * Draw en E-R diagram in the tag with id: id based on the text definition of the diagram
 * @param text the text of the diagram
 * @param id the unique id of the DOM node that contains the diagram
 */


var draw = function draw(text, id) {
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Drawing ER diagram');
  _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_erDiagram__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _erDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the text to populate erDb

  try {
    parser.parse(text);
  } catch (err) {
    _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].debug('Parsing failed');
  } // Get a reference to the svg node that contains the text


  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id='".concat(id, "']")); // Add cardinality marker definitions to the svg

  _erMarkers__WEBPACK_IMPORTED_MODULE_7__["default"].insertMarkers(svg, conf); // Now we have to construct the diagram in a specific way:
  // ---
  // 1. Create all the entities in the svg node at 0,0, but with the correct dimensions (allowing for text content)
  // 2. Make sure they are all added to the graph
  // 3. Add all the edges (relationships) to the graph aswell
  // 4. Let dagre do its magic to layout the graph.  This assigns:
  //    - the centre co-ordinates for each node, bearing in mind the dimensions and edge relationships
  //    - the path co-ordinates for each edge
  //    But it has no impact on the svg child nodes - the diagram remains with every entity rooted at 0,0
  // 5. Now assign a transform to each entity in the svg node so that it gets drawn in the correct place, as determined by
  //    its centre point, which is obtained from the graph, and it's width and height
  // 6. And finally, create all the edges in the svg node using information from the graph
  // ---
  // Create the graph

  var g; // TODO: Explore directed vs undirected graphs, and how the layout is affected
  // An E-R diagram could be said to be undirected, but there is merit in setting
  // the direction from parent to child in a one-to-many as this influences graphlib to
  // put the parent above the child (does it?), which is intuitive.  Most relationships
  // in ER diagrams are one-to-many.

  g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
    multigraph: true,
    directed: true,
    compound: false
  }).setGraph({
    rankdir: conf.layoutDirection,
    marginx: 20,
    marginy: 20,
    nodesep: 100,
    edgesep: 100,
    ranksep: 100
  }).setDefaultEdgeLabel(function () {
    return {};
  }); // Draw the entities (at 0,0), returning the first svg node that got
  // inserted - this represents the insertion point for relationship paths

  var firstEntity = drawEntities(svg, _erDb__WEBPACK_IMPORTED_MODULE_2__["default"].getEntities(), g); // TODO: externalise the addition of entities to the graph - it's a bit 'buried' in the above
  // Add all the relationships to the graph

  var relationships = addRelationships(_erDb__WEBPACK_IMPORTED_MODULE_2__["default"].getRelationships(), g);
  dagre__WEBPACK_IMPORTED_MODULE_4___default.a.layout(g); // Node and edge positions will be updated
  // Adjust the positions of the entities so that they adhere to the layout

  adjustEntities(svg, g); // Draw the relationships

  relationships.forEach(function (rel) {
    drawRelationshipFromLayout(svg, rel, g, firstEntity);
  });
  var padding = conf.diagramPadding;
  var svgBounds = svg.node().getBBox();
  var width = svgBounds.width + padding * 2;
  var height = svgBounds.height + padding * 2;
  svg.attr('height', height);
  svg.attr('width', '100%');
  svg.attr('style', "max-width: ".concat(width, "px;"));
  svg.attr('viewBox', "".concat(svgBounds.x - padding, " ").concat(svgBounds.y - padding, " ").concat(width, " ").concat(height));
}; // draw

/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/er/parser/erDiagram.jison":
/*!************************************************!*\
  !*** ./src/diagrams/er/parser/erDiagram.jison ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,12],$V1=[1,7],$V2=[1,10],$V3=[1,11],$V4=[1,12],$V5=[1,13],$V6=[12,19,20],$V7=[15,16,17,18];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"ER_DIAGRAM":4,"document":5,"EOF":6,"statement":7,"entityName":8,"relSpec":9,":":10,"role":11,"ALPHANUM":12,"cardinality":13,"relType":14,"ZERO_OR_ONE":15,"ZERO_OR_MORE":16,"ONE_OR_MORE":17,"ONLY_ONE":18,"NON_IDENTIFYING":19,"IDENTIFYING":20,"WORD":21,"$accept":0,"$end":1},
terminals_: {2:"error",4:"ER_DIAGRAM",6:"EOF",10:":",12:"ALPHANUM",15:"ZERO_OR_ONE",16:"ZERO_OR_MORE",17:"ONE_OR_MORE",18:"ONLY_ONE",19:"NON_IDENTIFYING",20:"IDENTIFYING",21:"WORD"},
productions_: [0,[3,3],[5,0],[5,2],[7,5],[8,1],[9,3],[13,1],[13,1],[13,1],[13,1],[14,1],[14,1],[11,1],[11,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 /*console.log('finished parsing');*/ 
break;
case 4:

          yy.addEntity($$[$0-4]); 
          yy.addEntity($$[$0-2]); 
          yy.addRelationship($$[$0-4], $$[$0], $$[$0-2], $$[$0-3]);
          /*console.log($$[$0-4] + $$[$0-3] + $$[$0-2] + ':' + $$[$0]);*/
      
break;
case 5:
 this.$ = $$[$0]; /*console.log('Entity: ' + $$[$0]);*/ 
break;
case 6:

        this.$ = { cardA: $$[$0], relType: $$[$0-1], cardB: $$[$0-2] };
        /*console.log('relSpec: ' + $$[$0] + $$[$0-1] + $$[$0-2]);*/
      
break;
case 7:
 this.$ = yy.Cardinality.ZERO_OR_ONE; 
break;
case 8:
 this.$ = yy.Cardinality.ZERO_OR_MORE; 
break;
case 9:
 this.$ = yy.Cardinality.ONE_OR_MORE; 
break;
case 10:
 this.$ = yy.Cardinality.ONLY_ONE; 
break;
case 11:
 this.$ = yy.Identification.NON_IDENTIFYING;  
break;
case 12:
 this.$ = yy.Identification.IDENTIFYING; 
break;
case 13:
 this.$ = $$[$0].replace(/"/g, ''); 
break;
case 14:
 this.$ = $$[$0]; 
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:6,12:$V1},{1:[2,1]},o($V0,[2,3]),{9:8,13:9,15:$V2,16:$V3,17:$V4,18:$V5},o([10,15,16,17,18],[2,5]),{8:14,12:$V1},{14:15,19:[1,16],20:[1,17]},o($V6,[2,7]),o($V6,[2,8]),o($V6,[2,9]),o($V6,[2,10]),{10:[1,18]},{13:19,15:$V2,16:$V3,17:$V4,18:$V5},o($V7,[2,11]),o($V7,[2,12]),{11:20,12:[1,22],21:[1,21]},{12:[2,6]},o($V0,[2,4]),o($V0,[2,13]),o($V0,[2,14])],
defaultActions: {4:[2,1],19:[2,6]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 'SPACE';
break;
case 2:return 21;
break;
case 3:return 4;
break;
case 4:return 15;
break;
case 5:return 16;
break;
case 6:return 17;
break;
case 7:return 18;
break;
case 8:return 15;
break;
case 9:return 16;
break;
case 10:return 17;
break;
case 11:return 19;
break;
case 12:return 20;
break;
case 13:return 19;
break;
case 14:return 19;
break;
case 15:return 12;
break;
case 16:return yy_.yytext[0];
break;
case 17:return 6;
break;
}
},
rules: [/^(?:\s+)/i,/^(?:[\s]+)/i,/^(?:"[^"]*")/i,/^(?:erDiagram\b)/i,/^(?:\|o\b)/i,/^(?:\}o\b)/i,/^(?:\}\|)/i,/^(?:\|\|)/i,/^(?:o\|)/i,/^(?:o\{)/i,/^(?:\|\{)/i,/^(?:\.\.)/i,/^(?:--)/i,/^(?:\.-)/i,/^(?:-\.)/i,/^(?:[A-Za-z][A-Za-z0-9\-]*)/i,/^(?:.)/i,/^(?:$)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/flowchart/flowChartShapes.js":
/*!***************************************************!*\
  !*** ./src/diagrams/flowchart/flowChartShapes.js ***!
  \***************************************************/
/*! exports provided: addToRender, addToRenderV2, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addToRender", function() { return addToRender; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addToRenderV2", function() { return addToRenderV2; });
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dagre-d3 */ "dagre-d3");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dagre_d3__WEBPACK_IMPORTED_MODULE_0__);


function question(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var s = (w + h) * 0.9;
  var points = [{
    x: s / 2,
    y: 0
  }, {
    x: s,
    y: -s / 2
  }, {
    x: s / 2,
    y: -s
  }, {
    x: 0,
    y: -s / 2
  }];
  var shapeSvg = insertPolygonShape(parent, s, s, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function hexagon(parent, bbox, node) {
  var f = 4;
  var h = bbox.height;
  var m = h / f;
  var w = bbox.width + 2 * m;
  var points = [{
    x: m,
    y: 0
  }, {
    x: w - m,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w - m,
    y: -h
  }, {
    x: m,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function rect_left_inv_arrow(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -h / 2,
    y: 0
  }, {
    x: w,
    y: 0
  }, {
    x: w,
    y: -h
  }, {
    x: -h / 2,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function lean_right(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function lean_left(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: 2 * h / 6,
    y: 0
  }, {
    x: w + h / 6,
    y: 0
  }, {
    x: w - 2 * h / 6,
    y: -h
  }, {
    x: -h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function trapezoid(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function inv_trapezoid(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: -2 * h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function rect_right_inv_arrow(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: 0,
    y: 0
  }, {
    x: w + h / 2,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w + h / 2,
    y: -h
  }, {
    x: 0,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function stadium(parent, bbox, node) {
  var h = bbox.height;
  var w = bbox.width + h / 4;
  var shapeSvg = parent.insert('rect', ':first-child').attr('rx', h / 2).attr('ry', h / 2).attr('x', -w / 2).attr('y', -h / 2).attr('width', w).attr('height', h);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.rect(node, point);
  };

  return shapeSvg;
}

function subroutine(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: 0,
    y: 0
  }, {
    x: w,
    y: 0
  }, {
    x: w,
    y: -h
  }, {
    x: 0,
    y: -h
  }, {
    x: 0,
    y: 0
  }, {
    x: -8,
    y: 0
  }, {
    x: w + 8,
    y: 0
  }, {
    x: w + 8,
    y: -h
  }, {
    x: -8,
    y: -h
  }, {
    x: -8,
    y: 0
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function cylinder(parent, bbox, node) {
  var w = bbox.width;
  var rx = w / 2;
  var ry = rx / (2.5 + w / 50);
  var h = bbox.height + ry;
  var shape = 'M 0,' + ry + ' a ' + rx + ',' + ry + ' 0,0,0 ' + w + ' 0 a ' + rx + ',' + ry + ' 0,0,0 ' + -w + ' 0 l 0,' + h + ' a ' + rx + ',' + ry + ' 0,0,0 ' + w + ' 0 l 0,' + -h;
  var shapeSvg = parent.attr('label-offset-y', ry).insert('path', ':first-child').attr('d', shape).attr('transform', 'translate(' + -w / 2 + ',' + -(h / 2 + ry) + ')');

  node.intersect = function (point) {
    var pos = dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.rect(node, point);
    var x = pos.x - node.x;

    if (rx != 0 && (Math.abs(x) < node.width / 2 || Math.abs(x) == node.width / 2 && Math.abs(pos.y - node.y) > node.height / 2 - ry)) {
      // ellipsis equation: x*x / a*a + y*y / b*b = 1
      // solve for y to get adjustion value for pos.y
      var y = ry * ry * (1 - x * x / (rx * rx));
      if (y != 0) y = Math.sqrt(y);
      y = ry - y;
      if (point.y - node.y > 0) y = -y;
      pos.y += y;
    }

    return pos;
  };

  return shapeSvg;
}

function addToRender(render) {
  render.shapes().question = question;
  render.shapes().hexagon = hexagon;
  render.shapes().stadium = stadium;
  render.shapes().subroutine = subroutine;
  render.shapes().cylinder = cylinder; // Add custom shape for box with inverted arrow on left side

  render.shapes().rect_left_inv_arrow = rect_left_inv_arrow; // Add custom shape for box with inverted arrow on left side

  render.shapes().lean_right = lean_right; // Add custom shape for box with inverted arrow on left side

  render.shapes().lean_left = lean_left; // Add custom shape for box with inverted arrow on left side

  render.shapes().trapezoid = trapezoid; // Add custom shape for box with inverted arrow on left side

  render.shapes().inv_trapezoid = inv_trapezoid; // Add custom shape for box with inverted arrow on right side

  render.shapes().rect_right_inv_arrow = rect_right_inv_arrow;
}
function addToRenderV2(addShape) {
  addShape({
    question: question
  });
  addShape({
    hexagon: hexagon
  });
  addShape({
    stadium: stadium
  });
  addShape({
    subroutine: subroutine
  });
  addShape({
    cylinder: cylinder
  }); // Add custom shape for box with inverted arrow on left side

  addShape({
    rect_left_inv_arrow: rect_left_inv_arrow
  }); // Add custom shape for box with inverted arrow on left side

  addShape({
    lean_right: lean_right
  }); // Add custom shape for box with inverted arrow on left side

  addShape({
    lean_left: lean_left
  }); // Add custom shape for box with inverted arrow on left side

  addShape({
    trapezoid: trapezoid
  }); // Add custom shape for box with inverted arrow on left side

  addShape({
    inv_trapezoid: inv_trapezoid
  }); // Add custom shape for box with inverted arrow on right side

  addShape({
    rect_right_inv_arrow: rect_right_inv_arrow
  });
}

function insertPolygonShape(parent, w, h, points) {
  return parent.insert('polygon', ':first-child').attr('points', points.map(function (d) {
    return d.x + ',' + d.y;
  }).join(' ')).attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}

/* harmony default export */ __webpack_exports__["default"] = ({
  addToRender: addToRender,
  addToRenderV2: addToRenderV2
});

/***/ }),

/***/ "./src/diagrams/flowchart/flowDb.js":
/*!******************************************!*\
  !*** ./src/diagrams/flowchart/flowDb.js ***!
  \******************************************/
/*! exports provided: addVertex, addSingleLink, addLink, updateLinkInterpolate, updateLink, addClass, setDirection, setClass, setLink, getTooltip, setClickEvent, bindFunctions, getDirection, getVertices, getEdges, getClasses, clear, defaultStyle, addSubGraph, getDepthFirstPos, indexNodes, getSubGraphs, firstGraph, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addVertex", function() { return addVertex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSingleLink", function() { return addSingleLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLink", function() { return addLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateLinkInterpolate", function() { return updateLinkInterpolate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateLink", function() { return updateLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addClass", function() { return addClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDirection", function() { return setDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClass", function() { return setClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLink", function() { return setLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTooltip", function() { return getTooltip; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClickEvent", function() { return setClickEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindFunctions", function() { return bindFunctions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDirection", function() { return getDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getVertices", function() { return getVertices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getEdges", function() { return getEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultStyle", function() { return defaultStyle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSubGraph", function() { return addSubGraph; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDepthFirstPos", function() { return getDepthFirstPos; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "indexNodes", function() { return indexNodes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSubGraphs", function() { return getSubGraphs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "firstGraph", function() { return firstGraph; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


 // eslint-disable-line



 // const MERMAID_DOM_ID_PREFIX = 'mermaid-dom-id-';

var MERMAID_DOM_ID_PREFIX = '';
var config = Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])();
var vertices = {};
var edges = [];
var classes = [];
var subGraphs = [];
var subGraphLookup = {};
var tooltips = {};
var subCount = 0;
var firstGraphFlag = true;
var direction; // Functions to be run after graph rendering

var funs = [];
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 * @param classes
 */

var addVertex = function addVertex(_id, text, type, style, classes) {
  var txt;
  var id = _id;

  if (typeof id === 'undefined') {
    return;
  }

  if (id.trim().length === 0) {
    return;
  }

  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (typeof vertices[id] === 'undefined') {
    vertices[id] = {
      id: id,
      styles: [],
      classes: []
    };
  }

  if (typeof text !== 'undefined') {
    config = Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])();
    txt = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].sanitizeText(text.trim(), config); // strip quotes if string starts and ends with a quote

    if (txt[0] === '"' && txt[txt.length - 1] === '"') {
      txt = txt.substring(1, txt.length - 1);
    }

    vertices[id].text = txt;
  } else {
    if (typeof vertices[id].text === 'undefined') {
      vertices[id].text = _id;
    }
  }

  if (typeof type !== 'undefined') {
    vertices[id].type = type;
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        vertices[id].styles.push(s);
      });
    }
  }

  if (typeof classes !== 'undefined') {
    if (classes !== null) {
      classes.forEach(function (s) {
        vertices[id].classes.push(s);
      });
    }
  }
};
/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */

var addSingleLink = function addSingleLink(_start, _end, type, linktext) {
  var start = _start;
  var end = _end;
  if (start[0].match(/\d/)) start = MERMAID_DOM_ID_PREFIX + start;
  if (end[0].match(/\d/)) end = MERMAID_DOM_ID_PREFIX + end; // logger.info('Got edge...', start, end);

  var edge = {
    start: start,
    end: end,
    type: undefined,
    text: ''
  };
  linktext = type.text;

  if (typeof linktext !== 'undefined') {
    edge.text = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].sanitizeText(linktext.trim(), config); // strip quotes if string starts and exnds with a quote

    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
  }

  if (typeof type !== 'undefined') {
    edge.type = type.type;
    edge.stroke = type.stroke;
  }

  edges.push(edge);
};
var addLink = function addLink(_start, _end, type, linktext) {
  var i, j;

  for (i = 0; i < _start.length; i++) {
    for (j = 0; j < _end.length; j++) {
      addSingleLink(_start[i], _end[j], type, linktext);
    }
  }
};
/**
 * Updates a link's line interpolation algorithm
 * @param pos
 * @param interpolate
 */

var updateLinkInterpolate = function updateLinkInterpolate(positions, interp) {
  positions.forEach(function (pos) {
    if (pos === 'default') {
      edges.defaultInterpolate = interp;
    } else {
      edges[pos].interpolate = interp;
    }
  });
};
/**
 * Updates a link with a style
 * @param pos
 * @param style
 */

var updateLink = function updateLink(positions, style) {
  positions.forEach(function (pos) {
    if (pos === 'default') {
      edges.defaultStyle = style;
    } else {
      if (_utils__WEBPACK_IMPORTED_MODULE_2__["default"].isSubstringInArray('fill', style) === -1) {
        style.push('fill:none');
      }

      edges[pos].style = style;
    }
  });
};
var addClass = function addClass(id, style) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = {
      id: id,
      styles: [],
      textStyles: []
    };
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        if (s.match('color')) {
          var newStyle1 = s.replace('fill', 'bgFill');
          var newStyle2 = newStyle1.replace('color', 'fill');
          classes[id].textStyles.push(newStyle2);
        }

        classes[id].styles.push(s);
      });
    }
  }
};
/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */

var setDirection = function setDirection(dir) {
  direction = dir;

  if (direction.match(/.*</)) {
    direction = 'RL';
  }

  if (direction.match(/.*\^/)) {
    direction = 'BT';
  }

  if (direction.match(/.*>/)) {
    direction = 'LR';
  }

  if (direction.match(/.*v/)) {
    direction = 'TB';
  }
};
/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */

var setClass = function setClass(ids, className) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof vertices[id] !== 'undefined') {
      vertices[id].classes.push(className);
    }

    if (typeof subGraphLookup[id] !== 'undefined') {
      subGraphLookup[id].classes.push(className);
    }
  });
};

var setTooltip = function setTooltip(ids, tooltip) {
  ids.split(',').forEach(function (id) {
    if (typeof tooltip !== 'undefined') {
      tooltips[id] = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].sanitizeText(tooltip, config);
    }
  });
};

var setClickFun = function setClickFun(_id, functionName) {
  var id = _id;
  if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().securityLevel !== 'loose') {
    return;
  }

  if (typeof functionName === 'undefined') {
    return;
  }

  if (typeof vertices[id] !== 'undefined') {
    funs.push(function () {
      var elem = document.querySelector("[id=\"".concat(id, "\"]"));

      if (elem !== null) {
        elem.addEventListener('click', function () {
          _utils__WEBPACK_IMPORTED_MODULE_2__["default"].runFunc(functionName, id);
        }, false);
      }
    });
  }
};
/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 * @param tooltip Tooltip for the clickable element
 */


var setLink = function setLink(ids, linkStr, tooltip) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof vertices[id] !== 'undefined') {
      vertices[id].link = _utils__WEBPACK_IMPORTED_MODULE_2__["default"].formatUrl(linkStr, config);
    }
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};
var getTooltip = function getTooltip(id) {
  return tooltips[id];
};
/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param tooltip Tooltip for the clickable element
 */

var setClickEvent = function setClickEvent(ids, functionName, tooltip) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName);
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};
var bindFunctions = function bindFunctions(element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
var getDirection = function getDirection() {
  return direction.trim();
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */

var getVertices = function getVertices() {
  return vertices;
};
/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */

var getEdges = function getEdges() {
  return edges;
};
/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */

var getClasses = function getClasses() {
  return classes;
};

var setupToolTips = function setupToolTips(element) {
  var tooltipElem = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('.mermaidTooltip');

  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(element).select('svg');
  var nodes = svg.selectAll('g.node');
  nodes.on('mouseover', function () {
    var el = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(this);
    var title = el.attr('title'); // Dont try to draw a tooltip if no data is provided

    if (title === null) {
      return;
    }

    var rect = this.getBoundingClientRect();
    tooltipElem.transition().duration(200).style('opacity', '.9');
    tooltipElem.html(el.attr('title')).style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px').style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
    el.classed('hover', true);
  }).on('mouseout', function () {
    tooltipElem.transition().duration(500).style('opacity', 0);
    var el = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(this);
    el.classed('hover', false);
  });
};

funs.push(setupToolTips);
/**
 * Clears the internal graph db so that a new graph can be parsed.
 */

var clear = function clear() {
  vertices = {};
  classes = {};
  edges = [];
  funs = [];
  funs.push(setupToolTips);
  subGraphs = [];
  subGraphLookup = {};
  subCount = 0;
  tooltips = [];
  firstGraphFlag = true;
};
/**
 *
 * @returns {string}
 */

var defaultStyle = function defaultStyle() {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};
/**
 * Clears the internal graph db so that a new graph can be parsed.
 */

var addSubGraph = function addSubGraph(_id, list, _title) {
  var id = _id.trim();

  var title = _title;

  if (_id === _title && _title.match(/\s/)) {
    id = undefined;
  }

  function uniq(a) {
    var prims = {
      boolean: {},
      number: {},
      string: {}
    };
    var objs = [];
    return a.filter(function (item) {
      var type = _typeof(item);

      if (item.trim() === '') {
        return false;
      }

      if (type in prims) {
        return prims[type].hasOwnProperty(item) ? false : prims[type][item] = true; // eslint-disable-line
      } else {
        return objs.indexOf(item) >= 0 ? false : objs.push(item);
      }
    });
  }

  var nodeList = [];
  nodeList = uniq(nodeList.concat.apply(nodeList, list));

  for (var i = 0; i < nodeList.length; i++) {
    if (nodeList[i][0].match(/\d/)) nodeList[i] = MERMAID_DOM_ID_PREFIX + nodeList[i];
  }

  id = id || 'subGraph' + subCount;
  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  title = title || '';
  title = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].sanitizeText(title, config);
  subCount = subCount + 1;
  var subGraph = {
    id: id,
    nodes: nodeList,
    title: title.trim(),
    classes: []
  };
  subGraphs.push(subGraph);
  subGraphLookup[id] = subGraph;
  return id;
};

var getPosForId = function getPosForId(id) {
  for (var i = 0; i < subGraphs.length; i++) {
    if (subGraphs[i].id === id) {
      return i;
    }
  }

  return -1;
};

var secCount = -1;
var posCrossRef = [];

var indexNodes2 = function indexNodes2(id, pos) {
  var nodes = subGraphs[pos].nodes;
  secCount = secCount + 1;

  if (secCount > 2000) {
    return;
  }

  posCrossRef[secCount] = pos; // Check if match

  if (subGraphs[pos].id === id) {
    return {
      result: true,
      count: 0
    };
  }

  var count = 0;
  var posCount = 1;

  while (count < nodes.length) {
    var childPos = getPosForId(nodes[count]); // Ignore regular nodes (pos will be -1)

    if (childPos >= 0) {
      var res = indexNodes2(id, childPos);

      if (res.result) {
        return {
          result: true,
          count: posCount + res.count
        };
      } else {
        posCount = posCount + res.count;
      }
    }

    count = count + 1;
  }

  return {
    result: false,
    count: posCount
  };
};

var getDepthFirstPos = function getDepthFirstPos(pos) {
  return posCrossRef[pos];
};
var indexNodes = function indexNodes() {
  secCount = -1;

  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1, 0);
  }
};
var getSubGraphs = function getSubGraphs() {
  return subGraphs;
};
var firstGraph = function firstGraph() {
  if (firstGraphFlag) {
    firstGraphFlag = false;
    return true;
  }

  return false;
};

var destructStartLink = function destructStartLink(_str) {
  var str = _str.trim();

  switch (str) {
    case '<--':
      return {
        type: 'arrow_point',
        stroke: 'normal'
      };

    case 'x--':
      return {
        type: 'arrow_cross',
        stroke: 'normal'
      };

    case 'o--':
      return {
        type: 'arrow_circle',
        stroke: 'normal'
      };

    case '<-.':
      return {
        type: 'arrow_point',
        stroke: 'dotted'
      };

    case 'x-.':
      return {
        type: 'arrow_cross',
        stroke: 'dotted'
      };

    case 'o-.':
      return {
        type: 'arrow_circle',
        stroke: 'dotted'
      };

    case '<==':
      return {
        type: 'arrow_point',
        stroke: 'thick'
      };

    case 'x==':
      return {
        type: 'arrow_cross',
        stroke: 'thick'
      };

    case 'o==':
      return {
        type: 'arrow_circle',
        stroke: 'thick'
      };

    case '--':
      return {
        type: 'arrow_open',
        stroke: 'normal'
      };

    case '==':
      return {
        type: 'arrow_open',
        stroke: 'thick'
      };

    case '-.':
      return {
        type: 'arrow_open',
        stroke: 'dotted'
      };
  }
};

var destructEndLink = function destructEndLink(_str) {
  var str = _str.trim();

  switch (str) {
    case '--x':
      return {
        type: 'arrow_cross',
        stroke: 'normal'
      };

    case '-->':
      return {
        type: 'arrow_point',
        stroke: 'normal'
      };

    case '<-->':
      return {
        type: 'double_arrow_point',
        stroke: 'normal'
      };

    case 'x--x':
      return {
        type: 'double_arrow_cross',
        stroke: 'normal'
      };

    case 'o--o':
      return {
        type: 'double_arrow_circle',
        stroke: 'normal'
      };

    case 'o.-o':
      return {
        type: 'double_arrow_circle',
        stroke: 'dotted'
      };

    case '<==>':
      return {
        type: 'double_arrow_point',
        stroke: 'thick'
      };

    case 'o==o':
      return {
        type: 'double_arrow_circle',
        stroke: 'thick'
      };

    case 'x==x':
      return {
        type: 'double_arrow_cross',
        stroke: 'thick'
      };

    case 'x.-x':
      return {
        type: 'double_arrow_cross',
        stroke: 'dotted'
      };

    case 'x-.-x':
      return {
        type: 'double_arrow_cross',
        stroke: 'dotted'
      };

    case '<.->':
      return {
        type: 'double_arrow_point',
        stroke: 'dotted'
      };

    case '<-.->':
      return {
        type: 'double_arrow_point',
        stroke: 'dotted'
      };

    case 'o-.-o':
      return {
        type: 'double_arrow_circle',
        stroke: 'dotted'
      };

    case '--o':
      return {
        type: 'arrow_circle',
        stroke: 'normal'
      };

    case '---':
      return {
        type: 'arrow_open',
        stroke: 'normal'
      };

    case '-.-x':
      return {
        type: 'arrow_cross',
        stroke: 'dotted'
      };

    case '-.->':
      return {
        type: 'arrow_point',
        stroke: 'dotted'
      };

    case '-.-o':
      return {
        type: 'arrow_circle',
        stroke: 'dotted'
      };

    case '-.-':
      return {
        type: 'arrow_open',
        stroke: 'dotted'
      };

    case '.-x':
      return {
        type: 'arrow_cross',
        stroke: 'dotted'
      };

    case '.->':
      return {
        type: 'arrow_point',
        stroke: 'dotted'
      };

    case '.-o':
      return {
        type: 'arrow_circle',
        stroke: 'dotted'
      };

    case '.-':
      return {
        type: 'arrow_open',
        stroke: 'dotted'
      };

    case '==x':
      return {
        type: 'arrow_cross',
        stroke: 'thick'
      };

    case '==>':
      return {
        type: 'arrow_point',
        stroke: 'thick'
      };

    case '==o':
      return {
        type: 'arrow_circle',
        stroke: 'thick'
      };

    case '===':
      return {
        type: 'arrow_open',
        stroke: 'thick'
      };
  }
};

var destructLink = function destructLink(_str, _startStr) {
  var info = destructEndLink(_str);
  var startInfo;

  if (_startStr) {
    startInfo = destructStartLink(_startStr);

    if (startInfo.stroke !== info.stroke) {
      return {
        type: 'INVALID',
        stroke: 'INVALID'
      };
    }

    if (startInfo.type === 'arrow_open') {
      // -- xyz -->  - take arrow type form ending
      startInfo.type = info.type;
    } else {
      // x-- xyz -->  - not supported
      if (startInfo.type !== info.type) return {
        type: 'INVALID',
        stroke: 'INVALID'
      };
      startInfo.type = 'double_' + startInfo.type;
    }

    if (startInfo.type === 'double_arrow') {
      startInfo.type = 'double_arrow_point';
    }

    return startInfo;
  }

  return info;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  addVertex: addVertex,
  addLink: addLink,
  updateLinkInterpolate: updateLinkInterpolate,
  updateLink: updateLink,
  addClass: addClass,
  setDirection: setDirection,
  setClass: setClass,
  getTooltip: getTooltip,
  setClickEvent: setClickEvent,
  setLink: setLink,
  bindFunctions: bindFunctions,
  getDirection: getDirection,
  getVertices: getVertices,
  getEdges: getEdges,
  getClasses: getClasses,
  clear: clear,
  defaultStyle: defaultStyle,
  addSubGraph: addSubGraph,
  getDepthFirstPos: getDepthFirstPos,
  indexNodes: indexNodes,
  getSubGraphs: getSubGraphs,
  destructLink: destructLink,
  lex: {
    firstGraph: firstGraph
  }
});

/***/ }),

/***/ "./src/diagrams/flowchart/flowRenderer-v2.js":
/*!***************************************************!*\
  !*** ./src/diagrams/flowchart/flowRenderer-v2.js ***!
  \***************************************************/
/*! exports provided: setConf, addVertices, addEdges, getClasses, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addVertices", function() { return addVertices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addEdges", function() { return addEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _flowDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flowDb */ "./src/diagrams/flowchart/flowDb.js");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/flow */ "./src/diagrams/flowchart/parser/flow.jison");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_flow__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _dagre_wrapper_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../dagre-wrapper/index.js */ "./src/dagre-wrapper/index.js");
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! dagre-d3/lib/label/add-html-label.js */ "dagre-d3/lib/label/add-html-label.js");
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");










var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);

  for (var i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};
/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */

var addVertices = function addVertices(vert, g, svgId) {
  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id=\"".concat(svgId, "\"]"));
  var keys = Object.keys(vert); // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition

  keys.forEach(function (id) {
    var vertex = vert[id];
    /**
     * Variable for storing the classes for the vertex
     * @type {string}
     */

    var classStr = 'default';

    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }

    var styles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(vertex.styles); // Use vertex id as text in the box if no text is provided by the graph definition

    var vertexText = vertex.text !== undefined ? vertex.text : vertex.id; // We create a SVG label, either by delegating to addHtmlLabel or manually

    var vertexNode;

    if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      var node = {
        label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, function (s) {
          return "<i class='".concat(s.replace(':', ' '), "'></i>");
        })
      };
      vertexNode = dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default()(svg, node).node();
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      var svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
      var rows = vertexText.split(_common_common__WEBPACK_IMPORTED_MODULE_8__["default"].lineBreakRegex);

      for (var j = 0; j < rows.length; j++) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        tspan.setAttribute('dy', '1em');
        tspan.setAttribute('x', '1');
        tspan.textContent = rows[j];
        svgLabel.appendChild(tspan);
      }

      vertexNode = svgLabel;
    }

    var radious = 0;
    var _shape = ''; // Set the shape based parameters

    switch (vertex.type) {
      case 'round':
        radious = 5;
        _shape = 'rect';
        break;

      case 'square':
        _shape = 'rect';
        break;

      case 'diamond':
        _shape = 'question';
        break;

      case 'hexagon':
        _shape = 'hexagon';
        break;

      case 'odd':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'lean_right':
        _shape = 'lean_right';
        break;

      case 'lean_left':
        _shape = 'lean_left';
        break;

      case 'trapezoid':
        _shape = 'trapezoid';
        break;

      case 'inv_trapezoid':
        _shape = 'inv_trapezoid';
        break;

      case 'odd_right':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'circle':
        _shape = 'circle';
        break;

      case 'ellipse':
        _shape = 'ellipse';
        break;

      case 'stadium':
        _shape = 'stadium';
        break;

      case 'subroutine':
        _shape = 'subroutine';
        break;

      case 'cylinder':
        _shape = 'cylinder';
        break;

      case 'group':
        _shape = 'rect';
        break;

      default:
        _shape = 'rect';
    } // Add the node


    g.setNode(vertex.id, {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id,
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      padding: Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.padding
    });
    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('setNode', {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id,
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      padding: Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.padding
    });
  });
};
/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */

var addEdges = function addEdges(edges, g) {
  var cnt = 0;
  var defaultStyle;
  var defaultLabelStyle;

  if (typeof edges.defaultStyle !== 'undefined') {
    var defaultStyles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function (edge) {
    cnt++; // Identify Link

    var linkId = 'L-' + edge.start + '-' + edge.end;
    var linkNameStart = 'LS-' + edge.start;
    var linkNameEnd = 'LE-' + edge.end;
    var edgeData = {}; //edgeData.id = 'id' + cnt;
    // Set link type for rendering

    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info(edgeData, edge);
    edgeData.arrowType = edge.type;
    var style = '';
    var labelStyle = '';

    if (typeof edge.style !== 'undefined') {
      var styles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none';

          if (typeof defaultStyle !== 'undefined') {
            style = defaultStyle;
          }

          if (typeof defaultLabelStyle !== 'undefined') {
            labelStyle = defaultLabelStyle;
          }

          edgeData.thickness = 'normal';
          edgeData.pattern = 'solid';
          break;

        case 'dotted':
          edgeData.thickness = 'normal';
          edgeData.pattern = 'dotted';
          break;

        case 'thick':
          edgeData.thickness = 'thick';
          edgeData.pattern = 'solid';
          break;
      }
    }

    edgeData.style = style;
    edgeData.labelStyle = labelStyle;

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(edge.interpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else if (typeof edges.defaultInterpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(edges.defaultInterpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(conf.curve, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';

      if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels && false) {
        // eslint-disable-line
        edgeData.labelType = 'html';
        edgeData.label = "<span id=\"L-".concat(linkId, "\" class=\"edgeLabel L-").concat(linkNameStart, "' L-").concat(linkNameEnd, "\">").concat(edge.text, "</span>");
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(_common_common__WEBPACK_IMPORTED_MODULE_8__["default"].lineBreakRegex, '\n');

        if (typeof edge.style === 'undefined') {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd; // Add the edge to the graph

    g.setEdge(edge.start, edge.end, edgeData, cnt);
  });
};
/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */

var getClasses = function getClasses(text) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Extracting classes');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"];

  try {
    // Parse the graph definition
    parser.parse(text);
  } catch (e) {
    return;
  }

  return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getClasses();
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(text, id) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Drawing flowchart');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition
  // try {

  parser.parse(text); // } catch (err) {
  // logger.debug('Parsing failed');
  // }
  // Fetch the default direction, use TD if none was found

  var dir = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getDirection();

  if (typeof dir === 'undefined') {
    dir = 'TD';
  }

  var conf = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart;
  var nodeSpacing = conf.nodeSpacing || 50;
  var rankSpacing = conf.rankSpacing || 50; // Create the input mermaid.graph

  var g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
    multigraph: true,
    compound: true
  }).setGraph({
    rankdir: dir,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 8,
    marginy: 8
  }).setDefaultEdgeLabel(function () {
    return {};
  });
  var subG;
  var subGraphs = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getSubGraphs();
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Subgraphs - ', subGraphs);

  for (var _i = subGraphs.length - 1; _i >= 0; _i--) {
    subG = subGraphs[_i];
    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Subgraph - ', subG);
    _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  } // Fetch the verices/nodes and edges/links from the parsed graph definition


  var vert = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getVertices();
  var edges = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getEdges();
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info(edges);
  var i = 0;

  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    Object(d3__WEBPACK_IMPORTED_MODULE_1__["selectAll"])('cluster').append('text');

    for (var j = 0; j < subG.nodes.length; j++) {
      g.setParent(subG.nodes[j], subG.id);
    }
  }

  addVertices(vert, g, id);
  addEdges(edges, g); // Add custom shapes
  // flowChartShapes.addToRenderV2(addShape);
  // Set up an SVG group so that we can translate the final graph.

  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id=\"".concat(id, "\"]")); // Run the renderer. This is what draws the final graph.

  var element = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])('#' + id + ' g');
  Object(_dagre_wrapper_index_js__WEBPACK_IMPORTED_MODULE_5__["render"])(element, g, ['point', 'circle', 'cross'], 'flowchart', id); // dagre.layout(g);

  element.selectAll('g.node').attr('title', function () {
    return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getTooltip(this.id);
  });
  var padding = 8;
  var svgBounds = svg.node().getBBox();
  var width = svgBounds.width + padding * 2;
  var height = svgBounds.height + padding * 2;
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].debug("new ViewBox 0 0 ".concat(width, " ").concat(height), "translate(".concat(padding - g._label.marginx, ", ").concat(padding - g._label.marginy, ")"));

  if (conf.useMaxWidth) {
    svg.attr('width', '100%');
    svg.attr('style', "max-width: ".concat(width, "px;"));
  } else {
    svg.attr('height', height);
    svg.attr('width', width);
  }

  svg.attr('viewBox', "0 0 ".concat(width, " ").concat(height));
  svg.select('g').attr('transform', "translate(".concat(padding - g._label.marginx, ", ").concat(padding - svgBounds.y, ")")); // Index nodes

  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].indexNodes('subGraph' + i); // // reposition labels
  // for (i = 0; i < subGraphs.length; i++) {
  //   subG = subGraphs[i];
  //   if (subG.title !== 'undefined') {
  //     const clusterRects = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"] rect');
  //     const clusterEl = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"]');
  //     const xPos = clusterRects[0].x.baseVal.value;
  //     const yPos = clusterRects[0].y.baseVal.value;
  //     const width = clusterRects[0].width.baseVal.value;
  //     const cluster = d3.select(clusterEl[0]);
  //     const te = cluster.select('.label');
  //     te.attr('transform', `translate(${xPos + width / 2}, ${yPos + 14})`);
  //     te.attr('id', id + 'Text');
  //     for (let j = 0; j < subG.classes.length; j++) {
  //       clusterEl[0].classList.add(subG.classes[j]);
  //     }
  //   }
  // }
  // Add label rects for non html labels

  if (!conf.htmlLabels) {
    var labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');

    for (var k = 0; k < labels.length; k++) {
      var label = labels[k]; // Get dimensions of label

      var dim = label.getBBox();
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      rect.setAttribute('style', 'fill:#e8e8e8;');
      label.insertBefore(rect, label.firstChild);
    }
  } // If node has a link, wrap it in an anchor SVG object.


  var keys = Object.keys(vert);
  keys.forEach(function (key) {
    var vertex = vert[key];

    if (vertex.link) {
      var node = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])('#' + id + ' [id="' + key + '"]');

      if (node) {
        var link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
        link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
        link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
        link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
        var linkNode = node.insert(function () {
          return link;
        }, ':first-child');
        var shape = node.select('.label-container');

        if (shape) {
          linkNode.append(function () {
            return shape.node();
          });
        }

        var _label = node.select('.label');

        if (_label) {
          linkNode.append(function () {
            return _label.node();
          });
        }
      }
    }
  });
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  addVertices: addVertices,
  addEdges: addEdges,
  getClasses: getClasses,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/flowchart/flowRenderer.js":
/*!************************************************!*\
  !*** ./src/diagrams/flowchart/flowRenderer.js ***!
  \************************************************/
/*! exports provided: setConf, addVertices, addEdges, getClasses, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addVertices", function() { return addVertices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addEdges", function() { return addEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _flowDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flowDb */ "./src/diagrams/flowchart/flowDb.js");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/flow */ "./src/diagrams/flowchart/parser/flow.jison");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_flow__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! dagre-d3 */ "dagre-d3");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(dagre_d3__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! dagre-d3/lib/label/add-html-label.js */ "dagre-d3/lib/label/add-html-label.js");
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _flowChartShapes__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./flowChartShapes */ "./src/diagrams/flowchart/flowChartShapes.js");











var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);

  for (var i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};
/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */

var addVertices = function addVertices(vert, g, svgId) {
  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id=\"".concat(svgId, "\"]"));
  var keys = Object.keys(vert); // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition

  keys.forEach(function (id) {
    var vertex = vert[id];
    /**
     * Variable for storing the classes for the vertex
     * @type {string}
     */

    var classStr = 'default';

    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }

    var styles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(vertex.styles); // Use vertex id as text in the box if no text is provided by the graph definition

    var vertexText = vertex.text !== undefined ? vertex.text : vertex.id; // We create a SVG label, either by delegating to addHtmlLabel or manually

    var vertexNode;

    if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      var node = {
        label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, function (s) {
          return "<i class='".concat(s.replace(':', ' '), "'></i>");
        })
      };
      vertexNode = dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default()(svg, node).node();
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      var svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
      var rows = vertexText.split(_common_common__WEBPACK_IMPORTED_MODULE_8__["default"].lineBreakRegex);

      for (var j = 0; j < rows.length; j++) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        tspan.setAttribute('dy', '1em');
        tspan.setAttribute('x', '1');
        tspan.textContent = rows[j];
        svgLabel.appendChild(tspan);
      }

      vertexNode = svgLabel;
    }

    var radious = 0;
    var _shape = ''; // Set the shape based parameters

    switch (vertex.type) {
      case 'round':
        radious = 5;
        _shape = 'rect';
        break;

      case 'square':
        _shape = 'rect';
        break;

      case 'diamond':
        _shape = 'question';
        break;

      case 'hexagon':
        _shape = 'hexagon';
        break;

      case 'odd':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'lean_right':
        _shape = 'lean_right';
        break;

      case 'lean_left':
        _shape = 'lean_left';
        break;

      case 'trapezoid':
        _shape = 'trapezoid';
        break;

      case 'inv_trapezoid':
        _shape = 'inv_trapezoid';
        break;

      case 'odd_right':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'circle':
        _shape = 'circle';
        break;

      case 'ellipse':
        _shape = 'ellipse';
        break;

      case 'stadium':
        _shape = 'stadium';
        break;

      case 'subroutine':
        _shape = 'subroutine';
        break;

      case 'cylinder':
        _shape = 'cylinder';
        break;

      case 'group':
        _shape = 'rect';
        break;

      default:
        _shape = 'rect';
    } // Add the node


    g.setNode(vertex.id, {
      labelType: 'svg',
      labelStyle: styles.labelStyle,
      shape: _shape,
      label: vertexNode,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id
    });
  });
};
/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */

var addEdges = function addEdges(edges, g) {
  var cnt = 0;
  var defaultStyle;
  var defaultLabelStyle;

  if (typeof edges.defaultStyle !== 'undefined') {
    var defaultStyles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function (edge) {
    cnt++; // Identify Link

    var linkId = 'L-' + edge.start + '-' + edge.end;
    var linkNameStart = 'LS-' + edge.start;
    var linkNameEnd = 'LE-' + edge.end;
    var edgeData = {}; // Set link type for rendering

    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    var style = '';
    var labelStyle = '';

    if (typeof edge.style !== 'undefined') {
      var styles = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["getStylesFromArray"])(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none';

          if (typeof defaultStyle !== 'undefined') {
            style = defaultStyle;
          }

          if (typeof defaultLabelStyle !== 'undefined') {
            labelStyle = defaultLabelStyle;
          }

          break;

        case 'dotted':
          style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
          break;

        case 'thick':
          style = ' stroke-width: 3.5px;fill:none';
          break;
      }
    }

    edgeData.style = style;
    edgeData.labelStyle = labelStyle;

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(edge.interpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else if (typeof edges.defaultInterpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(edges.defaultInterpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_9__["interpolateToCurve"])(conf.curve, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';

      if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
        edgeData.labelType = 'html';
        edgeData.label = "<span id=\"L-".concat(linkId, "\" class=\"edgeLabel L-").concat(linkNameStart, "' L-").concat(linkNameEnd, "\">").concat(edge.text, "</span>");
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(_common_common__WEBPACK_IMPORTED_MODULE_8__["default"].lineBreakRegex, '\n');

        if (typeof edge.style === 'undefined') {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }

    edgeData.id = linkId;
    edgeData.class = linkNameStart + ' ' + linkNameEnd; // Add the edge to the graph

    g.setEdge(edge.start, edge.end, edgeData, cnt);
  });
};
/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */

var getClasses = function getClasses(text) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Extracting classes');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();

  try {
    var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
    parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition

    parser.parse(text);
    return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getClasses();
  } catch (e) {
    return;
  }
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(text, id) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Drawing flowchart');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition
  // try {

  parser.parse(text); // } catch (err) {
  // logger.debug('Parsing failed');
  // }
  // Fetch the default direction, use TD if none was found

  var dir = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getDirection();

  if (typeof dir === 'undefined') {
    dir = 'TD';
  }

  var conf = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart;
  var nodeSpacing = conf.nodeSpacing || 50;
  var rankSpacing = conf.rankSpacing || 50; // Create the input mermaid.graph

  var g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
    multigraph: true,
    compound: true
  }).setGraph({
    rankdir: dir,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 8,
    marginy: 8
  }).setDefaultEdgeLabel(function () {
    return {};
  });
  var subG;
  var subGraphs = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getSubGraphs();

  for (var _i = subGraphs.length - 1; _i >= 0; _i--) {
    subG = subGraphs[_i];
    _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  } // Fetch the verices/nodes and edges/links from the parsed graph definition


  var vert = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getVertices();
  var edges = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getEdges();
  var i = 0;

  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    Object(d3__WEBPACK_IMPORTED_MODULE_1__["selectAll"])('cluster').append('text');

    for (var j = 0; j < subG.nodes.length; j++) {
      g.setParent(subG.nodes[j], subG.id);
    }
  }

  addVertices(vert, g, id);
  addEdges(edges, g); // Create the renderer

  var Render = dagre_d3__WEBPACK_IMPORTED_MODULE_5___default.a.render;
  var render = new Render(); // Add custom shapes

  _flowChartShapes__WEBPACK_IMPORTED_MODULE_10__["default"].addToRender(render); // Add our custom arrow - an empty arrowhead

  render.arrows().none = function normal(parent, id, edge, type) {
    var marker = parent.append('marker').attr('id', id).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'strokeWidth').attr('markerWidth', 8).attr('markerHeight', 6).attr('orient', 'auto');
    var path = marker.append('path').attr('d', 'M 0 0 L 0 0 L 0 0 z');
    dagre_d3__WEBPACK_IMPORTED_MODULE_5___default.a.util.applyStyle(path, edge[type + 'Style']);
  }; // Override normal arrowhead defined in d3. Remove style & add class to allow css styling.


  render.arrows().normal = function normal(parent, id) {
    var marker = parent.append('marker').attr('id', id).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'strokeWidth').attr('markerWidth', 8).attr('markerHeight', 6).attr('orient', 'auto');
    marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('class', 'arrowheadPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
  }; // Set up an SVG group so that we can translate the final graph.


  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id=\"".concat(id, "\"]")); // Run the renderer. This is what draws the final graph.

  var element = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])('#' + id + ' g');
  render(element, g);
  element.selectAll('g.node').attr('title', function () {
    return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getTooltip(this.id);
  });
  var padding = 8;
  var svgBounds = svg.node().getBBox();
  var width = svgBounds.width + padding * 2;
  var height = svgBounds.height + padding * 2;

  if (conf.useMaxWidth) {
    svg.attr('width', '100%');
    svg.attr('style', "max-width: ".concat(width, "px;"));
  } else {
    svg.attr('height', height);
    svg.attr('width', width);
  } // Ensure the viewBox includes the whole svgBounds area with extra space for padding


  var vBox = "".concat(svgBounds.x - padding, " ").concat(svgBounds.y - padding, " ").concat(width, " ").concat(height);
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].debug("viewBox ".concat(vBox));
  svg.attr('viewBox', vBox); // Index nodes

  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].indexNodes('subGraph' + i); // reposition labels

  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];

    if (subG.title !== 'undefined') {
      var clusterRects = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"] rect');
      var clusterEl = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"]');
      var xPos = clusterRects[0].x.baseVal.value;
      var yPos = clusterRects[0].y.baseVal.value;
      var _width = clusterRects[0].width.baseVal.value;
      var cluster = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])(clusterEl[0]);
      var te = cluster.select('.label');
      te.attr('transform', "translate(".concat(xPos + _width / 2, ", ").concat(yPos + 14, ")"));
      te.attr('id', id + 'Text');

      for (var _j = 0; _j < subG.classes.length; _j++) {
        clusterEl[0].classList.add(subG.classes[_j]);
      }
    }
  } // Add label rects for non html labels


  if (!conf.htmlLabels || true) {
    // eslint-disable-line
    var labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');

    for (var k = 0; k < labels.length; k++) {
      var label = labels[k]; // Get dimensions of label

      var dim = label.getBBox();
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      rect.setAttribute('style', 'fill:#e8e8e8;');
      label.insertBefore(rect, label.firstChild);
    }
  } // If node has a link, wrap it in an anchor SVG object.


  var keys = Object.keys(vert);
  keys.forEach(function (key) {
    var vertex = vert[key];

    if (vertex.link) {
      var node = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])('#' + id + ' [id="' + key + '"]');

      if (node) {
        var link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
        link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
        link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
        link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
        var linkNode = node.insert(function () {
          return link;
        }, ':first-child');
        var shape = node.select('.label-container');

        if (shape) {
          linkNode.append(function () {
            return shape.node();
          });
        }

        var _label = node.select('.label');

        if (_label) {
          linkNode.append(function () {
            return _label.node();
          });
        }
      }
    }
  });
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  addVertices: addVertices,
  addEdges: addEdges,
  getClasses: getClasses,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/flowchart/parser/flow.jison":
/*!**************************************************!*\
  !*** ./src/diagrams/flowchart/parser/flow.jison ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,4],$V1=[1,3],$V2=[1,5],$V3=[1,8,9,10,11,26,34,63,64,65,66,67,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$V4=[2,2],$V5=[1,12],$V6=[1,13],$V7=[1,14],$V8=[1,15],$V9=[1,22],$Va=[1,46],$Vb=[1,24],$Vc=[1,25],$Vd=[1,26],$Ve=[1,27],$Vf=[1,28],$Vg=[1,40],$Vh=[1,35],$Vi=[1,37],$Vj=[1,32],$Vk=[1,36],$Vl=[1,39],$Vm=[1,43],$Vn=[1,44],$Vo=[1,45],$Vp=[1,34],$Vq=[1,38],$Vr=[1,41],$Vs=[1,42],$Vt=[1,33],$Vu=[1,51],$Vv=[1,8,9,10,11,26,30,34,63,64,65,66,67,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$Vw=[1,55],$Vx=[1,54],$Vy=[1,56],$Vz=[8,9,11,57,58],$VA=[8,9,10,11,57,58],$VB=[8,9,10,11,35,57,58],$VC=[8,9,10,11,28,34,35,37,39,41,43,45,47,49,50,52,57,58,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$VD=[8,9,11,34,57,58,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$VE=[34,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$VF=[1,101],$VG=[1,122],$VH=[1,123],$VI=[1,124],$VJ=[1,125],$VK=[1,105],$VL=[1,96],$VM=[1,97],$VN=[1,93],$VO=[1,117],$VP=[1,118],$VQ=[1,119],$VR=[1,120],$VS=[1,121],$VT=[1,126],$VU=[1,127],$VV=[1,99],$VW=[1,107],$VX=[1,110],$VY=[1,108],$VZ=[1,109],$V_=[1,102],$V$=[1,115],$V01=[1,114],$V11=[1,98],$V21=[1,95],$V31=[1,104],$V41=[1,106],$V51=[1,111],$V61=[1,112],$V71=[1,113],$V81=[1,116],$V91=[8,9,10,11,26,30,34,63,64,65,66,67,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$Va1=[1,130],$Vb1=[1,134],$Vc1=[1,136],$Vd1=[1,137],$Ve1=[8,9,10,11,12,13,26,28,29,30,34,38,40,42,44,46,48,49,51,53,57,58,59,63,64,65,66,67,68,69,72,78,79,82,83,84,86,87,88,89,93,94,95,96,97,98],$Vf1=[8,9,10,11,13,34,68,78,79,82,83,84,86,87,93,94,95,96,97,98],$Vg1=[10,79],$Vh1=[1,204],$Vi1=[1,208],$Vj1=[1,205],$Vk1=[1,202],$Vl1=[1,199],$Vm1=[1,200],$Vn1=[1,201],$Vo1=[1,203],$Vp1=[1,206],$Vq1=[1,207],$Vr1=[1,209],$Vs1=[8,9,11],$Vt1=[1,225],$Vu1=[8,9,11,79],$Vv1=[8,9,10,11,63,75,78,79,82,83,84,85,86,87,88];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"mermaidDoc":3,"graphConfig":4,"document":5,"line":6,"statement":7,"SEMI":8,"NEWLINE":9,"SPACE":10,"EOF":11,"GRAPH":12,"DIR":13,"FirstStmtSeperator":14,"ending":15,"endToken":16,"spaceList":17,"spaceListNewline":18,"verticeStatement":19,"separator":20,"styleStatement":21,"linkStyleStatement":22,"classDefStatement":23,"classStatement":24,"clickStatement":25,"subgraph":26,"text":27,"SQS":28,"SQE":29,"end":30,"link":31,"node":32,"vertex":33,"AMP":34,"STYLE_SEPARATOR":35,"idString":36,"PS":37,"PE":38,"(-":39,"-)":40,"STADIUMSTART":41,"STADIUMEND":42,"SUBROUTINESTART":43,"SUBROUTINEEND":44,"CYLINDERSTART":45,"CYLINDEREND":46,"DIAMOND_START":47,"DIAMOND_STOP":48,"TAGEND":49,"TRAPSTART":50,"TRAPEND":51,"INVTRAPSTART":52,"INVTRAPEND":53,"linkStatement":54,"arrowText":55,"TESTSTR":56,"START_LINK":57,"LINK":58,"PIPE":59,"textToken":60,"STR":61,"keywords":62,"STYLE":63,"LINKSTYLE":64,"CLASSDEF":65,"CLASS":66,"CLICK":67,"DOWN":68,"UP":69,"textNoTags":70,"textNoTagsToken":71,"DEFAULT":72,"stylesOpt":73,"alphaNum":74,"HEX":75,"numList":76,"INTERPOLATE":77,"NUM":78,"COMMA":79,"style":80,"styleComponent":81,"ALPHA":82,"COLON":83,"MINUS":84,"UNIT":85,"BRKT":86,"DOT":87,"PCT":88,"TAGSTART":89,"alphaNumToken":90,"idStringToken":91,"alphaNumStatement":92,"PUNCTUATION":93,"UNICODE_TEXT":94,"PLUS":95,"EQUALS":96,"MULT":97,"UNDERSCORE":98,"graphCodeTokens":99,"ARROW_CROSS":100,"ARROW_POINT":101,"ARROW_CIRCLE":102,"ARROW_OPEN":103,"QUOTE":104,"$accept":0,"$end":1},
terminals_: {2:"error",8:"SEMI",9:"NEWLINE",10:"SPACE",11:"EOF",12:"GRAPH",13:"DIR",26:"subgraph",28:"SQS",29:"SQE",30:"end",34:"AMP",35:"STYLE_SEPARATOR",37:"PS",38:"PE",39:"(-",40:"-)",41:"STADIUMSTART",42:"STADIUMEND",43:"SUBROUTINESTART",44:"SUBROUTINEEND",45:"CYLINDERSTART",46:"CYLINDEREND",47:"DIAMOND_START",48:"DIAMOND_STOP",49:"TAGEND",50:"TRAPSTART",51:"TRAPEND",52:"INVTRAPSTART",53:"INVTRAPEND",56:"TESTSTR",57:"START_LINK",58:"LINK",59:"PIPE",61:"STR",63:"STYLE",64:"LINKSTYLE",65:"CLASSDEF",66:"CLASS",67:"CLICK",68:"DOWN",69:"UP",72:"DEFAULT",75:"HEX",77:"INTERPOLATE",78:"NUM",79:"COMMA",82:"ALPHA",83:"COLON",84:"MINUS",85:"UNIT",86:"BRKT",87:"DOT",88:"PCT",89:"TAGSTART",93:"PUNCTUATION",94:"UNICODE_TEXT",95:"PLUS",96:"EQUALS",97:"MULT",98:"UNDERSCORE",100:"ARROW_CROSS",101:"ARROW_POINT",102:"ARROW_CIRCLE",103:"ARROW_OPEN",104:"QUOTE"},
productions_: [0,[3,2],[5,0],[5,2],[6,1],[6,1],[6,1],[6,1],[6,1],[4,2],[4,2],[4,3],[15,2],[15,1],[16,1],[16,1],[16,1],[14,1],[14,1],[14,2],[18,2],[18,2],[18,1],[18,1],[17,2],[17,1],[7,2],[7,2],[7,2],[7,2],[7,2],[7,2],[7,9],[7,6],[7,4],[20,1],[20,1],[20,1],[19,3],[19,4],[19,2],[19,1],[32,1],[32,5],[32,3],[33,4],[33,6],[33,4],[33,4],[33,4],[33,4],[33,4],[33,4],[33,6],[33,4],[33,4],[33,4],[33,4],[33,4],[33,1],[31,2],[31,3],[31,3],[31,1],[31,3],[54,1],[55,3],[27,1],[27,2],[27,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[62,1],[70,1],[70,2],[23,5],[23,5],[24,5],[25,5],[25,7],[25,5],[25,7],[21,5],[21,5],[22,5],[22,5],[22,9],[22,9],[22,7],[22,7],[76,1],[76,3],[73,1],[73,3],[80,1],[80,2],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[81,1],[60,1],[60,1],[60,1],[60,1],[60,1],[60,1],[71,1],[71,1],[71,1],[71,1],[36,1],[36,2],[74,1],[74,2],[92,1],[92,1],[92,1],[92,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[90,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[91,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1],[99,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 2:
 this.$ = [];
break;
case 3:

	    if($$[$0] !== []){
	        $$[$0-1].push($$[$0]);
	    }
	    this.$=$$[$0-1];
break;
case 4: case 67: case 69: case 81: case 127: case 129: case 130:
this.$=$$[$0];
break;
case 11:
 yy.setDirection($$[$0-1]);this.$ = $$[$0-1];
break;
case 26:
 /* console.warn('finat vs', $$[$0-1].nodes); */ this.$=$$[$0-1].nodes
break;
case 27: case 28: case 29: case 30: case 31:
this.$=[];
break;
case 32:
this.$=yy.addSubGraph($$[$0-6],$$[$0-1],$$[$0-4]);
break;
case 33:
this.$=yy.addSubGraph($$[$0-3],$$[$0-1],$$[$0-3]);
break;
case 34:
this.$=yy.addSubGraph(undefined,$$[$0-1],undefined);
break;
case 38:
 /* console.warn('vs',$$[$0-2].stmt,$$[$0]); */ yy.addLink($$[$0-2].stmt,$$[$0],$$[$0-1]); this.$ = { stmt: $$[$0], nodes: $$[$0].concat($$[$0-2].nodes) } 
break;
case 39:
 /* console.warn('vs',$$[$0-3].stmt,$$[$0-1]); */ yy.addLink($$[$0-3].stmt,$$[$0-1],$$[$0-2]); this.$ = { stmt: $$[$0-1], nodes: $$[$0-1].concat($$[$0-3].nodes) } 
break;
case 40:
/*console.warn('noda', $$[$0-1]);*/ this.$ = {stmt: $$[$0-1], nodes:$$[$0-1] }
break;
case 41:
 /*console.warn('noda', $$[$0]);*/ this.$ = {stmt: $$[$0], nodes:$$[$0] }
break;
case 42:
 /* console.warn('nod', $$[$0]); */ this.$ = [$$[$0]];
break;
case 43:
 this.$ = $$[$0-4].concat($$[$0]); /* console.warn('pip', $$[$0-4][0], $$[$0], this.$); */ 
break;
case 44:
this.$ = [$$[$0-2]];yy.setClass($$[$0-2],$$[$0])
break;
case 45:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'square');
break;
case 46:
this.$ = $$[$0-5];yy.addVertex($$[$0-5],$$[$0-2],'circle');
break;
case 47:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'ellipse');
break;
case 48:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'stadium');
break;
case 49:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'subroutine');
break;
case 50:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'cylinder');
break;
case 51:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'round');
break;
case 52:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'diamond');
break;
case 53:
this.$ = $$[$0-5];yy.addVertex($$[$0-5],$$[$0-2],'hexagon');
break;
case 54:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'odd');
break;
case 55:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'trapezoid');
break;
case 56:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'inv_trapezoid');
break;
case 57:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'lean_right');
break;
case 58:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'lean_left');
break;
case 59:
 /*console.warn('h: ', $$[$0]);*/this.$ = $$[$0];yy.addVertex($$[$0]);
break;
case 60:
$$[$0-1].text = $$[$0];this.$ = $$[$0-1];
break;
case 61: case 62:
$$[$0-2].text = $$[$0-1];this.$ = $$[$0-2];
break;
case 63:
this.$ = $$[$0];
break;
case 64:
var inf = yy.destructLink($$[$0], $$[$0-2]); this.$ = {"type":inf.type,"stroke":inf.stroke,"text":$$[$0-1]};
break;
case 65:
var inf = yy.destructLink($$[$0]);this.$ = {"type":inf.type,"stroke":inf.stroke};
break;
case 66:
this.$ = $$[$0-1];
break;
case 68: case 82: case 128:
this.$=$$[$0-1]+''+$$[$0];
break;
case 83: case 84:
this.$ = $$[$0-4];yy.addClass($$[$0-2],$$[$0]);
break;
case 85:
this.$ = $$[$0-4];yy.setClass($$[$0-2], $$[$0]);
break;
case 86:
this.$ = $$[$0-4];yy.setClickEvent($$[$0-2], $$[$0], undefined);
break;
case 87:
this.$ = $$[$0-6];yy.setClickEvent($$[$0-4], $$[$0-2], $$[$0])       ;
break;
case 88:
this.$ = $$[$0-4];yy.setLink($$[$0-2], $$[$0], undefined);
break;
case 89:
this.$ = $$[$0-6];yy.setLink($$[$0-4], $$[$0-2], $$[$0]       );
break;
case 90:
this.$ = $$[$0-4];yy.addVertex($$[$0-2],undefined,undefined,$$[$0]);
break;
case 91: case 93:
this.$ = $$[$0-4];yy.updateLink($$[$0-2],$$[$0]);
break;
case 92:
this.$ = $$[$0-4];yy.updateLink([$$[$0-2]],$$[$0]);
break;
case 94:
this.$ = $$[$0-8];yy.updateLinkInterpolate([$$[$0-6]],$$[$0-2]);yy.updateLink([$$[$0-6]],$$[$0]);
break;
case 95:
this.$ = $$[$0-8];yy.updateLinkInterpolate($$[$0-6],$$[$0-2]);yy.updateLink($$[$0-6],$$[$0]);
break;
case 96:
this.$ = $$[$0-6];yy.updateLinkInterpolate([$$[$0-4]],$$[$0]);
break;
case 97:
this.$ = $$[$0-6];yy.updateLinkInterpolate($$[$0-4],$$[$0]);
break;
case 98: case 100:
this.$ = [$$[$0]]
break;
case 99: case 101:
$$[$0-2].push($$[$0]);this.$ = $$[$0-2];
break;
case 103:
this.$ = $$[$0-1] + $$[$0];
break;
case 125:
this.$=$$[$0]
break;
case 126:
this.$=$$[$0-1]+''+$$[$0]
break;
case 131:
this.$='v';
break;
case 132:
this.$='-';
break;
}
},
table: [{3:1,4:2,9:$V0,10:$V1,12:$V2},{1:[3]},o($V3,$V4,{5:6}),{4:7,9:$V0,10:$V1,12:$V2},{4:8,9:$V0,10:$V1,12:$V2},{13:[1,9]},{1:[2,1],6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,32:23,33:29,34:$Va,36:30,63:$Vb,64:$Vc,65:$Vd,66:$Ve,67:$Vf,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},o($V3,[2,9]),o($V3,[2,10]),{8:[1,48],9:[1,49],10:$Vu,14:47,17:50},o($Vv,[2,3]),o($Vv,[2,4]),o($Vv,[2,5]),o($Vv,[2,6]),o($Vv,[2,7]),o($Vv,[2,8]),{8:$Vw,9:$Vx,11:$Vy,20:52,31:53,54:57,57:[1,58],58:[1,59]},{8:$Vw,9:$Vx,11:$Vy,20:60},{8:$Vw,9:$Vx,11:$Vy,20:61},{8:$Vw,9:$Vx,11:$Vy,20:62},{8:$Vw,9:$Vx,11:$Vy,20:63},{8:$Vw,9:$Vx,11:$Vy,20:64},{8:$Vw,9:$Vx,10:[1,65],11:$Vy,20:66},o($Vz,[2,41],{17:67,10:$Vu}),{10:[1,68]},{10:[1,69]},{10:[1,70]},{10:[1,71]},{10:[1,72]},o($VA,[2,42],{35:[1,73]}),o($VB,[2,59],{91:84,28:[1,74],34:$Va,37:[1,75],39:[1,76],41:[1,77],43:[1,78],45:[1,79],47:[1,80],49:[1,81],50:[1,82],52:[1,83],68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt}),o($VC,[2,125]),o($VC,[2,146]),o($VC,[2,147]),o($VC,[2,148]),o($VC,[2,149]),o($VC,[2,150]),o($VC,[2,151]),o($VC,[2,152]),o($VC,[2,153]),o($VC,[2,154]),o($VC,[2,155]),o($VC,[2,156]),o($VC,[2,157]),o($VC,[2,158]),o($VC,[2,159]),o($VC,[2,160]),o($V3,[2,11]),o($V3,[2,17]),o($V3,[2,18]),{9:[1,85]},o($VD,[2,25],{17:86,10:$Vu}),o($Vv,[2,26]),{32:87,33:29,34:$Va,36:30,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},o($Vv,[2,35]),o($Vv,[2,36]),o($Vv,[2,37]),o($VE,[2,63],{55:88,56:[1,89],59:[1,90]}),{10:$VF,12:$VG,13:$VH,26:$VI,27:91,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o([34,56,59,68,78,79,82,83,84,86,87,93,94,95,96,97,98],[2,65]),o($Vv,[2,27]),o($Vv,[2,28]),o($Vv,[2,29]),o($Vv,[2,30]),o($Vv,[2,31]),{10:$VF,12:$VG,13:$VH,26:$VI,27:128,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($V91,$V4,{5:129}),o($Vz,[2,40],{34:$Va1}),{13:$Vb1,34:$VK,68:$Vc1,74:131,75:[1,132],78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{72:[1,138],76:139,78:[1,140]},{13:$Vb1,34:$VK,68:$Vc1,72:[1,141],74:142,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{13:$Vb1,34:$VK,68:$Vc1,74:143,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{13:$Vb1,34:$VK,68:$Vc1,74:144,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{34:$Va,36:145,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},{10:$VF,12:$VG,13:$VH,26:$VI,27:146,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:148,30:$VJ,34:$VK,37:[1,147],49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:149,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:150,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:151,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:152,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:153,30:$VJ,34:$VK,47:[1,154],49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:155,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:156,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:157,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VC,[2,126]),o($V3,[2,19]),o($VD,[2,24]),o($Vz,[2,38],{17:158,10:$Vu}),o($VE,[2,60],{10:[1,159]}),{10:[1,160]},{10:$VF,12:$VG,13:$VH,26:$VI,27:161,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,49:$VL,57:$VM,58:[1,162],60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($Ve1,[2,67]),o($Ve1,[2,69]),o($Ve1,[2,115]),o($Ve1,[2,116]),o($Ve1,[2,117]),o($Ve1,[2,118]),o($Ve1,[2,119]),o($Ve1,[2,120]),o($Ve1,[2,121]),o($Ve1,[2,122]),o($Ve1,[2,123]),o($Ve1,[2,124]),o($Ve1,[2,133]),o($Ve1,[2,134]),o($Ve1,[2,135]),o($Ve1,[2,136]),o($Ve1,[2,137]),o($Ve1,[2,138]),o($Ve1,[2,139]),o($Ve1,[2,140]),o($Ve1,[2,141]),o($Ve1,[2,142]),o($Ve1,[2,143]),o($Ve1,[2,144]),o($Ve1,[2,145]),o($Ve1,[2,70]),o($Ve1,[2,71]),o($Ve1,[2,72]),o($Ve1,[2,73]),o($Ve1,[2,74]),o($Ve1,[2,75]),o($Ve1,[2,76]),o($Ve1,[2,77]),o($Ve1,[2,78]),o($Ve1,[2,79]),o($Ve1,[2,80]),{8:$Vw,9:$Vx,10:$VF,11:$Vy,12:$VG,13:$VH,20:165,26:$VI,28:[1,164],30:$VJ,34:$VK,49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,166],32:23,33:29,34:$Va,36:30,63:$Vb,64:$Vc,65:$Vd,66:$Ve,67:$Vf,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},{10:$Vu,17:167},{10:[1,168],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:169,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:[1,170]},o($Vf1,[2,127]),o($Vf1,[2,129]),o($Vf1,[2,130]),o($Vf1,[2,131]),o($Vf1,[2,132]),{10:[1,171]},{10:[1,172],79:[1,173]},o($Vg1,[2,98]),{10:[1,174]},{10:[1,175],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:169,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:[1,176],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:169,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:[1,177],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:169,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VA,[2,44],{91:84,34:$Va,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt}),{10:$VF,12:$VG,13:$VH,26:$VI,29:[1,178],30:$VJ,34:$VK,49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:179,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,38:[1,180],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,40:[1,181],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,42:[1,182],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,44:[1,183],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,46:[1,184],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,48:[1,185],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,27:186,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,29:[1,187],30:$VJ,34:$VK,49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,49:$VL,51:[1,188],53:[1,189],57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,49:$VL,51:[1,191],53:[1,190],57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($Vz,[2,39],{34:$Va1}),o($VE,[2,62]),o($VE,[2,61]),{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,49:$VL,57:$VM,59:[1,192],60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VE,[2,64]),o($Ve1,[2,68]),{10:$VF,12:$VG,13:$VH,26:$VI,27:193,30:$VJ,34:$VK,49:$VL,57:$VM,60:92,61:$VN,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($V91,$V4,{5:194}),o($Vv,[2,34]),{33:195,34:$Va,36:30,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},{10:$Vh1,63:$Vi1,73:196,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},o($Vf1,[2,128]),{10:$Vh1,63:$Vi1,73:210,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{10:$Vh1,63:$Vi1,73:211,75:$Vj1,77:[1,212],78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{10:$Vh1,63:$Vi1,73:213,75:$Vj1,77:[1,214],78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{78:[1,215]},{10:$Vh1,63:$Vi1,73:216,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{10:$Vh1,63:$Vi1,73:217,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{13:$Vb1,34:$VK,68:$Vc1,74:218,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{13:$Vb1,34:$VK,61:[1,220],68:$Vc1,74:219,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VB,[2,45]),{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,38:[1,221],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VB,[2,51]),o($VB,[2,47]),o($VB,[2,48]),o($VB,[2,49]),o($VB,[2,50]),o($VB,[2,52]),{10:$VF,12:$VG,13:$VH,26:$VI,30:$VJ,34:$VK,48:[1,222],49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},o($VB,[2,54]),o($VB,[2,55]),o($VB,[2,57]),o($VB,[2,56]),o($VB,[2,58]),o([10,34,68,78,79,82,83,84,86,87,93,94,95,96,97,98],[2,66]),{10:$VF,12:$VG,13:$VH,26:$VI,29:[1,223],30:$VJ,34:$VK,49:$VL,57:$VM,60:163,62:103,63:$VO,64:$VP,65:$VQ,66:$VR,67:$VS,68:$VT,69:$VU,71:94,72:$VV,78:$VW,79:$VX,82:$VY,83:$VZ,84:$V_,86:$V$,87:$V01,88:$V11,89:$V21,90:100,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,224],32:23,33:29,34:$Va,36:30,63:$Vb,64:$Vc,65:$Vd,66:$Ve,67:$Vf,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},o($VA,[2,43]),o($Vs1,[2,90],{79:$Vt1}),o($Vu1,[2,100],{81:226,10:$Vh1,63:$Vi1,75:$Vj1,78:$Vk1,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1}),o($Vv1,[2,102]),o($Vv1,[2,104]),o($Vv1,[2,105]),o($Vv1,[2,106]),o($Vv1,[2,107]),o($Vv1,[2,108]),o($Vv1,[2,109]),o($Vv1,[2,110]),o($Vv1,[2,111]),o($Vv1,[2,112]),o($Vv1,[2,113]),o($Vv1,[2,114]),o($Vs1,[2,91],{79:$Vt1}),o($Vs1,[2,92],{79:$Vt1}),{10:[1,227]},o($Vs1,[2,93],{79:$Vt1}),{10:[1,228]},o($Vg1,[2,99]),o($Vs1,[2,83],{79:$Vt1}),o($Vs1,[2,84],{79:$Vt1}),o($Vs1,[2,85],{90:135,92:169,13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81}),o($Vs1,[2,86],{90:135,92:169,10:[1,229],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81}),o($Vs1,[2,88],{10:[1,230]}),{38:[1,231]},{48:[1,232]},{8:$Vw,9:$Vx,11:$Vy,20:233},o($Vv,[2,33]),{10:$Vh1,63:$Vi1,75:$Vj1,78:$Vk1,80:234,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},o($Vv1,[2,103]),{13:$Vb1,34:$VK,68:$Vc1,74:235,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{13:$Vb1,34:$VK,68:$Vc1,74:236,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,90:135,92:133,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81},{61:[1,237]},{61:[1,238]},o($VB,[2,46]),o($VB,[2,53]),o($V91,$V4,{5:239}),o($Vu1,[2,101],{81:226,10:$Vh1,63:$Vi1,75:$Vj1,78:$Vk1,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1}),o($Vs1,[2,96],{90:135,92:169,10:[1,240],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81}),o($Vs1,[2,97],{90:135,92:169,10:[1,241],13:$Vb1,34:$VK,68:$Vc1,78:$VW,79:$VX,82:$VY,83:$VZ,84:$Vd1,86:$V$,87:$V01,93:$V31,94:$V41,95:$V51,96:$V61,97:$V71,98:$V81}),o($Vs1,[2,87]),o($Vs1,[2,89]),{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,242],32:23,33:29,34:$Va,36:30,63:$Vb,64:$Vc,65:$Vd,66:$Ve,67:$Vf,68:$Vg,78:$Vh,79:$Vi,82:$Vj,83:$Vk,84:$Vl,86:$Vm,87:$Vn,91:31,93:$Vo,94:$Vp,95:$Vq,96:$Vr,97:$Vs,98:$Vt},{10:$Vh1,63:$Vi1,73:243,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},{10:$Vh1,63:$Vi1,73:244,75:$Vj1,78:$Vk1,80:197,81:198,82:$Vl1,83:$Vm1,84:$Vn1,85:$Vo1,86:$Vp1,87:$Vq1,88:$Vr1},o($Vv,[2,32]),o($Vs1,[2,94],{79:$Vt1}),o($Vs1,[2,95],{79:$Vt1})],
defaultActions: {},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:this.begin("string");
break;
case 2:this.popState();
break;
case 3:return "STR";
break;
case 4:return 63;
break;
case 5:return 72;
break;
case 6:return 64;
break;
case 7:return 77;
break;
case 8:return 65;
break;
case 9:return 66;
break;
case 10:return 67;
break;
case 11:if(yy.lex.firstGraph()){this.begin("dir");}  return 12;
break;
case 12:if(yy.lex.firstGraph()){this.begin("dir");}  return 12;
break;
case 13:return 26;
break;
case 14:return 30;
break;
case 15:   this.popState();  return 13; 
break;
case 16:   this.popState();  return 13; 
break;
case 17:   this.popState();  return 13; 
break;
case 18:   this.popState();  return 13; 
break;
case 19:   this.popState();  return 13; 
break;
case 20:   this.popState();  return 13; 
break;
case 21:   this.popState();  return 13; 
break;
case 22:   this.popState();  return 13; 
break;
case 23:   this.popState();  return 13; 
break;
case 24:   this.popState();  return 13; 
break;
case 25: return 78;
break;
case 26:return 86;
break;
case 27:return 35;
break;
case 28:return 83;
break;
case 29:return 34;
break;
case 30:return 8;
break;
case 31:return 79;
break;
case 32:return 97;
break;
case 33:return 58;
break;
case 34:return 58;
break;
case 35:return 58;
break;
case 36:return 58;
break;
case 37:return 58;
break;
case 38:return 58;
break;
case 39:return 58;
break;
case 40:return 58;
break;
case 41:return 58;
break;
case 42:return 58;
break;
case 43:return 58;
break;
case 44:return 58;
break;
case 45:return 58;
break;
case 46:return 58;
break;
case 47:return 58;
break;
case 48:return 58;
break;
case 49:return 58;
break;
case 50:return 58;
break;
case 51:return 58;
break;
case 52:return 58;
break;
case 53:return 58;
break;
case 54:return 58;
break;
case 55:return 58;
break;
case 56:return 58;
break;
case 57:return 58;
break;
case 58:return 58;
break;
case 59:return 58;
break;
case 60:return 58;
break;
case 61:return 57;
break;
case 62:return 57;
break;
case 63:return 57;
break;
case 64:return 57;
break;
case 65:return 57;
break;
case 66:return 57;
break;
case 67:return 57;
break;
case 68:return 57;
break;
case 69:return 57;
break;
case 70:return 57;
break;
case 71:return 57;
break;
case 72:return 57;
break;
case 73:return 39;
break;
case 74:return 40;
break;
case 75:return 41;
break;
case 76:return 42;
break;
case 77:return 43;
break;
case 78:return 44;
break;
case 79:return 45;
break;
case 80:return 46;
break;
case 81:return 84;
break;
case 82:return 87;
break;
case 83:return 98;
break;
case 84:return 95;
break;
case 85:return 88;
break;
case 86:return 96;
break;
case 87:return 96;
break;
case 88:return 89;
break;
case 89:return 49;
break;
case 90:return 69;
break;
case 91:return 'SEP';
break;
case 92:return 68;
break;
case 93:return 82;
break;
case 94:return 51;
break;
case 95:return 50;
break;
case 96:return 53;
break;
case 97:return 52;
break;
case 98:return 93;
break;
case 99:return 94;
break;
case 100:return 59;
break;
case 101:return 37;
break;
case 102:return 38;
break;
case 103:return 28;
break;
case 104:return 29;
break;
case 105:return 47
break;
case 106:return 48
break;
case 107:return 104;
break;
case 108:return 9;
break;
case 109:return 10;
break;
case 110:return 11;
break;
}
},
rules: [/^(?:%%[^\n]*\n*)/,/^(?:["])/,/^(?:["])/,/^(?:[^"]*)/,/^(?:style\b)/,/^(?:default\b)/,/^(?:linkStyle\b)/,/^(?:interpolate\b)/,/^(?:classDef\b)/,/^(?:class\b)/,/^(?:click\b)/,/^(?:graph\b)/,/^(?:flowchart\b)/,/^(?:subgraph\b)/,/^(?:end\b\s*)/,/^(?:\s*LR\b)/,/^(?:\s*RL\b)/,/^(?:\s*TB\b)/,/^(?:\s*BT\b)/,/^(?:\s*TD\b)/,/^(?:\s*BR\b)/,/^(?:\s*<)/,/^(?:\s*>)/,/^(?:\s*\^)/,/^(?:\s*v\b)/,/^(?:[0-9]+)/,/^(?:#)/,/^(?::::)/,/^(?::)/,/^(?:&)/,/^(?:;)/,/^(?:,)/,/^(?:\*)/,/^(?:\s*--[x]\s*)/,/^(?:\s*-->\s*)/,/^(?:\s*<-->\s*)/,/^(?:\s*[x]--[x]\s*)/,/^(?:\s*[o]--[o]\s*)/,/^(?:\s*[o]\.-[o]\s*)/,/^(?:\s*<==>\s*)/,/^(?:\s*[o]==[o]\s*)/,/^(?:\s*[x]==[x]\s*)/,/^(?:\s*[x].-[x]\s*)/,/^(?:\s*[x]-\.-[x]\s*)/,/^(?:\s*<\.->\s*)/,/^(?:\s*<-\.->\s*)/,/^(?:\s*[o]-\.-[o]\s*)/,/^(?:\s*--[o]\s*)/,/^(?:\s*---\s*)/,/^(?:\s*-\.-[x]\s*)/,/^(?:\s*-\.->\s*)/,/^(?:\s*-\.-[o]\s*)/,/^(?:\s*-\.-\s*)/,/^(?:\s*.-[x]\s*)/,/^(?:\s*\.->\s*)/,/^(?:\s*\.-[o]\s*)/,/^(?:\s*\.-\s*)/,/^(?:\s*==[x]\s*)/,/^(?:\s*==>\s*)/,/^(?:\s*==[o]\s*)/,/^(?:\s*==[\=]\s*)/,/^(?:\s*<--\s*)/,/^(?:\s*[x]--\s*)/,/^(?:\s*[o]--\s*)/,/^(?:\s*<-\.\s*)/,/^(?:\s*[x]-\.\s*)/,/^(?:\s*[o]-\.\s*)/,/^(?:\s*<==\s*)/,/^(?:\s*[x]==\s*)/,/^(?:\s*[o]==\s*)/,/^(?:\s*--\s*)/,/^(?:\s*-\.\s*)/,/^(?:\s*==\s*)/,/^(?:\(-)/,/^(?:-\))/,/^(?:\(\[)/,/^(?:\]\))/,/^(?:\[\[)/,/^(?:\]\])/,/^(?:\[\()/,/^(?:\)\])/,/^(?:-)/,/^(?:\.)/,/^(?:[\_])/,/^(?:\+)/,/^(?:%)/,/^(?:=)/,/^(?:=)/,/^(?:<)/,/^(?:>)/,/^(?:\^)/,/^(?:\\\|)/,/^(?:v\b)/,/^(?:[A-Za-z]+)/,/^(?:\\\])/,/^(?:\[\/)/,/^(?:\/\])/,/^(?:\[\\)/,/^(?:[!"#$%&'*+,-.`?\\_/])/,/^(?:[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]|[\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377]|[\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5]|[\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA]|[\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE]|[\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA]|[\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0]|[\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977]|[\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2]|[\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A]|[\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39]|[\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8]|[\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C]|[\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C]|[\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99]|[\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0]|[\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D]|[\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3]|[\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10]|[\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1]|[\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81]|[\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3]|[\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6]|[\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A]|[\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081]|[\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D]|[\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0]|[\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310]|[\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C]|[\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711]|[\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7]|[\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C]|[\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16]|[\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF]|[\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC]|[\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D]|[\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D]|[\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3]|[\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F]|[\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128]|[\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184]|[\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3]|[\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6]|[\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE]|[\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C]|[\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D]|[\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC]|[\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B]|[\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788]|[\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805]|[\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB]|[\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28]|[\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5]|[\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4]|[\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E]|[\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D]|[\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36]|[\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D]|[\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]|[\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF]|[\uFFD2-\uFFD7\uFFDA-\uFFDC])/,/^(?:\|)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:")/,/^(?:(\r|\n|\r\n)+)/,/^(?:\s)/,/^(?:$)/],
conditions: {"vertex":{"rules":[],"inclusive":false},"dir":{"rules":[15,16,17,18,19,20,21,22,23,24],"inclusive":false},"string":{"rules":[2,3],"inclusive":false},"INITIAL":{"rules":[0,1,4,5,6,7,8,9,10,11,12,13,14,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/gantt/ganttDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/gantt/ganttDb.js ***!
  \***************************************/
/*! exports provided: clear, setAxisFormat, getAxisFormat, setTodayMarker, getTodayMarker, setDateFormat, enableInclusiveEndDates, endDatesAreInclusive, getDateFormat, setExcludes, getExcludes, setTitle, getTitle, addSection, getSections, getTasks, addTask, findTaskById, addTaskOrg, setLink, setClass, setClickEvent, bindFunctions, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAxisFormat", function() { return setAxisFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAxisFormat", function() { return getAxisFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTodayMarker", function() { return setTodayMarker; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTodayMarker", function() { return getTodayMarker; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDateFormat", function() { return setDateFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "enableInclusiveEndDates", function() { return enableInclusiveEndDates; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "endDatesAreInclusive", function() { return endDatesAreInclusive; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDateFormat", function() { return getDateFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setExcludes", function() { return setExcludes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getExcludes", function() { return getExcludes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTitle", function() { return setTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitle", function() { return getTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSection", function() { return addSection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSections", function() { return getSections; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTasks", function() { return getTasks; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTask", function() { return addTask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "findTaskById", function() { return findTaskById; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTaskOrg", function() { return addTaskOrg; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLink", function() { return setLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClass", function() { return setClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClickEvent", function() { return setClickEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindFunctions", function() { return bindFunctions; });
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment-mini */ "moment-mini");
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment_mini__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @braintree/sanitize-url */ "@braintree/sanitize-url");
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }






var dateFormat = '';
var axisFormat = '';
var todayMarker = '';
var excludes = [];
var title = '';
var sections = [];
var tasks = [];
var currentSection = '';
var tags = ['active', 'done', 'crit', 'milestone'];
var funs = [];
var inclusiveEndDates = false; // The serial order of the task in the script

var lastOrder = 0;
var clear = function clear() {
  sections = [];
  tasks = [];
  currentSection = '';
  funs = [];
  title = '';
  taskCnt = 0;
  lastTask = undefined;
  lastTaskID = undefined;
  rawTasks = [];
  dateFormat = '';
  axisFormat = '';
  todayMarker = '';
  excludes = [];
  inclusiveEndDates = false;
  lastOrder = 0;
};
var setAxisFormat = function setAxisFormat(txt) {
  axisFormat = txt;
};
var getAxisFormat = function getAxisFormat() {
  return axisFormat;
};
var setTodayMarker = function setTodayMarker(txt) {
  todayMarker = txt;
};
var getTodayMarker = function getTodayMarker() {
  return todayMarker;
};
var setDateFormat = function setDateFormat(txt) {
  dateFormat = txt;
};
var enableInclusiveEndDates = function enableInclusiveEndDates() {
  inclusiveEndDates = true;
};
var endDatesAreInclusive = function endDatesAreInclusive() {
  return inclusiveEndDates;
};
var getDateFormat = function getDateFormat() {
  return dateFormat;
};
var setExcludes = function setExcludes(txt) {
  excludes = txt.toLowerCase().split(/[\s,]+/);
};
var getExcludes = function getExcludes() {
  return excludes;
};
var setTitle = function setTitle(txt) {
  title = txt;
};
var getTitle = function getTitle() {
  return title;
};
var addSection = function addSection(txt) {
  currentSection = txt;
  sections.push(txt);
};
var getSections = function getSections() {
  return sections;
};
var getTasks = function getTasks() {
  var allItemsPricessed = compileTasks();
  var maxDepth = 10;
  var iterationCount = 0;

  while (!allItemsPricessed && iterationCount < maxDepth) {
    allItemsPricessed = compileTasks();
    iterationCount++;
  }

  tasks = rawTasks;
  return tasks;
};

var isInvalidDate = function isInvalidDate(date, dateFormat, excludes) {
  if (date.isoWeekday() >= 6 && excludes.indexOf('weekends') >= 0) {
    return true;
  }

  if (excludes.indexOf(date.format('dddd').toLowerCase()) >= 0) {
    return true;
  }

  return excludes.indexOf(date.format(dateFormat.trim())) >= 0;
};

var checkTaskDates = function checkTaskDates(task, dateFormat, excludes) {
  if (!excludes.length || task.manualEndTime) return;
  var startTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(task.startTime, dateFormat, true);
  startTime.add(1, 'd');
  var endTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(task.endTime, dateFormat, true);
  var renderEndTime = fixTaskDates(startTime, endTime, dateFormat, excludes);
  task.endTime = endTime.toDate();
  task.renderEndTime = renderEndTime;
};

var fixTaskDates = function fixTaskDates(startTime, endTime, dateFormat, excludes) {
  var invalid = false;
  var renderEndTime = null;

  while (startTime <= endTime) {
    if (!invalid) {
      renderEndTime = endTime.toDate();
    }

    invalid = isInvalidDate(startTime, dateFormat, excludes);

    if (invalid) {
      endTime.add(1, 'd');
    }

    startTime.add(1, 'd');
  }

  return renderEndTime;
};

var getStartDate = function getStartDate(prevTime, dateFormat, str) {
  str = str.trim(); // Test for after

  var re = /^after\s+([\d\w- ]+)/;
  var afterStatement = re.exec(str.trim());

  if (afterStatement !== null) {
    // check all after ids and take the latest
    var latestEndingTask = null;
    afterStatement[1].split(' ').forEach(function (id) {
      var task = findTaskById(id);

      if (typeof task !== 'undefined') {
        if (!latestEndingTask) {
          latestEndingTask = task;
        } else {
          if (task.endTime > latestEndingTask.endTime) {
            latestEndingTask = task;
          }
        }
      }
    });

    if (!latestEndingTask) {
      var dt = new Date();
      dt.setHours(0, 0, 0, 0);
      return dt;
    } else {
      return latestEndingTask.endTime;
    }
  } // Check for actual date set


  var mDate = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(str, dateFormat.trim(), true);

  if (mDate.isValid()) {
    return mDate.toDate();
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Invalid date:' + str);
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('With date format:' + dateFormat.trim());
  } // Default date - now


  return new Date();
};

var durationToDate = function durationToDate(durationStatement, relativeTime) {
  if (durationStatement !== null) {
    switch (durationStatement[2]) {
      case 's':
        relativeTime.add(durationStatement[1], 'seconds');
        break;

      case 'm':
        relativeTime.add(durationStatement[1], 'minutes');
        break;

      case 'h':
        relativeTime.add(durationStatement[1], 'hours');
        break;

      case 'd':
        relativeTime.add(durationStatement[1], 'days');
        break;

      case 'w':
        relativeTime.add(durationStatement[1], 'weeks');
        break;
    }
  } // Default date - now


  return relativeTime.toDate();
};

var getEndDate = function getEndDate(prevTime, dateFormat, str, inclusive) {
  inclusive = inclusive || false;
  str = str.trim(); // Check for actual date

  var mDate = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(str, dateFormat.trim(), true);

  if (mDate.isValid()) {
    if (inclusive) {
      mDate.add(1, 'd');
    }

    return mDate.toDate();
  }

  return durationToDate(/^([\d]+)([wdhms])/.exec(str.trim()), moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(prevTime));
};

var taskCnt = 0;

var parseId = function parseId(idStr) {
  if (typeof idStr === 'undefined') {
    taskCnt = taskCnt + 1;
    return 'task' + taskCnt;
  }

  return idStr;
}; // id, startDate, endDate
// id, startDate, length
// id, after x, endDate
// id, after x, length
// startDate, endDate
// startDate, length
// after x, endDate
// after x, length
// endDate
// length


var compileData = function compileData(prevTask, dataStr) {
  var ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  var data = ds.split(',');
  var task = {}; // Get tags like active, done, crit and milestone

  getTaskTags(data, task, tags);

  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  var endTimeData = '';

  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = prevTask.endTime;
      endTimeData = data[0];
      break;

    case 2:
      task.id = parseId();
      task.startTime = getStartDate(undefined, dateFormat, data[0]);
      endTimeData = data[1];
      break;

    case 3:
      task.id = parseId(data[0]);
      task.startTime = getStartDate(undefined, dateFormat, data[1]);
      endTimeData = data[2];
      break;

    default:
  }

  if (endTimeData) {
    task.endTime = getEndDate(task.startTime, dateFormat, endTimeData, inclusiveEndDates);
    task.manualEndTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(endTimeData, 'YYYY-MM-DD', true).isValid();
    checkTaskDates(task, dateFormat, excludes);
  }

  return task;
};

var parseData = function parseData(prevTaskId, dataStr) {
  var ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  var data = ds.split(',');
  var task = {}; // Get tags like active, done, crit and milestone

  getTaskTags(data, task, tags);

  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = {
        type: 'prevTaskEnd',
        id: prevTaskId
      };
      task.endTime = {
        data: data[0]
      };
      break;

    case 2:
      task.id = parseId();
      task.startTime = {
        type: 'getStartDate',
        startData: data[0]
      };
      task.endTime = {
        data: data[1]
      };
      break;

    case 3:
      task.id = parseId(data[0]);
      task.startTime = {
        type: 'getStartDate',
        startData: data[1]
      };
      task.endTime = {
        data: data[2]
      };
      break;

    default:
  }

  return task;
};

var lastTask;
var lastTaskID;
var rawTasks = [];
var taskDb = {};
var addTask = function addTask(descr, data) {
  var rawTask = {
    section: currentSection,
    type: currentSection,
    processed: false,
    manualEndTime: false,
    renderEndTime: null,
    raw: {
      data: data
    },
    task: descr,
    classes: []
  };
  var taskInfo = parseData(lastTaskID, data);
  rawTask.raw.startTime = taskInfo.startTime;
  rawTask.raw.endTime = taskInfo.endTime;
  rawTask.id = taskInfo.id;
  rawTask.prevTaskId = lastTaskID;
  rawTask.active = taskInfo.active;
  rawTask.done = taskInfo.done;
  rawTask.crit = taskInfo.crit;
  rawTask.milestone = taskInfo.milestone;
  rawTask.order = lastOrder;
  lastOrder++;
  var pos = rawTasks.push(rawTask);
  lastTaskID = rawTask.id; // Store cross ref

  taskDb[rawTask.id] = pos - 1;
};
var findTaskById = function findTaskById(id) {
  var pos = taskDb[id];
  return rawTasks[pos];
};
var addTaskOrg = function addTaskOrg(descr, data) {
  var newTask = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: []
  };
  var taskInfo = compileData(lastTask, data);
  newTask.startTime = taskInfo.startTime;
  newTask.endTime = taskInfo.endTime;
  newTask.id = taskInfo.id;
  newTask.active = taskInfo.active;
  newTask.done = taskInfo.done;
  newTask.crit = taskInfo.crit;
  newTask.milestone = taskInfo.milestone;
  lastTask = newTask;
  tasks.push(newTask);
};

var compileTasks = function compileTasks() {
  var compileTask = function compileTask(pos) {
    var task = rawTasks[pos];
    var startTime = '';

    switch (rawTasks[pos].raw.startTime.type) {
      case 'prevTaskEnd':
        {
          var prevTask = findTaskById(task.prevTaskId);
          task.startTime = prevTask.endTime;
          break;
        }

      case 'getStartDate':
        startTime = getStartDate(undefined, dateFormat, rawTasks[pos].raw.startTime.startData);

        if (startTime) {
          rawTasks[pos].startTime = startTime;
        }

        break;
    }

    if (rawTasks[pos].startTime) {
      rawTasks[pos].endTime = getEndDate(rawTasks[pos].startTime, dateFormat, rawTasks[pos].raw.endTime.data, inclusiveEndDates);

      if (rawTasks[pos].endTime) {
        rawTasks[pos].processed = true;
        rawTasks[pos].manualEndTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(rawTasks[pos].raw.endTime.data, 'YYYY-MM-DD', true).isValid();
        checkTaskDates(rawTasks[pos], dateFormat, excludes);
      }
    }

    return rawTasks[pos].processed;
  };

  var allProcessed = true;

  for (var i = 0; i < rawTasks.length; i++) {
    compileTask(i);
    allProcessed = allProcessed && rawTasks[i].processed;
  }

  return allProcessed;
};
/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 */


var setLink = function setLink(ids, _linkStr) {
  var linkStr = _linkStr;

  if (Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().securityLevel !== 'loose') {
    linkStr = Object(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__["sanitizeUrl"])(_linkStr);
  }

  ids.split(',').forEach(function (id) {
    var rawTask = findTaskById(id);

    if (typeof rawTask !== 'undefined') {
      pushFun(id, function () {
        window.open(linkStr, '_self');
      });
    }
  });
  setClass(ids, 'clickable');
};
/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */

var setClass = function setClass(ids, className) {
  ids.split(',').forEach(function (id) {
    var rawTask = findTaskById(id);

    if (typeof rawTask !== 'undefined') {
      rawTask.classes.push(className);
    }
  });
};

var setClickFun = function setClickFun(id, functionName, functionArgs) {
  if (Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().securityLevel !== 'loose') {
    return;
  }

  if (typeof functionName === 'undefined') {
    return;
  }

  var argList = [];

  if (typeof functionArgs === 'string') {
    /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
    argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    for (var i = 0; i < argList.length; i++) {
      var item = argList[i].trim();
      /* Removes all double quotes at the start and end of an argument */

      /* This preserves all starting and ending whitespace inside */

      if (item.charAt(0) === '"' && item.charAt(item.length - 1) === '"') {
        item = item.substr(1, item.length - 2);
      }

      argList[i] = item;
    }
  }
  /* if no arguments passed into callback, default to passing in id */


  if (argList.length === 0) {
    argList.push(id);
  }

  var rawTask = findTaskById(id);

  if (typeof rawTask !== 'undefined') {
    pushFun(id, function () {
      _utils__WEBPACK_IMPORTED_MODULE_4__["default"].runFunc.apply(_utils__WEBPACK_IMPORTED_MODULE_4__["default"], [functionName].concat(_toConsumableArray(argList)));
    });
  }
};
/**
 * The callbackFunction is executed in a click event bound to the task with the specified id or the task's assigned text
 * @param id The task's id
 * @param callbackFunction A function to be executed when clicked on the task or the task's text
 */


var pushFun = function pushFun(id, callbackFunction) {
  funs.push(function () {
    // const elem = d3.select(element).select(`[id="${id}"]`)
    var elem = document.querySelector("[id=\"".concat(id, "\"]"));

    if (elem !== null) {
      elem.addEventListener('click', function () {
        callbackFunction();
      });
    }
  });
  funs.push(function () {
    // const elem = d3.select(element).select(`[id="${id}-text"]`)
    var elem = document.querySelector("[id=\"".concat(id, "-text\"]"));

    if (elem !== null) {
      elem.addEventListener('click', function () {
        callbackFunction();
      });
    }
  });
};
/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param functionArgs Function args the function should be called with
 */


var setClickEvent = function setClickEvent(ids, functionName, functionArgs) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};
/**
 * Binds all functions previously added to fun (specified through click) to the element
 * @param element
 */

var bindFunctions = function bindFunctions(element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
/* harmony default export */ __webpack_exports__["default"] = ({
  clear: clear,
  setDateFormat: setDateFormat,
  getDateFormat: getDateFormat,
  enableInclusiveEndDates: enableInclusiveEndDates,
  endDatesAreInclusive: endDatesAreInclusive,
  setAxisFormat: setAxisFormat,
  getAxisFormat: getAxisFormat,
  setTodayMarker: setTodayMarker,
  getTodayMarker: getTodayMarker,
  setTitle: setTitle,
  getTitle: getTitle,
  addSection: addSection,
  getSections: getSections,
  getTasks: getTasks,
  addTask: addTask,
  findTaskById: findTaskById,
  addTaskOrg: addTaskOrg,
  setExcludes: setExcludes,
  getExcludes: getExcludes,
  setClickEvent: setClickEvent,
  setLink: setLink,
  bindFunctions: bindFunctions,
  durationToDate: durationToDate
});

function getTaskTags(data, task, tags) {
  var matchFound = true;

  while (matchFound) {
    matchFound = false;
    tags.forEach(function (t) {
      var pattern = '^\\s*' + t + '\\s*$';
      var regex = new RegExp(pattern);

      if (data[0].match(regex)) {
        task[t] = true;
        data.shift(1);
        matchFound = true;
      }
    });
  }
}

/***/ }),

/***/ "./src/diagrams/gantt/ganttRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/gantt/ganttRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _parser_gantt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser/gantt */ "./src/diagrams/gantt/parser/gantt.jison");
/* harmony import */ var _parser_gantt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_parser_gantt__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _ganttDb__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ganttDb */ "./src/diagrams/gantt/ganttDb.js");




_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy = _ganttDb__WEBPACK_IMPORTED_MODULE_3__["default"];
var conf = {
  titleTopMargin: 25,
  barHeight: 20,
  barGap: 4,
  topPadding: 50,
  rightPadding: 75,
  leftPadding: 75,
  gridLineStartPadding: 35,
  fontSize: 11,
  fontFamily: '"Open-Sans", "sans-serif"'
};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
var w;
var draw = function draw(text, id) {
  _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.clear();
  _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].parse(text);
  var elem = document.getElementById(id);
  w = elem.parentElement.offsetWidth;

  if (typeof w === 'undefined') {
    w = 1200;
  }

  if (typeof conf.useWidth !== 'undefined') {
    w = conf.useWidth;
  }

  var taskArray = _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTasks(); // Set height based on number of tasks

  var h = taskArray.length * (conf.barHeight + conf.barGap) + 2 * conf.topPadding;
  elem.setAttribute('height', '100%'); // Set viewBox

  elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id=\"".concat(id, "\"]")); // Set timescale

  var timeScale = Object(d3__WEBPACK_IMPORTED_MODULE_0__["scaleTime"])().domain([Object(d3__WEBPACK_IMPORTED_MODULE_0__["min"])(taskArray, function (d) {
    return d.startTime;
  }), Object(d3__WEBPACK_IMPORTED_MODULE_0__["max"])(taskArray, function (d) {
    return d.endTime;
  })]).rangeRound([0, w - conf.leftPadding - conf.rightPadding]);
  var categories = [];

  for (var i = 0; i < taskArray.length; i++) {
    categories.push(taskArray[i].type);
  }

  var catsUnfiltered = categories; // for vert labels

  categories = checkUnique(categories);

  function taskCompare(a, b) {
    var taskA = a.startTime;
    var taskB = b.startTime;
    var result = 0;

    if (taskA > taskB) {
      result = 1;
    } else if (taskA < taskB) {
      result = -1;
    }

    return result;
  } // Sort the task array using the above taskCompare() so that
  // tasks are created based on their order of startTime


  taskArray.sort(taskCompare);
  makeGant(taskArray, w, h);

  if (typeof conf.useWidth !== 'undefined') {
    elem.setAttribute('width', w);
  }

  svg.append('text').text(_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTitle()).attr('x', w / 2).attr('y', conf.titleTopMargin).attr('class', 'titleText');

  function makeGant(tasks, pageWidth, pageHeight) {
    var barHeight = conf.barHeight;
    var gap = barHeight + conf.barGap;
    var topPadding = conf.topPadding;
    var leftPadding = conf.leftPadding;
    var colorScale = Object(d3__WEBPACK_IMPORTED_MODULE_0__["scaleLinear"])().domain([0, categories.length]).range(['#00B9FA', '#F95002']).interpolate(d3__WEBPACK_IMPORTED_MODULE_0__["interpolateHcl"]);
    makeGrid(leftPadding, topPadding, pageWidth, pageHeight);
    drawRects(tasks, gap, topPadding, leftPadding, barHeight, colorScale, pageWidth, pageHeight);
    vertLabels(gap, topPadding, leftPadding, barHeight, colorScale);
    drawToday(leftPadding, topPadding, pageWidth, pageHeight);
  }

  function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w) {
    // Draw background rects covering the entire width of the graph, these form the section rows.
    svg.append('g').selectAll('rect').data(theArray).enter().append('rect').attr('x', 0).attr('y', function (d, i) {
      // Ignore the incoming i value and use our order instead
      i = d.order;
      return i * theGap + theTopPad - 2;
    }).attr('width', function () {
      return w - conf.rightPadding / 2;
    }).attr('height', theGap).attr('class', function (d) {
      for (var _i = 0; _i < categories.length; _i++) {
        if (d.type === categories[_i]) {
          return 'section section' + _i % conf.numberSectionStyles;
        }
      }

      return 'section section0';
    }); // Draw the rects representing the tasks

    var rectangles = svg.append('g').selectAll('rect').data(theArray).enter();
    rectangles.append('rect').attr('id', function (d) {
      return d.id;
    }).attr('rx', 3).attr('ry', 3).attr('x', function (d) {
      if (d.milestone) {
        return timeScale(d.startTime) + theSidePad + 0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) - 0.5 * theBarHeight;
      }

      return timeScale(d.startTime) + theSidePad;
    }).attr('y', function (d, i) {
      // Ignore the incoming i value and use our order instead
      i = d.order;
      return i * theGap + theTopPad;
    }).attr('width', function (d) {
      if (d.milestone) {
        return theBarHeight;
      }

      return timeScale(d.renderEndTime || d.endTime) - timeScale(d.startTime);
    }).attr('height', theBarHeight).attr('transform-origin', function (d, i) {
      return (timeScale(d.startTime) + theSidePad + 0.5 * (timeScale(d.endTime) - timeScale(d.startTime))).toString() + 'px ' + (i * theGap + theTopPad + 0.5 * theBarHeight).toString() + 'px';
    }).attr('class', function (d) {
      var res = 'task';
      var classStr = '';

      if (d.classes.length > 0) {
        classStr = d.classes.join(' ');
      }

      var secNum = 0;

      for (var _i2 = 0; _i2 < categories.length; _i2++) {
        if (d.type === categories[_i2]) {
          secNum = _i2 % conf.numberSectionStyles;
        }
      }

      var taskClass = '';

      if (d.active) {
        if (d.crit) {
          taskClass += ' activeCrit';
        } else {
          taskClass = ' active';
        }
      } else if (d.done) {
        if (d.crit) {
          taskClass = ' doneCrit';
        } else {
          taskClass = ' done';
        }
      } else {
        if (d.crit) {
          taskClass += ' crit';
        }
      }

      if (taskClass.length === 0) {
        taskClass = ' task';
      }

      if (d.milestone) {
        taskClass = ' milestone ' + taskClass;
      }

      taskClass += secNum;
      taskClass += ' ' + classStr;
      return res + taskClass;
    }); // Append task labels

    rectangles.append('text').attr('id', function (d) {
      return d.id + '-text';
    }).text(function (d) {
      return d.task;
    }).attr('font-size', conf.fontSize).attr('x', function (d) {
      var startX = timeScale(d.startTime);
      var endX = timeScale(d.renderEndTime || d.endTime);

      if (d.milestone) {
        startX += 0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) - 0.5 * theBarHeight;
      }

      if (d.milestone) {
        endX = startX + theBarHeight;
      }

      var textWidth = this.getBBox().width; // Check id text width > width of rectangle

      if (textWidth > endX - startX) {
        if (endX + textWidth + 1.5 * conf.leftPadding > w) {
          return startX + theSidePad - 5;
        } else {
          return endX + theSidePad + 5;
        }
      } else {
        return (endX - startX) / 2 + startX + theSidePad;
      }
    }).attr('y', function (d, i) {
      // Ignore the incoming i value and use our order instead
      i = d.order;
      return i * theGap + conf.barHeight / 2 + (conf.fontSize / 2 - 2) + theTopPad;
    }).attr('text-height', theBarHeight).attr('class', function (d) {
      var startX = timeScale(d.startTime);
      var endX = timeScale(d.endTime);

      if (d.milestone) {
        endX = startX + theBarHeight;
      }

      var textWidth = this.getBBox().width;
      var classStr = '';

      if (d.classes.length > 0) {
        classStr = d.classes.join(' ');
      }

      var secNum = 0;
      console.log(conf);

      for (var _i3 = 0; _i3 < categories.length; _i3++) {
        if (d.type === categories[_i3]) {
          secNum = _i3 % conf.numberSectionStyles;
        }
      }

      var taskType = '';

      if (d.active) {
        if (d.crit) {
          taskType = 'activeCritText' + secNum;
        } else {
          taskType = 'activeText' + secNum;
        }
      }

      if (d.done) {
        if (d.crit) {
          taskType = taskType + ' doneCritText' + secNum;
        } else {
          taskType = taskType + ' doneText' + secNum;
        }
      } else {
        if (d.crit) {
          taskType = taskType + ' critText' + secNum;
        }
      }

      if (d.milestone) {
        taskType += ' milestoneText';
      } // Check id text width > width of rectangle


      if (textWidth > endX - startX) {
        if (endX + textWidth + 1.5 * conf.leftPadding > w) {
          return classStr + ' taskTextOutsideLeft taskTextOutside' + secNum + ' ' + taskType;
        } else {
          return classStr + ' taskTextOutsideRight taskTextOutside' + secNum + ' ' + taskType + ' width-' + textWidth;
        }
      } else {
        return classStr + ' taskText taskText' + secNum + ' ' + taskType + ' width-' + textWidth;
      }
    });
  }

  function makeGrid(theSidePad, theTopPad, w, h) {
    var xAxis = Object(d3__WEBPACK_IMPORTED_MODULE_0__["axisBottom"])(timeScale).tickSize(-h + theTopPad + conf.gridLineStartPadding).tickFormat(Object(d3__WEBPACK_IMPORTED_MODULE_0__["timeFormat"])(_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getAxisFormat() || conf.axisFormat || '%Y-%m-%d'));
    svg.append('g').attr('class', 'grid').attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')').call(xAxis).selectAll('text').style('text-anchor', 'middle').attr('fill', '#000').attr('stroke', 'none').attr('font-size', 10).attr('dy', '1em');
  }

  function vertLabels(theGap, theTopPad) {
    var numOccurances = [];
    var prevGap = 0;

    for (var _i4 = 0; _i4 < categories.length; _i4++) {
      numOccurances[_i4] = [categories[_i4], getCount(categories[_i4], catsUnfiltered)];
    }

    svg.append('g') // without doing this, impossible to put grid lines behind text
    .selectAll('text').data(numOccurances).enter().append(function (d) {
      var rows = d[0].split(_common_common__WEBPACK_IMPORTED_MODULE_2__["default"].lineBreakRegex);
      var dy = -(rows.length - 1) / 2;
      var svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('dy', dy + 'em');

      for (var j = 0; j < rows.length; j++) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('alignment-baseline', 'central');
        tspan.setAttribute('x', '10');
        if (j > 0) tspan.setAttribute('dy', '1em');
        tspan.textContent = rows[j];
        svgLabel.appendChild(tspan);
      }

      return svgLabel;
    }).attr('x', 10).attr('y', function (d, i) {
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          prevGap += numOccurances[i - 1][1];
          return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
        }
      } else {
        return d[1] * theGap / 2 + theTopPad;
      }
    }).attr('class', function (d) {
      for (var _i5 = 0; _i5 < categories.length; _i5++) {
        if (d[0] === categories[_i5]) {
          return 'sectionTitle sectionTitle' + _i5 % conf.numberSectionStyles;
        }
      }

      return 'sectionTitle';
    });
  }

  function drawToday(theSidePad, theTopPad, w, h) {
    var todayMarker = _ganttDb__WEBPACK_IMPORTED_MODULE_3__["default"].getTodayMarker();

    if (todayMarker === 'off') {
      return;
    }

    var todayG = svg.append('g').attr('class', 'today');
    var today = new Date();
    var todayLine = todayG.append('line');
    todayLine.attr('x1', timeScale(today) + theSidePad).attr('x2', timeScale(today) + theSidePad).attr('y1', conf.titleTopMargin).attr('y2', h - conf.titleTopMargin).attr('class', 'today');

    if (todayMarker !== '') {
      todayLine.attr('style', todayMarker.replace(/,/g, ';'));
    }
  } // from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript


  function checkUnique(arr) {
    var hash = {};
    var result = [];

    for (var _i6 = 0, l = arr.length; _i6 < l; ++_i6) {
      if (!hash.hasOwnProperty(arr[_i6])) {
        // eslint-disable-line
        // it works with objects! in FF, at least
        hash[arr[_i6]] = true;
        result.push(arr[_i6]);
      }
    }

    return result;
  } // from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array


  function getCounts(arr) {
    var i = arr.length; // const to loop over

    var obj = {}; // obj to store results

    while (i) {
      obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
    }

    return obj;
  } // get specific from everything


  function getCount(word, arr) {
    return getCounts(arr)[word] || 0;
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/gantt/parser/gantt.jison":
/*!***********************************************!*\
  !*** ./src/diagrams/gantt/parser/gantt.jison ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,8,10,11,12,13,14,15,16,17,19,21],$V1=[1,9],$V2=[1,10],$V3=[1,11],$V4=[1,12],$V5=[1,13],$V6=[1,14],$V7=[1,15],$V8=[1,17],$V9=[1,18];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"gantt":4,"document":5,"EOF":6,"line":7,"SPACE":8,"statement":9,"NL":10,"dateFormat":11,"inclusiveEndDates":12,"axisFormat":13,"excludes":14,"todayMarker":15,"title":16,"section":17,"clickStatement":18,"taskTxt":19,"taskData":20,"click":21,"callbackname":22,"callbackargs":23,"href":24,"clickStatementDebug":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",11:"dateFormat",12:"inclusiveEndDates",13:"axisFormat",14:"excludes",15:"todayMarker",16:"title",17:"section",19:"taskTxt",20:"taskData",21:"click",22:"callbackname",23:"callbackargs",24:"href"},
productions_: [0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[18,2],[18,3],[18,3],[18,4],[18,3],[18,4],[18,2],[25,2],[25,3],[25,3],[25,4],[25,3],[25,4],[25,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2:
 this.$ = [] 
break;
case 3:
$$[$0-1].push($$[$0]);this.$ = $$[$0-1]
break;
case 4: case 5:
 this.$ = $$[$0] 
break;
case 6: case 7:
 this.$=[];
break;
case 8:
yy.setDateFormat($$[$0].substr(11));this.$=$$[$0].substr(11);
break;
case 9:
yy.enableInclusiveEndDates();this.$=$$[$0].substr(18);
break;
case 10:
yy.setAxisFormat($$[$0].substr(11));this.$=$$[$0].substr(11);
break;
case 11:
yy.setExcludes($$[$0].substr(9));this.$=$$[$0].substr(9);
break;
case 12:
yy.setTodayMarker($$[$0].substr(12));this.$=$$[$0].substr(12);
break;
case 13:
yy.setTitle($$[$0].substr(6));this.$=$$[$0].substr(6);
break;
case 14:
yy.addSection($$[$0].substr(8));this.$=$$[$0].substr(8);
break;
case 16:
yy.addTask($$[$0-1],$$[$0]);this.$='task';
break;
case 17:
this.$ = $$[$0-1];yy.setClickEvent($$[$0-1], $$[$0], null);
break;
case 18:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0-1], $$[$0]);
break;
case 19:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0-1], null);yy.setLink($$[$0-2],$$[$0]);
break;
case 20:
this.$ = $$[$0-3];yy.setClickEvent($$[$0-3], $$[$0-2], $$[$0-1]);yy.setLink($$[$0-3],$$[$0]);
break;
case 21:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0], null);yy.setLink($$[$0-2],$$[$0-1]);
break;
case 22:
this.$ = $$[$0-3];yy.setClickEvent($$[$0-3], $$[$0-1], $$[$0]);yy.setLink($$[$0-3],$$[$0-2]);
break;
case 23:
this.$ = $$[$0-1];yy.setLink($$[$0-1], $$[$0]);
break;
case 24: case 30:
this.$=$$[$0-1] + ' ' + $$[$0];
break;
case 25: case 26: case 28:
this.$=$$[$0-2] + ' ' + $$[$0-1] + ' ' + $$[$0];
break;
case 27: case 29:
this.$=$$[$0-3] + ' ' + $$[$0-2] + ' ' + $$[$0-1] + ' ' + $$[$0];
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:$V1,12:$V2,13:$V3,14:$V4,15:$V5,16:$V6,17:$V7,18:16,19:$V8,21:$V9},o($V0,[2,7],{1:[2,1]}),o($V0,[2,3]),{9:19,11:$V1,12:$V2,13:$V3,14:$V4,15:$V5,16:$V6,17:$V7,18:16,19:$V8,21:$V9},o($V0,[2,5]),o($V0,[2,6]),o($V0,[2,8]),o($V0,[2,9]),o($V0,[2,10]),o($V0,[2,11]),o($V0,[2,12]),o($V0,[2,13]),o($V0,[2,14]),o($V0,[2,15]),{20:[1,20]},{22:[1,21],24:[1,22]},o($V0,[2,4]),o($V0,[2,16]),o($V0,[2,17],{23:[1,23],24:[1,24]}),o($V0,[2,23],{22:[1,25]}),o($V0,[2,18],{24:[1,26]}),o($V0,[2,19]),o($V0,[2,21],{23:[1,27]}),o($V0,[2,20]),o($V0,[2,22])],
defaultActions: {},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 10;
break;
case 1:/* skip whitespace */
break;
case 2:/* skip comments */
break;
case 3:/* skip comments */
break;
case 4:this.begin("href");
break;
case 5:this.popState();
break;
case 6:return 24;
break;
case 7:this.begin("callbackname");
break;
case 8:this.popState();
break;
case 9:this.popState(); this.begin("callbackargs");
break;
case 10:return 22;
break;
case 11:this.popState();
break;
case 12:return 23;
break;
case 13:this.begin("click");
break;
case 14:this.popState();
break;
case 15:return 21;
break;
case 16:return 4;
break;
case 17:return 11;
break;
case 18:return 12;
break;
case 19:return 13;
break;
case 20:return 14;
break;
case 21:return 15;
break;
case 22:return 'date';
break;
case 23:return 16;
break;
case 24:return 17;
break;
case 25:return 19;
break;
case 26:return 20;
break;
case 27:return ':';
break;
case 28:return 6;
break;
case 29:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"callbackargs":{"rules":[11,12],"inclusive":false},"callbackname":{"rules":[8,9,10],"inclusive":false},"href":{"rules":[5,6],"inclusive":false},"click":{"rules":[14,15],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,7,13,16,17,18,19,20,21,22,23,24,25,26,27,28,29],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/git/gitGraphAst.js":
/*!*****************************************!*\
  !*** ./src/diagrams/git/gitGraphAst.js ***!
  \*****************************************/
/*! exports provided: setDirection, setOptions, getOptions, commit, branch, merge, checkout, reset, prettyPrint, clear, getBranchesAsObjArray, getBranches, getCommits, getCommitsArray, getCurrentBranch, getDirection, getHead, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDirection", function() { return setDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setOptions", function() { return setOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getOptions", function() { return getOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "commit", function() { return commit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "branch", function() { return branch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "merge", function() { return merge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "checkout", function() { return checkout; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reset", function() { return reset; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prettyPrint", function() { return prettyPrint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBranchesAsObjArray", function() { return getBranchesAsObjArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBranches", function() { return getBranches; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCommits", function() { return getCommits; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCommitsArray", function() { return getCommitsArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentBranch", function() { return getCurrentBranch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDirection", function() { return getDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getHead", function() { return getHead; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");

var commits = {};
var head = null;
var branches = {
  master: head
};
var curBranch = 'master';
var direction = 'LR';
var seq = 0;

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function getId() {
  return makeid(7);
}

function isfastforwardable(currentCommit, otherCommit) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Entering isfastforwardable:', currentCommit.id, otherCommit.id);

  while (currentCommit.seq <= otherCommit.seq && currentCommit !== otherCommit) {
    // only if other branch has more commits
    if (otherCommit.parent == null) break;

    if (Array.isArray(otherCommit.parent)) {
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('In merge commit:', otherCommit.parent);
      return isfastforwardable(currentCommit, commits[otherCommit.parent[0]]) || isfastforwardable(currentCommit, commits[otherCommit.parent[1]]);
    } else {
      otherCommit = commits[otherCommit.parent];
    }
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(currentCommit.id, otherCommit.id);
  return currentCommit.id === otherCommit.id;
}

function isReachableFrom(currentCommit, otherCommit) {
  var currentSeq = currentCommit.seq;
  var otherSeq = otherCommit.seq;
  if (currentSeq > otherSeq) return isfastforwardable(otherCommit, currentCommit);
  return false;
}

function uniqBy(list, fn) {
  var recordMap = Object.create(null);
  return list.reduce(function (out, item) {
    var key = fn(item);

    if (!recordMap[key]) {
      recordMap[key] = true;
      out.push(item);
    }

    return out;
  }, []);
}

var setDirection = function setDirection(dir) {
  direction = dir;
};
var options = {};
var setOptions = function setOptions(rawOptString) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('options str', rawOptString);
  rawOptString = rawOptString && rawOptString.trim();
  rawOptString = rawOptString || '{}';

  try {
    options = JSON.parse(rawOptString);
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].error('error while parsing gitGraph options', e.message);
  }
};
var getOptions = function getOptions() {
  return options;
};
var commit = function commit(msg) {
  var commit = {
    id: getId(),
    message: msg,
    seq: seq++,
    parent: head == null ? null : head.id
  };
  head = commit;
  commits[commit.id] = commit;
  branches[curBranch] = commit.id;
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('in pushCommit ' + commit.id);
};
var branch = function branch(name) {
  branches[name] = head != null ? head.id : null;
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('in createBranch');
};
var merge = function merge(otherBranch) {
  var currentCommit = commits[branches[curBranch]];
  var otherCommit = commits[branches[otherBranch]];

  if (isReachableFrom(currentCommit, otherCommit)) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Already merged');
    return;
  }

  if (isfastforwardable(currentCommit, otherCommit)) {
    branches[curBranch] = branches[otherBranch];
    head = commits[branches[curBranch]];
  } else {
    // create merge commit
    var _commit = {
      id: getId(),
      message: 'merged branch ' + otherBranch + ' into ' + curBranch,
      seq: seq++,
      parent: [head == null ? null : head.id, branches[otherBranch]]
    };
    head = _commit;
    commits[_commit.id] = _commit;
    branches[curBranch] = _commit.id;
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(branches);
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('in mergeBranch');
};
var checkout = function checkout(branch) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('in checkout');
  curBranch = branch;
  var id = branches[curBranch];
  head = commits[id];
};
var reset = function reset(commitRef) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('in reset', commitRef);
  var ref = commitRef.split(':')[0];
  var parentCount = parseInt(commitRef.split(':')[1]);
  var commit = ref === 'HEAD' ? head : commits[branches[ref]];
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(commit, parentCount);

  while (parentCount > 0) {
    commit = commits[commit.parent];
    parentCount--;

    if (!commit) {
      var err = 'Critical error - unique parent commit not found during reset';
      _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].error(err);
      throw err;
    }
  }

  head = commit;
  branches[curBranch] = commit.id;
};

function upsert(arr, key, newval) {
  var index = arr.indexOf(key);

  if (index === -1) {
    arr.push(newval);
  } else {
    arr.splice(index, 1, newval);
  }
}

function prettyPrintCommitHistory(commitArr) {
  var commit = commitArr.reduce(function (out, commit) {
    if (out.seq > commit.seq) return out;
    return commit;
  }, commitArr[0]);
  var line = '';
  commitArr.forEach(function (c) {
    if (c === commit) {
      line += '\t*';
    } else {
      line += '\t|';
    }
  });
  var label = [line, commit.id, commit.seq];

  for (var _branch in branches) {
    if (branches[_branch] === commit.id) label.push(_branch);
  }

  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(label.join(' '));

  if (Array.isArray(commit.parent)) {
    var newCommit = commits[commit.parent[0]];
    upsert(commitArr, commit, newCommit);
    commitArr.push(commits[commit.parent[1]]);
  } else if (commit.parent == null) {
    return;
  } else {
    var nextCommit = commits[commit.parent];
    upsert(commitArr, commit, nextCommit);
  }

  commitArr = uniqBy(commitArr, function (c) {
    return c.id;
  });
  prettyPrintCommitHistory(commitArr);
}

var prettyPrint = function prettyPrint() {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(commits);
  var node = getCommitsArray()[0];
  prettyPrintCommitHistory([node]);
};
var clear = function clear() {
  commits = {};
  head = null;
  branches = {
    master: head
  };
  curBranch = 'master';
  seq = 0;
};
var getBranchesAsObjArray = function getBranchesAsObjArray() {
  var branchArr = [];

  for (var _branch2 in branches) {
    branchArr.push({
      name: _branch2,
      commit: commits[branches[_branch2]]
    });
  }

  return branchArr;
};
var getBranches = function getBranches() {
  return branches;
};
var getCommits = function getCommits() {
  return commits;
};
var getCommitsArray = function getCommitsArray() {
  var commitArr = Object.keys(commits).map(function (key) {
    return commits[key];
  });
  commitArr.forEach(function (o) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug(o.id);
  });
  commitArr.sort(function (a, b) {
    return b.seq - a.seq;
  });
  return commitArr;
};
var getCurrentBranch = function getCurrentBranch() {
  return curBranch;
};
var getDirection = function getDirection() {
  return direction;
};
var getHead = function getHead() {
  return head;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setDirection: setDirection,
  setOptions: setOptions,
  getOptions: getOptions,
  commit: commit,
  branch: branch,
  merge: merge,
  checkout: checkout,
  reset: reset,
  prettyPrint: prettyPrint,
  clear: clear,
  getBranchesAsObjArray: getBranchesAsObjArray,
  getBranches: getBranches,
  getCommits: getCommits,
  getCommitsArray: getCommitsArray,
  getCurrentBranch: getCurrentBranch,
  getDirection: getDirection,
  getHead: getHead
});

/***/ }),

/***/ "./src/diagrams/git/gitGraphRenderer.js":
/*!**********************************************!*\
  !*** ./src/diagrams/git/gitGraphRenderer.js ***!
  \**********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./gitGraphAst */ "./src/diagrams/git/gitGraphAst.js");
/* harmony import */ var _parser_gitGraph__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/gitGraph */ "./src/diagrams/git/parser/gitGraph.jison");
/* harmony import */ var _parser_gitGraph__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_parser_gitGraph__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");





var allCommitsDict = {};
var branchNum;
var config = {
  nodeSpacing: 150,
  nodeFillColor: 'yellow',
  nodeStrokeWidth: 2,
  nodeStrokeColor: 'grey',
  lineStrokeWidth: 4,
  branchOffset: 50,
  lineColor: 'grey',
  leftMargin: 50,
  branchColors: ['#442f74', '#983351', '#609732', '#AA9A39'],
  nodeRadius: 10,
  nodeLabel: {
    width: 75,
    height: 100,
    x: -25,
    y: 0
  }
};
var apiConfig = {};
var setConf = function setConf(c) {
  apiConfig = c;
};

function svgCreateDefs(svg) {
  svg.append('defs').append('g').attr('id', 'def-commit').append('circle').attr('r', config.nodeRadius).attr('cx', 0).attr('cy', 0);
  svg.select('#def-commit').append('foreignObject').attr('width', config.nodeLabel.width).attr('height', config.nodeLabel.height).attr('x', config.nodeLabel.x).attr('y', config.nodeLabel.y).attr('class', 'node-label').attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility').append('p').html('');
}

function svgDrawLine(svg, points, colorIdx, interpolate) {
  var curve = Object(_utils__WEBPACK_IMPORTED_MODULE_4__["interpolateToCurve"])(interpolate, d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var color = config.branchColors[colorIdx % config.branchColors.length];
  var lineGen = Object(d3__WEBPACK_IMPORTED_MODULE_0__["line"])().x(function (d) {
    return Math.round(d.x);
  }).y(function (d) {
    return Math.round(d.y);
  }).curve(curve);
  svg.append('svg:path').attr('d', lineGen(points)).style('stroke', color).style('stroke-width', config.lineStrokeWidth).style('fill', 'none');
} // Pass in the element and its pre-transform coords


function getElementCoords(element, coords) {
  coords = coords || element.node().getBBox();
  var ctm = element.node().getCTM();
  var xn = ctm.e + coords.x * ctm.a;
  var yn = ctm.f + coords.y * ctm.d;
  return {
    left: xn,
    top: yn,
    width: coords.width,
    height: coords.height
  };
}

function svgDrawLineForCommits(svg, fromId, toId, direction, color) {
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('svgDrawLineForCommits: ', fromId, toId);
  var fromBbox = getElementCoords(svg.select('#node-' + fromId + ' circle'));
  var toBbox = getElementCoords(svg.select('#node-' + toId + ' circle'));

  switch (direction) {
    case 'LR':
      // (toBbox)
      //  +--------
      //          + (fromBbox)
      if (fromBbox.left - toBbox.left > config.nodeSpacing) {
        var lineStart = {
          x: fromBbox.left - config.nodeSpacing,
          y: toBbox.top + toBbox.height / 2
        };
        var lineEnd = {
          x: toBbox.left + toBbox.width,
          y: toBbox.top + toBbox.height / 2
        };
        svgDrawLine(svg, [lineStart, lineEnd], color, 'linear');
        svgDrawLine(svg, [{
          x: fromBbox.left,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: lineStart.y
        }, lineStart], color);
      } else {
        svgDrawLine(svg, [{
          x: fromBbox.left,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: toBbox.top + toBbox.height / 2
        }, {
          x: toBbox.left + toBbox.width,
          y: toBbox.top + toBbox.height / 2
        }], color);
      }

      break;

    case 'BT':
      //      +           (fromBbox)
      //      |
      //      |
      //              +   (toBbox)
      if (toBbox.top - fromBbox.top > config.nodeSpacing) {
        var _lineStart = {
          x: toBbox.left + toBbox.width / 2,
          y: fromBbox.top + fromBbox.height + config.nodeSpacing
        };
        var _lineEnd = {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top
        };
        svgDrawLine(svg, [_lineStart, _lineEnd], color, 'linear');
        svgDrawLine(svg, [{
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height
        }, {
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height + config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: _lineStart.y - config.nodeSpacing / 2
        }, _lineStart], color);
      } else {
        svgDrawLine(svg, [{
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height
        }, {
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top - config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top
        }], color);
      }

      break;
  }
}

function cloneNode(svg, selector) {
  return svg.select(selector).node().cloneNode(true);
}

function renderCommitHistory(svg, commitid, branches, direction) {
  var commit;
  var numCommits = Object.keys(allCommitsDict).length;

  if (typeof commitid === 'string') {
    do {
      commit = allCommitsDict[commitid];
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('in renderCommitHistory', commit.id, commit.seq);

      if (svg.select('#node-' + commitid).size() > 0) {
        return;
      }

      svg.append(function () {
        return cloneNode(svg, '#def-commit');
      }).attr('class', 'commit').attr('id', function () {
        return 'node-' + commit.id;
      }).attr('transform', function () {
        switch (direction) {
          case 'LR':
            return 'translate(' + (commit.seq * config.nodeSpacing + config.leftMargin) + ', ' + branchNum * config.branchOffset + ')';

          case 'BT':
            return 'translate(' + (branchNum * config.branchOffset + config.leftMargin) + ', ' + (numCommits - commit.seq) * config.nodeSpacing + ')';
        }
      }).attr('fill', config.nodeFillColor).attr('stroke', config.nodeStrokeColor).attr('stroke-width', config.nodeStrokeWidth);
      var branch = void 0;

      for (var branchName in branches) {
        if (branches[branchName].commit === commit) {
          branch = branches[branchName];
          break;
        }
      }

      if (branch) {
        _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('found branch ', branch.name);
        svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'branch-label').text(branch.name + ', ');
      }

      svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'commit-id').text(commit.id);

      if (commit.message !== '' && direction === 'BT') {
        svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'commit-msg').text(', ' + commit.message);
      }

      commitid = commit.parent;
    } while (commitid && allCommitsDict[commitid]);
  }

  if (Array.isArray(commitid)) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('found merge commmit', commitid);
    renderCommitHistory(svg, commitid[0], branches, direction);
    branchNum++;
    renderCommitHistory(svg, commitid[1], branches, direction);
    branchNum--;
  }
}

function renderLines(svg, commit, direction, branchColor) {
  branchColor = branchColor || 0;

  while (commit.seq > 0 && !commit.lineDrawn) {
    if (typeof commit.parent === 'string') {
      svgDrawLineForCommits(svg, commit.id, commit.parent, direction, branchColor);
      commit.lineDrawn = true;
      commit = allCommitsDict[commit.parent];
    } else if (Array.isArray(commit.parent)) {
      svgDrawLineForCommits(svg, commit.id, commit.parent[0], direction, branchColor);
      svgDrawLineForCommits(svg, commit.id, commit.parent[1], direction, branchColor + 1);
      renderLines(svg, allCommitsDict[commit.parent[1]], direction, branchColor + 1);
      commit.lineDrawn = true;
      commit = allCommitsDict[commit.parent[0]];
    }
  }
}

var draw = function draw(txt, id, ver) {
  try {
    var parser = _parser_gitGraph__WEBPACK_IMPORTED_MODULE_2___default.a.parser;
    parser.yy = _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__["default"];
    parser.yy.clear();
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('in gitgraph renderer', txt + '\n', 'id:', id, ver); // Parse the graph definition

    parser.parse(txt + '\n');
    config = Object.assign(config, apiConfig, _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__["default"].getOptions());
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('effective options', config);
    var direction = _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__["default"].getDirection();
    allCommitsDict = _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__["default"].getCommits();
    var branches = _gitGraphAst__WEBPACK_IMPORTED_MODULE_1__["default"].getBranchesAsObjArray();

    if (direction === 'BT') {
      config.nodeLabel.x = branches.length * config.branchOffset;
      config.nodeLabel.width = '100%';
      config.nodeLabel.y = -1 * 2 * config.nodeRadius;
    }

    var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id=\"".concat(id, "\"]"));
    svgCreateDefs(svg);
    branchNum = 1;

    for (var branch in branches) {
      var v = branches[branch];
      renderCommitHistory(svg, v.commit.id, branches, direction);
      renderLines(svg, v.commit, direction);
      branchNum++;
    }

    svg.attr('height', function () {
      if (direction === 'BT') return Object.keys(allCommitsDict).length * config.nodeSpacing;
      return (branches.length + 1) * config.branchOffset;
    });
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error('Error while rendering gitgraph');
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/git/parser/gitGraph.jison":
/*!************************************************!*\
  !*** ./src/diagrams/git/parser/gitGraph.jison ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,3],$V1=[1,7],$V2=[7,12,15,17,19,20,21],$V3=[7,11,12,15,17,19,20,21],$V4=[2,20],$V5=[1,32];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"GG":4,":":5,"document":6,"EOF":7,"DIR":8,"options":9,"body":10,"OPT":11,"NL":12,"line":13,"statement":14,"COMMIT":15,"commit_arg":16,"BRANCH":17,"ID":18,"CHECKOUT":19,"MERGE":20,"RESET":21,"reset_arg":22,"STR":23,"HEAD":24,"reset_parents":25,"CARET":26,"$accept":0,"$end":1},
terminals_: {2:"error",4:"GG",5:":",7:"EOF",8:"DIR",11:"OPT",12:"NL",15:"COMMIT",17:"BRANCH",18:"ID",19:"CHECKOUT",20:"MERGE",21:"RESET",23:"STR",24:"HEAD",26:"CARET"},
productions_: [0,[3,4],[3,5],[6,0],[6,2],[9,2],[9,1],[10,0],[10,2],[13,2],[13,1],[14,2],[14,2],[14,2],[14,2],[14,2],[16,0],[16,1],[22,2],[22,2],[25,0],[25,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2:
yy.setDirection($$[$0-3]); return $$[$0-1];
break;
case 4:
 yy.setOptions($$[$0-1]); this.$ = $$[$0]
break;
case 5:
$$[$0-1] +=$$[$0]; this.$=$$[$0-1]
break;
case 7:
this.$ = []
break;
case 8:
$$[$0-1].push($$[$0]); this.$=$$[$0-1];
break;
case 9:
this.$ =$$[$0-1]
break;
case 11:
yy.commit($$[$0])
break;
case 12:
yy.branch($$[$0])
break;
case 13:
yy.checkout($$[$0])
break;
case 14:
yy.merge($$[$0])
break;
case 15:
yy.reset($$[$0])
break;
case 16:
this.$ = ""
break;
case 17:
this.$=$$[$0]
break;
case 18:
this.$ = $$[$0-1]+ ":" + $$[$0] 
break;
case 19:
this.$ = $$[$0-1]+ ":"  + yy.count; yy.count = 0
break;
case 20:
yy.count = 0
break;
case 21:
 yy.count += 1 
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},{5:[1,3],8:[1,4]},{6:5,7:$V0,9:6,12:$V1},{5:[1,8]},{7:[1,9]},o($V2,[2,7],{10:10,11:[1,11]}),o($V3,[2,6]),{6:12,7:$V0,9:6,12:$V1},{1:[2,1]},{7:[2,4],12:[1,15],13:13,14:14,15:[1,16],17:[1,17],19:[1,18],20:[1,19],21:[1,20]},o($V3,[2,5]),{7:[1,21]},o($V2,[2,8]),{12:[1,22]},o($V2,[2,10]),{12:[2,16],16:23,23:[1,24]},{18:[1,25]},{18:[1,26]},{18:[1,27]},{18:[1,30],22:28,24:[1,29]},{1:[2,2]},o($V2,[2,9]),{12:[2,11]},{12:[2,17]},{12:[2,12]},{12:[2,13]},{12:[2,14]},{12:[2,15]},{12:$V4,25:31,26:$V5},{12:$V4,25:33,26:$V5},{12:[2,18]},{12:$V4,25:34,26:$V5},{12:[2,19]},{12:[2,21]}],
defaultActions: {9:[2,1],21:[2,2],23:[2,11],24:[2,17],25:[2,12],26:[2,13],27:[2,14],28:[2,15],31:[2,18],33:[2,19],34:[2,21]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 12;
break;
case 1:/* skip all whitespace */
break;
case 2:/* skip comments */
break;
case 3:/* skip comments */
break;
case 4:return 4;
break;
case 5:return 15;
break;
case 6:return 17;
break;
case 7:return 20;
break;
case 8:return 21;
break;
case 9:return 19;
break;
case 10:return 8;
break;
case 11:return 8;
break;
case 12:return 5;
break;
case 13:return 26
break;
case 14:this.begin("options");
break;
case 15:this.popState();
break;
case 16:return 11;
break;
case 17:this.begin("string");
break;
case 18:this.popState();
break;
case 19:return 23;
break;
case 20:return 18;
break;
case 21:return 7;
break;
}
},
rules: [/^(?:(\r?\n)+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:gitGraph\b)/i,/^(?:commit\b)/i,/^(?:branch\b)/i,/^(?:merge\b)/i,/^(?:reset\b)/i,/^(?:checkout\b)/i,/^(?:LR\b)/i,/^(?:BT\b)/i,/^(?::)/i,/^(?:\^)/i,/^(?:options\r?\n)/i,/^(?:end\r?\n)/i,/^(?:[^\n]+\r?\n)/i,/^(?:["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[a-zA-Z][-_\.a-zA-Z0-9]*[-_a-zA-Z0-9])/i,/^(?:$)/i],
conditions: {"options":{"rules":[15,16],"inclusive":false},"string":{"rules":[18,19],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,17,20,21],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/info/infoDb.js":
/*!*************************************!*\
  !*** ./src/diagrams/info/infoDb.js ***!
  \*************************************/
/*! exports provided: setMessage, getMessage, setInfo, getInfo, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setMessage", function() { return setMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMessage", function() { return getMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setInfo", function() { return setInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getInfo", function() { return getInfo; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by knut on 15-01-14.
 */

var message = '';
var info = false;
var setMessage = function setMessage(txt) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Setting message to: ' + txt);
  message = txt;
};
var getMessage = function getMessage() {
  return message;
};
var setInfo = function setInfo(inf) {
  info = inf;
};
var getInfo = function getInfo() {
  return info;
}; // export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }

/* harmony default export */ __webpack_exports__["default"] = ({
  setMessage: setMessage,
  getMessage: getMessage,
  setInfo: setInfo,
  getInfo: getInfo // parseError

});

/***/ }),

/***/ "./src/diagrams/info/infoRenderer.js":
/*!*******************************************!*\
  !*** ./src/diagrams/info/infoRenderer.js ***!
  \*******************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _infoDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./infoDb */ "./src/diagrams/info/infoDb.js");
/* harmony import */ var _parser_info__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/info */ "./src/diagrams/info/parser/info.jison");
/* harmony import */ var _parser_info__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_parser_info__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by knut on 14-12-11.
 */




var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(txt, id, ver) {
  try {
    var parser = _parser_info__WEBPACK_IMPORTED_MODULE_2___default.a.parser;
    parser.yy = _infoDb__WEBPACK_IMPORTED_MODULE_1__["default"];
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Renering info diagram\n' + txt); // Parse the graph definition

    parser.parse(txt);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Parsed info diagram'); // Fetch the default direction, use TD if none was found

    var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + id);
    var g = svg.append('g');
    g.append('text') // text label for the x axis
    .attr('x', 100).attr('y', 40).attr('class', 'version').attr('font-size', '32px').style('text-anchor', 'middle').text('v ' + ver);
    svg.attr('height', 100);
    svg.attr('width', 400); // svg.attr('viewBox', '0 0 300 150');
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error('Error while rendering info diagram');
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/info/parser/info.jison":
/*!*********************************************!*\
  !*** ./src/diagrams/info/parser/info.jison ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,9,10];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"info":4,"document":5,"EOF":6,"line":7,"statement":8,"NL":9,"showInfo":10,"$accept":0,"$end":1},
terminals_: {2:"error",4:"info",6:"EOF",9:"NL",10:"showInfo"},
productions_: [0,[3,3],[5,0],[5,2],[7,1],[7,1],[8,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return yy; 
break;
case 4:
 
break;
case 6:
 yy.setInfo(true);  
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:6,9:[1,7],10:[1,8]},{1:[2,1]},o($V0,[2,3]),o($V0,[2,4]),o($V0,[2,5]),o($V0,[2,6])],
defaultActions: {4:[2,1]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
	// Pre-lexer code can go here

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 4    ;
break;
case 1:return 9      ;
break;
case 2:return 'space';
break;
case 3:return 10;
break;
case 4:return 6     ;
break;
case 5:return 'TXT' ;
break;
}
},
rules: [/^(?:info\b)/i,/^(?:[\s\n\r]+)/i,/^(?:[\s]+)/i,/^(?:showInfo\b)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/pie/parser/pie.jison":
/*!*******************************************!*\
  !*** ./src/diagrams/pie/parser/pie.jison ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,9,10,12];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"pie":4,"document":5,"EOF":6,"line":7,"statement":8,"NL":9,"STR":10,"VALUE":11,"title":12,"$accept":0,"$end":1},
terminals_: {2:"error",4:"pie",6:"EOF",9:"NL",10:"STR",11:"VALUE",12:"title"},
productions_: [0,[3,3],[5,0],[5,2],[7,1],[7,1],[8,2],[8,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 4:
 
break;
case 6:

		/*console.log('str:'+$$[$0-1]+' value: '+$$[$0])*/
		yy.addSection($$[$0-1],yy.cleanupValue($$[$0]));  
break;
case 7:
yy.setTitle($$[$0].substr(6));this.$=$$[$0].substr(6);
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:6,9:[1,7],10:[1,8],12:[1,9]},{1:[2,1]},o($V0,[2,3]),o($V0,[2,4]),o($V0,[2,5]),{11:[1,10]},o($V0,[2,7]),o($V0,[2,6])],
defaultActions: {4:[2,1]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
	// Pre-lexer code can go here

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:/* skip whitespace */
break;
case 2:return 4    ;
break;
case 3:return 9      ;
break;
case 4:return 'space';
break;
case 5:return 12;
break;
case 6:/*console.log('begin str');*/this.begin("string");
break;
case 7:/*console.log('pop-state');*/this.popState();
break;
case 8:/*console.log('ending string')*/return "STR";
break;
case 9:return "VALUE";
break;
case 10:return 6     ;
break;
}
},
rules: [/^(?:%%[^\n]*)/i,/^(?:\s+)/i,/^(?:pie\b)/i,/^(?:[\s\n\r]+)/i,/^(?:[\s]+)/i,/^(?:title\s[^#\n;]+)/i,/^(?:["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?::[\s]*[\d]+(?:\.[\d]+)?)/i,/^(?:$)/i],
conditions: {"string":{"rules":[7,8],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,9,10],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/pie/pieDb.js":
/*!***********************************!*\
  !*** ./src/diagrams/pie/pieDb.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 *
 */

var sections = {};
var title = '';

var addSection = function addSection(id, value) {
  if (typeof sections[id] === 'undefined') {
    sections[id] = value;
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Added new section :', id);
  }
};

var getSections = function getSections() {
  return sections;
};

var setTitle = function setTitle(txt) {
  title = txt;
};

var getTitle = function getTitle() {
  return title;
};

var cleanupValue = function cleanupValue(value) {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

var clear = function clear() {
  sections = {};
  title = '';
}; // export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }


/* harmony default export */ __webpack_exports__["default"] = ({
  addSection: addSection,
  getSections: getSections,
  cleanupValue: cleanupValue,
  clear: clear,
  setTitle: setTitle,
  getTitle: getTitle // parseError

});

/***/ }),

/***/ "./src/diagrams/pie/pieRenderer.js":
/*!*****************************************!*\
  !*** ./src/diagrams/pie/pieRenderer.js ***!
  \*****************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _pieDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./pieDb */ "./src/diagrams/pie/pieDb.js");
/* harmony import */ var _parser_pie__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/pie */ "./src/diagrams/pie/parser/pie.jison");
/* harmony import */ var _parser_pie__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_parser_pie__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by AshishJ on 11-09-2019.
 */




var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a Pie Chart with the data given in text.
 * @param text
 * @param id
 */

var w;
var draw = function draw(txt, id) {
  try {
    var parser = _parser_pie__WEBPACK_IMPORTED_MODULE_2___default.a.parser;
    parser.yy = _pieDb__WEBPACK_IMPORTED_MODULE_1__["default"];
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Rendering info diagram\n' + txt); // Parse the Pie Chart definition

    parser.yy.clear();
    parser.parse(txt);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Parsed info diagram');
    var elem = document.getElementById(id);
    w = elem.parentElement.offsetWidth;

    if (typeof w === 'undefined') {
      w = 1200;
    }

    if (typeof conf.useWidth !== 'undefined') {
      w = conf.useWidth;
    }

    var h = 450;
    elem.setAttribute('height', '100%'); // Set viewBox

    elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h); // Fetch the default direction, use TD if none was found

    var width = w; // 450

    var height = 450;
    var margin = 40;
    var legendRectSize = 18;
    var legendSpacing = 4;
    var radius = Math.min(width, height) / 2 - margin;
    var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + id).append('svg').attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    var data = _pieDb__WEBPACK_IMPORTED_MODULE_1__["default"].getSections();
    var sum = 0;
    Object.keys(data).forEach(function (key) {
      sum += data[key];
    });
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info(data); // set the color scale

    var color = Object(d3__WEBPACK_IMPORTED_MODULE_0__["scaleOrdinal"])().domain(data).range(d3__WEBPACK_IMPORTED_MODULE_0__["schemeSet2"]); // Compute the position of each group on the pie:

    var pie = Object(d3__WEBPACK_IMPORTED_MODULE_0__["pie"])().value(function (d) {
      return d.value;
    });
    var dataReady = pie(Object(d3__WEBPACK_IMPORTED_MODULE_0__["entries"])(data)); // shape helper to build arcs:

    var arcGenerator = Object(d3__WEBPACK_IMPORTED_MODULE_0__["arc"])().innerRadius(0).outerRadius(radius); // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.

    svg.selectAll('mySlices').data(dataReady).enter().append('path').attr('d', arcGenerator).attr('fill', function (d) {
      return color(d.data.key);
    }).attr('stroke', 'black').style('stroke-width', '2px').style('opacity', 0.7); // Now add the Percentage. Use the centroid method to get the best coordinates

    svg.selectAll('mySlices').data(dataReady).enter().append('text').text(function (d) {
      return (d.data.value / sum * 100).toFixed(0) + '%';
    }).attr('transform', function (d) {
      return 'translate(' + arcGenerator.centroid(d) + ')';
    }).style('text-anchor', 'middle').attr('class', 'slice').style('font-size', 17);
    svg.append('text').text(parser.yy.getTitle()).attr('x', 0).attr('y', -(h - 50) / 2).attr('class', 'pieTitleText'); //Add the slegend/annotations for each section

    var legend = svg.selectAll('.legend').data(color.domain()).enter().append('g').attr('class', 'legend').attr('transform', function (d, i) {
      var height = legendRectSize + legendSpacing;
      var offset = height * color.domain().length / 2;
      var horz = 12 * legendRectSize;
      var vert = i * height - offset;
      return 'translate(' + horz + ',' + vert + ')';
    });
    legend.append('rect').attr('width', legendRectSize).attr('height', legendRectSize).style('fill', color).style('stroke', color);
    legend.append('text').attr('x', legendRectSize + legendSpacing).attr('y', legendRectSize - legendSpacing).text(function (d) {
      return d;
    });
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error('Error while rendering info diagram');
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/sequence/parser/sequenceDiagram.jison":
/*!************************************************************!*\
  !*** ./src/diagrams/sequence/parser/sequenceDiagram.jison ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,2],$V1=[1,3],$V2=[1,5],$V3=[1,7],$V4=[2,5],$V5=[1,15],$V6=[1,17],$V7=[1,18],$V8=[1,20],$V9=[1,21],$Va=[1,22],$Vb=[1,24],$Vc=[1,25],$Vd=[1,26],$Ve=[1,27],$Vf=[1,28],$Vg=[1,29],$Vh=[1,32],$Vi=[1,33],$Vj=[1,36],$Vk=[1,4,5,16,21,22,23,25,27,28,29,30,31,33,35,36,37,48,56],$Vl=[1,44],$Vm=[4,5,16,21,22,23,25,27,28,29,30,31,33,37,48,56],$Vn=[4,5,16,21,22,23,25,27,28,29,30,31,33,36,37,48,56],$Vo=[4,5,16,21,22,23,25,27,28,29,30,31,33,35,37,48,56],$Vp=[46,47,48],$Vq=[1,4,5,7,16,21,22,23,25,27,28,29,30,31,33,35,36,37,48,56];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"SPACE":4,"NL":5,"directive":6,"SD":7,"document":8,"line":9,"statement":10,"openDirective":11,"typeDirective":12,"closeDirective":13,":":14,"argDirective":15,"participant":16,"actor":17,"AS":18,"restOfLine":19,"signal":20,"autonumber":21,"activate":22,"deactivate":23,"note_statement":24,"title":25,"text2":26,"loop":27,"end":28,"rect":29,"opt":30,"alt":31,"else_sections":32,"par":33,"par_sections":34,"and":35,"else":36,"note":37,"placement":38,"over":39,"actor_pair":40,"spaceList":41,",":42,"left_of":43,"right_of":44,"signaltype":45,"+":46,"-":47,"ACTOR":48,"SOLID_OPEN_ARROW":49,"DOTTED_OPEN_ARROW":50,"SOLID_ARROW":51,"DOTTED_ARROW":52,"SOLID_CROSS":53,"DOTTED_CROSS":54,"TXT":55,"open_directive":56,"type_directive":57,"arg_directive":58,"close_directive":59,"$accept":0,"$end":1},
terminals_: {2:"error",4:"SPACE",5:"NL",7:"SD",14:":",16:"participant",18:"AS",19:"restOfLine",21:"autonumber",22:"activate",23:"deactivate",25:"title",27:"loop",28:"end",29:"rect",30:"opt",31:"alt",33:"par",35:"and",36:"else",37:"note",39:"over",42:",",43:"left_of",44:"right_of",46:"+",47:"-",48:"ACTOR",49:"SOLID_OPEN_ARROW",50:"DOTTED_OPEN_ARROW",51:"SOLID_ARROW",52:"DOTTED_ARROW",53:"SOLID_CROSS",54:"DOTTED_CROSS",55:"TXT",56:"open_directive",57:"type_directive",58:"arg_directive",59:"close_directive"},
productions_: [0,[3,2],[3,2],[3,2],[3,2],[8,0],[8,2],[9,2],[9,1],[9,1],[6,4],[6,6],[10,5],[10,3],[10,2],[10,1],[10,3],[10,3],[10,2],[10,3],[10,4],[10,4],[10,4],[10,4],[10,4],[10,1],[34,1],[34,4],[32,1],[32,4],[24,4],[24,4],[41,2],[41,1],[40,3],[40,1],[38,1],[38,1],[20,5],[20,5],[20,4],[17,1],[45,1],[45,1],[45,1],[45,1],[45,1],[45,1],[26,1],[11,1],[12,1],[15,1],[13,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 4:
 yy.apply($$[$0]);return $$[$0]; 
break;
case 5:
 this.$ = [] 
break;
case 6:
$$[$0-1].push($$[$0]);this.$ = $$[$0-1]
break;
case 7: case 8:
 this.$ = $$[$0] 
break;
case 9:
 this.$=[]; 
break;
case 12:
$$[$0-3].description=yy.parseMessage($$[$0-1]); this.$=$$[$0-3];
break;
case 13:
this.$=$$[$0-1];
break;
case 15:
yy.enableSequenceNumbers()
break;
case 16:
this.$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $$[$0-1]};
break;
case 17:
this.$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $$[$0-1]};
break;
case 19:
this.$=[{type:'setTitle', text:$$[$0-1]}]
break;
case 20:

		$$[$0-1].unshift({type: 'loopStart', loopText:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.LOOP_START});
		$$[$0-1].push({type: 'loopEnd', loopText:$$[$0-2], signalType: yy.LINETYPE.LOOP_END});
		this.$=$$[$0-1];
break;
case 21:

		$$[$0-1].unshift({type: 'rectStart', color:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.RECT_START });
		$$[$0-1].push({type: 'rectEnd', color:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.RECT_END });
		this.$=$$[$0-1];
break;
case 22:

		$$[$0-1].unshift({type: 'optStart', optText:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.OPT_START});
		$$[$0-1].push({type: 'optEnd', optText:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.OPT_END});
		this.$=$$[$0-1];
break;
case 23:

		// Alt start
		$$[$0-1].unshift({type: 'altStart', altText:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.ALT_START});
		// Content in alt is already in $$[$0-1]
		// End
		$$[$0-1].push({type: 'altEnd', signalType: yy.LINETYPE.ALT_END});
		this.$=$$[$0-1];
break;
case 24:

		// Parallel start
		$$[$0-1].unshift({type: 'parStart', parText:yy.parseMessage($$[$0-2]), signalType: yy.LINETYPE.PAR_START});
		// Content in par is already in $$[$0-1]
		// End
		$$[$0-1].push({type: 'parEnd', signalType: yy.LINETYPE.PAR_END});
		this.$=$$[$0-1];
break;
case 27:
 this.$ = $$[$0-3].concat([{type: 'and', parText:yy.parseMessage($$[$0-1]), signalType: yy.LINETYPE.PAR_AND}, $$[$0]]); 
break;
case 29:
 this.$ = $$[$0-3].concat([{type: 'else', altText:yy.parseMessage($$[$0-1]), signalType: yy.LINETYPE.ALT_ELSE}, $$[$0]]); 
break;
case 30:

		this.$ = [$$[$0-1], {type:'addNote', placement:$$[$0-2], actor:$$[$0-1].actor, text:$$[$0]}];
break;
case 31:

		// Coerce actor_pair into a [to, from, ...] array
		$$[$0-2] = [].concat($$[$0-1], $$[$0-1]).slice(0, 2);
		$$[$0-2][0] = $$[$0-2][0].actor;
		$$[$0-2][1] = $$[$0-2][1].actor;
		this.$ = [$$[$0-1], {type:'addNote', placement:yy.PLACEMENT.OVER, actor:$$[$0-2].slice(0, 2), text:$$[$0]}];
break;
case 34:
 this.$ = [$$[$0-2], $$[$0]]; 
break;
case 35:
 this.$ = $$[$0]; 
break;
case 36:
 this.$ = yy.PLACEMENT.LEFTOF; 
break;
case 37:
 this.$ = yy.PLACEMENT.RIGHTOF; 
break;
case 38:
 this.$ = [$$[$0-4],$$[$0-1],{type: 'addMessage', from:$$[$0-4].actor, to:$$[$0-1].actor, signalType:$$[$0-3], msg:$$[$0]},
	              {type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $$[$0-1]}
	             ]
break;
case 39:
 this.$ = [$$[$0-4],$$[$0-1],{type: 'addMessage', from:$$[$0-4].actor, to:$$[$0-1].actor, signalType:$$[$0-3], msg:$$[$0]},
	             {type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $$[$0-4]}
	             ]
break;
case 40:
 this.$ = [$$[$0-3],$$[$0-1],{type: 'addMessage', from:$$[$0-3].actor, to:$$[$0-1].actor, signalType:$$[$0-2], msg:$$[$0]}]
break;
case 41:
this.$={type: 'addActor', actor:$$[$0]}
break;
case 42:
 this.$ = yy.LINETYPE.SOLID_OPEN; 
break;
case 43:
 this.$ = yy.LINETYPE.DOTTED_OPEN; 
break;
case 44:
 this.$ = yy.LINETYPE.SOLID; 
break;
case 45:
 this.$ = yy.LINETYPE.DOTTED; 
break;
case 46:
 this.$ = yy.LINETYPE.SOLID_CROSS; 
break;
case 47:
 this.$ = yy.LINETYPE.DOTTED_CROSS; 
break;
case 48:
this.$ = yy.parseMessage($$[$0].trim().substring(1)) 
break;
case 49:
 yy.parseDirective('%%{', 'open_directive'); 
break;
case 50:
 yy.parseDirective($$[$0], 'type_directive'); 
break;
case 51:
 $$[$0] = $$[$0].trim().replace(/'/g, '"'); yy.parseDirective($$[$0], 'arg_directive'); 
break;
case 52:
 yy.parseDirective('}%%', 'close_directive', 'sequence'); 
break;
}
},
table: [{3:1,4:$V0,5:$V1,6:4,7:$V2,11:6,56:$V3},{1:[3]},{3:8,4:$V0,5:$V1,6:4,7:$V2,11:6,56:$V3},{3:9,4:$V0,5:$V1,6:4,7:$V2,11:6,56:$V3},{3:10,4:$V0,5:$V1,6:4,7:$V2,11:6,56:$V3},o([1,4,5,16,21,22,23,25,27,29,30,31,33,37,48,56],$V4,{8:11}),{12:12,57:[1,13]},{57:[2,49]},{1:[2,1]},{1:[2,2]},{1:[2,3]},{1:[2,4],4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,29:$Vd,30:$Ve,31:$Vf,33:$Vg,37:$Vh,48:$Vi,56:$V3},{13:34,14:[1,35],59:$Vj},o([14,59],[2,50]),o($Vk,[2,6]),{6:30,10:37,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,29:$Vd,30:$Ve,31:$Vf,33:$Vg,37:$Vh,48:$Vi,56:$V3},o($Vk,[2,8]),o($Vk,[2,9]),{17:38,48:$Vi},{5:[1,39]},o($Vk,[2,15]),{17:40,48:$Vi},{17:41,48:$Vi},{5:[1,42]},{26:43,55:$Vl},{19:[1,45]},{19:[1,46]},{19:[1,47]},{19:[1,48]},{19:[1,49]},o($Vk,[2,25]),{45:50,49:[1,51],50:[1,52],51:[1,53],52:[1,54],53:[1,55],54:[1,56]},{38:57,39:[1,58],43:[1,59],44:[1,60]},o([5,18,42,49,50,51,52,53,54,55],[2,41]),{5:[1,61]},{15:62,58:[1,63]},{5:[2,52]},o($Vk,[2,7]),{5:[1,65],18:[1,64]},o($Vk,[2,14]),{5:[1,66]},{5:[1,67]},o($Vk,[2,18]),{5:[1,68]},{5:[2,48]},o($Vm,$V4,{8:69}),o($Vm,$V4,{8:70}),o($Vm,$V4,{8:71}),o($Vn,$V4,{32:72,8:73}),o($Vo,$V4,{34:74,8:75}),{17:78,46:[1,76],47:[1,77],48:$Vi},o($Vp,[2,42]),o($Vp,[2,43]),o($Vp,[2,44]),o($Vp,[2,45]),o($Vp,[2,46]),o($Vp,[2,47]),{17:79,48:$Vi},{17:81,40:80,48:$Vi},{48:[2,36]},{48:[2,37]},o($Vq,[2,10]),{13:82,59:$Vj},{59:[2,51]},{19:[1,83]},o($Vk,[2,13]),o($Vk,[2,16]),o($Vk,[2,17]),o($Vk,[2,19]),{4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,28:[1,84],29:$Vd,30:$Ve,31:$Vf,33:$Vg,37:$Vh,48:$Vi,56:$V3},{4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,28:[1,85],29:$Vd,30:$Ve,31:$Vf,33:$Vg,37:$Vh,48:$Vi,56:$V3},{4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,28:[1,86],29:$Vd,30:$Ve,31:$Vf,33:$Vg,37:$Vh,48:$Vi,56:$V3},{28:[1,87]},{4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,28:[2,28],29:$Vd,30:$Ve,31:$Vf,33:$Vg,36:[1,88],37:$Vh,48:$Vi,56:$V3},{28:[1,89]},{4:$V5,5:$V6,6:30,9:14,10:16,11:6,16:$V7,17:31,20:19,21:$V8,22:$V9,23:$Va,24:23,25:$Vb,27:$Vc,28:[2,26],29:$Vd,30:$Ve,31:$Vf,33:$Vg,35:[1,90],37:$Vh,48:$Vi,56:$V3},{17:91,48:$Vi},{17:92,48:$Vi},{26:93,55:$Vl},{26:94,55:$Vl},{26:95,55:$Vl},{42:[1,96],55:[2,35]},{5:[1,97]},{5:[1,98]},o($Vk,[2,20]),o($Vk,[2,21]),o($Vk,[2,22]),o($Vk,[2,23]),{19:[1,99]},o($Vk,[2,24]),{19:[1,100]},{26:101,55:$Vl},{26:102,55:$Vl},{5:[2,40]},{5:[2,30]},{5:[2,31]},{17:103,48:$Vi},o($Vq,[2,11]),o($Vk,[2,12]),o($Vn,$V4,{8:73,32:104}),o($Vo,$V4,{8:75,34:105}),{5:[2,38]},{5:[2,39]},{55:[2,34]},{28:[2,29]},{28:[2,27]}],
defaultActions: {7:[2,49],8:[2,1],9:[2,2],10:[2,3],36:[2,52],44:[2,48],59:[2,36],60:[2,37],63:[2,51],93:[2,40],94:[2,30],95:[2,31],101:[2,38],102:[2,39],103:[2,34],104:[2,29],105:[2,27]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0: this.begin('OPEN_DIRECTIVE'); return 56; 
break;
case 1: this.begin('TYPE_DIRECTIVE'); return 57; 
break;
case 2: this.popState(); this.begin('ARG_DIRECTIVE'); return 14; 
break;
case 3: this.popState(); this.popState(); return 59; 
break;
case 4:return 58;
break;
case 5:return 5;
break;
case 6:/* skip all whitespace */
break;
case 7:/* skip same-line whitespace */
break;
case 8:/* skip comments */
break;
case 9:/* skip comments */
break;
case 10:/* skip comments */
break;
case 11: this.begin('ID'); return 16; 
break;
case 12: yy_.yytext = yy_.yytext.trim(); this.begin('ALIAS'); return 48; 
break;
case 13: this.popState(); this.popState(); this.begin('LINE'); return 18; 
break;
case 14: this.popState(); this.popState(); return 5; 
break;
case 15: this.begin('LINE'); return 27; 
break;
case 16: this.begin('LINE'); return 29; 
break;
case 17: this.begin('LINE'); return 30; 
break;
case 18: this.begin('LINE'); return 31; 
break;
case 19: this.begin('LINE'); return 36; 
break;
case 20: this.begin('LINE'); return 33; 
break;
case 21: this.begin('LINE'); return 35; 
break;
case 22: this.popState(); return 19; 
break;
case 23:return 28;
break;
case 24:return 43;
break;
case 25:return 44;
break;
case 26:return 39;
break;
case 27:return 37;
break;
case 28: this.begin('ID'); return 22; 
break;
case 29: this.begin('ID'); return 23; 
break;
case 30:return 25;
break;
case 31:return 7;
break;
case 32:return 21;
break;
case 33:return 42;
break;
case 34:return 5;
break;
case 35: yy_.yytext = yy_.yytext.trim(); return 48; 
break;
case 36:return 51;
break;
case 37:return 52;
break;
case 38:return 49;
break;
case 39:return 50;
break;
case 40:return 53;
break;
case 41:return 54;
break;
case 42:return 55;
break;
case 43:return 46;
break;
case 44:return 47;
break;
case 45:return 5;
break;
case 46:return 'INVALID';
break;
}
},
rules: [/^(?:%%\{)/i,/^(?:((?:(?!\}%%)[^:.])*))/i,/^(?::)/i,/^(?:\}%%)/i,/^(?:((?:(?!\}%%).|\n)*))/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:participant\b)/i,/^(?:[^\->:\n,;]+?(?=((?!\n)\s)+as(?!\n)\s|[#\n;]|$))/i,/^(?:as\b)/i,/^(?:(?:))/i,/^(?:loop\b)/i,/^(?:rect\b)/i,/^(?:opt\b)/i,/^(?:alt\b)/i,/^(?:else\b)/i,/^(?:par\b)/i,/^(?:and\b)/i,/^(?:(?:[:]?(?:no)?wrap)?[^#\n;]*)/i,/^(?:end\b)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:over\b)/i,/^(?:note\b)/i,/^(?:activate\b)/i,/^(?:deactivate\b)/i,/^(?:title\b)/i,/^(?:sequenceDiagram\b)/i,/^(?:autonumber\b)/i,/^(?:,)/i,/^(?:;)/i,/^(?:[^\+\->:\n,;]+)/i,/^(?:->>)/i,/^(?:-->>)/i,/^(?:->)/i,/^(?:-->)/i,/^(?:-[x])/i,/^(?:--[x])/i,/^(?::(?:(?:no)?wrap)?[^#\n;]+)/i,/^(?:\+)/i,/^(?:-)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"LINE":{"rules":[7,8,22],"inclusive":false},"ARG_DIRECTIVE":{"rules":[3,4,8],"inclusive":false},"TYPE_DIRECTIVE":{"rules":[2,3,8],"inclusive":false},"OPEN_DIRECTIVE":{"rules":[1,8],"inclusive":false},"ALIAS":{"rules":[7,8,13,14],"inclusive":false},"ID":{"rules":[7,8,12],"inclusive":false},"INITIAL":{"rules":[0,5,6,8,9,10,11,15,16,17,18,19,20,21,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/sequence/sequenceDb.js":
/*!*********************************************!*\
  !*** ./src/diagrams/sequence/sequenceDb.js ***!
  \*********************************************/
/*! exports provided: parseDirective, addActor, addMessage, addSignal, getMessages, getActors, getActor, getActorKeys, getTitle, getTitleWrapped, enableSequenceNumbers, showSequenceNumbers, setWrap, autoWrap, clear, parseMessage, LINETYPE, ARROWTYPE, PLACEMENT, addNote, setTitle, apply, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseDirective", function() { return parseDirective; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addActor", function() { return addActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMessage", function() { return addMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSignal", function() { return addSignal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMessages", function() { return getMessages; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActors", function() { return getActors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActor", function() { return getActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActorKeys", function() { return getActorKeys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitle", function() { return getTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitleWrapped", function() { return getTitleWrapped; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "enableSequenceNumbers", function() { return enableSequenceNumbers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showSequenceNumbers", function() { return showSequenceNumbers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setWrap", function() { return setWrap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "autoWrap", function() { return autoWrap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseMessage", function() { return parseMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LINETYPE", function() { return LINETYPE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ARROWTYPE", function() { return ARROWTYPE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLACEMENT", function() { return PLACEMENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addNote", function() { return addNote; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTitle", function() { return setTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "apply", function() { return apply; });
/* harmony import */ var _mermaidAPI__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../mermaidAPI */ "./src/mermaidAPI.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");




var prevActor = undefined;
var actors = {};
var messages = [];
var notes = [];
var title = '';
var titleWrapped = false;
var sequenceNumbersEnabled = false;
var wrapEnabled = false;
var parseDirective = function parseDirective(statement, context, type) {
  _mermaidAPI__WEBPACK_IMPORTED_MODULE_0__["default"].parseDirective(statement, context, type);
};
var addActor = function addActor(id, name, description) {
  // Don't allow description nulling
  var old = actors[id];
  if (old && name === old.name && description == null) return; // Don't allow null descriptions, either

  if (description == null || description.text == null) {
    description = {
      text: name,
      wrap: null
    };
  }

  actors[id] = {
    name: name,
    description: description.text,
    wrap: description.wrap === undefined && autoWrap() || !!description.wrap,
    prevActor: prevActor
  };

  if (prevActor && actors[prevActor]) {
    actors[prevActor].nextActor = id;
  }

  prevActor = id;
};

var activationCount = function activationCount(part) {
  var i;
  var count = 0;

  for (i = 0; i < messages.length; i++) {
    // console.warn(i, messages[i]);
    if (messages[i].type === LINETYPE.ACTIVE_START) {
      if (messages[i].from.actor === part) {
        count++;
      }
    }

    if (messages[i].type === LINETYPE.ACTIVE_END) {
      if (messages[i].from.actor === part) {
        count--;
      }
    }
  }

  return count;
};

var addMessage = function addMessage(idFrom, idTo, message, answer) {
  messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: message.wrap === undefined && autoWrap() || !!message.wrap,
    answer: answer
  });
};
var addSignal = function addSignal(idFrom, idTo) {
  var message = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    text: undefined,
    wrap: undefined
  };
  var messageType = arguments.length > 3 ? arguments[3] : undefined;

  if (messageType === LINETYPE.ACTIVE_END) {
    var cnt = activationCount(idFrom.actor);

    if (cnt < 1) {
      // Bail out as there is an activation signal from an inactive participant
      var error = new Error('Trying to inactivate an inactive participant (' + idFrom.actor + ')');
      error.hash = {
        text: '->>-',
        token: '->>-',
        line: '1',
        loc: {
          first_line: 1,
          last_line: 1,
          first_column: 1,
          last_column: 1
        },
        expected: ["'ACTIVE_PARTICIPANT'"]
      };
      throw error;
    }
  }

  messages.push({
    from: idFrom,
    to: idTo,
    message: message.text,
    wrap: message.wrap === undefined && autoWrap() || !!message.wrap,
    type: messageType
  });
  return true;
};
var getMessages = function getMessages() {
  return messages;
};
var getActors = function getActors() {
  return actors;
};
var getActor = function getActor(id) {
  return actors[id];
};
var getActorKeys = function getActorKeys() {
  return Object.keys(actors);
};
var getTitle = function getTitle() {
  return title;
};
var getTitleWrapped = function getTitleWrapped() {
  return titleWrapped;
};
var enableSequenceNumbers = function enableSequenceNumbers() {
  sequenceNumbersEnabled = true;
};
var showSequenceNumbers = function showSequenceNumbers() {
  return sequenceNumbersEnabled;
};
var setWrap = function setWrap(wrapSetting) {
  wrapEnabled = wrapSetting;
};
var autoWrap = function autoWrap() {
  return wrapEnabled;
};
var clear = function clear() {
  actors = {};
  messages = [];
};
var parseMessage = function parseMessage(str) {
  var _str = str.trim();

  var message = {
    text: _str.replace(/^[:]?(?:no)?wrap:/, '').trim(),
    wrap: _str.match(/^[:]?(?:no)?wrap:/) === null ? _common_common__WEBPACK_IMPORTED_MODULE_2__["default"].hasBreaks(_str) || autoWrap() : _str.match(/^[:]?wrap:/) !== null ? true : _str.match(/^[:]?nowrap:/) !== null ? false : autoWrap()
  };
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('parseMessage:', message);
  return message;
};
var LINETYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23
};
var ARROWTYPE = {
  FILLED: 0,
  OPEN: 1
};
var PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2
};
var addNote = function addNote(actor, placement, message) {
  var note = {
    actor: actor,
    placement: placement,
    message: message.text,
    wrap: message.wrap === undefined && autoWrap() || !!message.wrap
  }; // Coerce actor into a [to, from, ...] array

  var actors = [].concat(actor, actor);
  notes.push(note);
  messages.push({
    from: actors[0],
    to: actors[1],
    message: message.text,
    wrap: message.wrap === undefined && autoWrap() || !!message.wrap,
    type: LINETYPE.NOTE,
    placement: placement
  });
};
var setTitle = function setTitle(titleWrap) {
  title = titleWrap.text;
  titleWrapped = titleWrap.wrap === undefined && autoWrap() || !!titleWrap.wrap;
};
var apply = function apply(param) {
  if (param instanceof Array) {
    param.forEach(function (item) {
      apply(item);
    });
  } else {
    switch (param.type) {
      case 'addActor':
        addActor(param.actor, param.actor, param.description);
        break;

      case 'activeStart':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;

      case 'activeEnd':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;

      case 'addNote':
        addNote(param.actor, param.placement, param.text);
        break;

      case 'addMessage':
        addSignal(param.from, param.to, param.msg, param.signalType);
        break;

      case 'loopStart':
        addSignal(undefined, undefined, param.loopText, param.signalType);
        break;

      case 'loopEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'rectStart':
        addSignal(undefined, undefined, param.color, param.signalType);
        break;

      case 'rectEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'optStart':
        addSignal(undefined, undefined, param.optText, param.signalType);
        break;

      case 'optEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'altStart':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;

      case 'else':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;

      case 'altEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'setTitle':
        setTitle(param.text);
        break;

      case 'parStart':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;

      case 'and':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;

      case 'parEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
    }
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  addActor: addActor,
  addMessage: addMessage,
  addSignal: addSignal,
  autoWrap: autoWrap,
  setWrap: setWrap,
  enableSequenceNumbers: enableSequenceNumbers,
  showSequenceNumbers: showSequenceNumbers,
  getMessages: getMessages,
  getActors: getActors,
  getActor: getActor,
  getActorKeys: getActorKeys,
  getTitle: getTitle,
  parseDirective: parseDirective,
  getConfig: function getConfig() {
    return _config__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig().sequence;
  },
  getTitleWrapped: getTitleWrapped,
  clear: clear,
  parseMessage: parseMessage,
  LINETYPE: LINETYPE,
  ARROWTYPE: ARROWTYPE,
  PLACEMENT: PLACEMENT,
  addNote: addNote,
  setTitle: setTitle,
  apply: apply
});

/***/ }),

/***/ "./src/diagrams/sequence/sequenceRenderer.js":
/*!***************************************************!*\
  !*** ./src/diagrams/sequence/sequenceRenderer.js ***!
  \***************************************************/
/*! exports provided: bounds, drawActors, setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bounds", function() { return bounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActors", function() { return drawActors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _svgDraw__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./svgDraw */ "./src/diagrams/sequence/svgDraw.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/sequenceDiagram */ "./src/diagrams/sequence/parser/sequenceDiagram.jison");
/* harmony import */ var _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _sequenceDb__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./sequenceDb */ "./src/diagrams/sequence/sequenceDb.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");







_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy = _sequenceDb__WEBPACK_IMPORTED_MODULE_5__["default"];
var conf = {};
var bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined
  },
  verticalPos: 0,
  sequenceItems: [],
  activations: [],
  models: {
    getHeight: function getHeight() {
      return Math.max.apply(null, this.actors.length === 0 ? [0] : this.actors.map(function (actor) {
        return actor.height || 0;
      })) + (this.loops.length === 0 ? 0 : this.loops.map(function (it) {
        return it.height || 0;
      }).reduce(function (acc, h) {
        return acc + h;
      })) + (this.messages.length === 0 ? 0 : this.messages.map(function (it) {
        return it.height || 0;
      }).reduce(function (acc, h) {
        return acc + h;
      })) + (this.notes.length === 0 ? 0 : this.notes.map(function (it) {
        return it.height || 0;
      }).reduce(function (acc, h) {
        return acc + h;
      }));
    },
    clear: function clear() {
      this.actors = [];
      this.loops = [];
      this.messages = [];
      this.notes = [];
    },
    addActor: function addActor(actorModel) {
      this.actors.push(actorModel);
    },
    addLoop: function addLoop(loopModel) {
      this.loops.push(loopModel);
    },
    addMessage: function addMessage(msgModel) {
      this.messages.push(msgModel);
    },
    addNote: function addNote(noteModel) {
      this.notes.push(noteModel);
    },
    lastActor: function lastActor() {
      return this.actors[this.actors.length - 1];
    },
    lastLoop: function lastLoop() {
      return this.loops[this.loops.length - 1];
    },
    lastMessage: function lastMessage() {
      return this.messages[this.messages.length - 1];
    },
    lastNote: function lastNote() {
      return this.notes[this.notes.length - 1];
    },
    actors: [],
    loops: [],
    messages: [],
    notes: []
  },
  init: function init() {
    this.sequenceItems = [];
    this.activations = [];
    this.models.clear();
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined
    };
    this.verticalPos = 0;
    setConf(_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getConfig());
  },
  updateVal: function updateVal(obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function updateBounds(startx, starty, stopx, stopy) {
    var _self = this;

    var cnt = 0;

    function updateFn(type) {
      return function updateItemBounds(item) {
        cnt++; // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems

        var n = _self.sequenceItems.length - cnt + 1;

        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min);

        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max);

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);

        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min);

          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max);

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);

          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
        }
      };
    }

    this.sequenceItems.forEach(updateFn());
    this.activations.forEach(updateFn('activation'));
  },
  insert: function insert(startx, starty, stopx, stopy) {
    var _startx = Math.min(startx, stopx);

    var _stopx = Math.max(startx, stopx);

    var _starty = Math.min(starty, stopy);

    var _stopy = Math.max(starty, stopy);

    this.updateVal(bounds.data, 'startx', _startx, Math.min);
    this.updateVal(bounds.data, 'starty', _starty, Math.min);
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max);
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max);
    this.updateBounds(_startx, _starty, _stopx, _stopy);
  },
  newActivation: function newActivation(message, diagram, actors) {
    var actorRect = actors[message.from.actor];
    var stackedSize = actorActivations(message.from.actor).length || 0;
    var x = actorRect.x + actorRect.width / 2 + (stackedSize - 1) * conf.activationWidth / 2;
    this.activations.push({
      startx: x,
      starty: this.verticalPos + 2,
      stopx: x + conf.activationWidth,
      stopy: undefined,
      actor: message.from.actor,
      anchored: _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].anchorElement(diagram)
    });
  },
  endActivation: function endActivation(message) {
    // find most recent activation for given actor
    var lastActorActivationIdx = this.activations.map(function (activation) {
      return activation.actor;
    }).lastIndexOf(message.from.actor);
    return this.activations.splice(lastActorActivationIdx, 1)[0];
  },
  createLoop: function createLoop() {
    var title = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      message: undefined,
      wrap: false,
      width: undefined
    };
    var fill = arguments.length > 1 ? arguments[1] : undefined;
    return {
      startx: undefined,
      starty: this.verticalPos,
      stopx: undefined,
      stopy: undefined,
      title: title.message,
      wrap: title.wrap,
      width: title.width,
      height: 0,
      fill: fill
    };
  },
  newLoop: function newLoop() {
    var title = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      message: undefined,
      wrap: false,
      width: undefined
    };
    var fill = arguments.length > 1 ? arguments[1] : undefined;
    this.sequenceItems.push(this.createLoop(title, fill));
  },
  endLoop: function endLoop() {
    return this.sequenceItems.pop();
  },
  addSectionToLoop: function addSectionToLoop(message) {
    var loop = this.sequenceItems.pop();
    loop.sections = loop.sections || [];
    loop.sectionTitles = loop.sectionTitles || [];
    loop.sections.push({
      y: bounds.getVerticalPos(),
      height: 0
    });
    loop.sectionTitles.push(message);
    this.sequenceItems.push(loop);
  },
  bumpVerticalPos: function bumpVerticalPos(bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function getVerticalPos() {
    return this.verticalPos;
  },
  getBounds: function getBounds() {
    return {
      bounds: this.data,
      models: this.models
    };
  }
};
/**
 * Draws an note in the diagram with the attached line
 * @param elem - The diagram to draw to.
 * @param noteModel:{x: number, y: number, message: string, width: number} - startx: x axis start position, verticalPos: y axis position, messsage: the message to be shown, width: Set this with a custom width to override the default configured width.
 */

var drawNote = function drawNote(elem, noteModel) {
  bounds.bumpVerticalPos(conf.boxMargin);
  noteModel.height = conf.boxMargin;
  noteModel.starty = bounds.getVerticalPos();
  var rect = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].getNoteRect();
  rect.x = noteModel.startx;
  rect.y = noteModel.starty;
  rect.width = noteModel.width || conf.width;
  rect.class = 'note';
  var g = elem.append('g');
  var rectElem = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawRect(g, rect);
  var textObj = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].getTextObj();
  textObj.x = noteModel.startx;
  textObj.y = noteModel.starty;
  textObj.width = rect.width;
  textObj.dy = '1em';
  textObj.text = noteModel.message;
  textObj.class = 'noteText';
  textObj.fontFamily = conf.noteFontFamily;
  textObj.fontSize = conf.noteFontSize;
  textObj.fontWeight = conf.noteFontWeight;
  textObj.anchor = conf.noteAlign;
  textObj.textMargin = conf.noteMargin;
  textObj.valign = conf.noteAlign;
  textObj.wrap = true;
  var textElem = Object(_svgDraw__WEBPACK_IMPORTED_MODULE_1__["drawText"])(g, textObj);
  var textHeight = Math.round(textElem.map(function (te) {
    return (te._groups || te)[0][0].getBBox().height;
  }).reduce(function (acc, curr) {
    return acc + curr;
  }));
  rectElem.attr('height', textHeight + 2 * conf.noteMargin);
  noteModel.height += textHeight + 2 * conf.noteMargin;
  bounds.bumpVerticalPos(textHeight + 2 * conf.noteMargin);
  noteModel.stopy = noteModel.starty + textHeight + 2 * conf.noteMargin;
  noteModel.stopx = noteModel.startx + rect.width;
  bounds.insert(noteModel.startx, noteModel.starty, noteModel.stopx, noteModel.stopy);
  bounds.models.addNote(noteModel);
};
/**
 * Draws a message
 * @param g - the parent of the message element
 * @param msgModel - the model containing fields describing a message
 */


var drawMessage = function drawMessage(g, msgModel) {
  bounds.bumpVerticalPos(10);
  var startx = msgModel.startx,
      stopx = msgModel.stopx,
      starty = msgModel.starty,
      message = msgModel.message,
      type = msgModel.type,
      sequenceIndex = msgModel.sequenceIndex,
      wrap = msgModel.wrap;
  var lines = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].splitBreaks(message).length;
  var textDims = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(message, conf.messageFont());
  var lineHeight = textDims.height / lines;
  msgModel.height += lineHeight;
  bounds.bumpVerticalPos(lineHeight);
  var textObj = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].getTextObj();
  textObj.x = startx;
  textObj.y = starty + 10;
  textObj.width = stopx - startx;
  textObj.class = 'messageText';
  textObj.dy = '1em';
  textObj.text = message;
  textObj.fontFamily = conf.messageFontFamily;
  textObj.fontSize = conf.messageFontSize;
  textObj.fontWeight = conf.messageFontWeight;
  textObj.anchor = conf.messageAlign;
  textObj.valign = conf.messageAlign;
  textObj.textMargin = conf.wrapPadding;
  textObj.tspan = false;
  textObj.wrap = wrap;
  Object(_svgDraw__WEBPACK_IMPORTED_MODULE_1__["drawText"])(g, textObj);
  var totalOffset = textDims.height - 10;
  var textWidth = textDims.width;
  var line, lineStarty;

  if (startx === stopx) {
    lineStarty = bounds.getVerticalPos() + totalOffset;

    if (conf.rightAngles) {
      line = g.append('path').attr('d', "M  ".concat(startx, ",").concat(lineStarty, " H ").concat(startx + Math.max(conf.width / 2, textWidth / 2), " V ").concat(lineStarty + 25, " H ").concat(startx));
    } else {
      totalOffset += conf.boxMargin;
      lineStarty = bounds.getVerticalPos() + totalOffset;
      line = g.append('path').attr('d', 'M ' + startx + ',' + lineStarty + ' C ' + (startx + 60) + ',' + (lineStarty - 10) + ' ' + (startx + 60) + ',' + (lineStarty + 30) + ' ' + startx + ',' + (lineStarty + 20));
    }

    totalOffset += 30;
    var dx = Math.max(textWidth / 2, conf.width / 2);
    bounds.insert(startx - dx, bounds.getVerticalPos() - 10 + totalOffset, stopx + dx, bounds.getVerticalPos() + 30 + totalOffset);
  } else {
    totalOffset += conf.boxMargin;
    lineStarty = bounds.getVerticalPos() + totalOffset;
    line = g.append('line');
    line.attr('x1', startx);
    line.attr('y1', lineStarty);
    line.attr('x2', stopx);
    line.attr('y2', lineStarty);
    bounds.insert(startx, lineStarty - 10, stopx, lineStarty);
  } // Make an SVG Container
  // Draw the line


  if (type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED || type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS || type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_OPEN) {
    line.style('stroke-dasharray', '3, 3');
    line.attr('class', 'messageLine1');
  } else {
    line.attr('class', 'messageLine0');
  }

  var url = '';

  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  line.attr('stroke-width', 2);
  line.attr('stroke', 'none'); // handled by theme/css anyway

  line.style('fill', 'none'); // remove any fill colour

  if (type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID || type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)');
  }

  if (type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_CROSS || type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS) {
    line.attr('marker-end', 'url(' + url + '#crosshead)');
  } // add node number


  if (_sequenceDb__WEBPACK_IMPORTED_MODULE_5__["default"].showSequenceNumbers() || conf.showSequenceNumbers) {
    line.attr('marker-start', 'url(' + url + '#sequencenumber)');
    g.append('text').attr('x', startx).attr('y', lineStarty + 4).attr('font-family', 'sans-serif').attr('font-size', '12px').attr('text-anchor', 'middle').attr('textLength', '16px').attr('class', 'sequenceNumber').text(sequenceIndex);
  }

  bounds.bumpVerticalPos(totalOffset);
  msgModel.height += totalOffset;
  msgModel.stopy = msgModel.starty + msgModel.height;
  bounds.insert(msgModel.fromBounds, msgModel.starty, msgModel.toBounds, msgModel.stopy);
};

var drawActors = function drawActors(diagram, actors, actorKeys, verticalPos) {
  // Draw the actors
  var prevWidth = 0;
  var prevMargin = 0;

  for (var i = 0; i < actorKeys.length; i++) {
    var actor = actors[actorKeys[i]]; // Add some rendering data to the object

    actor.width = actor.width || conf.width;
    actor.height = Math.max(actor.height || conf.height, conf.height);
    actor.margin = actor.margin || conf.actorMargin;
    actor.x = prevWidth + prevMargin;
    actor.y = verticalPos; // Draw the box with the attached line

    _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawActor(diagram, actor, conf);
    bounds.insert(actor.x, verticalPos, actor.x + actor.width, actor.height);
    prevWidth += actor.width;
    prevMargin += actor.margin;
    bounds.models.addActor(actor);
  } // Add a margin between the actor boxes and the first arrow


  bounds.bumpVerticalPos(conf.height);
};
var setConf = function setConf(cnf) {
  Object(_utils__WEBPACK_IMPORTED_MODULE_6__["assignWithDepth"])(conf, cnf);

  if (cnf.fontFamily) {
    conf.actorFontFamily = conf.noteFontFamily = conf.messageFontFamily = cnf.fontFamily;
  }

  if (cnf.fontSize) {
    conf.actorFontSize = conf.noteFontSize = conf.messageFontSize = cnf.fontSize;
  }

  if (cnf.fontWeight) {
    conf.actorFontWeight = conf.noteFontWeight = conf.messageFontWeight = cnf.fontWeight;
  }
};

var actorActivations = function actorActivations(actor) {
  return bounds.activations.filter(function (activation) {
    return activation.actor === actor;
  });
};

var activationBounds = function activationBounds(actor, actors) {
  // handle multiple stacked activations for same actor
  var actorObj = actors[actor];
  var activations = actorActivations(actor);
  var left = activations.reduce(function (acc, activation) {
    return Math.min(acc, activation.startx);
  }, actorObj.x + actorObj.width / 2);
  var right = activations.reduce(function (acc, activation) {
    return Math.max(acc, activation.stopx);
  }, actorObj.x + actorObj.width / 2);
  return [left, right];
};

function adjustLoopHeightForWrap(loopWidths, msg, preMargin, postMargin, addLoopFn) {
  bounds.bumpVerticalPos(preMargin);
  var heightAdjust = postMargin;

  if (msg.id && msg.message && loopWidths[msg.id]) {
    var loopWidth = loopWidths[msg.id].width;
    var textConf = conf.messageFont();
    msg.message = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel("[".concat(msg.message, "]"), loopWidth - 2 * conf.wrapPadding, textConf);
    msg.width = loopWidth;
    msg.wrap = true; // const lines = common.splitBreaks(msg.message).length;

    var textDims = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(msg.message, textConf);
    var totalOffset = Math.max(textDims.height, conf.labelBoxHeight);
    heightAdjust = postMargin + totalOffset;
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug("".concat(totalOffset, " - ").concat(msg.message));
  }

  addLoopFn(msg);
  bounds.bumpVerticalPos(heightAdjust);
}
/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */


var draw = function draw(text, id) {
  _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.clear();
  _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.setWrap(conf.wrap);
  _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].parse(text + '\n');
  bounds.init();
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug("C:".concat(JSON.stringify(conf, null, 2)));
  var diagram = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id=\"".concat(id, "\"]")); // Fetch data from the parsing

  var actors = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActors();
  var actorKeys = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActorKeys();
  var messages = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getMessages();
  var title = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getTitle();
  var maxMessageWidthPerActor = getMaxMessageWidthPerActor(actors, messages);
  conf.height = calculateActorMargins(actors, maxMessageWidthPerActor);
  drawActors(diagram, actors, actorKeys, 0);
  var loopWidths = calculateLoopBounds(messages, actors, maxMessageWidthPerActor); // The arrow head definition is attached to the svg once

  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertArrowHead(diagram);
  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertArrowCrossHead(diagram);
  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertSequenceNumber(diagram);

  function activeEnd(msg, verticalPos) {
    var activationData = bounds.endActivation(msg);

    if (activationData.starty + 18 > verticalPos) {
      activationData.starty = verticalPos - 6;
      verticalPos += 12;
    }

    _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawActivation(diagram, activationData, verticalPos, conf, actorActivations(msg.from.actor).length);
    bounds.insert(activationData.startx, verticalPos - 10, activationData.stopx, verticalPos);
  } // Draw the messages/signals


  var sequenceIndex = 1;
  messages.forEach(function (msg) {
    var loopModel, noteModel, msgModel;

    switch (msg.type) {
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.NOTE:
        noteModel = msg.noteModel;
        drawNote(diagram, noteModel);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram, actors);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos());
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin + conf.boxTextMargin, function (message) {
          return bounds.newLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_END:
        loopModel = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopModel, 'loop', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.RECT_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin, function (message) {
          return bounds.newLoop(undefined, message.message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.RECT_END:
        loopModel = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawBackgroundRect(diagram, loopModel);
        bounds.models.addLoop(loopModel);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin + conf.boxTextMargin, function (message) {
          return bounds.newLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_END:
        loopModel = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopModel, 'opt', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin + conf.boxTextMargin, function (message) {
          return bounds.newLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_ELSE:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin + conf.boxTextMargin, conf.boxMargin, function (message) {
          return bounds.addSectionToLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_END:
        loopModel = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopModel, 'alt', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_START:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin, conf.boxMargin + conf.boxTextMargin, function (message) {
          return bounds.newLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_AND:
        adjustLoopHeightForWrap(loopWidths, msg, conf.boxMargin + conf.boxTextMargin, conf.boxMargin, function (message) {
          return bounds.addSectionToLoop(message);
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_END:
        loopModel = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopModel, 'par', conf);
        bounds.bumpVerticalPos(loopModel.stopy - bounds.getVerticalPos());
        bounds.models.addLoop(loopModel);
        break;

      default:
        try {
          // lastMsg = msg
          msgModel = msg.msgModel;
          msgModel.starty = bounds.getVerticalPos();
          msgModel.sequenceIndex = sequenceIndex;
          drawMessage(diagram, msgModel);
          bounds.models.addMessage(msgModel);
        } catch (e) {
          _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].error('error while drawing message', e);
        }

    } // Increment sequence counter if msg.type is a line (and not another event like activation or note, etc)


    if ([_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_CROSS, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS].includes(msg.type)) {
      sequenceIndex++;
    }
  });

  if (conf.mirrorActors) {
    // Draw actors below diagram
    bounds.bumpVerticalPos(conf.boxMargin * 2);
    drawActors(diagram, actors, actorKeys, bounds.getVerticalPos());
  }

  var _bounds$getBounds = bounds.getBounds(),
      box = _bounds$getBounds.bounds; // Adjust line height of actor lines now that the height of the diagram is known


  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('For line height fix Querying: #' + id + ' .actor-line');
  var actorLines = Object(d3__WEBPACK_IMPORTED_MODULE_0__["selectAll"])('#' + id + ' .actor-line');
  actorLines.attr('y2', box.stopy);
  var height = box.stopy - box.starty + 2 * conf.diagramMarginY;

  if (conf.mirrorActors) {
    height = height - conf.boxMargin + conf.bottomMarginAdj;
  }

  var width = box.stopx - box.startx + 2 * conf.diagramMarginX;

  if (title) {
    diagram.append('text').text(title).attr('x', (box.stopx - box.startx) / 2 - 2 * conf.diagramMarginX).attr('y', -25);
  }

  if (conf.useMaxWidth) {
    diagram.attr('height', '100%');
    diagram.attr('width', '100%');
    diagram.attr('style', 'max-width:' + width + 'px;'); // diagram.attr('style', 'max-width:100%;');
  } else {
    diagram.attr('height', height);
    diagram.attr('width', width);
  }

  var extraVertForTitle = title ? 40 : 0;
  diagram.attr('viewBox', box.startx - conf.diagramMarginX + ' -' + (conf.diagramMarginY + extraVertForTitle) + ' ' + width + ' ' + (height + extraVertForTitle));
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug("models:", bounds.models);
};
/**
 * Retrieves the max message width of each actor, supports signals (messages, loops)
 * and notes.
 *
 * It will enumerate each given message, and will determine its text width, in relation
 * to the actor it originates from, and destined to.
 *
 * @param actors - The actors map
 * @param messages - A list of message objects to iterate
 */

var getMaxMessageWidthPerActor = function getMaxMessageWidthPerActor(actors, messages) {
  var maxMessageWidthPerActor = {};
  messages.forEach(function (msg) {
    if (actors[msg.to] && actors[msg.from]) {
      var actor = actors[msg.to]; // If this is the first actor, and the message is left of it, no need to calculate the margin

      if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.LEFTOF && !actor.prevActor) {
        return;
      } // If this is the last actor, and the message is right of it, no need to calculate the margin


      if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.RIGHTOF && !actor.nextActor) {
        return;
      }

      var isNote = msg.placement !== undefined;
      var isMessage = !isNote;
      var textFont = isNote ? conf.noteFont() : conf.messageFont();
      var wrappedMessage = msg.wrap ? _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(msg.message, conf.width - 2 * conf.wrapPadding, textFont) : msg.message;
      var messageDimensions = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(wrappedMessage, textFont);
      var messageWidth = messageDimensions.width + 2 * conf.wrapPadding;
      /*
       * The following scenarios should be supported:
       *
       * - There's a message (non-note) between fromActor and toActor
       *   - If fromActor is on the right and toActor is on the left, we should
       *     define the toActor's margin
       *   - If fromActor is on the left and toActor is on the right, we should
       *     define the fromActor's margin
       * - There's a note, in which case fromActor == toActor
       *   - If the note is to the left of the actor, we should define the previous actor
       *     margin
       *   - If the note is on the actor, we should define both the previous and next actor
       *     margins, each being the half of the note size
       *   - If the note is on the right of the actor, we should define the current actor
       *     margin
       */

      if (isMessage && msg.from === actor.nextActor) {
        maxMessageWidthPerActor[msg.to] = Math.max(maxMessageWidthPerActor[msg.to] || 0, messageWidth);
      } else if (isMessage && msg.from === actor.prevActor) {
        maxMessageWidthPerActor[msg.from] = Math.max(maxMessageWidthPerActor[msg.from] || 0, messageWidth);
      } else if (isMessage && msg.from === msg.to) {
        maxMessageWidthPerActor[msg.from] = Math.max(maxMessageWidthPerActor[msg.from] || 0, messageWidth / 2);
        maxMessageWidthPerActor[msg.to] = Math.max(maxMessageWidthPerActor[msg.to] || 0, messageWidth / 2);
      } else if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.RIGHTOF) {
        maxMessageWidthPerActor[msg.from] = Math.max(maxMessageWidthPerActor[msg.from] || 0, messageWidth);
      } else if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.LEFTOF) {
        maxMessageWidthPerActor[actor.prevActor] = Math.max(maxMessageWidthPerActor[actor.prevActor] || 0, messageWidth);
      } else if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.OVER) {
        if (actor.prevActor) {
          maxMessageWidthPerActor[actor.prevActor] = Math.max(maxMessageWidthPerActor[actor.prevActor] || 0, messageWidth / 2);
        }

        if (actor.nextActor) {
          maxMessageWidthPerActor[msg.from] = Math.max(maxMessageWidthPerActor[msg.from] || 0, messageWidth / 2);
        }
      }
    }
  });
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('maxMessageWidthPerActor:', maxMessageWidthPerActor);
  return maxMessageWidthPerActor;
};
/**
 * This will calculate the optimal margin for each given actor, for a given
 * actor->messageWidth map.
 *
 * An actor's margin is determined by the width of the actor, the width of the
 * largest message that originates from it, and the configured conf.actorMargin.
 *
 * @param actors - The actors map to calculate margins for
 * @param actorToMessageWidth - A map of actor key -> max message width it holds
 */


var calculateActorMargins = function calculateActorMargins(actors, actorToMessageWidth) {
  var maxHeight = 0;
  Object.keys(actors).forEach(function (prop) {
    var actor = actors[prop];

    if (actor.wrap) {
      actor.description = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(actor.description, conf.width - 2 * conf.wrapPadding, conf.actorFont());
    }

    var actDims = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(actor.description, conf.actorFont());
    actor.width = actor.wrap ? conf.width : Math.max(conf.width, actDims.width + 2 * conf.wrapPadding);
    actor.height = actor.wrap ? Math.max(actDims.height, conf.height) : conf.height;
    maxHeight = Math.max(maxHeight, actor.height);
  });

  for (var actorKey in actorToMessageWidth) {
    var actor = actors[actorKey];

    if (!actor) {
      continue;
    }

    var nextActor = actors[actor.nextActor]; // No need to space out an actor that doesn't have a next link

    if (!nextActor) {
      continue;
    }

    var messageWidth = actorToMessageWidth[actorKey];
    var actorWidth = messageWidth + conf.actorMargin - actor.width / 2 - nextActor.width / 2;
    actor.margin = Math.max(actorWidth, conf.actorMargin);
  }

  return Math.max(maxHeight, conf.height);
};

var buildNoteModel = function buildNoteModel(msg, actors) {
  var startx = actors[msg.from].x;
  var stopx = actors[msg.to].x;
  var shouldWrap = msg.wrap && msg.message;
  var textDimensions = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(shouldWrap ? _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(msg.message, conf.width, conf.noteFont()) : msg.message, conf.noteFont());
  var noteModel = {
    width: shouldWrap ? conf.width : Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin),
    height: 0,
    startx: actors[msg.from].x,
    stopx: 0,
    starty: 0,
    stopy: 0,
    message: msg.message
  };

  if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.RIGHTOF) {
    noteModel.width = shouldWrap ? Math.max(conf.width, textDimensions.width) : Math.max(actors[msg.from].width / 2 + actors[msg.to].width / 2, textDimensions.width + 2 * conf.noteMargin);
    noteModel.startx = startx + (actors[msg.from].width + conf.actorMargin) / 2;
  } else if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.LEFTOF) {
    noteModel.width = shouldWrap ? Math.max(conf.width, textDimensions.width + 2 * conf.noteMargin) : Math.max(actors[msg.from].width / 2 + actors[msg.to].width / 2, textDimensions.width + 2 * conf.noteMargin);
    noteModel.startx = startx - noteModel.width + (actors[msg.from].width - conf.actorMargin) / 2;
  } else if (msg.to === msg.from) {
    textDimensions = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(shouldWrap ? _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(msg.message, Math.max(conf.width, actors[msg.from].width), conf.noteFont()) : msg.message, conf.noteFont());
    noteModel.width = shouldWrap ? Math.max(conf.width, actors[msg.from].width) : Math.max(actors[msg.from].width, conf.width, textDimensions.width + 2 * conf.noteMargin);
    noteModel.startx = startx + (actors[msg.from].width - noteModel.width) / 2;
  } else {
    noteModel.width = Math.abs(startx + actors[msg.from].width / 2 - (stopx + actors[msg.to].width / 2)) + conf.actorMargin;
    noteModel.startx = startx < stopx ? startx + actors[msg.from].width / 2 - conf.actorMargin / 2 : stopx + actors[msg.to].width / 2 - conf.actorMargin / 2;
  }

  if (shouldWrap) {
    noteModel.message = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(msg.message, noteModel.width - 2 * conf.wrapPadding, conf.noteFont());
  }

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug("NM:[".concat(noteModel.startx, ",").concat(noteModel.stopx, ",").concat(noteModel.starty, ",").concat(noteModel.stopy, ":").concat(noteModel.width, ",").concat(noteModel.height, "=").concat(msg.message, "]"));
  return noteModel;
};

var buildMessageModel = function buildMessageModel(msg, actors) {
  var process = false;

  if ([_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_CROSS, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS].includes(msg.type)) {
    process = true;
  }

  if (!process) {
    return {};
  }

  var fromBounds = activationBounds(msg.from, actors);
  var toBounds = activationBounds(msg.to, actors);
  var fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0;
  var toIdx = fromBounds[0] < toBounds[0] ? 0 : 1;
  var allBounds = fromBounds.concat(toBounds);
  var boundedWidth = Math.abs(toBounds[toIdx] - fromBounds[fromIdx]);
  var msgDims = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].calculateTextDimensions(msg.message, conf.messageFont());

  if (msg.wrap && msg.message) {
    msg.message = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].wrapLabel(msg.message, Math.max(boundedWidth + 2 * conf.wrapPadding, conf.width), conf.messageFont());
  }

  return {
    width: Math.max(msg.wrap ? 0 : msgDims.width + 2 * conf.wrapPadding, boundedWidth + 2 * conf.wrapPadding, conf.width),
    height: 0,
    startx: fromBounds[fromIdx],
    stopx: toBounds[toIdx],
    starty: 0,
    stopy: 0,
    message: msg.message,
    type: msg.type,
    wrap: msg.wrap,
    fromBounds: Math.min.apply(null, allBounds),
    toBounds: Math.max.apply(null, allBounds)
  };
};

var calculateLoopBounds = function calculateLoopBounds(messages, actors) {
  var loops = {};
  var stack = [];
  var current, noteModel, msgModel;
  messages.forEach(function (msg) {
    msg.id = _utils__WEBPACK_IMPORTED_MODULE_6__["default"].random({
      length: 10
    });

    switch (msg.type) {
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_START:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_START:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_START:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_START:
        stack.push({
          id: msg.id,
          msg: msg.message,
          from: Number.MAX_SAFE_INTEGER,
          to: Number.MIN_SAFE_INTEGER,
          width: 0
        });
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_ELSE:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_AND:
        if (msg.message) {
          current = stack.pop();
          loops[current.id] = current;
          loops[msg.id] = current;
          stack.push(current);
        }

        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_END:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_END:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_END:
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_END:
        current = stack.pop();
        loops[current.id] = current;
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_START:
        {
          var actorRect = actors[msg.from ? msg.from.actor : msg.to.actor];
          var stackedSize = actorActivations(msg.from ? msg.from.actor : msg.to.actor).length;
          var x = actorRect.x + actorRect.width / 2 + (stackedSize - 1) * conf.activationWidth / 2;
          var toAdd = {
            startx: x,
            stopx: x + conf.activationWidth,
            actor: msg.from.actor,
            enabled: true
          };
          bounds.activations.push(toAdd);
        }
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_END:
        {
          var lastActorActivationIdx = bounds.activations.map(function (a) {
            return a.actor;
          }).lastIndexOf(msg.from.actor);
          delete bounds.activations.splice(lastActorActivationIdx, 1)[0];
        }
        break;
    }

    var isNote = msg.placement !== undefined;

    if (isNote) {
      noteModel = buildNoteModel(msg, actors);
      msg.noteModel = noteModel;
      stack.forEach(function (stk) {
        current = stk;
        current.from = Math.min(current.from, noteModel.startx);
        current.to = Math.max(current.to, noteModel.startx + noteModel.width);
        current.width = Math.max(current.width, Math.abs(current.from - current.to)) - conf.labelBoxWidth;
      });
    } else {
      msgModel = buildMessageModel(msg, actors);
      msg.msgModel = msgModel;

      if (msgModel.startx && msgModel.stopx && stack.length > 0) {
        stack.forEach(function (stk) {
          current = stk;

          if (msgModel.startx === msgModel.stopx) {
            var from = actors[msg.from];
            var to = actors[msg.to];
            current.from = Math.min(from.x - msgModel.width / 2, from.x - from.width / 2, current.from);
            current.to = Math.max(to.x + msgModel.width / 2, to.x + from.width / 2, current.to);
            current.width = Math.max(current.width, Math.abs(current.to - current.from)) - conf.labelBoxWidth;
          } else {
            current.from = Math.min(msgModel.startx, current.from);
            current.to = Math.max(msgModel.stopx, current.to);
            current.width = Math.max(current.width, msgModel.width) - conf.labelBoxWidth;
          }
        });
      }
    }
  });
  bounds.activations = [];
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Loop type widths:', loops);
  return loops;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  bounds: bounds,
  drawActors: drawActors,
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/sequence/svgDraw.js":
/*!******************************************!*\
  !*** ./src/diagrams/sequence/svgDraw.js ***!
  \******************************************/
/*! exports provided: drawRect, drawText, drawLabel, drawActor, anchorElement, drawActivation, drawLoop, drawBackgroundRect, insertArrowHead, insertSequenceNumber, insertArrowCrossHead, getTextObj, getNoteRect, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawRect", function() { return drawRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawText", function() { return drawText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawLabel", function() { return drawLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActor", function() { return drawActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "anchorElement", function() { return anchorElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActivation", function() { return drawActivation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawLoop", function() { return drawLoop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawBackgroundRect", function() { return drawBackgroundRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertArrowHead", function() { return insertArrowHead; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertSequenceNumber", function() { return insertSequenceNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertArrowCrossHead", function() { return insertArrowCrossHead; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTextObj", function() { return getTextObj; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getNoteRect", function() { return getNoteRect; });
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");

var drawRect = function drawRect(elem, rectData) {
  var rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (typeof rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};
var drawText = function drawText(elem, textData) {
  var prevTextHeight = 0,
      textHeight = 0;
  var lines = textData.wrap ? textData.text.split(_common_common__WEBPACK_IMPORTED_MODULE_0__["default"].lineBreakRegex) : [textData.text.replace(_common_common__WEBPACK_IMPORTED_MODULE_0__["default"].lineBreakRegex, ' ')];
  var textElems = [];
  var dy = 0;

  var yfunc = function yfunc() {
    return textData.y;
  };

  if (typeof textData.valign !== 'undefined' && typeof textData.textMargin !== 'undefined' && textData.textMargin > 0) {
    switch (textData.valign) {
      case 'top':
      case 'start':
        yfunc = function yfunc() {
          return Math.round(textData.y + textData.textMargin);
        };

        break;

      case 'middle':
      case 'center':
        yfunc = function yfunc() {
          return Math.round(textData.y + (prevTextHeight + textHeight + textData.textMargin) / 2);
        };

        break;

      case 'bottom':
      case 'end':
        yfunc = function yfunc() {
          return Math.round(textData.y + (prevTextHeight + textHeight + 2 * textData.textMargin) - textData.textMargin);
        };

        break;
    }
  }

  if (typeof textData.anchor !== 'undefined' && typeof textData.textMargin !== 'undefined' && typeof textData.width !== 'undefined') {
    switch (textData.anchor) {
      case 'left':
      case 'start':
        textData.x = Math.round(textData.x + textData.textMargin);
        textData.anchor = 'start';
        textData.dominantBaseline = 'text-after-edge';
        textData.alignmentBaseline = 'middle';
        break;

      case 'middle':
      case 'center':
        textData.x = Math.round(textData.x + textData.width / 2);
        textData.anchor = 'middle';
        textData.dominantBaseline = 'middle';
        textData.alignmentBaseline = 'middle';
        break;

      case 'right':
      case 'end':
        textData.x = Math.round(textData.x + textData.width - textData.textMargin);
        textData.anchor = 'end';
        textData.dominantBaseline = 'text-before-edge';
        textData.alignmentBaseline = 'middle';
        break;
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (typeof textData.textMargin !== 'undefined' && textData.textMargin === 0 && typeof textData.fontSize !== 'undefined') {
      dy = i * textData.fontSize;
    }

    var textElem = elem.append('text');
    textElem.attr('x', textData.x);
    textElem.attr('y', yfunc());

    if (typeof textData.anchor !== 'undefined') {
      textElem.attr('text-anchor', textData.anchor).attr('dominant-baseline', textData.dominantBaseline).attr('alignment-baseline', textData.alignmentBaseline);
    }

    if (typeof textData.fontFamily !== 'undefined') {
      textElem.style('font-family', textData.fontFamily);
    }

    if (typeof textData.fontSize !== 'undefined') {
      textElem.style('font-size', textData.fontSize);
    }

    if (typeof textData.fontWeight !== 'undefined') {
      textElem.style('font-weight', textData.fontWeight);
    }

    if (typeof textData.fill !== 'undefined') {
      textElem.attr('fill', textData.fill);
    }

    if (typeof textData.class !== 'undefined') {
      textElem.attr('class', textData.class);
    }

    if (typeof textData.dy !== 'undefined') {
      textElem.attr('dy', textData.dy);
    } else if (dy !== 0) {
      textElem.attr('dy', dy);
    }

    if (textData.tspan) {
      var span = textElem.append('tspan');
      span.attr('x', textData.x);

      if (typeof textData.fill !== 'undefined') {
        span.attr('fill', textData.fill);
      }

      span.text(line);
    } else {
      textElem.text(line);
    }

    if (typeof textData.valign !== 'undefined' && typeof textData.textMargin !== 'undefined' && textData.textMargin > 0) {
      textHeight += (textElem._groups || textElem)[0][0].getBBox().height;
      prevTextHeight = textHeight;
    }

    textElems.push(textElem);
  }

  return textElems;
};
var drawLabel = function drawLabel(elem, txtObject) {
  function genPoints(x, y, width, height, cut) {
    return x + ',' + y + ' ' + (x + width) + ',' + y + ' ' + (x + width) + ',' + (y + height - cut) + ' ' + (x + width - cut * 1.2) + ',' + (y + height) + ' ' + x + ',' + (y + height);
  }

  var polygon = elem.append('polygon');
  polygon.attr('points', genPoints(txtObject.x, txtObject.y, txtObject.width, txtObject.height, 7));
  polygon.attr('class', 'labelBox');
  txtObject.y = txtObject.y + txtObject.height / 2;
  drawText(elem, txtObject);
  return polygon;
};
var actorCnt = -1;
/**
 * Draws an actor in the diagram with the attached line
 * @param elem - The diagram we'll draw to.
 * @param actor - The actor to draw.
 * @param conf - drawText implementation discriminator object
 */

var drawActor = function drawActor(elem, actor, conf) {
  var center = actor.x + actor.width / 2;
  var g = elem.append('g');

  if (actor.y === 0) {
    actorCnt++;
    g.append('line').attr('id', 'actor' + actorCnt).attr('x1', center).attr('y1', 5).attr('x2', center).attr('y2', 2000).attr('class', 'actor-line').attr('stroke-width', '0.5px').attr('stroke', '#999');
  }

  var rect = getNoteRect();
  rect.x = actor.x;
  rect.y = actor.y;
  rect.fill = '#eaeaea';
  rect.width = actor.width;
  rect.height = actor.height;
  rect.class = 'actor';
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(actor.description, g, rect.x, rect.y, rect.width, rect.height, {
    class: 'actor'
  }, conf);
};
var anchorElement = function anchorElement(elem) {
  return elem.append('g');
};
/**
 * Draws an activation in the diagram
 * @param elem - element to append activation rect.
 * @param bounds - activation box bounds.
 * @param verticalPos - precise y cooridnate of bottom activation box edge.
 * @param conf - sequence diagram config object.
 * @param actorActivations - number of activations on the actor.
 */

var drawActivation = function drawActivation(elem, bounds, verticalPos, conf, actorActivations) {
  var rect = getNoteRect();
  var g = bounds.anchored;
  rect.x = bounds.startx;
  rect.y = bounds.starty;
  rect.class = 'activation' + actorActivations % 3; // Will evaluate to 0, 1 or 2

  rect.width = bounds.stopx - bounds.startx;
  rect.height = verticalPos - bounds.starty;
  drawRect(g, rect);
};
/**
 * Draws a loop in the diagram
 * @param elem - elemenet to append the loop to.
 * @param loopModel - loopModel of the given loop.
 * @param labelText - Text within the loop.
 * @param conf - diagrom configuration
 */

var drawLoop = function drawLoop(elem, loopModel, labelText, conf) {
  var boxMargin = conf.boxMargin,
      boxTextMargin = conf.boxTextMargin,
      labelBoxHeight = conf.labelBoxHeight,
      labelBoxWidth = conf.labelBoxWidth,
      fontFamily = conf.messageFontFamily,
      fontSize = conf.messageFontSize,
      fontWeight = conf.messageFontWeight;
  var g = elem.append('g');

  var drawLoopLine = function drawLoopLine(startx, starty, stopx, stopy) {
    return g.append('line').attr('x1', startx).attr('y1', starty).attr('x2', stopx).attr('y2', stopy).attr('class', 'loopLine');
  };

  drawLoopLine(loopModel.startx, loopModel.starty, loopModel.stopx, loopModel.starty);
  drawLoopLine(loopModel.stopx, loopModel.starty, loopModel.stopx, loopModel.stopy);
  drawLoopLine(loopModel.startx, loopModel.stopy, loopModel.stopx, loopModel.stopy);
  drawLoopLine(loopModel.startx, loopModel.starty, loopModel.startx, loopModel.stopy);

  if (typeof loopModel.sections !== 'undefined') {
    loopModel.sections.forEach(function (item) {
      drawLoopLine(loopModel.startx, item.y, loopModel.stopx, item.y).style('stroke-dasharray', '3, 3');
    });
  }

  var txt = getTextObj();
  txt.text = labelText;
  txt.x = loopModel.startx;
  txt.y = loopModel.starty;
  txt.fontFamily = fontFamily;
  txt.fontSize = fontSize;
  txt.fontWeight = fontWeight;
  txt.anchor = 'middle';
  txt.valign = 'middle';
  txt.tspan = false;
  txt.width = labelBoxWidth || 50;
  txt.height = labelBoxHeight || 20;
  txt.textMargin = boxTextMargin;
  txt.class = 'labelText';
  drawLabel(g, txt);
  txt = getTextObj();
  txt.text = loopModel.title;
  txt.x = loopModel.startx + labelBoxWidth / 2 + (loopModel.stopx - loopModel.startx) / 2;
  txt.y = loopModel.starty + boxMargin + boxTextMargin;
  txt.anchor = 'middle';
  txt.valign = 'middle';
  txt.textMargin = boxTextMargin;
  txt.class = 'loopText';
  txt.fontFamily = fontFamily;
  txt.fontSize = fontSize;
  txt.fontWeight = fontWeight;
  txt.wrap = true;
  var textElem = drawText(g, txt);

  if (typeof loopModel.sectionTitles !== 'undefined') {
    loopModel.sectionTitles.forEach(function (item, idx) {
      if (item.message) {
        txt.text = item.message;
        txt.x = loopModel.startx + (loopModel.stopx - loopModel.startx) / 2;
        txt.y = loopModel.sections[idx].y + boxMargin + boxTextMargin;
        txt.class = 'loopText';
        txt.anchor = 'middle';
        txt.valign = 'middle';
        txt.tspan = false;
        txt.fontFamily = fontFamily;
        txt.fontSize = fontSize;
        txt.fontWeight = fontWeight;
        txt.wrap = loopModel.wrap;
        textElem = drawText(g, txt);
        var sectionHeight = Math.round(textElem.map(function (te) {
          return (te._groups || te)[0][0].getBBox().height;
        }).reduce(function (acc, curr) {
          return acc + curr;
        }));
        loopModel.sections[idx].height += sectionHeight - (boxMargin + boxTextMargin);
      }
    });
  }

  loopModel.height = Math.round(loopModel.stopy - loopModel.starty);
  return g;
};
/**
 * Draws a background rectangle
 * @param elem diagram (reference for bounds)
 * @param bounds shape of the rectangle
 */

var drawBackgroundRect = function drawBackgroundRect(elem, bounds) {
  var rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    class: 'rect'
  });
  rectElem.lower();
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertArrowHead = function insertArrowHead(elem) {
  elem.append('defs').append('marker').attr('id', 'arrowhead').attr('refX', 5).attr('refY', 2).attr('markerWidth', 6).attr('markerHeight', 4).attr('orient', 'auto').append('path').attr('d', 'M 0,0 V 4 L6,2 Z'); // this is actual shape for arrowhead
};
/**
 * Setup node number. The result is appended to the svg.
 */

var insertSequenceNumber = function insertSequenceNumber(elem) {
  elem.append('defs').append('marker').attr('id', 'sequencenumber').attr('refX', 15).attr('refY', 15).attr('markerWidth', 60).attr('markerHeight', 40).attr('orient', 'auto').append('circle').attr('cx', 15).attr('cy', 15).attr('r', 6); // .style("fill", '#f00');
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertArrowCrossHead = function insertArrowCrossHead(elem) {
  var defs = elem.append('defs');
  var marker = defs.append('marker').attr('id', 'crosshead').attr('markerWidth', 15).attr('markerHeight', 8).attr('orient', 'auto').attr('refX', 16).attr('refY', 4); // The arrow

  marker.append('path').attr('fill', 'black').attr('stroke', '#000000').style('stroke-dasharray', '0, 0').attr('stroke-width', '1px').attr('d', 'M 9,2 V 6 L16,4 Z'); // The cross

  marker.append('path').attr('fill', 'none').attr('stroke', '#000000').style('stroke-dasharray', '0, 0').attr('stroke-width', '1px').attr('d', 'M 0,1 L 6,7 M 6,1 L 0,7'); // this is actual shape for arrowhead
};
var getTextObj = function getTextObj() {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    anchor: undefined,
    style: '#666',
    width: undefined,
    height: undefined,
    textMargin: 0,
    rx: 0,
    ry: 0,
    tspan: true,
    valign: undefined
  };
};
var getNoteRect = function getNoteRect() {
  return {
    x: 0,
    y: 0,
    fill: '#EDF2AE',
    stroke: '#666',
    width: 100,
    anchor: 'start',
    height: 100,
    rx: 0,
    ry: 0
  };
};

var _drawTextCandidateFunc = function () {
  function byText(content, g, x, y, width, height, textAttrs) {
    var text = g.append('text').attr('x', x + width / 2).attr('y', y + height / 2 + 5).style('text-anchor', 'middle').text(content);

    _setTextAttrs(text, textAttrs);
  }

  function byTspan(content, g, x, y, width, height, textAttrs, conf) {
    var actorFontSize = conf.actorFontSize,
        actorFontFamily = conf.actorFontFamily,
        actorFontWeight = conf.actorFontWeight;
    var lines = content.split(_common_common__WEBPACK_IMPORTED_MODULE_0__["default"].lineBreakRegex);

    for (var i = 0; i < lines.length; i++) {
      var dy = i * actorFontSize - actorFontSize * (lines.length - 1) / 2;
      var text = g.append('text').attr('x', x + width / 2).attr('y', y).style('text-anchor', 'middle').style('font-size', actorFontSize).style('font-weight', actorFontWeight).style('font-family', actorFontFamily);
      text.append('tspan').attr('x', x + width / 2).attr('dy', dy).text(lines[i]);
      text.attr('y', y + height / 2.0).attr('dominant-baseline', 'central').attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  function byFo(content, g, x, y, width, height, textAttrs, conf) {
    var s = g.append('switch');
    var f = s.append('foreignObject').attr('x', x).attr('y', y).attr('width', width).attr('height', height);
    var text = f.append('div').style('display', 'table').style('height', '100%').style('width', '100%');
    text.append('div').style('display', 'table-cell').style('text-align', 'center').style('vertical-align', 'middle').text(content);
    byTspan(content, s, x, y, width, height, textAttrs, conf);

    _setTextAttrs(text, textAttrs);
  }

  function _setTextAttrs(toText, fromTextAttrsDict) {
    for (var key in fromTextAttrsDict) {
      if (fromTextAttrsDict.hasOwnProperty(key)) {
        // eslint-disable-line
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf) {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
}();

/* harmony default export */ __webpack_exports__["default"] = ({
  drawRect: drawRect,
  drawText: drawText,
  drawLabel: drawLabel,
  drawActor: drawActor,
  anchorElement: anchorElement,
  drawActivation: drawActivation,
  drawLoop: drawLoop,
  drawBackgroundRect: drawBackgroundRect,
  insertArrowHead: insertArrowHead,
  insertSequenceNumber: insertSequenceNumber,
  insertArrowCrossHead: insertArrowCrossHead,
  getTextObj: getTextObj,
  getNoteRect: getNoteRect
});

/***/ }),

/***/ "./src/diagrams/state/id-cache.js":
/*!****************************************!*\
  !*** ./src/diagrams/state/id-cache.js ***!
  \****************************************/
/*! exports provided: set, get, keys, size, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "set", function() { return set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keys", function() { return keys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "size", function() { return size; });
var idCache = {};
var set = function set(key, val) {
  idCache[key] = val;
};
var get = function get(k) {
  return idCache[k];
};
var keys = function keys() {
  return Object.keys(idCache);
};
var size = function size() {
  return keys().length;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  get: get,
  set: set,
  keys: keys,
  size: size
});

/***/ }),

/***/ "./src/diagrams/state/parser/stateDiagram.jison":
/*!******************************************************!*\
  !*** ./src/diagrams/state/parser/stateDiagram.jison ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,2],$V1=[1,3],$V2=[1,4],$V3=[2,4],$V4=[1,9],$V5=[1,11],$V6=[1,13],$V7=[1,14],$V8=[1,15],$V9=[1,16],$Va=[1,21],$Vb=[1,17],$Vc=[1,18],$Vd=[1,19],$Ve=[1,20],$Vf=[1,22],$Vg=[1,4,5,13,14,16,18,19,21,22,23,24,25,28],$Vh=[1,4,5,11,12,13,14,16,18,19,21,22,23,24,25,28],$Vi=[4,5,13,14,16,18,19,21,22,23,24,25,28];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"SPACE":4,"NL":5,"SD":6,"document":7,"line":8,"statement":9,"idStatement":10,"DESCR":11,"-->":12,"HIDE_EMPTY":13,"scale":14,"WIDTH":15,"COMPOSIT_STATE":16,"STRUCT_START":17,"STRUCT_STOP":18,"STATE_DESCR":19,"AS":20,"ID":21,"FORK":22,"JOIN":23,"CONCURRENT":24,"note":25,"notePosition":26,"NOTE_TEXT":27,"EDGE_STATE":28,"left_of":29,"right_of":30,"$accept":0,"$end":1},
terminals_: {2:"error",4:"SPACE",5:"NL",6:"SD",11:"DESCR",12:"-->",13:"HIDE_EMPTY",14:"scale",15:"WIDTH",16:"COMPOSIT_STATE",17:"STRUCT_START",18:"STRUCT_STOP",19:"STATE_DESCR",20:"AS",21:"ID",22:"FORK",23:"JOIN",24:"CONCURRENT",25:"note",27:"NOTE_TEXT",28:"EDGE_STATE",29:"left_of",30:"right_of"},
productions_: [0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,4],[9,4],[10,1],[10,1],[26,1],[26,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 3:
 /*console.warn('Root document', $$[$0]);*/ yy.setRootDoc($$[$0]);return $$[$0]; 
break;
case 4:
 this.$ = [] 
break;
case 5:

        if($$[$0]!='nl'){
            $$[$0-1].push($$[$0]);this.$ = $$[$0-1]
        }
        // console.warn('Got document',$$[$0-1], $$[$0]);
    
break;
case 6: case 7:
 this.$ = $$[$0] 
break;
case 8:
 this.$='nl';
break;
case 9:
 /*console.warn('got id and descr', $$[$0]);*/this.$={ stmt: 'state', id: $$[$0], type: 'default', description: ''};
break;
case 10:
 /*console.warn('got id and descr', $$[$0-1], $$[$0].trim());*/this.$={ stmt: 'state', id: $$[$0-1], type: 'default', description: yy.trimColon($$[$0])};
break;
case 11:

        /*console.warn('got id', $$[$0-2]);yy.addRelation($$[$0-2], $$[$0]);*/
        this.$={ stmt: 'relation', state1: { stmt: 'state', id: $$[$0-2], type: 'default', description: '' }, state2:{ stmt: 'state', id: $$[$0] ,type: 'default', description: ''}};
    
break;
case 12:

        /*yy.addRelation($$[$0-3], $$[$0-1], $$[$0].substr(1).trim());*/
        this.$={ stmt: 'relation', state1: { stmt: 'state', id: $$[$0-3], type: 'default', description: '' }, state2:{ stmt: 'state', id: $$[$0-1] ,type: 'default', description: ''}, description: $$[$0].substr(1).trim()};
    
break;
case 16:


        /* console.warn('Adding document for state without id ', $$[$0-3]);*/
        this.$={ stmt: 'state', id: $$[$0-3], type: 'default', description: '', doc: $$[$0-1] }
    
break;
case 17:

        var id=$$[$0];
        var description = $$[$0-2].trim();
        if($$[$0].match(':')){
            var parts = $$[$0].split(':');
            id=parts[0];
            description = [description, parts[1]];
        }
        this.$={stmt: 'state', id: id, type: 'default', description: description};

    
break;
case 18:

         //console.warn('Adding document for state with id ', $$[$0-3], $$[$0-2]); yy.addDocument($$[$0-3]);
         this.$={ stmt: 'state', id: $$[$0-3], type: 'default', description: $$[$0-5], doc: $$[$0-1] }
    
break;
case 19:

        this.$={ stmt: 'state', id: $$[$0], type: 'fork' }
    
break;
case 20:

        this.$={ stmt: 'state', id: $$[$0], type: 'join' }
    
break;
case 21:

        this.$={ stmt: 'state', id: yy.getDividerId(), type: 'divider' }
    
break;
case 22:

        /*console.warn('got NOTE, position: ', $$[$0-2].trim(), 'id = ', $$[$0-1].trim(), 'note: ', $$[$0]);*/
        this.$={ stmt: 'state', id: $$[$0-1].trim(), note:{position: $$[$0-2].trim(), text: $$[$0].trim()}};
    
break;
case 24: case 25:
this.$=$$[$0];
break;
}
},
table: [{3:1,4:$V0,5:$V1,6:$V2},{1:[3]},{3:5,4:$V0,5:$V1,6:$V2},{3:6,4:$V0,5:$V1,6:$V2},o([1,4,5,13,14,16,19,21,22,23,24,25,28],$V3,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,5]),{9:23,10:12,13:$V6,14:$V7,16:$V8,19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,7]),o($Vg,[2,8]),o($Vg,[2,9],{11:[1,24],12:[1,25]}),o($Vg,[2,13]),{15:[1,26]},o($Vg,[2,15],{17:[1,27]}),{20:[1,28]},o($Vg,[2,19]),o($Vg,[2,20]),o($Vg,[2,21]),{26:29,27:[1,30],29:[1,31],30:[1,32]},o($Vh,[2,24]),o($Vh,[2,25]),o($Vg,[2,6]),o($Vg,[2,10]),{10:33,21:$Va,28:$Vf},o($Vg,[2,14]),o($Vi,$V3,{7:34}),{21:[1,35]},{21:[1,36]},{20:[1,37]},{21:[2,26]},{21:[2,27]},o($Vg,[2,11],{11:[1,38]}),{4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,18:[1,39],19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,17],{17:[1,40]}),{27:[1,41]},{21:[1,42]},o($Vg,[2,12]),o($Vg,[2,16]),o($Vi,$V3,{7:43}),o($Vg,[2,22]),o($Vg,[2,23]),{4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,18:[1,44],19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,18])],
defaultActions: {5:[2,1],6:[2,2],31:[2,26],32:[2,27]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 5;
break;
case 1:/* skip all whitespace */
break;
case 2:/* skip same-line whitespace */
break;
case 3:/* skip comments */
break;
case 4:/* skip comments */
break;
case 5: this.pushState('SCALE'); /* console.log('Got scale', yy_.yytext);*/ return 14; 
break;
case 6:return 15;
break;
case 7:this.popState();
break;
case 8: this.pushState('STATE'); 
break;
case 9:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim(); /*console.warn('Fork Fork: ',yy_.yytext);*/return 22;
break;
case 10:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yy_.yytext);*/return 23;
break;
case 11:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Fork: ',yy_.yytext);*/return 22;
break;
case 12:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yy_.yytext);*/return 23;
break;
case 13:this.begin("STATE_STRING");
break;
case 14:this.popState();this.pushState('STATE_ID');return "AS";
break;
case 15:this.popState();/* console.log('STATE_ID', yy_.yytext);*/return "ID";
break;
case 16:this.popState();
break;
case 17: /*console.log('Long description:', yy_.yytext);*/return "STATE_DESCR";
break;
case 18:/*console.log('COMPOSIT_STATE', yy_.yytext);*/return 16;
break;
case 19:this.popState();
break;
case 20:this.popState();this.pushState('struct'); /*console.log('begin struct', yy_.yytext);*/return 17;
break;
case 21: /*console.log('Ending struct');*/ this.popState(); return 18;
break;
case 22:/* nothing */
break;
case 23: this.begin('NOTE'); return 25; 
break;
case 24: this.popState();this.pushState('NOTE_ID');return 29;
break;
case 25: this.popState();this.pushState('NOTE_ID');return 30;
break;
case 26: this.popState();this.pushState('FLOATING_NOTE');
break;
case 27:this.popState();this.pushState('FLOATING_NOTE_ID');return "AS";
break;
case 28:/**/
break;
case 29: /*console.log('Floating note text: ', yy_.yytext);*/return "NOTE_TEXT";
break;
case 30:this.popState();/*console.log('Floating note ID', yy_.yytext);*/return "ID";
break;
case 31: this.popState();this.pushState('NOTE_TEXT');/*console.log('Got ID for note', yy_.yytext);*/return 21;
break;
case 32: this.popState();/*console.log('Got NOTE_TEXT for note',yy_.yytext);*/yy_.yytext = yy_.yytext.substr(2).trim();return 27;
break;
case 33: this.popState();/*console.log('Got NOTE_TEXT for note',yy_.yytext);*/yy_.yytext = yy_.yytext.slice(0,-8).trim();return 27;
break;
case 34: /*console.log('Got state diagram', yy_.yytext,'#');*/return 6; 
break;
case 35: /*console.log('Got state diagram', yy_.yytext,'#');*/return 6; 
break;
case 36: /*console.log('HIDE_EMPTY', yy_.yytext,'#');*/return 13; 
break;
case 37: /*console.log('EDGE_STATE=',yy_.yytext);*/ return 28;
break;
case 38: /*console.log('=>ID=',yy_.yytext);*/ return 21;
break;
case 39: yy_.yytext = yy_.yytext.trim(); /*console.log('Descr = ', yy_.yytext);*/ return 11; 
break;
case 40:return 12;
break;
case 41:return 24;
break;
case 42:return 5;
break;
case 43:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:\s*[^:;]+end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"LINE":{"rules":[2,3],"inclusive":false},"struct":{"rules":[2,3,8,21,22,23,37,38,39,40,41],"inclusive":false},"FLOATING_NOTE_ID":{"rules":[30],"inclusive":false},"FLOATING_NOTE":{"rules":[27,28,29],"inclusive":false},"NOTE_TEXT":{"rules":[32,33],"inclusive":false},"NOTE_ID":{"rules":[31],"inclusive":false},"NOTE":{"rules":[24,25,26],"inclusive":false},"SCALE":{"rules":[6,7],"inclusive":false},"ALIAS":{"rules":[],"inclusive":false},"STATE_ID":{"rules":[15],"inclusive":false},"STATE_STRING":{"rules":[16,17],"inclusive":false},"FORK_STATE":{"rules":[],"inclusive":false},"STATE":{"rules":[2,3,9,10,11,12,13,14,18,19,20],"inclusive":false},"ID":{"rules":[2,3],"inclusive":false},"INITIAL":{"rules":[0,1,3,4,5,8,20,23,34,35,36,37,38,39,40,42,43],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/state/shapes.js":
/*!**************************************!*\
  !*** ./src/diagrams/state/shapes.js ***!
  \**************************************/
/*! exports provided: drawStartState, drawDivider, drawSimpleState, drawDescrState, addTitleAndBox, drawText, drawNote, drawState, drawEdge */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawStartState", function() { return drawStartState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawDivider", function() { return drawDivider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawSimpleState", function() { return drawSimpleState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawDescrState", function() { return drawDescrState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTitleAndBox", function() { return addTitleAndBox; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawText", function() { return drawText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawNote", function() { return drawNote; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawState", function() { return drawState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawEdge", function() { return drawEdge; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _id_cache_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./id-cache.js */ "./src/diagrams/state/id-cache.js");
/* harmony import */ var _stateDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");






 // let conf;

/**
 * Draws a start state as a black circle
 */

var drawStartState = function drawStartState(g) {
  return g.append('circle').style('stroke', 'black').style('fill', 'black').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit);
};
/**
 * Draws a start state as a black circle
 */

var drawDivider = function drawDivider(g) {
  return g.append('line').style('stroke', 'grey').style('stroke-dasharray', '3').attr('x1', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight).attr('class', 'divider').attr('x2', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight * 2).attr('y1', 0).attr('y2', 0);
};
/**
 * Draws a an end state as a black circle
 */

var drawSimpleState = function drawSimpleState(g, stateDef) {
  var state = g.append('text').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.id);
  var classBox = state.node().getBBox();
  g.insert('rect', ':first-child').attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('width', classBox.width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('height', classBox.height + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.radius);
  return state;
};
/**
 * Draws a state with descriptions
 * @param {*} g
 * @param {*} stateDef
 */

var drawDescrState = function drawDescrState(g, stateDef) {
  var addTspan = function addTspan(textEl, txt, isFirst) {
    var tSpan = textEl.append('tspan').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).text(txt);

    if (!isFirst) {
      tSpan.attr('dy', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight);
    }
  };

  var title = g.append('text').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight + 1.3 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.descriptions[0]);
  var titleBox = title.node().getBBox();
  var titleHeight = titleBox.height;
  var description = g.append('text') // text label for the x axis
  .attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding * 0.4 + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.dividerMargin + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight).attr('class', 'state-description');
  var isFirst = true;
  var isSecond = true;
  stateDef.descriptions.forEach(function (descr) {
    if (!isFirst) {
      addTspan(description, descr, isSecond);
      isSecond = false;
    }

    isFirst = false;
  });
  var descrLine = g.append('line') // text label for the x axis
  .attr('x1', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y1', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.dividerMargin / 2).attr('y2', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.dividerMargin / 2).attr('class', 'descr-divider');
  var descrBox = description.node().getBBox();
  var width = Math.max(descrBox.width, titleBox.width);
  descrLine.attr('x2', width + 3 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding); // const classBox = title.node().getBBox();

  g.insert('rect', ':first-child').attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('width', width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('height', descrBox.height + titleHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.radius);
  return g;
};
/**
 * Adds the creates a box around the existing content and adds a
 * panel for the id on top of the content.
 */

/**
 * Function that creates an title row and a frame around a substate for a composit state diagram.
 * The function returns a new d3 svg object with updated width and height properties;
 * @param {*} g The d3 svg object for the substate to framed
 * @param {*} stateDef The info about the
 */

var addTitleAndBox = function addTitleAndBox(g, stateDef, altBkg) {
  var pad = Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding;
  var dblPad = 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding;
  var orgBox = g.node().getBBox();
  var orgWidth = orgBox.width;
  var orgX = orgBox.x;
  var title = g.append('text').attr('x', 0).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.titleShift).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.id);
  var titleBox = title.node().getBBox();
  var titleWidth = titleBox.width + dblPad;
  var width = Math.max(titleWidth, orgWidth); // + dblPad;

  if (width === orgWidth) {
    width = width + dblPad;
  }

  var startX; // const lineY = 1 - getConfig().state.textHeight;
  // const descrLine = g
  //   .append('line') // text label for the x axis
  //   .attr('x1', 0)
  //   .attr('y1', lineY)
  //   .attr('y2', lineY)
  //   .attr('class', 'descr-divider');

  var graphBox = g.node().getBBox(); // console.warn(width / 2, titleWidth / 2, getConfig().state.padding, orgBox);
  // descrLine.attr('x2', graphBox.width + getConfig().state.padding);

  if (stateDef.doc) {// cnsole.warn(
    //   stateDef.id,
    //   'orgX: ',
    //   orgX,
    //   'width: ',
    //   width,
    //   'titleWidth: ',
    //   titleWidth,
    //   'orgWidth: ',
    //   orgWidth,
    //   'width',
    //   width
    // );
  }

  startX = orgX - pad;

  if (titleWidth > orgWidth) {
    startX = (orgWidth - width) / 2 + pad;
  }

  if (Math.abs(orgX - graphBox.x) < pad) {
    if (titleWidth > orgWidth) {
      startX = orgX - (titleWidth - orgWidth) / 2;
    }
  }

  var lineY = 1 - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight; // White color

  g.insert('rect', ':first-child').attr('x', startX).attr('y', lineY).attr('class', altBkg ? 'alt-composit' : 'composit').attr('width', width).attr('height', graphBox.height + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.titleShift + 1).attr('rx', '0');
  title.attr('x', startX + pad);
  if (titleWidth <= orgWidth) title.attr('x', orgX + (width - dblPad) / 2 - titleWidth / 2 + pad); // Title background

  g.insert('rect', ':first-child').attr('x', startX).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.titleShift - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('width', width) // Just needs to be higher then the descr line, will be clipped by the white color box
  .attr('height', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight * 3).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.radius); // Full background

  g.insert('rect', ':first-child').attr('x', startX).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.titleShift - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('width', width).attr('height', graphBox.height + 3 + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.textHeight).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.radius);
  return g;
};

var drawEndState = function drawEndState(g) {
  g.append('circle').style('stroke', 'black').style('fill', 'white').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.miniPadding).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.miniPadding).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.miniPadding);
  return g.append('circle').style('stroke', 'black').style('fill', 'black').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit + 2).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.sizeUnit + 2);
};

var drawForkJoinState = function drawForkJoinState(g, stateDef) {
  var width = Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.forkWidth;
  var height = Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.forkHeight;

  if (stateDef.parentId) {
    var tmp = width;
    width = height;
    height = tmp;
  }

  return g.append('rect').style('stroke', 'black').style('fill', 'black').attr('width', width).attr('height', height).attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding);
};

var drawText = function drawText(elem, textData) {
  // Remove and ignore br:s
  var nText = textData.text.replace(_common_common__WEBPACK_IMPORTED_MODULE_4__["default"].lineBreakRegex, ' ');
  var textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.attr('fill', textData.fill);

  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  var span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);
  return textElem;
};

var _drawLongText = function _drawLongText(_text, x, y, g) {
  var textHeight = 0;
  var textElem = g.append('text');
  textElem.style('text-anchor', 'start');
  textElem.attr('class', 'noteText');

  var text = _text.replace(/\r\n/g, '<br/>');

  text = text.replace(/\n/g, '<br/>');
  var lines = text.split(_common_common__WEBPACK_IMPORTED_MODULE_4__["default"].lineBreakRegex);
  var tHeight = 1.25 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.noteMargin;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _line = _step.value;

      var txt = _line.trim();

      if (txt.length > 0) {
        var span = textElem.append('tspan');
        span.text(txt);

        if (tHeight === 0) {
          var textBounds = span.node().getBBox();
          tHeight += textBounds.height;
        } // console.warn('textBounds', textBounds);


        textHeight += tHeight;
        span.attr('x', x + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.noteMargin);
        span.attr('y', y + textHeight + 1.25 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.noteMargin);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    textWidth: textElem.node().getBBox().width,
    textHeight: textHeight
  };
};
/**
 * Draws a note to the diagram
 * @param text - The text of the given note.
 * @param g - The element the note is attached to.
 */


var drawNote = function drawNote(text, g) {
  g.attr('class', 'state-note');
  var note = g.append('rect').attr('x', 0).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding);
  var rectElem = g.append('g');

  var _drawLongText2 = _drawLongText(text, 0, 0, rectElem),
      textWidth = _drawLongText2.textWidth,
      textHeight = _drawLongText2.textHeight;

  note.attr('height', textHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.noteMargin);
  note.attr('width', textWidth + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.noteMargin * 2);
  return note;
};
/**
 * Starting point for drawing a state. The function finds out the specifics
 * about the state and renders with approprtiate function.
 * @param {*} elem
 * @param {*} stateDef
 */

var drawState = function drawState(elem, stateDef) {
  var id = stateDef.id;
  var stateInfo = {
    id: id,
    label: stateDef.id,
    width: 0,
    height: 0
  };
  var g = elem.append('g').attr('id', id).attr('class', 'stateGroup');
  if (stateDef.type === 'start') drawStartState(g);
  if (stateDef.type === 'end') drawEndState(g);
  if (stateDef.type === 'fork' || stateDef.type === 'join') drawForkJoinState(g, stateDef);
  if (stateDef.type === 'note') drawNote(stateDef.note.text, g);
  if (stateDef.type === 'divider') drawDivider(g);
  if (stateDef.type === 'default' && stateDef.descriptions.length === 0) drawSimpleState(g, stateDef);
  if (stateDef.type === 'default' && stateDef.descriptions.length > 0) drawDescrState(g, stateDef);
  var stateBox = g.node().getBBox();
  stateInfo.width = stateBox.width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding;
  stateInfo.height = stateBox.height + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding;
  _id_cache_js__WEBPACK_IMPORTED_MODULE_1__["default"].set(id, stateInfo); // stateCnt++;

  return stateInfo;
};
var edgeCount = 0;
var drawEdge = function drawEdge(elem, path, relation) {
  var getRelationType = function getRelationType(type) {
    switch (type) {
      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.AGGREGATION:
        return 'aggregation';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.EXTENSION:
        return 'extension';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.COMPOSITION:
        return 'composition';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(function (p) {
    return !Number.isNaN(p.y);
  }); // The data for our line

  var lineData = path.points; // This is the accessor function we talked about above

  var lineFunction = Object(d3__WEBPACK_IMPORTED_MODULE_0__["line"])().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var svgPath = elem.append('path').attr('d', lineFunction(lineData)).attr('id', 'edge' + edgeCount).attr('class', 'transition');
  var url = '';

  if (Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  svgPath.attr('marker-end', 'url(' + url + '#' + getRelationType(_stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.DEPENDENCY) + 'End' + ')');

  if (typeof relation.title !== 'undefined') {
    var label = elem.append('g').attr('class', 'stateLabel');

    var _utils$calcLabelPosit = _utils__WEBPACK_IMPORTED_MODULE_3__["default"].calcLabelPosition(path.points),
        x = _utils$calcLabelPosit.x,
        y = _utils$calcLabelPosit.y;

    var rows = _common_common__WEBPACK_IMPORTED_MODULE_4__["default"].getRows(relation.title); // console.warn(rows);

    var titleHeight = 0;
    var titleRows = [];
    var maxWidth = 0;
    var minX = 0;

    for (var i = 0; i <= rows.length; i++) {
      var title = label.append('text').attr('text-anchor', 'middle').text(rows[i]).attr('x', x).attr('y', y + titleHeight);
      var boundstmp = title.node().getBBox();
      maxWidth = Math.max(maxWidth, boundstmp.width);
      minX = Math.min(minX, boundstmp.x);
      _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info(boundstmp.x, x, y + titleHeight);

      if (titleHeight === 0) {
        var titleBox = title.node().getBBox();
        titleHeight = titleBox.height;
        _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Title height', titleHeight, y);
      }

      titleRows.push(title);
    }

    var boxHeight = titleHeight * rows.length;

    if (rows.length > 1) {
      var heightAdj = (rows.length - 1) * titleHeight * 0.5;
      titleRows.forEach(function (title, i) {
        return title.attr('y', y + i * titleHeight - heightAdj);
      });
      boxHeight = titleHeight * rows.length;
    }

    var bounds = label.node().getBBox();
    label.insert('rect', ':first-child').attr('class', 'box').attr('x', x - maxWidth / 2 - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding / 2).attr('y', y - boxHeight / 2 - Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding / 2 - 3.5).attr('width', maxWidth + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding).attr('height', boxHeight + Object(_config__WEBPACK_IMPORTED_MODULE_5__["getConfig"])().state.padding);
    _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info(bounds); //label.attr('transform', '0 -' + (bounds.y / 2));
    // Debug points
    // path.points.forEach(point => {
    //   g.append('circle')
    //     .style('stroke', 'red')
    //     .style('fill', 'red')
    //     .attr('r', 1)
    //     .attr('cx', point.x)
    //     .attr('cy', point.y);
    // });
    // g.append('circle')
    //   .style('stroke', 'blue')
    //   .style('fill', 'blue')
    //   .attr('r', 1)
    //   .attr('cx', x)
    //   .attr('cy', y);
  }

  edgeCount++;
};

/***/ }),

/***/ "./src/diagrams/state/stateDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/state/stateDb.js ***!
  \***************************************/
/*! exports provided: addState, clear, getState, getStates, logDocuments, getRelations, addRelation, cleanupLabel, lineType, relationType, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addState", function() { return addState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getState", function() { return getState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getStates", function() { return getStates; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "logDocuments", function() { return logDocuments; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRelations", function() { return getRelations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addRelation", function() { return addRelation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cleanupLabel", function() { return cleanupLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lineType", function() { return lineType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "relationType", function() { return relationType; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }




var clone = function clone(o) {
  return JSON.parse(JSON.stringify(o));
};

var rootDoc = [];

var setRootDoc = function setRootDoc(o) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Setting root doc', o); // rootDoc = { id: 'root', doc: o };

  rootDoc = o;
};

var getRootDoc = function getRootDoc() {
  return rootDoc;
};

var docTranslator = function docTranslator(parent, node, first) {
  if (node.stmt === 'relation') {
    docTranslator(parent, node.state1, true);
    docTranslator(parent, node.state2, false);
  } else {
    if (node.stmt === 'state') {
      if (node.id === '[*]') {
        node.id = first ? parent.id + '_start' : parent.id + '_end';
        node.start = first;
      }
    }

    if (node.doc) {
      var doc = []; // Check for concurrency

      var i = 0;
      var currentDoc = [];

      for (i = 0; i < node.doc.length; i++) {
        if (node.doc[i].type === 'divider') {
          // debugger;
          var newNode = clone(node.doc[i]);
          newNode.doc = clone(currentDoc);
          doc.push(newNode);
          currentDoc = [];
        } else {
          currentDoc.push(node.doc[i]);
        }
      } // If any divider was encountered


      if (doc.length > 0 && currentDoc.length > 0) {
        var _newNode = {
          stmt: 'state',
          id: Object(_utils__WEBPACK_IMPORTED_MODULE_1__["generateId"])(),
          type: 'divider',
          doc: clone(currentDoc)
        };
        doc.push(clone(_newNode));
        node.doc = doc;
      }

      node.doc.forEach(function (docNode) {
        return docTranslator(node, docNode, true);
      });
    }
  }
};

var getRootDocV2 = function getRootDocV2() {
  docTranslator({
    id: 'root'
  }, {
    id: 'root',
    doc: rootDoc
  }, true);
  return {
    id: 'root',
    doc: rootDoc
  };
};

var extract = function extract(_doc) {
  // const res = { states: [], relations: [] };
  var doc;

  if (_doc.doc) {
    doc = _doc.doc;
  } else {
    doc = _doc;
  } // let doc = root.doc;
  // if (!doc) {
  //   doc = root;
  // }


  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info(doc);
  clear();
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Extract', doc);
  doc.forEach(function (item) {
    if (item.stmt === 'state') {
      addState(item.id, item.type, item.doc, item.description, item.note);
    }

    if (item.stmt === 'relation') {
      addRelation(item.state1.id, item.state2.id, item.description);
    }
  });
};

var newDoc = function newDoc() {
  return {
    relations: [],
    states: {},
    documents: {}
  };
};

var documents = {
  root: newDoc()
};
var currentDocument = documents.root;
var startCnt = 0;
var endCnt = 0; // eslint-disable-line
// let stateCnt = 0;

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */

var addState = function addState(id, type, doc, descr, note) {
  if (typeof currentDocument.states[id] === 'undefined') {
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type: type,
      doc: doc,
      note: note
    };
  } else {
    if (!currentDocument.states[id].doc) {
      currentDocument.states[id].doc = doc;
    }

    if (!currentDocument.states[id].type) {
      currentDocument.states[id].type = type;
    }
  }

  if (descr) {
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Adding state ', id, descr);
    if (typeof descr === 'string') addDescription(id, descr.trim());

    if (_typeof(descr) === 'object') {
      descr.forEach(function (des) {
        return addDescription(id, des.trim());
      });
    }
  }

  if (note) currentDocument.states[id].note = note;
};
var clear = function clear() {
  documents = {
    root: newDoc()
  };
  currentDocument = documents.root;
  currentDocument = documents.root;
  startCnt = 0;
  endCnt = 0; // eslint-disable-line

  classes = [];
};
var getState = function getState(id) {
  return currentDocument.states[id];
};
var getStates = function getStates() {
  return currentDocument.states;
};
var logDocuments = function logDocuments() {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Documents = ', documents);
};
var getRelations = function getRelations() {
  return currentDocument.relations;
};
var addRelation = function addRelation(_id1, _id2, title) {
  var id1 = _id1;
  var id2 = _id2;
  var type1 = 'default';
  var type2 = 'default';

  if (_id1 === '[*]') {
    startCnt++;
    id1 = 'start' + startCnt;
    type1 = 'start';
  }

  if (_id2 === '[*]') {
    endCnt++;
    id2 = 'end' + startCnt;
    type2 = 'end';
  }

  addState(id1, type1);
  addState(id2, type2);
  currentDocument.relations.push({
    id1: id1,
    id2: id2,
    title: title
  });
};

var addDescription = function addDescription(id, _descr) {
  var theState = currentDocument.states[id];
  var descr = _descr;

  if (descr[0] === ':') {
    descr = descr.substr(1).trim();
  }

  theState.descriptions.push(descr);
};

var cleanupLabel = function cleanupLabel(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};
var lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};
var dividerCnt = 0;

var getDividerId = function getDividerId() {
  dividerCnt++;
  return 'divider-id-' + dividerCnt;
};

var classes = [];

var getClasses = function getClasses() {
  return classes;
};

var getDirection = function getDirection() {
  return 'TB';
};

var relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};

var trimColon = function trimColon(str) {
  return str && str[0] === ':' ? str.substr(1).trim() : str.trim();
};

/* harmony default export */ __webpack_exports__["default"] = ({
  addState: addState,
  clear: clear,
  getState: getState,
  getStates: getStates,
  getRelations: getRelations,
  getClasses: getClasses,
  getDirection: getDirection,
  addRelation: addRelation,
  getDividerId: getDividerId,
  // addDescription,
  cleanupLabel: cleanupLabel,
  lineType: lineType,
  relationType: relationType,
  logDocuments: logDocuments,
  getRootDoc: getRootDoc,
  setRootDoc: setRootDoc,
  getRootDocV2: getRootDocV2,
  extract: extract,
  trimColon: trimColon
});

/***/ }),

/***/ "./src/diagrams/state/stateRenderer-v2.js":
/*!************************************************!*\
  !*** ./src/diagrams/state/stateRenderer-v2.js ***!
  \************************************************/
/*! exports provided: setConf, getClasses, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stateDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/stateDiagram */ "./src/diagrams/state/parser/stateDiagram.jison");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var _dagre_wrapper_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../dagre-wrapper/index.js */ "./src/dagre-wrapper/index.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");







var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);

  for (var i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};
var nodeDb = {};
/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */

var getClasses = function getClasses(text) {
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].trace('Extracting classes');
  _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition

  parser.parse(text);
  return _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getClasses();
};

var setupNode = function setupNode(g, parent, node, altFlag) {
  // Add the node
  if (node.id !== 'root') {
    var shape = 'rect';

    if (node.start === true) {
      shape = 'start';
    }

    if (node.start === false) {
      shape = 'end';
    }

    if (node.type !== 'default') {
      shape = node.type;
    }

    if (!nodeDb[node.id]) {
      nodeDb[node.id] = {
        id: node.id,
        shape: shape,
        description: node.id,
        classes: 'statediagram-state'
      };
    } // Build of the array of description strings accordinging


    if (node.description) {
      if (Array.isArray(nodeDb[node.id].description)) {
        // There already is an array of strings,add to it
        nodeDb[node.id].shape = 'rectWithTitle';
        nodeDb[node.id].description.push(node.description);
      } else {
        if (nodeDb[node.id].description.length > 0) {
          // if there is a description already transformit to an array
          nodeDb[node.id].shape = 'rectWithTitle';

          if (nodeDb[node.id].description === node.id) {
            // If the previous description was the is, remove it
            nodeDb[node.id].description = [node.description];
          } else {
            nodeDb[node.id].description = [nodeDb[node.id].description, node.description];
          }
        } else {
          nodeDb[node.id].shape = 'rect';
          nodeDb[node.id].description = node.description;
        }
      }
    } // Save data for description and group so that for instance a statement without description overwrites
    // one with description
    // group


    if (!nodeDb[node.id].type && node.doc) {
      _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Setting cluser for ', node.id);
      nodeDb[node.id].type = 'group';
      nodeDb[node.id].shape = node.type === 'divider' ? 'divider' : 'roundedWithTitle';
      nodeDb[node.id].classes = nodeDb[node.id].classes + ' ' + (altFlag ? 'statediagram-cluster statediagram-cluster-alt' : 'statediagram-cluster');
    }

    var nodeData = {
      labelStyle: '',
      shape: nodeDb[node.id].shape,
      labelText: nodeDb[node.id].description,
      classes: nodeDb[node.id].classes,
      //classStr,
      style: '',
      //styles.style,
      id: node.id,
      type: nodeDb[node.id].type,
      padding: 15 //getConfig().flowchart.padding

    };

    if (node.note) {
      // Todo: set random id
      var noteData = {
        labelStyle: '',
        shape: 'note',
        labelText: node.note.text,
        classes: 'statediagram-note',
        //classStr,
        style: '',
        //styles.style,
        id: node.id + '----note',
        type: nodeDb[node.id].type,
        padding: 15 //getConfig().flowchart.padding

      };
      var groupData = {
        labelStyle: '',
        shape: 'noteGroup',
        labelText: node.note.text,
        classes: nodeDb[node.id].classes,
        //classStr,
        style: '',
        //styles.style,
        id: node.id + '----parent',
        type: 'group',
        padding: 0 //getConfig().flowchart.padding

      };
      g.setNode(node.id + '----parent', groupData);
      g.setNode(noteData.id, noteData);
      g.setNode(node.id, nodeData);
      g.setParent(node.id, node.id + '----parent');
      g.setParent(noteData.id, node.id + '----parent');
      var from = node.id;
      var to = noteData.id;

      if (node.note.position === 'left of') {
        from = noteData.id;
        to = node.id;
      }

      g.setEdge(from, to, {
        arrowhead: 'none',
        arrowType: '',
        style: 'fill:none',
        labelStyle: '',
        classes: 'transition note-edge',
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        thickness: 'normal'
      });
    } else {
      g.setNode(node.id, nodeData);
    }
  }

  if (parent) {
    if (parent.id !== 'root') {
      _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Setting node ', node.id, ' to be child of its parent ', parent.id);
      g.setParent(node.id, parent.id);
    }
  }

  if (node.doc) {
    _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Adding nodes children ');
    setupDoc(g, node, node.doc, !altFlag);
  }
};

var cnt = 0;

var setupDoc = function setupDoc(g, parent, doc, altFlag) {
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].trace('items', doc);
  doc.forEach(function (item) {
    if (item.stmt === 'state' || item.stmt === 'default') {
      setupNode(g, parent, item, altFlag);
    } else if (item.stmt === 'relation') {
      setupNode(g, parent, item.state1, altFlag);
      setupNode(g, parent, item.state2, altFlag);
      var edgeData = {
        id: 'edge' + cnt,
        arrowhead: 'normal',
        arrowType: 'arrow_barb',
        style: 'fill:none',
        labelStyle: '',
        label: item.description,
        arrowheadStyle: 'fill: #333',
        labelpos: 'c',
        labelType: 'text',
        thickness: 'normal',
        classes: 'transition'
      };
      var startId = item.state1.id;
      var endId = item.state2.id;
      g.setEdge(startId, endId, edgeData, cnt);
      cnt++;
    }
  });
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */


var draw = function draw(text, id) {
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info('Drawing state diagram (v2)', id);
  _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  nodeDb = {};
  var parser = _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition

  try {
    parser.parse(text);
  } catch (err) {
    _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].debug('Parsing failed');
  } // Fetch the default direction, use TD if none was found


  var dir = _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getDirection();

  if (typeof dir === 'undefined') {
    dir = 'LR';
  }

  var conf = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state;
  var nodeSpacing = conf.nodeSpacing || 50;
  var rankSpacing = conf.rankSpacing || 50; // Create the input mermaid.graph

  var g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
    multigraph: true,
    compound: true
  }).setGraph({
    rankdir: 'TB',
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 8,
    marginy: 8
  }).setDefaultEdgeLabel(function () {
    return {};
  });
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info(_stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getRootDocV2());
  _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].extract(_stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getRootDocV2());
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].info(_stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getRootDocV2());
  setupNode(g, undefined, _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].getRootDocV2(), true); // Set up an SVG group so that we can translate the final graph.

  var svg = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])("[id=\"".concat(id, "\"]")); // Run the renderer. This is what draws the final graph.

  var element = Object(d3__WEBPACK_IMPORTED_MODULE_1__["select"])('#' + id + ' g');
  Object(_dagre_wrapper_index_js__WEBPACK_IMPORTED_MODULE_5__["render"])(element, g, ['barb'], 'statediagram', id);
  var padding = 8; // const svgBounds = svg.node().getBBox();
  // const width = svgBounds.width + padding * 2;
  // const height = svgBounds.height + padding * 2;
  // logger.debug(
  //   `new ViewBox 0 0 ${width} ${height}`,
  //   `translate(${padding + g._label.marginx}, ${padding + g._label.marginy})`
  // );
  // if (conf.useMaxWidth) {
  //   svg.attr('width', '100%');
  //   svg.attr('style', `max-width: ${width}px;`);
  // } else {
  //   svg.attr('height', height);
  //   svg.attr('width', width);
  // }
  // svg.attr('viewBox', `0 0 ${width} ${height}`);
  // svg
  //   .select('g')
  //   .attr('transform', `translate(${padding - g._label.marginx}, ${padding - svgBounds.y})`);

  var bounds = svg.node().getBBox();
  var width = bounds.width + padding * 2;
  var height = bounds.height + padding * 2; // diagram.attr('height', '100%');
  // diagram.attr('style', `width: ${bounds.width * 3 + conf.padding * 2};`);
  // diagram.attr('height', height);
  // Zoom in a bit

  svg.attr('width', width * 1.75);
  svg.attr('class', 'statediagram'); // diagram.attr('height', bounds.height * 3 + conf.padding * 2);
  // svg.attr(
  //   'viewBox',
  //   `${bounds.x - conf.padding}  ${bounds.y - conf.padding} ` + width + ' ' + height
  // );

  var svgBounds = svg.node().getBBox();

  if (conf.useMaxWidth) {
    svg.attr('width', '100%');
    svg.attr('style', "max-width: ".concat(width, "px;"));
  } else {
    svg.attr('height', height);
    svg.attr('width', width);
  } // Ensure the viewBox includes the whole svgBounds area with extra space for padding


  var vBox = "".concat(svgBounds.x - padding, " ").concat(svgBounds.y - padding, " ").concat(width, " ").concat(height);
  _logger__WEBPACK_IMPORTED_MODULE_6__["logger"].debug("viewBox ".concat(vBox));
  svg.attr('viewBox', vBox); // Add label rects for non html labels

  if (!conf.htmlLabels) {
    var labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');

    for (var k = 0; k < labels.length; k++) {
      var label = labels[k]; // Get dimensions of label

      var dim = label.getBBox();
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      rect.setAttribute('style', 'fill:#e8e8e8;');
      label.insertBefore(rect, label.firstChild);
    }
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  getClasses: getClasses,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/state/stateRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/state/stateRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _stateDb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _common_common__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./parser/stateDiagram */ "./src/diagrams/state/parser/stateDiagram.jison");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./shapes */ "./src/diagrams/state/shapes.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../config */ "./src/config.js");






 // import idCache from './id-cache';



_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].yy = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"]; // TODO Move conf object to main conf in mermaidAPI

var conf;
var transformationLog = {};
var setConf = function setConf() {}; // Todo optimize

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertMarkers = function insertMarkers(elem) {
  elem.append('defs').append('marker').attr('id', 'dependencyEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */


var draw = function draw(text, id) {
  conf = Object(_config__WEBPACK_IMPORTED_MODULE_8__["getConfig"])().state;
  _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].yy.clear();
  _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].parse(text);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Rendering diagram ' + text); // Fetch the default direction, use TD if none was found

  var diagram = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id='".concat(id, "']"));
  insertMarkers(diagram); // Layout graph, Create a new directed graph

  var graph = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    multigraph: true,
    compound: true,
    // acyclicer: 'greedy',
    rankdir: 'RL' // ranksep: '20'

  }); // Default to assigning a new object as a label for each new edge.

  graph.setDefaultEdgeLabel(function () {
    return {};
  });
  var rootDoc = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRootDoc();
  renderDoc(rootDoc, diagram, undefined, false);
  var padding = conf.padding;
  var bounds = diagram.node().getBBox();
  var width = bounds.width + padding * 2;
  var height = bounds.height + padding * 2;

  if (conf.useMaxWidth) {
    diagram.attr('width', '100%');
    diagram.attr('style', "max-width: ".concat(width * 1.75, "px;"));
  } else {
    // Zoom in a bit
    diagram.attr('width', width * 1.75);
  } // diagram.attr('height', bounds.height * 3 + conf.padding * 2);


  diagram.attr('viewBox', "".concat(bounds.x - conf.padding, "  ").concat(bounds.y - conf.padding, " ") + width + ' ' + height);
};

var getLabelWidth = function getLabelWidth(text) {
  return text ? text.length * conf.fontSizeFactor : 1;
};

var renderDoc = function renderDoc(doc, diagram, parentId, altBkg) {
  // // Layout graph, Create a new directed graph
  var graph = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    compound: true,
    multigraph: true
  });
  var i;
  var edgeFreeDoc = true;

  for (i = 0; i < doc.length; i++) {
    if (doc[i].stmt === 'relation') {
      edgeFreeDoc = false;
      break;
    }
  } // Set an object for the graph label


  if (parentId) graph.setGraph({
    rankdir: 'LR',
    multigraph: true,
    compound: true,
    // acyclicer: 'greedy',
    ranker: 'tight-tree',
    ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
    nodeSep: edgeFreeDoc ? 1 : 50,
    isMultiGraph: true // ranksep: 5,
    // nodesep: 1

  });else {
    graph.setGraph({
      rankdir: 'TB',
      multigraph: true,
      compound: true,
      // isCompound: true,
      // acyclicer: 'greedy',
      // ranker: 'longest-path'
      ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
      nodeSep: edgeFreeDoc ? 1 : 50,
      ranker: 'tight-tree',
      // ranker: 'network-simplex'
      isMultiGraph: true
    });
  } // Default to assigning a new object as a label for each new edge.

  graph.setDefaultEdgeLabel(function () {
    return {};
  });
  _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].extract(doc);
  var states = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getStates();
  var relations = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRelations();
  var keys = Object.keys(states);
  var first = true;

  for (var _i = 0; _i < keys.length; _i++) {
    var stateDef = states[keys[_i]];

    if (parentId) {
      stateDef.parentId = parentId;
    }

    var node = void 0;

    if (stateDef.doc) {
      var sub = diagram.append('g').attr('id', stateDef.id).attr('class', 'stateGroup');
      node = renderDoc(stateDef.doc, sub, stateDef.id, !altBkg);

      if (first) {
        // first = false;
        sub = Object(_shapes__WEBPACK_IMPORTED_MODULE_7__["addTitleAndBox"])(sub, stateDef, altBkg);
        var boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height + conf.padding / 2;
        transformationLog[stateDef.id] = {
          y: conf.compositTitleSize
        };
      } else {
        // sub = addIdAndBox(sub, stateDef);
        var _boxBounds = sub.node().getBBox();

        node.width = _boxBounds.width;
        node.height = _boxBounds.height; // transformationLog[stateDef.id] = { y: conf.compositTitleSize };
      }
    } else {
      node = Object(_shapes__WEBPACK_IMPORTED_MODULE_7__["drawState"])(diagram, stateDef, graph);
    }

    if (stateDef.note) {
      // Draw note note
      var noteDef = {
        descriptions: [],
        id: stateDef.id + '-note',
        note: stateDef.note,
        type: 'note'
      };
      var note = Object(_shapes__WEBPACK_IMPORTED_MODULE_7__["drawState"])(diagram, noteDef, graph); // graph.setNode(node.id, node);

      if (stateDef.note.position === 'left of') {
        graph.setNode(node.id + '-note', note);
        graph.setNode(node.id, node);
      } else {
        graph.setNode(node.id, node);
        graph.setNode(node.id + '-note', note);
      } // graph.setNode(node.id);


      graph.setParent(node.id, node.id + '-group');
      graph.setParent(node.id + '-note', node.id + '-group');
    } else {
      // Add nodes to the graph. The first argument is the node id. The second is
      // metadata about the node. In this case we're going to add labels to each of
      // our nodes.
      graph.setNode(node.id, node);
    }
  }

  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Count=', graph.nodeCount(), graph);
  var cnt = 0;
  relations.forEach(function (relation) {
    cnt++;
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Setting edge', relation);
    graph.setEdge(relation.id1, relation.id2, {
      relation: relation,
      width: getLabelWidth(relation.title),
      height: conf.labelHeight * _common_common__WEBPACK_IMPORTED_MODULE_5__["default"].getRows(relation.title).length,
      labelpos: 'c'
    }, 'id' + cnt);
  });
  dagre__WEBPACK_IMPORTED_MODULE_1___default.a.layout(graph);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Graph after layout', graph.nodes());
  var svgElem = diagram.node();
  graph.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].warn('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
      Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + svgElem.id + ' #' + v).attr('transform', 'translate(' + (graph.node(v).x - graph.node(v).width / 2) + ',' + (graph.node(v).y + (transformationLog[v] ? transformationLog[v].y : 0) - graph.node(v).height / 2) + ' )');
      Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + svgElem.id + ' #' + v).attr('data-x-shift', graph.node(v).x - graph.node(v).width / 2);
      var dividers = document.querySelectorAll('#' + svgElem.id + ' #' + v + ' .divider');
      dividers.forEach(function (divider) {
        var parent = divider.parentElement;
        var pWidth = 0;
        var pShift = 0;

        if (parent) {
          if (parent.parentElement) pWidth = parent.parentElement.getBBox().width;
          pShift = parseInt(parent.getAttribute('data-x-shift'), 10);

          if (Number.isNaN(pShift)) {
            pShift = 0;
          }
        }

        divider.setAttribute('x1', 0 - pShift + 8);
        divider.setAttribute('x2', pWidth - pShift - 8);
      });
    } else {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('No Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    }
  });
  var stateBox = svgElem.getBBox();
  graph.edges().forEach(function (e) {
    if (typeof e !== 'undefined' && typeof graph.edge(e) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      Object(_shapes__WEBPACK_IMPORTED_MODULE_7__["drawEdge"])(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });
  stateBox = svgElem.getBBox();
  var stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0
  };
  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Doc rendered', stateInfo, graph);
  return stateInfo;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/user-journey/journeyDb.js":
/*!************************************************!*\
  !*** ./src/diagrams/user-journey/journeyDb.js ***!
  \************************************************/
/*! exports provided: clear, setTitle, getTitle, addSection, getSections, getTasks, addTask, addTaskOrg, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTitle", function() { return setTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitle", function() { return getTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSection", function() { return addSection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSections", function() { return getSections; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTasks", function() { return getTasks; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTask", function() { return addTask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTaskOrg", function() { return addTaskOrg; });
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var title = '';
var currentSection = '';
var sections = [];
var tasks = [];
var rawTasks = [];
var clear = function clear() {
  sections.length = 0;
  tasks.length = 0;
  currentSection = '';
  title = '';
  rawTasks.length = 0;
};
var setTitle = function setTitle(txt) {
  title = txt;
};
var getTitle = function getTitle() {
  return title;
};
var addSection = function addSection(txt) {
  currentSection = txt;
  sections.push(txt);
};
var getSections = function getSections() {
  return sections;
};
var getTasks = function getTasks() {
  var allItemsProcessed = compileTasks();
  var maxDepth = 100;
  var iterationCount = 0;

  while (!allItemsProcessed && iterationCount < maxDepth) {
    allItemsProcessed = compileTasks();
    iterationCount++;
  }

  tasks.push.apply(tasks, rawTasks);
  return tasks;
};

var updateActors = function updateActors() {
  var tempActors = [];
  tasks.forEach(function (task) {
    if (task.people) {
      tempActors.push.apply(tempActors, _toConsumableArray(task.people));
    }
  });
  var unique = new Set(tempActors);
  return _toConsumableArray(unique).sort();
};

var addTask = function addTask(descr, taskData) {
  var pieces = taskData.substr(1).split(':');
  var score = 0;
  var peeps = [];

  if (pieces.length === 1) {
    score = Number(pieces[0]);
    peeps = [];
  } else {
    score = Number(pieces[0]);
    peeps = pieces[1].split(',');
  }

  var peopleList = peeps.map(function (s) {
    return s.trim();
  });
  var rawTask = {
    section: currentSection,
    type: currentSection,
    people: peopleList,
    task: descr,
    score: score
  };
  rawTasks.push(rawTask);
};
var addTaskOrg = function addTaskOrg(descr) {
  var newTask = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: []
  };
  tasks.push(newTask);
};

var compileTasks = function compileTasks() {
  var compileTask = function compileTask(pos) {
    return rawTasks[pos].processed;
  };

  var allProcessed = true;

  for (var i = 0; i < rawTasks.length; i++) {
    compileTask(i);
    allProcessed = allProcessed && rawTasks[i].processed;
  }

  return allProcessed;
};

var getActors = function getActors() {
  return updateActors();
};

/* harmony default export */ __webpack_exports__["default"] = ({
  clear: clear,
  setTitle: setTitle,
  getTitle: getTitle,
  addSection: addSection,
  getSections: getSections,
  getTasks: getTasks,
  addTask: addTask,
  addTaskOrg: addTaskOrg,
  getActors: getActors
});

/***/ }),

/***/ "./src/diagrams/user-journey/journeyRenderer.js":
/*!******************************************************!*\
  !*** ./src/diagrams/user-journey/journeyRenderer.js ***!
  \******************************************************/
/*! exports provided: setConf, draw, bounds, drawTasks, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bounds", function() { return bounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawTasks", function() { return drawTasks; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _parser_journey__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser/journey */ "./src/diagrams/user-journey/parser/journey.jison");
/* harmony import */ var _parser_journey__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_parser_journey__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _journeyDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./journeyDb */ "./src/diagrams/user-journey/journeyDb.js");
/* harmony import */ var _svgDraw__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./svgDraw */ "./src/diagrams/user-journey/svgDraw.js");




_parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].yy = _journeyDb__WEBPACK_IMPORTED_MODULE_2__["default"];
var conf = {
  leftMargin: 150,
  diagramMarginX: 50,
  diagramMarginY: 20,
  // Margin between tasks
  taskMargin: 50,
  // Width of task boxes
  width: 150,
  // Height of task boxes
  height: 50,
  taskFontSize: 14,
  taskFontFamily: '"Open-Sans", "sans-serif"',
  // Margin around loop boxes
  boxMargin: 10,
  boxTextMargin: 5,
  noteMargin: 10,
  // Space between messages
  messageMargin: 35,
  // Multiline message alignment
  messageAlign: 'center',
  // Depending on css styling this might need adjustment
  // Projects the edge of the diagram downwards
  bottomMarginAdj: 1,
  // width of activation box
  activationWidth: 10,
  // text placement as: tspan | fo | old only text as before
  textPlacement: 'fo',
  actorColours: ['#8FBC8F', '#7CFC00', '#00FFFF', '#20B2AA', '#B0E0E6', '#FFFFE0'],
  sectionFills: ['#191970', '#8B008B', '#4B0082', '#2F4F4F', '#800000', '#8B4513', '#00008B'],
  sectionColours: ['#fff']
};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
var actors = {};

function drawActorLegend(diagram) {
  // Draw the actors
  var yPos = 60;
  Object.keys(actors).forEach(function (person) {
    var colour = actors[person];
    var circleData = {
      cx: 20,
      cy: yPos,
      r: 7,
      fill: colour,
      stroke: '#000'
    };
    _svgDraw__WEBPACK_IMPORTED_MODULE_3__["default"].drawCircle(diagram, circleData);
    var labelData = {
      x: 40,
      y: yPos + 7,
      fill: '#666',
      text: person
    };
    _svgDraw__WEBPACK_IMPORTED_MODULE_3__["default"].drawText(diagram, labelData);
    yPos += 20;
  });
}

var LEFT_MARGIN = conf.leftMargin;
var draw = function draw(text, id) {
  _parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.clear();
  _parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].parse(text + '\n');
  bounds.init();
  var diagram = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + id);
  diagram.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  _svgDraw__WEBPACK_IMPORTED_MODULE_3__["default"].initGraphics(diagram);
  var tasks = _parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTasks();
  var title = _parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTitle();
  var actorNames = _parser_journey__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getActors();

  for (var member in actors) {
    delete actors[member];
  }

  var actorPos = 0;
  actorNames.forEach(function (actorName) {
    actors[actorName] = conf.actorColours[actorPos % conf.actorColours.length];
    actorPos++;
  });
  drawActorLegend(diagram);
  bounds.insert(0, 0, LEFT_MARGIN, Object.keys(actors).length * 50);
  drawTasks(diagram, tasks, 0);
  var box = bounds.getBounds();

  if (title) {
    diagram.append('text').text(title).attr('x', LEFT_MARGIN).attr('font-size', '4ex').attr('font-weight', 'bold').attr('y', 25);
  }

  var height = box.stopy - box.starty + 2 * conf.diagramMarginY;
  var width = LEFT_MARGIN + box.stopx + 2 * conf.diagramMarginX;

  if (conf.useMaxWidth) {
    diagram.attr('height', '100%');
    diagram.attr('width', '100%');
    diagram.attr('style', 'max-width:' + width + 'px;');
  } else {
    diagram.attr('height', height);
    diagram.attr('width', width);
  } // Draw activity line


  diagram.append('line').attr('x1', LEFT_MARGIN).attr('y1', conf.height * 4) // One section head + one task + margins
  .attr('x2', width - LEFT_MARGIN - 4) // Subtract stroke width so arrow point is retained
  .attr('y2', conf.height * 4).attr('stroke-width', 4).attr('stroke', 'black').attr('marker-end', 'url(#arrowhead)');
  var extraVertForTitle = title ? 70 : 0;
  diagram.attr('viewBox', "".concat(box.startx, " -25 ").concat(width, " ").concat(height + extraVertForTitle));
  diagram.attr('preserveAspectRatio', 'xMinYMin meet');
};
var bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined
  },
  verticalPos: 0,
  sequenceItems: [],
  init: function init() {
    this.sequenceItems = [];
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined
    };
    this.verticalPos = 0;
  },
  updateVal: function updateVal(obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function updateBounds(startx, starty, stopx, stopy) {
    var _self = this;

    var cnt = 0;

    function updateFn(type) {
      return function updateItemBounds(item) {
        cnt++; // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems

        var n = _self.sequenceItems.length - cnt + 1;

        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min);

        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max);

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);

        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min);

          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max);

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);

          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
        }
      };
    }

    this.sequenceItems.forEach(updateFn());
  },
  insert: function insert(startx, starty, stopx, stopy) {
    var _startx = Math.min(startx, stopx);

    var _stopx = Math.max(startx, stopx);

    var _starty = Math.min(starty, stopy);

    var _stopy = Math.max(starty, stopy);

    this.updateVal(bounds.data, 'startx', _startx, Math.min);
    this.updateVal(bounds.data, 'starty', _starty, Math.min);
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max);
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max);
    this.updateBounds(_startx, _starty, _stopx, _stopy);
  },
  bumpVerticalPos: function bumpVerticalPos(bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function getVerticalPos() {
    return this.verticalPos;
  },
  getBounds: function getBounds() {
    return this.data;
  }
};
var fills = conf.sectionFills;
var textColours = conf.sectionColours;
var drawTasks = function drawTasks(diagram, tasks, verticalPos) {
  var lastSection = '';
  var sectionVHeight = conf.height * 2 + conf.diagramMarginY;
  var taskPos = verticalPos + sectionVHeight;
  var sectionNumber = 0;
  var fill = '#CCC';
  var colour = 'black'; // Draw the tasks

  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];

    if (lastSection !== task.section) {
      fill = fills[sectionNumber % fills.length];
      colour = textColours[sectionNumber % textColours.length];
      var section = {
        x: i * conf.taskMargin + i * conf.width + LEFT_MARGIN,
        y: 50,
        text: task.section,
        fill: fill,
        colour: colour
      };
      _svgDraw__WEBPACK_IMPORTED_MODULE_3__["default"].drawSection(diagram, section, conf);
      lastSection = task.section;
      sectionNumber++;
    } // Collect the actors involved in the task


    var taskActors = task.people.reduce(function (acc, actorName) {
      if (actors[actorName]) {
        acc[actorName] = actors[actorName];
      }

      return acc;
    }, {}); // Add some rendering data to the object

    task.x = i * conf.taskMargin + i * conf.width + LEFT_MARGIN;
    task.y = taskPos;
    task.width = conf.diagramMarginX;
    task.height = conf.diagramMarginY;
    task.colour = colour;
    task.fill = fill;
    task.actors = taskActors; // Draw the box with the attached line

    _svgDraw__WEBPACK_IMPORTED_MODULE_3__["default"].drawTask(diagram, task, conf);
    bounds.insert(task.x, task.y, task.x + task.width + conf.taskMargin, 300 + 5 * 30); // stopy is the length of the descenders.
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/user-journey/parser/journey.jison":
/*!********************************************************!*\
  !*** ./src/diagrams/user-journey/parser/journey.jison ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,8,10,11,12,13],$V1=[1,9],$V2=[1,10],$V3=[1,11];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"journey":4,"document":5,"EOF":6,"line":7,"SPACE":8,"statement":9,"NL":10,"title":11,"section":12,"taskName":13,"taskData":14,"$accept":0,"$end":1},
terminals_: {2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NL",11:"title",12:"section",13:"taskName",14:"taskData"},
productions_: [0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,1],[9,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2:
 this.$ = [] 
break;
case 3:
$$[$0-1].push($$[$0]);this.$ = $$[$0-1]
break;
case 4: case 5:
 this.$ = $$[$0] 
break;
case 6: case 7:
 this.$=[];
break;
case 8:
yy.setTitle($$[$0].substr(6));this.$=$$[$0].substr(6);
break;
case 9:
yy.addSection($$[$0].substr(8));this.$=$$[$0].substr(8);
break;
case 10:
yy.addTask($$[$0-1], $$[$0]);this.$='task';
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:$V1,12:$V2,13:$V3},o($V0,[2,7],{1:[2,1]}),o($V0,[2,3]),{9:12,11:$V1,12:$V2,13:$V3},o($V0,[2,5]),o($V0,[2,6]),o($V0,[2,8]),o($V0,[2,9]),{14:[1,13]},o($V0,[2,4]),o($V0,[2,10])],
defaultActions: {},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 10;
break;
case 1:/* skip whitespace */
break;
case 2:/* skip comments */
break;
case 3:/* skip comments */
break;
case 4:return 4;
break;
case 5:return 11;
break;
case 6:return 12;
break;
case 7:return 13;
break;
case 8:return 14;
break;
case 9:return ':';
break;
case 10:return 6;
break;
case 11:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/user-journey/svgDraw.js":
/*!**********************************************!*\
  !*** ./src/diagrams/user-journey/svgDraw.js ***!
  \**********************************************/
/*! exports provided: drawRect, drawFace, drawCircle, drawText, drawLabel, drawSection, drawTask, drawBackgroundRect, getTextObj, getNoteRect, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawRect", function() { return drawRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawFace", function() { return drawFace; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawCircle", function() { return drawCircle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawText", function() { return drawText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawLabel", function() { return drawLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawSection", function() { return drawSection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawTask", function() { return drawTask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawBackgroundRect", function() { return drawBackgroundRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTextObj", function() { return getTextObj; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getNoteRect", function() { return getNoteRect; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);

var drawRect = function drawRect(elem, rectData) {
  var rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (typeof rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};
var drawFace = function drawFace(element, faceData) {
  var radius = 15;
  var circleElement = element.append('circle').attr('cx', faceData.cx).attr('cy', faceData.cy).attr('fill', '#FFF8DC').attr('stroke', '#999').attr('r', radius).attr('stroke-width', 2).attr('overflow', 'visible');
  var face = element.append('g'); //left eye

  face.append('circle').attr('cx', faceData.cx - radius / 3).attr('cy', faceData.cy - radius / 3).attr('r', 1.5).attr('stroke-width', 2).attr('fill', '#666').attr('stroke', '#666'); //right eye

  face.append('circle').attr('cx', faceData.cx + radius / 3).attr('cy', faceData.cy - radius / 3).attr('r', 1.5).attr('stroke-width', 2).attr('fill', '#666').attr('stroke', '#666');

  function smile(face) {
    var arc = Object(d3__WEBPACK_IMPORTED_MODULE_0__["arc"])().startAngle(Math.PI / 2).endAngle(3 * (Math.PI / 2)).innerRadius(radius / 2).outerRadius(radius / 2.2); //mouth

    face.append('path').attr('d', arc).attr('transform', 'translate(' + faceData.cx + ',' + (faceData.cy + 2) + ')');
  }

  function sad(face) {
    var arc = Object(d3__WEBPACK_IMPORTED_MODULE_0__["arc"])().startAngle(3 * Math.PI / 2).endAngle(5 * (Math.PI / 2)).innerRadius(radius / 2).outerRadius(radius / 2.2); //mouth

    face.append('path').attr('d', arc).attr('transform', 'translate(' + faceData.cx + ',' + (faceData.cy + 7) + ')');
  }

  function ambivalent(face) {
    face.append('line').attr('stroke', 2).attr('x1', faceData.cx - 5).attr('y1', faceData.cy + 7).attr('x2', faceData.cx + 5).attr('y2', faceData.cy + 7).attr('class', 'task-line').attr('stroke-width', '1px').attr('stroke', '#666');
  }

  if (faceData.score > 3) {
    smile(face);
  } else if (faceData.score < 3) {
    sad(face);
  } else {
    ambivalent(face);
  }

  return circleElement;
};
var drawCircle = function drawCircle(element, circleData) {
  var circleElement = element.append('circle');
  circleElement.attr('cx', circleData.cx);
  circleElement.attr('cy', circleData.cy);
  circleElement.attr('fill', circleData.fill);
  circleElement.attr('stroke', circleData.stroke);
  circleElement.attr('r', circleData.r);

  if (typeof circleElement.class !== 'undefined') {
    circleElement.attr('class', circleElement.class);
  }

  if (typeof circleData.title !== 'undefined') {
    circleElement.append('title').text(circleData.title);
  }

  return circleElement;
};
var drawText = function drawText(elem, textData) {
  // Remove and ignore br:s
  var nText = textData.text.replace(/<br\s*\/?>/gi, ' ');
  var textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.attr('fill', textData.fill);
  textElem.style('text-anchor', textData.anchor);

  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  var span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.text(nText);
  return textElem;
};
var drawLabel = function drawLabel(elem, txtObject) {
  function genPoints(x, y, width, height, cut) {
    return x + ',' + y + ' ' + (x + width) + ',' + y + ' ' + (x + width) + ',' + (y + height - cut) + ' ' + (x + width - cut * 1.2) + ',' + (y + height) + ' ' + x + ',' + (y + height);
  }

  var polygon = elem.append('polygon');
  polygon.attr('points', genPoints(txtObject.x, txtObject.y, 50, 20, 7));
  polygon.attr('class', 'labelBox');
  txtObject.y = txtObject.y + txtObject.labelMargin;
  txtObject.x = txtObject.x + 0.5 * txtObject.labelMargin;
  drawText(elem, txtObject);
};
var drawSection = function drawSection(elem, section, conf) {
  var g = elem.append('g');
  var rect = getNoteRect();
  rect.x = section.x;
  rect.y = section.y;
  rect.fill = section.fill;
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'journey-section';
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(section.text, g, rect.x, rect.y, rect.width, rect.height, {
    class: 'journey-section'
  }, conf, section.colour);
};
var taskCount = -1;
/**
 * Draws an actor in the diagram with the attaced line
 * @param elem The HTML element
 * @param task The task to render
 * @param conf The global configuration
 */

var drawTask = function drawTask(elem, task, conf) {
  var center = task.x + conf.width / 2;
  var g = elem.append('g');
  taskCount++;
  var maxHeight = 300 + 5 * 30;
  g.append('line').attr('id', 'task' + taskCount).attr('x1', center).attr('y1', task.y).attr('x2', center).attr('y2', maxHeight).attr('class', 'task-line').attr('stroke-width', '1px').attr('stroke-dasharray', '4 2').attr('stroke', '#666');
  drawFace(g, {
    cx: center,
    cy: 300 + (5 - task.score) * 30,
    score: task.score
  });
  var rect = getNoteRect();
  rect.x = task.x;
  rect.y = task.y;
  rect.fill = task.fill;
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'task';
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);
  var xPos = task.x + 14;
  task.people.forEach(function (person) {
    var colour = task.actors[person];
    var circle = {
      cx: xPos,
      cy: task.y,
      r: 7,
      fill: colour,
      stroke: '#000',
      title: person
    };
    drawCircle(g, circle);
    xPos += 10;
  });

  _drawTextCandidateFunc(conf)(task.task, g, rect.x, rect.y, rect.width, rect.height, {
    class: 'task'
  }, conf, task.colour);
};
/**
 * Draws a background rectangle
 * @param elem The html element
 * @param bounds The bounds of the drawing
 */

var drawBackgroundRect = function drawBackgroundRect(elem, bounds) {
  var rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    class: 'rect'
  });
  rectElem.lower();
};
var getTextObj = function getTextObj() {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    'text-anchor': 'start',
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0
  };
};
var getNoteRect = function getNoteRect() {
  return {
    x: 0,
    y: 0,
    width: 100,
    anchor: 'start',
    height: 100,
    rx: 0,
    ry: 0
  };
};

var _drawTextCandidateFunc = function () {
  function byText(content, g, x, y, width, height, textAttrs, colour) {
    var text = g.append('text').attr('x', x + width / 2).attr('y', y + height / 2 + 5).style('font-color', colour).style('text-anchor', 'middle').text(content);

    _setTextAttrs(text, textAttrs);
  }

  function byTspan(content, g, x, y, width, height, textAttrs, conf, colour) {
    var taskFontSize = conf.taskFontSize,
        taskFontFamily = conf.taskFontFamily;
    var lines = content.split(/<br\s*\/?>/gi);

    for (var i = 0; i < lines.length; i++) {
      var dy = i * taskFontSize - taskFontSize * (lines.length - 1) / 2;
      var text = g.append('text').attr('x', x + width / 2).attr('y', y).attr('fill', colour).style('text-anchor', 'middle').style('font-size', taskFontSize).style('font-family', taskFontFamily);
      text.append('tspan').attr('x', x + width / 2).attr('dy', dy).text(lines[i]);
      text.attr('y', y + height / 2.0).attr('dominant-baseline', 'central').attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  function byFo(content, g, x, y, width, height, textAttrs, conf, colour) {
    var body = g.append('switch');
    var f = body.append('foreignObject').attr('x', x).attr('y', y).attr('width', width).attr('height', height).attr('position', 'fixed');
    var text = f.append('div').style('display', 'table').style('height', '100%').style('width', '100%');
    text.append('div').style('display', 'table-cell').style('text-align', 'center').style('vertical-align', 'middle').style('color', colour).text(content);
    byTspan(content, body, x, y, width, height, textAttrs, conf);

    _setTextAttrs(text, textAttrs);
  }

  function _setTextAttrs(toText, fromTextAttrsDict) {
    for (var key in fromTextAttrsDict) {
      if (key in fromTextAttrsDict) {
        // eslint-disable-line
        // noinspection JSUnfilteredForInLoop
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf) {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
}();

var initGraphics = function initGraphics(graphics) {
  graphics.append('defs').append('marker').attr('id', 'arrowhead').attr('refX', 5).attr('refY', 2).attr('markerWidth', 6).attr('markerHeight', 4).attr('orient', 'auto').append('path').attr('d', 'M 0,0 V 4 L6,2 Z'); // this is actual shape for arrowhead
};

/* harmony default export */ __webpack_exports__["default"] = ({
  drawRect: drawRect,
  drawCircle: drawCircle,
  drawSection: drawSection,
  drawText: drawText,
  drawLabel: drawLabel,
  drawTask: drawTask,
  drawBackgroundRect: drawBackgroundRect,
  getTextObj: getTextObj,
  getNoteRect: getNoteRect,
  initGraphics: initGraphics
});

/***/ }),

/***/ "./src/errorRenderer.js":
/*!******************************!*\
  !*** ./src/errorRenderer.js ***!
  \******************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/**
 * Created by knut on 14-12-11.
 */


var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(id, ver) {
  try {
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].debug('Renering svg for syntax error\n');
    var svg = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#' + id);
    var g = svg.append('g');
    g.append('path').attr('class', 'error-icon').attr('d', 'm411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z');
    g.append('path').attr('class', 'error-icon').attr('d', 'm459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z');
    g.append('path').attr('class', 'error-icon').attr('d', 'm340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z');
    g.append('path').attr('class', 'error-icon').attr('d', 'm400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z');
    g.append('path').attr('class', 'error-icon').attr('d', 'm496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z');
    g.append('path').attr('class', 'error-icon').attr('d', 'm436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z');
    g.append('text') // text label for the x axis
    .attr('class', 'error-text').attr('x', 1240).attr('y', 250).attr('font-size', '150px').style('text-anchor', 'middle').text('Syntax error in graph');
    g.append('text') // text label for the x axis
    .attr('class', 'error-text').attr('x', 1050).attr('y', 400).attr('font-size', '100px').style('text-anchor', 'middle').text('mermaid version ' + ver);
    svg.attr('height', 100);
    svg.attr('width', 400);
    svg.attr('viewBox', '768 0 512 512');
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].error('Error while rendering info diagram');
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/logger.js":
/*!***********************!*\
  !*** ./src/logger.js ***!
  \***********************/
/*! exports provided: LEVELS, logger, setLogLevel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LEVELS", function() { return LEVELS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "logger", function() { return logger; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLogLevel", function() { return setLogLevel; });
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment-mini */ "moment-mini");
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment_mini__WEBPACK_IMPORTED_MODULE_0__);
 //

var LEVELS = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};
var logger = {
  debug: function debug() {},
  info: function info() {},
  warn: function warn() {},
  error: function error() {},
  fatal: function fatal() {}
};
var setLogLevel = function setLogLevel() {
  var level = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'fatal';

  if (isNaN(level)) {
    level = level.toLowerCase();

    if (LEVELS[level] !== undefined) {
      level = LEVELS[level];
    }
  }

  logger.trace = function () {};

  logger.debug = function () {};

  logger.info = function () {};

  logger.warn = function () {};

  logger.error = function () {};

  logger.fatal = function () {};

  if (level <= LEVELS.fatal) {
    logger.fatal = console.error ? console.error.bind(console, format('FATAL'), 'color: orange') : console.log.bind(console, '\x1b[35m', format('FATAL'));
  }

  if (level <= LEVELS.error) {
    logger.error = console.error ? console.error.bind(console, format('ERROR'), 'color: orange') : console.log.bind(console, '\x1b[31m', format('ERROR'));
  }

  if (level <= LEVELS.warn) {
    logger.warn = console.warn ? console.warn.bind(console, format('WARN'), 'color: orange') : console.log.bind(console, "\x1B[33m", format('WARN'));
  }

  if (level <= LEVELS.info) {
    logger.info = console.info ? // ? console.info.bind(console, '\x1b[34m', format('INFO'), 'color: blue')
    console.info.bind(console, format('INFO'), 'color: lightblue') : console.log.bind(console, '\x1b[34m', format('INFO'));
  }

  if (level <= LEVELS.debug) {
    logger.debug = console.debug ? console.debug.bind(console, format('DEBUG'), 'color: lightgreen') : console.log.bind(console, '\x1b[32m', format('DEBUG'));
  }
};

var format = function format(level) {
  var time = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()().format('ss.SSS');
  return "%c".concat(time, " : ").concat(level, " : ");
};

/***/ }),

/***/ "./src/mermaid.js":
/*!************************!*\
  !*** ./src/mermaid.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var entity_decode_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! entity-decode/browser */ "entity-decode/browser");
/* harmony import */ var entity_decode_browser__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(entity_decode_browser__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mermaidAPI */ "./src/mermaidAPI.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid functionality and to render
 * the diagrams to svg code.
 */
// import { decode } from 'he';




/**
 * ## init
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found elements with the
 * attribute already set. This way the init function can be triggered several times.
 *
 * Optionally, `init` can accept in the second argument one of the following:
 * - a DOM Node
 * - an array of DOM nodes (as would come from a jQuery selector)
 * - a W3C selector, a la `.mermaid`
 *
 * ```mermaid
 * graph LR;
 *  a(Find elements)-->b{Processed}
 *  b-->|Yes|c(Leave element)
 *  b-->|No |d(Transform)
 * ```
 * Renders the mermaid diagrams
 * @param nodes a css selector or an array of nodes
 */

var init = function init() {
  var _this = this;

  var conf = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig(); // console.log('Starting rendering diagrams (init) - mermaid.init');

  var nodes;

  if (arguments.length >= 2) {
    /*! sequence config was passed as #1 */
    if (typeof arguments[0] !== 'undefined') {
      mermaid.sequenceConfig = arguments[0];
    }

    nodes = arguments[1];
  } else {
    nodes = arguments[0];
  } // if last argument is a function this is the callback function


  var callback;

  if (typeof arguments[arguments.length - 1] === 'function') {
    callback = arguments[arguments.length - 1];
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Callback function found');
  } else {
    if (typeof conf.mermaid !== 'undefined') {
      if (typeof conf.mermaid.callback === 'function') {
        callback = conf.mermaid.callback;
        _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Callback function found');
      } else {
        _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('No Callback function found');
      }
    }
  }

  nodes = nodes === undefined ? document.querySelectorAll('.mermaid') : typeof nodes === 'string' ? document.querySelectorAll(nodes) : nodes instanceof window.Node ? [nodes] : nodes; // Last case  - sequence config was passed pick next

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Start On Load before: ' + mermaid.startOnLoad);

  if (typeof mermaid.startOnLoad !== 'undefined') {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Start On Load inner: ' + mermaid.startOnLoad);
    _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize({
      startOnLoad: mermaid.startOnLoad
    });
  }

  if (typeof mermaid.ganttConfig !== 'undefined') {
    _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize({
      gantt: mermaid.ganttConfig
    });
  }

  var txt;

  var _loop = function _loop(i) {
    var element = nodes[i];
    /*! Check if previously processed */

    if (!element.getAttribute('data-processed')) {
      element.setAttribute('data-processed', true);
    } else {
      return "continue";
    }

    var id = "mermaid-".concat(Date.now()); // Fetch the graph definition including tags

    txt = element.innerHTML; // transforms the html to pure text

    txt = entity_decode_browser__WEBPACK_IMPORTED_MODULE_0___default()(txt).trim().replace(/<br\s*\/?>/gi, '<br/>');
    var init = _utils__WEBPACK_IMPORTED_MODULE_3__["default"].detectInit(txt);

    if (init) {
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Detected early reinit: ', init);
    }

    try {
      _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].render(id, txt, function (svgCode, bindFunctions) {
        element.innerHTML = svgCode;

        if (typeof callback !== 'undefined') {
          callback(id);
        }

        if (bindFunctions) bindFunctions(element);
      }, element);
    } catch (e) {
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].warn('Syntax Error rendering');
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].warn(e);

      if (_this.parseError) {
        _this.parseError(e);
      }
    }
  };

  for (var i = 0; i < nodes.length; i++) {
    var _ret = _loop(i);

    if (_ret === "continue") continue;
  }
};

var initialize = function initialize(config) {
  _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].reset();

  if (typeof config.mermaid !== 'undefined') {
    if (typeof config.mermaid.startOnLoad !== 'undefined') {
      mermaid.startOnLoad = config.mermaid.startOnLoad;
    }

    if (typeof config.mermaid.htmlLabels !== 'undefined') {
      mermaid.htmlLabels = config.mermaid.htmlLabels;
    }
  }

  _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize(config);
};
/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */


var contentLoaded = function contentLoaded() {
  var config;

  if (mermaid.startOnLoad) {
    // No config found, do check API config
    config = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig();

    if (config.startOnLoad) {
      mermaid.init();
    }
  } else {
    if (typeof mermaid.startOnLoad === 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('In start, no config');
      config = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig();

      if (config.startOnLoad) {
        mermaid.init();
      }
    }
  }
};

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener('load', function () {
    contentLoaded();
  }, false);
}

var mermaid = {
  startOnLoad: true,
  htmlLabels: true,
  mermaidAPI: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"],
  parse: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].parse,
  render: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].render,
  init: init,
  initialize: initialize,
  contentLoaded: contentLoaded
};
/* harmony default export */ __webpack_exports__["default"] = (mermaid);

/***/ }),

/***/ "./src/mermaidAPI.js":
/*!***************************!*\
  !*** ./src/mermaidAPI.js ***!
  \***************************/
/*! exports provided: encodeEntities, decodeEntities, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encodeEntities", function() { return encodeEntities; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decodeEntities", function() { return decodeEntities; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var scope_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! scope-css */ "scope-css");
/* harmony import */ var scope_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(scope_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../package.json */ "./package.json");
var _package_json__WEBPACK_IMPORTED_MODULE_2___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../package.json */ "./package.json", 1);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./config */ "./src/config.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./diagrams/flowchart/flowRenderer */ "./src/diagrams/flowchart/flowRenderer.js");
/* harmony import */ var _diagrams_flowchart_flowRenderer_v2__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./diagrams/flowchart/flowRenderer-v2 */ "./src/diagrams/flowchart/flowRenderer-v2.js");
/* harmony import */ var _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./diagrams/flowchart/parser/flow */ "./src/diagrams/flowchart/parser/flow.jison");
/* harmony import */ var _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./diagrams/flowchart/flowDb */ "./src/diagrams/flowchart/flowDb.js");
/* harmony import */ var _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./diagrams/sequence/sequenceRenderer */ "./src/diagrams/sequence/sequenceRenderer.js");
/* harmony import */ var _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./diagrams/sequence/parser/sequenceDiagram */ "./src/diagrams/sequence/parser/sequenceDiagram.jison");
/* harmony import */ var _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(_diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _diagrams_sequence_sequenceDb__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./diagrams/sequence/sequenceDb */ "./src/diagrams/sequence/sequenceDb.js");
/* harmony import */ var _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./diagrams/gantt/ganttRenderer */ "./src/diagrams/gantt/ganttRenderer.js");
/* harmony import */ var _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./diagrams/gantt/parser/gantt */ "./src/diagrams/gantt/parser/gantt.jison");
/* harmony import */ var _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(_diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./diagrams/gantt/ganttDb */ "./src/diagrams/gantt/ganttDb.js");
/* harmony import */ var _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./diagrams/class/classRenderer */ "./src/diagrams/class/classRenderer.js");
/* harmony import */ var _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./diagrams/class/parser/classDiagram */ "./src/diagrams/class/parser/classDiagram.jison");
/* harmony import */ var _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(_diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var _diagrams_class_classDb__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./diagrams/class/classDb */ "./src/diagrams/class/classDb.js");
/* harmony import */ var _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./diagrams/state/stateRenderer */ "./src/diagrams/state/stateRenderer.js");
/* harmony import */ var _diagrams_state_stateRenderer_v2__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./diagrams/state/stateRenderer-v2 */ "./src/diagrams/state/stateRenderer-v2.js");
/* harmony import */ var _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./diagrams/state/parser/stateDiagram */ "./src/diagrams/state/parser/stateDiagram.jison");
/* harmony import */ var _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_21___default = /*#__PURE__*/__webpack_require__.n(_diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_21__);
/* harmony import */ var _diagrams_state_stateDb__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./diagrams/state/stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./diagrams/git/gitGraphRenderer */ "./src/diagrams/git/gitGraphRenderer.js");
/* harmony import */ var _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./diagrams/git/parser/gitGraph */ "./src/diagrams/git/parser/gitGraph.jison");
/* harmony import */ var _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_24___default = /*#__PURE__*/__webpack_require__.n(_diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_24__);
/* harmony import */ var _diagrams_git_gitGraphAst__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./diagrams/git/gitGraphAst */ "./src/diagrams/git/gitGraphAst.js");
/* harmony import */ var _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./diagrams/info/infoRenderer */ "./src/diagrams/info/infoRenderer.js");
/* harmony import */ var _errorRenderer__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./errorRenderer */ "./src/errorRenderer.js");
/* harmony import */ var _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./diagrams/info/parser/info */ "./src/diagrams/info/parser/info.jison");
/* harmony import */ var _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_28___default = /*#__PURE__*/__webpack_require__.n(_diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_28__);
/* harmony import */ var _diagrams_info_infoDb__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./diagrams/info/infoDb */ "./src/diagrams/info/infoDb.js");
/* harmony import */ var _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./diagrams/pie/pieRenderer */ "./src/diagrams/pie/pieRenderer.js");
/* harmony import */ var _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./diagrams/pie/parser/pie */ "./src/diagrams/pie/parser/pie.jison");
/* harmony import */ var _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_31___default = /*#__PURE__*/__webpack_require__.n(_diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_31__);
/* harmony import */ var _diagrams_pie_pieDb__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./diagrams/pie/pieDb */ "./src/diagrams/pie/pieDb.js");
/* harmony import */ var _diagrams_er_erDb__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./diagrams/er/erDb */ "./src/diagrams/er/erDb.js");
/* harmony import */ var _diagrams_er_parser_erDiagram__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./diagrams/er/parser/erDiagram */ "./src/diagrams/er/parser/erDiagram.jison");
/* harmony import */ var _diagrams_er_parser_erDiagram__WEBPACK_IMPORTED_MODULE_34___default = /*#__PURE__*/__webpack_require__.n(_diagrams_er_parser_erDiagram__WEBPACK_IMPORTED_MODULE_34__);
/* harmony import */ var _diagrams_er_erRenderer__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./diagrams/er/erRenderer */ "./src/diagrams/er/erRenderer.js");
/* harmony import */ var _diagrams_user_journey_parser_journey__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ./diagrams/user-journey/parser/journey */ "./src/diagrams/user-journey/parser/journey.jison");
/* harmony import */ var _diagrams_user_journey_parser_journey__WEBPACK_IMPORTED_MODULE_36___default = /*#__PURE__*/__webpack_require__.n(_diagrams_user_journey_parser_journey__WEBPACK_IMPORTED_MODULE_36__);
/* harmony import */ var _diagrams_user_journey_journeyDb__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./diagrams/user-journey/journeyDb */ "./src/diagrams/user-journey/journeyDb.js");
/* harmony import */ var _diagrams_user_journey_journeyRenderer__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./diagrams/user-journey/journeyRenderer */ "./src/diagrams/user-journey/journeyRenderer.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * This is the api to be used when optionally handling the integration with the web page, instead of using the default integration provided by mermaid.js.
 *
 * The core of this api is the [**render**](Setup.md?id=render) function which, given a graph
 * definition as text, renders the graph/diagram and returns an svg element for the graph.
 *
 * It is is then up to the user of the API to make use of the svg, either insert it somewhere in the page or do something completely different.
 *
 * In addition to the render function, a number of behavioral configuration options are available.
 *
 * @name mermaidAPI
 */








































var themes = {};

for (var _i = 0, _arr = ['default', 'forest', 'dark', 'neutral']; _i < _arr.length; _i++) {
  var themeName = _arr[_i];
  themes[themeName] = __webpack_require__("./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$")("./".concat(themeName, "/index.scss"));
}

function parse(text) {
  var graphInit = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectInit(text);

  if (graphInit) {
    reinitialize(graphInit);
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('reinit ', graphInit);
  }

  var graphType = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectType(text);
  var parser;
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Type ' + graphType);

  switch (graphType) {
    case 'git':
      parser = _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_24___default.a;
      parser.parser.yy = _diagrams_git_gitGraphAst__WEBPACK_IMPORTED_MODULE_25__["default"];
      break;

    case 'flowchart':
      _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__["default"].clear();
      parser = _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_8___default.a;
      parser.parser.yy = _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__["default"];
      break;

    case 'flowchart-v2':
      _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__["default"].clear();
      parser = _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_8___default.a;
      parser.parser.yy = _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__["default"];
      break;

    case 'sequence':
      parser = _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_11___default.a;
      parser.parser.yy = _diagrams_sequence_sequenceDb__WEBPACK_IMPORTED_MODULE_12__["default"];
      break;

    case 'gantt':
      parser = _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_14___default.a;
      parser.parser.yy = _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_15__["default"];
      break;

    case 'class':
      parser = _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_17___default.a;
      parser.parser.yy = _diagrams_class_classDb__WEBPACK_IMPORTED_MODULE_18__["default"];
      break;

    case 'state':
      parser = _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_21___default.a;
      parser.parser.yy = _diagrams_state_stateDb__WEBPACK_IMPORTED_MODULE_22__["default"];
      break;

    case 'stateDiagram':
      parser = _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_21___default.a;
      parser.parser.yy = _diagrams_state_stateDb__WEBPACK_IMPORTED_MODULE_22__["default"];
      break;

    case 'info':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('info info info');
      parser = _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_28___default.a;
      parser.parser.yy = _diagrams_info_infoDb__WEBPACK_IMPORTED_MODULE_29__["default"];
      break;

    case 'pie':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('pie');
      parser = _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_31___default.a;
      parser.parser.yy = _diagrams_pie_pieDb__WEBPACK_IMPORTED_MODULE_32__["default"];
      break;

    case 'er':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('er');
      parser = _diagrams_er_parser_erDiagram__WEBPACK_IMPORTED_MODULE_34___default.a;
      parser.parser.yy = _diagrams_er_erDb__WEBPACK_IMPORTED_MODULE_33__["default"];
      break;

    case 'journey':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Journey');
      parser = _diagrams_user_journey_parser_journey__WEBPACK_IMPORTED_MODULE_36___default.a;
      parser.parser.yy = _diagrams_user_journey_journeyDb__WEBPACK_IMPORTED_MODULE_37__["default"];
      break;
  }

  parser.parser.yy.graphType = graphType;

  parser.parser.yy.parseError = function (str, hash) {
    var error = {
      str: str,
      hash: hash
    };
    throw error;
  };

  parser.parse(text);
  return parser;
}

var encodeEntities = function encodeEntities(text) {
  var txt = text;
  txt = txt.replace(/style.*:\S*#.*;/g, function (s) {
    var innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s) {
    var innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/#\w+;/g, function (s) {
    var innerTxt = s.substring(1, s.length - 1);
    var isInt = /^\+?\d+$/.test(innerTxt);

    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß';
    } else {
      return 'ﬂ°' + innerTxt + '¶ß';
    }
  });
  return txt;
};
var decodeEntities = function decodeEntities(text) {
  var txt = text;
  txt = txt.replace(/ﬂ°°/g, function () {
    return '&#';
  });
  txt = txt.replace(/ﬂ°/g, function () {
    return '&';
  });
  txt = txt.replace(/¶ß/g, function () {
    return ';';
  });
  return txt;
};
/**
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```js
 * mermaidAPI.initialize({
 *      startOnLoad:true
 *  });
 *  $(function(){
 *      const graphDefinition = 'graph TB\na-->b';
 *      const cb = function(svgGraph){
 *          console.log(svgGraph);
 *      };
 *      mermaidAPI.render('id1',graphDefinition,cb);
 *  });
 *```
 * @param id the id of the element to be rendered
 * @param _txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */

var render = function render(id, _txt, cb, container) {
  var cnf = Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])(); // Check the maximum allowed text size

  var txt = _txt;

  if (_txt.length > cnf.maxTextSize) {
    txt = 'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';
  }

  var graphInit = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectInit(txt);

  if (graphInit) {
    reinitialize(graphInit);
    Object(_utils__WEBPACK_IMPORTED_MODULE_5__["assignWithDepth"])(cnf, Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])());
  }

  if (typeof container !== 'undefined') {
    container.innerHTML = '';
    Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])(container).append('div').attr('id', 'd' + id).attr('style', 'font-family: ' + cnf.fontFamily).append('svg').attr('id', id).attr('width', '100%').attr('xmlns', 'http://www.w3.org/2000/svg').append('g');
  } else {
    var existingSvg = document.getElementById(id);

    if (existingSvg) {
      existingSvg.remove();
    }

    var _element = document.querySelector('#' + 'd' + id);

    if (_element) {
      _element.remove();
    }

    Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('body').append('div').attr('id', 'd' + id).append('svg').attr('id', id).attr('width', '100%').attr('xmlns', 'http://www.w3.org/2000/svg').append('g');
  }

  window.txt = txt;
  txt = encodeEntities(txt);
  var element = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#d' + id).node();
  var graphType = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectType(txt); // insert inline style into svg

  var svg = element.firstChild;
  var firstChild = svg.firstChild; // pre-defined theme

  var style = themes[cnf.theme];

  if (style === undefined) {
    style = '';
  } // user provided theme CSS


  if (cnf.themeCSS !== undefined) {
    style += "\n".concat(cnf.themeCSS);
  } // user provided theme CSS


  if (cnf.fontFamily !== undefined) {
    style += "\n:root { --mermaid-font-family: ".concat(cnf.fontFamily, "}");
  } // user provided theme CSS


  if (cnf.altFontFamily !== undefined) {
    style += "\n:root { --mermaid-alt-font-family: ".concat(cnf.altFontFamily, "}");
  } // classDef


  if (graphType === 'flowchart' || graphType === 'flowchart-v2') {
    var classes = _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].getClasses(txt);

    for (var className in classes) {
      style += "\n.".concat(className, " > * { ").concat(classes[className].styles.join(' !important; '), " !important; }");

      if (classes[className].textStyles) {
        style += "\n.".concat(className, " tspan { ").concat(classes[className].textStyles.join(' !important; '), " !important; }");
      }
    }
  }

  var style1 = document.createElement('style');
  style1.innerHTML = scope_css__WEBPACK_IMPORTED_MODULE_1___default()(style, "#".concat(id));
  svg.insertBefore(style1, firstChild);
  var style2 = document.createElement('style');
  var cs = window.getComputedStyle(svg);
  style2.innerHTML = "#".concat(id, " {\n    color: ").concat(cs.color, ";\n    font: ").concat(cs.font, ";\n  }");
  svg.insertBefore(style2, firstChild);

  try {
    switch (graphType) {
      case 'git':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_23__["default"].setConf(cnf.git);
        _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_23__["default"].draw(txt, id, false);
        break;

      case 'flowchart':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].setConf(cnf.flowchart);
        _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].draw(txt, id, false);
        break;

      case 'flowchart-v2':
        cnf.flowchart.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_flowchart_flowRenderer_v2__WEBPACK_IMPORTED_MODULE_7__["default"].setConf(cnf.flowchart);
        _diagrams_flowchart_flowRenderer_v2__WEBPACK_IMPORTED_MODULE_7__["default"].draw(txt, id, false);
        break;

      case 'sequence':
        cnf.sequence.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;

        if (cnf.sequenceDiagram) {
          // backwards compatibility
          _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__["default"].setConf(Object.assign(cnf.sequence, cnf.sequenceDiagram));
          console.error('`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.');
        } else {
          _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__["default"].setConf(cnf.sequence);
        }

        _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__["default"].draw(txt, id);
        break;

      case 'gantt':
        cnf.gantt.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_13__["default"].setConf(cnf.gantt);
        _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_13__["default"].draw(txt, id);
        break;

      case 'class':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_16__["default"].setConf(cnf.class);
        _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_16__["default"].draw(txt, id);
        break;

      case 'state':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_19__["default"].setConf(cnf.state);
        _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_19__["default"].draw(txt, id);
        break;

      case 'stateDiagram':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_state_stateRenderer_v2__WEBPACK_IMPORTED_MODULE_20__["default"].setConf(cnf.state);
        _diagrams_state_stateRenderer_v2__WEBPACK_IMPORTED_MODULE_20__["default"].draw(txt, id);
        break;

      case 'info':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_26__["default"].setConf(cnf.class);
        _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_26__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
        break;

      case 'pie':
        cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
        _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_30__["default"].setConf(cnf.class);
        _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_30__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
        break;

      case 'er':
        _diagrams_er_erRenderer__WEBPACK_IMPORTED_MODULE_35__["default"].setConf(cnf.er);
        _diagrams_er_erRenderer__WEBPACK_IMPORTED_MODULE_35__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
        break;

      case 'journey':
        _diagrams_user_journey_journeyRenderer__WEBPACK_IMPORTED_MODULE_38__["default"].setConf(cnf.journey);
        _diagrams_user_journey_journeyRenderer__WEBPACK_IMPORTED_MODULE_38__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
        break;
    }
  } catch (e) {
    // errorRenderer.setConf(cnf.class);
    _errorRenderer__WEBPACK_IMPORTED_MODULE_27__["default"].draw(id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
    throw e;
  }

  Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])("[id=\"".concat(id, "\"]")).selectAll('foreignobject > *').attr('xmlns', 'http://www.w3.org/1999/xhtml'); // if (cnf.arrowMarkerAbsolute) {
  //   url =
  //     window.location.protocol +
  //     '//' +
  //     window.location.host +
  //     window.location.pathname +
  //     window.location.search;
  //   url = url.replace(/\(/g, '\\(');
  //   url = url.replace(/\)/g, '\\)');
  // }
  // Fix for when the base tag is used

  var svgCode = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#d' + id).node().innerHTML;
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('cnf.arrowMarkerAbsolute', cnf.arrowMarkerAbsolute);

  if (!cnf.arrowMarkerAbsolute || cnf.arrowMarkerAbsolute === 'false') {
    svgCode = svgCode.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#', 'g');
  }

  svgCode = decodeEntities(svgCode);

  if (typeof cb !== 'undefined') {
    switch (graphType) {
      case 'flowchart':
      case 'flowchart-v2':
        cb(svgCode, _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_9__["default"].bindFunctions);
        break;

      case 'gantt':
        cb(svgCode, _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_15__["default"].bindFunctions);
        break;

      case 'class':
        cb(svgCode, _diagrams_class_classDb__WEBPACK_IMPORTED_MODULE_18__["default"].bindFunctions);
        break;

      default:
        cb(svgCode);
    }
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('CB = undefined!');
  }

  var node = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#d' + id).node();

  if (node !== null && typeof node.remove === 'function') {
    Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('#d' + id).node().remove();
  }

  return svgCode;
};

var currentDirective = {};

var parseDirective = function parseDirective(statement, context, type) {
  try {
    if (statement !== undefined) {
      statement = statement.trim();

      switch (context) {
        case 'open_directive':
          currentDirective = {};
          break;

        case 'type_directive':
          currentDirective.type = statement.toLowerCase();
          break;

        case 'arg_directive':
          currentDirective.args = JSON.parse(statement);
          break;

        case 'close_directive':
          handleDirective(currentDirective, type);
          currentDirective = null;
          break;
      }
    }
  } catch (error) {
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].error("Error while rendering sequenceDiagram directive: ".concat(statement, " jison context: ").concat(context));
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].error(error.message);
  }
};

var handleDirective = function handleDirective(directive, type) {
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug("Directive type=".concat(directive.type, " with args:"), directive.args);

  switch (directive.type) {
    case 'init':
    case 'initialize':
      {
        ['config'].forEach(function (prop) {
          if (typeof directive.args[prop] !== 'undefined') {
            if (type === 'flowchart-v2') {
              type = 'flowchart';
            }

            directive.args[type] = directive.args[prop];
            delete directive.args[prop];
          }
        });
        reinitialize(directive.args);
        break;
      }

    case 'wrap':
    case 'nowrap':
      directive.args = {
        config: {
          wrap: directive.type === 'wrap'
        }
      };
      ['config'].forEach(function (prop) {
        if (typeof directive.args[prop] !== 'undefined') {
          if (type === 'flowchart-v2') {
            type = 'flowchart';
          }

          directive.args[type] = directive.args[prop];
          delete directive.args[prop];
        }
      });
      reinitialize(directive.args);
      break;

    default:
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].warn("Unhandled directive: source: '%%{".concat(directive.type, ": ").concat(JSON.stringify(directive.args ? directive.args : {}), "}%%"), directive);
      break;
  }
};

function updateRendererConfigs(conf) {
  _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_23__["default"].setConf(conf.git);
  _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].setConf(conf.flowchart);
  _diagrams_flowchart_flowRenderer_v2__WEBPACK_IMPORTED_MODULE_7__["default"].setConf(conf.flowchart);

  if (typeof conf['sequenceDiagram'] !== 'undefined') {
    _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__["default"].setConf(Object(_utils__WEBPACK_IMPORTED_MODULE_5__["assignWithDepth"])(conf.sequence, conf['sequenceDiagram']));
  }

  _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_10__["default"].setConf(conf.sequence);
  _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_13__["default"].setConf(conf.gantt);
  _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_16__["default"].setConf(conf.class);
  _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_19__["default"].setConf(conf.state);
  _diagrams_state_stateRenderer_v2__WEBPACK_IMPORTED_MODULE_20__["default"].setConf(conf.state);
  _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_26__["default"].setConf(conf.class);
  _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_30__["default"].setConf(conf.class);
  _diagrams_er_erRenderer__WEBPACK_IMPORTED_MODULE_35__["default"].setConf(conf.er);
  _diagrams_user_journey_journeyRenderer__WEBPACK_IMPORTED_MODULE_38__["default"].setConf(conf.journey);
  _errorRenderer__WEBPACK_IMPORTED_MODULE_27__["default"].setConf(conf.class);
}

function reinitialize(options) {
  console.log("mermaidAPI.reinitialize: v".concat(_package_json__WEBPACK_IMPORTED_MODULE_2__.version), options); // Set default options

  var config = _typeof(options) === 'object' ? Object(_config__WEBPACK_IMPORTED_MODULE_3__["setConfig"])(options) : Object(_config__WEBPACK_IMPORTED_MODULE_3__["getSiteConfig"])();
  updateRendererConfigs(config);
  Object(_logger__WEBPACK_IMPORTED_MODULE_4__["setLogLevel"])(config.logLevel);
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('mermaidAPI.reinitialize: ', config);
}

function initialize(options) {
  // console.log(`mermaidAPI.initialize: v${pkg.version}`);
  // Set default options
  var config = _typeof(options) === 'object' ? Object(_config__WEBPACK_IMPORTED_MODULE_3__["setSiteConfig"])(options) : Object(_config__WEBPACK_IMPORTED_MODULE_3__["getSiteConfig"])();
  updateRendererConfigs(config);
  Object(_logger__WEBPACK_IMPORTED_MODULE_4__["setLogLevel"])(config.logLevel);
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('mermaidAPI.initialize: ', config);
} // function getConfig () {
//   console.warn('get config')
//   return config
// }


var mermaidAPI = Object.freeze({
  render: render,
  parse: parse,
  parseDirective: parseDirective,
  initialize: initialize,
  reinitialize: reinitialize,
  getConfig: _config__WEBPACK_IMPORTED_MODULE_3__["getConfig"],
  getSiteConfig: _config__WEBPACK_IMPORTED_MODULE_3__["getSiteConfig"],
  reset: function reset() {
    // console.warn('reset');
    _config__WEBPACK_IMPORTED_MODULE_3__["default"].reset();
    var siteConfig = Object(_config__WEBPACK_IMPORTED_MODULE_3__["getSiteConfig"])();
    updateRendererConfigs(siteConfig);
  },
  globalReset: function globalReset() {
    _config__WEBPACK_IMPORTED_MODULE_3__["default"].reset(_config__WEBPACK_IMPORTED_MODULE_3__["default"].defaultConfig);
    updateRendererConfigs(Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])());
  },
  defaultConfig: _config__WEBPACK_IMPORTED_MODULE_3__["default"].defaultConfig
});
Object(_logger__WEBPACK_IMPORTED_MODULE_4__["setLogLevel"])(Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])().logLevel);
_config__WEBPACK_IMPORTED_MODULE_3__["default"].reset(Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])());
/* harmony default export */ __webpack_exports__["default"] = (mermaidAPI);
/**
 * ## mermaidAPI configuration defaults
 * <pre>
 *
 * &lt;script>
 *   var config = {
 *     theme:'default',
 *     logLevel:'fatal',
 *     securityLevel:'strict',
 *     startOnLoad:true,
 *     arrowMarkerAbsolute:false,
 *
 *     flowchart:{
 *       htmlLabels:true,
 *       curve:'linear',
 *     },
 *     sequence:{
 *       diagramMarginX:50,
 *       diagramMarginY:10,
 *       actorMargin:50,
 *       width:150,
 *       height:65,
 *       boxMargin:10,
 *       boxTextMargin:5,
 *       noteMargin:10,
 *       messageMargin:35,
 *       messageAlign:'center',
 *       mirrorActors:true,
 *       bottomMarginAdj:1,
 *       useMaxWidth:true,
 *       rightAngles:false,
 *       showSequenceNumbers:false,
 *     },
 *     gantt:{
 *       titleTopMargin:25,
 *       barHeight:20,
 *       barGap:4,
 *       topPadding:50,
 *       leftPadding:75,
 *       gridLineStartPadding:35,
 *       fontSize:11,
 *       fontFamily:'"Open-Sans", "sans-serif"',
 *       numberSectionStyles:4,
 *       axisFormat:'%Y-%m-%d',
 *     }
 *   };
 *   mermaid.initialize(config);
 * &lt;/script>
 *</pre>
 */

/***/ }),

/***/ "./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$":
/*!***********************************************!*\
  !*** ./src/themes sync ^\.\/.*\/index\.scss$ ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./dark/index.scss": "./src/themes/dark/index.scss",
	"./default/index.scss": "./src/themes/default/index.scss",
	"./forest/index.scss": "./src/themes/forest/index.scss",
	"./neutral/index.scss": "./src/themes/neutral/index.scss"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$";

/***/ }),

/***/ "./src/themes/dark/index.scss":
/*!************************************!*\
  !*** ./src/themes/dark/index.scss ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/default/index.scss":
/*!***************************************!*\
  !*** ./src/themes/default/index.scss ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/forest/index.scss":
/*!**************************************!*\
  !*** ./src/themes/forest/index.scss ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/neutral/index.scss":
/*!***************************************!*\
  !*** ./src/themes/neutral/index.scss ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/*! exports provided: detectInit, detectDirective, detectType, isSubstringInArray, interpolateToCurve, formatUrl, runFunc, getStylesFromArray, generateId, random, assignWithDepth, getTextObj, drawSimpleText, wrapLabel, calculateTextHeight, calculateTextWidth, calculateTextDimensions, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detectInit", function() { return detectInit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detectDirective", function() { return detectDirective; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detectType", function() { return detectType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isSubstringInArray", function() { return isSubstringInArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "interpolateToCurve", function() { return interpolateToCurve; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formatUrl", function() { return formatUrl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "runFunc", function() { return runFunc; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getStylesFromArray", function() { return getStylesFromArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "generateId", function() { return generateId; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "random", function() { return random; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assignWithDepth", function() { return assignWithDepth; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTextObj", function() { return getTextObj; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawSimpleText", function() { return drawSimpleText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wrapLabel", function() { return wrapLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "calculateTextHeight", function() { return calculateTextHeight; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "calculateTextWidth", function() { return calculateTextWidth; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "calculateTextDimensions", function() { return calculateTextDimensions; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @braintree/sanitize-url */ "@braintree/sanitize-url");
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _diagrams_common_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./diagrams/common/common */ "./src/diagrams/common/common.js");
/* harmony import */ var crypto_random_string__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! crypto-random-string */ "crypto-random-string");
/* harmony import */ var crypto_random_string__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(crypto_random_string__WEBPACK_IMPORTED_MODULE_4__);
var _this = undefined;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }





 // Effectively an enum of the supported curve types, accessible by name

var d3CurveTypes = {
  curveBasis: d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"],
  curveBasisClosed: d3__WEBPACK_IMPORTED_MODULE_0__["curveBasisClosed"],
  curveBasisOpen: d3__WEBPACK_IMPORTED_MODULE_0__["curveBasisOpen"],
  curveLinear: d3__WEBPACK_IMPORTED_MODULE_0__["curveLinear"],
  curveLinearClosed: d3__WEBPACK_IMPORTED_MODULE_0__["curveLinearClosed"],
  curveMonotoneX: d3__WEBPACK_IMPORTED_MODULE_0__["curveMonotoneX"],
  curveMonotoneY: d3__WEBPACK_IMPORTED_MODULE_0__["curveMonotoneY"],
  curveNatural: d3__WEBPACK_IMPORTED_MODULE_0__["curveNatural"],
  curveStep: d3__WEBPACK_IMPORTED_MODULE_0__["curveStep"],
  curveStepAfter: d3__WEBPACK_IMPORTED_MODULE_0__["curveStepAfter"],
  curveStepBefore: d3__WEBPACK_IMPORTED_MODULE_0__["curveStepBefore"]
};
var directive = /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
var directiveWithoutOpen = /\s*(?:(?:(\w+)(?=:):|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
var anyComment = /\s*%%.*\n/gm;
/**
 * @function detectInit
 * Detects the init config object from the text
 * ```mermaid
 * %%{init: {"theme": "debug", "logLevel": 1 }}%%
 * graph LR
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 * or
 * ```mermaid
 * %%{initialize: {"theme": "dark", logLevel: "debug" }}%%
 * graph LR
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 *
 * @param {string} text The text defining the graph
 * @returns {object} the json object representing the init passed to mermaid.initialize()
 */

var detectInit = function detectInit(text) {
  var inits = detectDirective(text, /(?:init\b)|(?:initialize\b)/);
  var results = {};

  if (Array.isArray(inits)) {
    var args = inits.map(function (init) {
      return init.args;
    });
    results = assignWithDepth(results, _toConsumableArray(args));
  } else {
    results = inits.args;
  }

  if (results) {
    var type = detectType(text);
    ['config'].forEach(function (prop) {
      if (typeof results[prop] !== 'undefined') {
        if (type === 'flowchart-v2') {
          type = 'flowchart';
        }

        results[type] = results[prop];
        delete results[prop];
      }
    });
  }

  return results;
};
/**
 * @function detectDirective
 * Detects the directive from the text. Text can be single line or multiline. If type is null or omitted
 * the first directive encountered in text will be returned
 * ```mermaid
 * graph LR
 *  %%{somedirective}%%
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 *
 * @param {string} text The text defining the graph
 * @param {string|RegExp} type The directive to return (default: null)
 * @returns {object | Array} An object or Array representing the directive(s): { type: string, args: object|null } matched by the input type
 *          if a single directive was found, that directive object will be returned.
 */

var detectDirective = function detectDirective(text) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  try {
    var commentWithoutDirectives = new RegExp("[%]{2}(?![{]".concat(directiveWithoutOpen.source, ")(?=[}][%]{2}).*\n"), 'ig');
    text = text.trim().replace(commentWithoutDirectives, '').replace(/'/gm, '"');
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].debug("Detecting diagram directive".concat(type !== null ? ' type:' + type : '', " based on the text:").concat(text));
    var match,
        result = [];

    while ((match = directive.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === directive.lastIndex) {
        directive.lastIndex++;
      }

      if (match && !type || type && match[1] && match[1].match(type) || type && match[2] && match[2].match(type)) {
        var _type = match[1] ? match[1] : match[2];

        var args = match[3] ? match[3].trim() : match[4] ? JSON.parse(match[4].trim()) : null;
        result.push({
          type: _type,
          args: args
        });
      }
    }

    if (result.length === 0) {
      result.push({
        type: text,
        args: null
      });
    }

    return result.length === 1 ? result[0] : result;
  } catch (error) {
    _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].error("ERROR: ".concat(error.message, " - Unable to parse directive").concat(type !== null ? ' type:' + type : '', " based on the text:").concat(text));
    return {
      type: null,
      args: null
    };
  }
};
/**
 * @function detectType
 * Detects the type of the graph text. Takes into consideration the possible existence of an %%init
 * directive
 * ```mermaid
 * %%{initialize: {"startOnLoad": true, logLevel: "fatal" }}%%
 * graph LR
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 *
 * @param {string} text The text defining the graph
 * @returns {string} A graph definition key
 */

var detectType = function detectType(text) {
  text = text.replace(directive, '').replace(anyComment, '\n');
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].debug('Detecting diagram type based on the text ' + text);

  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence';
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt';
  }

  if (text.match(/^\s*classDiagram/)) {
    return 'class';
  }

  if (text.match(/^\s*stateDiagram-v2/)) {
    return 'stateDiagram';
  }

  if (text.match(/^\s*stateDiagram/)) {
    return 'state';
  }

  if (text.match(/^\s*gitGraph/)) {
    return 'git';
  }

  if (text.match(/^\s*flowchart/)) {
    return 'flowchart-v2';
  }

  if (text.match(/^\s*info/)) {
    return 'info';
  }

  if (text.match(/^\s*pie/)) {
    return 'pie';
  }

  if (text.match(/^\s*erDiagram/)) {
    return 'er';
  }

  if (text.match(/^\s*journey/)) {
    return 'journey';
  }

  return 'flowchart';
};

var memoize = function memoize(fn, resolver) {
  var cache = {};
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var n = resolver ? resolver.apply(_this, args) : args[0];

    if (n in cache) {
      return cache[n];
    } else {
      var result = fn.apply(void 0, args);
      cache[n] = result;
      return result;
    }
  };
};
/**
 * @function isSubstringInArray
 * Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {array} arr The array to search
 * @returns {number} the array index containing the substring or -1 if not present
 **/


var isSubstringInArray = function isSubstringInArray(str, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) return i;
  }

  return -1;
};
var interpolateToCurve = function interpolateToCurve(interpolate, defaultCurve) {
  if (!interpolate) {
    return defaultCurve;
  }

  var curveName = "curve".concat(interpolate.charAt(0).toUpperCase() + interpolate.slice(1));
  return d3CurveTypes[curveName] || defaultCurve;
};
var formatUrl = function formatUrl(linkStr, config) {
  var url = linkStr.trim();

  if (url) {
    if (config.securityLevel !== 'loose') {
      return Object(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_2__["sanitizeUrl"])(url);
    }

    return url;
  }
};
var runFunc = function runFunc(functionName) {
  var _obj;

  var arrPaths = functionName.split('.');
  var len = arrPaths.length - 1;
  var fnName = arrPaths[len];
  var obj = window;

  for (var i = 0; i < len; i++) {
    obj = obj[arrPaths[i]];
    if (!obj) return;
  }

  for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    params[_key2 - 1] = arguments[_key2];
  }

  (_obj = obj)[fnName].apply(_obj, params);
};

var distance = function distance(p1, p2) {
  return p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) : 0;
};

var traverseEdge = function traverseEdge(points) {
  var prevPoint;
  var totalDistance = 0;
  points.forEach(function (point) {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  }); // Traverse half of total distance along points

  var remainingDistance = totalDistance / 2;
  var center = undefined;
  prevPoint = undefined;
  points.forEach(function (point) {
    if (prevPoint && !center) {
      var vectorDistance = distance(point, prevPoint);

      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        var distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = {
          x: point.x,
          y: point.y
        };

        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
          };
        }
      }
    }

    prevPoint = point;
  });
  return center;
};

var calcLabelPosition = function calcLabelPosition(points) {
  return traverseEdge(points);
};

var calcCardinalityPosition = function calcCardinalityPosition(isRelationTypePresent, points, initialPosition) {
  var prevPoint;
  var totalDistance = 0; // eslint-disable-line

  if (points[0] !== initialPosition) {
    points = points.reverse();
  }

  points.forEach(function (point) {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  }); // Traverse only 25 total distance along points to find cardinality point

  var distanceToCardinalityPoint = 25;
  var remainingDistance = distanceToCardinalityPoint;
  var center;
  prevPoint = undefined;
  points.forEach(function (point) {
    if (prevPoint && !center) {
      var vectorDistance = distance(point, prevPoint);

      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        var distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = {
          x: point.x,
          y: point.y
        };

        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
          };
        }
      }
    }

    prevPoint = point;
  }); // if relation is present (Arrows will be added), change cardinality point off-set distance (d)

  var d = isRelationTypePresent ? 10 : 5; //Calculate Angle for x and y axis

  var angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  var cardinalityPosition = {
    x: 0,
    y: 0
  }; //Calculation cardinality position using angle, center point on the line/curve but pendicular and with offset-distance

  cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
  cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
  return cardinalityPosition;
};

var getStylesFromArray = function getStylesFromArray(arr) {
  var style = '';
  var labelStyle = '';

  for (var i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'undefined') {
      // add text properties to label style definition
      if (arr[i].startsWith('color:') || arr[i].startsWith('text-align:')) {
        labelStyle = labelStyle + arr[i] + ';';
      } else {
        style = style + arr[i] + ';';
      }
    }
  }

  return {
    style: style,
    labelStyle: labelStyle
  };
};
var cnt = 0;
var generateId = function generateId() {
  cnt++;
  return 'id-' + Math.random().toString(36).substr(2, 12) + '-' + cnt;
};
var random = function random(options) {
  return crypto_random_string__WEBPACK_IMPORTED_MODULE_4___default()(options);
};
/**
 * @function assignWithDepth
 * Extends the functionality of {@link ObjectConstructor.assign} with the ability to merge arbitrary-depth objects
 * For each key in src with path `k` (recursively) performs an Object.assign(dst[`k`], src[`k`]) with
 * a slight change from the typical handling of undefined for dst[`k`]: instead of raising an error,
 * dst[`k`] is auto-initialized to {} and effectively merged with src[`k`]
 * <p>
 * Additionally, dissimilar types will not clobber unless the config.clobber parameter === true. Example:
 * ```
 * let config_0 = { foo: { bar: 'bar' }, bar: 'foo' };
 * let config_1 = { foo: 'foo', bar: 'bar' };
 * let result = assignWithDepth(config_0, config_1);
 * console.log(result);
 * //-> result: { foo: { bar: 'bar' }, bar: 'bar' }
 * ```
 * <p>
 * Traditional Object.assign would have clobbered foo in config_0 with foo in config_1.
 * <p>
 * If src is a destructured array of objects and dst is not an array, assignWithDepth will apply each element of src to dst
 * in order.
 * @param dst:any - the destination of the merge
 * @param src:any - the source object(s) to merge into destination
 * @param config:{ depth: number, clobber: boolean } - depth: depth to traverse within src and dst for merging -
 * clobber: should dissimilar types clobber (default: { depth: 2, clobber: false })
 * @returns {*}
 */

var assignWithDepth = function assignWithDepth(dst, src, config) {
  var _Object$assign = Object.assign({
    depth: 2,
    clobber: false
  }, config),
      depth = _Object$assign.depth,
      clobber = _Object$assign.clobber;

  if (Array.isArray(src) && !Array.isArray(dst)) {
    src.forEach(function (s) {
      return assignWithDepth(dst, s, config);
    });
    return dst;
  } else if (Array.isArray(src) && Array.isArray(dst)) {
    src.forEach(function (s) {
      if (dst.indexOf(s) === -1) {
        dst.push(s);
      }
    });
    return dst;
  }

  if (typeof dst === 'undefined' || depth <= 0) {
    if (dst !== undefined && dst !== null && _typeof(dst) === 'object' && _typeof(src) === 'object') {
      return Object.assign(dst, src);
    } else {
      return src;
    }
  }

  if (typeof src !== 'undefined' && _typeof(dst) === 'object' && _typeof(src) === 'object') {
    Object.keys(src).forEach(function (key) {
      if (_typeof(src[key]) === 'object' && (dst[key] === undefined || _typeof(dst[key]) === 'object')) {
        if (dst[key] === undefined) {
          dst[key] = Array.isArray(src[key]) ? [] : {};
        }

        dst[key] = assignWithDepth(dst[key], src[key], {
          depth: depth - 1,
          clobber: clobber
        });
      } else if (clobber || _typeof(dst[key]) !== 'object' && _typeof(src[key]) !== 'object') {
        dst[key] = src[key];
      }
    });
  }

  return dst;
};
var getTextObj = function getTextObj() {
  return {
    x: 0,
    y: 0,
    fill: undefined,
    anchor: 'start',
    style: '#666',
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0,
    valign: undefined
  };
};
var drawSimpleText = function drawSimpleText(elem, textData) {
  // Remove and ignore br:s
  var nText = textData.text.replace(_diagrams_common_common__WEBPACK_IMPORTED_MODULE_3__["default"].lineBreakRegex, ' ');
  var textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.style('font-family', textData.fontFamily);
  textElem.style('font-size', textData.fontSize);
  textElem.style('font-weight', textData.fontWeight);
  textElem.attr('fill', textData.fill);

  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  var span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);
  return textElem;
};
var wrapLabel = memoize(function (label, maxWidth, config) {
  if (!label) {
    return label;
  }

  config = Object.assign({
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Arial',
    joinWith: '<br/>'
  }, config);

  if (_diagrams_common_common__WEBPACK_IMPORTED_MODULE_3__["default"].lineBreakRegex.test(label)) {
    return label;
  }

  var words = label.split(' ');
  var completedLines = [];
  var nextLine = '';
  words.forEach(function (word, index) {
    var wordLength = calculateTextWidth("".concat(word, " "), config);
    var nextLineLength = calculateTextWidth(nextLine, config);

    if (wordLength > maxWidth) {
      var _breakString = breakString(word, maxWidth, '-', config),
          hyphenatedStrings = _breakString.hyphenatedStrings,
          remainingWord = _breakString.remainingWord;

      completedLines.push.apply(completedLines, [nextLine].concat(_toConsumableArray(hyphenatedStrings)));
      nextLine = remainingWord;
    } else if (nextLineLength + wordLength >= maxWidth) {
      completedLines.push(nextLine);
      nextLine = word;
    } else {
      nextLine = [nextLine, word].filter(Boolean).join(' ');
    }

    var currentWord = index + 1;
    var isLastWord = currentWord === words.length;

    if (isLastWord) {
      completedLines.push(nextLine);
    }
  });
  return completedLines.filter(function (line) {
    return line !== '';
  }).join(config.joinWith);
}, function (label, maxWidth, config) {
  return "".concat(label, "-").concat(maxWidth, "-").concat(config.fontSize, "-").concat(config.fontWeight, "-").concat(config.fontFamily, "-").concat(config.joinWith);
});
var breakString = memoize(function (word, maxWidth) {
  var hyphenCharacter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '-';
  var config = arguments.length > 3 ? arguments[3] : undefined;
  config = Object.assign({
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Arial',
    margin: 0
  }, config);
  var characters = word.split('');
  var lines = [];
  var currentLine = '';
  characters.forEach(function (character, index) {
    var nextLine = "".concat(currentLine).concat(character);
    var lineWidth = calculateTextWidth(nextLine, config);

    if (lineWidth >= maxWidth) {
      var currentCharacter = index + 1;
      var isLastLine = characters.length === currentCharacter;
      var hyphenatedNextLine = "".concat(nextLine).concat(hyphenCharacter);
      lines.push(isLastLine ? nextLine : hyphenatedNextLine);
      currentLine = '';
    } else {
      currentLine = nextLine;
    }
  });
  return {
    hyphenatedStrings: lines,
    remainingWord: currentLine
  };
}, function (word, maxWidth) {
  var hyphenCharacter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '-';
  var config = arguments.length > 3 ? arguments[3] : undefined;
  return "".concat(word, "-").concat(maxWidth, "-").concat(hyphenCharacter, "-").concat(config.fontSize, "-").concat(config.fontWeight, "-").concat(config.fontFamily);
});
/**
 * This calculates the text's height, taking into account the wrap breaks and
 * both the statically configured height, width, and the length of the text (in pixels).
 *
 * If the wrapped text text has greater height, we extend the height, so it's
 * value won't overflow.
 *
 * @return - The height for the given text
 * @param text the text to measure
 * @param config - the config for fontSize, fontFamily, and fontWeight all impacting the resulting size
 */

var calculateTextHeight = function calculateTextHeight(text, config) {
  config = Object.assign({
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Arial',
    margin: 15
  }, config);
  return calculateTextDimensions(text, config).height;
};
/**
 * This calculates the width of the given text, font size and family.
 *
 * @return - The width for the given text
 * @param text - The text to calculate the width of
 * @param config - the config for fontSize, fontFamily, and fontWeight all impacting the resulting size
 */

var calculateTextWidth = function calculateTextWidth(text, config) {
  config = Object.assign({
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Arial'
  }, config);
  return calculateTextDimensions(text, config).width;
};
/**
 * This calculates the dimensions of the given text, font size, font family, font weight, and margins.
 *
 * @return - The width for the given text
 * @param text - The text to calculate the width of
 * @param config - the config for fontSize, fontFamily, fontWeight, and margin all impacting the resulting size
 */

var calculateTextDimensions = memoize(function (text, config) {
  config = Object.assign({
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Arial'
  }, config);
  var _config = config,
      fontSize = _config.fontSize,
      fontFamily = _config.fontFamily,
      fontWeight = _config.fontWeight;

  if (!text) {
    return {
      width: 0,
      height: 0
    };
  } // We can't really know if the user supplied font family will render on the user agent;
  // thus, we'll take the max width between the user supplied font family, and a default
  // of sans-serif.


  var fontFamilies = ['sans-serif', fontFamily];
  var lines = text.split(_diagrams_common_common__WEBPACK_IMPORTED_MODULE_3__["default"].lineBreakRegex);
  var dims = [];
  var body = Object(d3__WEBPACK_IMPORTED_MODULE_0__["select"])('body'); // We don't want to leak DOM elements - if a removal operation isn't available
  // for any reason, do not continue.

  if (!body.remove) {
    return {
      width: 0,
      height: 0,
      lineHeight: 0
    };
  }

  var g = body.append('svg');

  for (var _i = 0, _fontFamilies = fontFamilies; _i < _fontFamilies.length; _i++) {
    var _fontFamily = _fontFamilies[_i];
    var cheight = 0;
    var dim = {
      width: 0,
      height: 0,
      lineHeight: 0
    };
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var line = _step.value;
        var textObj = getTextObj();
        textObj.text = line;
        var textElem = drawSimpleText(g, textObj).style('font-size', fontSize).style('font-weight', fontWeight).style('font-family', _fontFamily);
        var bBox = (textElem._groups || textElem)[0][0].getBBox();
        dim.width = Math.round(Math.max(dim.width, bBox.width));
        cheight = Math.round(bBox.height);
        dim.height += cheight;
        dim.lineHeight = Math.round(Math.max(dim.lineHeight, cheight));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    dims.push(dim);
  }

  g.remove();
  var index = isNaN(dims[1].height) || isNaN(dims[1].width) || isNaN(dims[1].lineHeight) || dims[0].height > dims[1].height && dims[0].width > dims[1].width && dims[0].lineHeight > dims[1].lineHeight ? 0 : 1;
  return dims[index];
}, function (text, config) {
  return "".concat(text, "-").concat(config.fontSize, "-").concat(config.fontWeight, "-").concat(config.fontFamily);
});
/* harmony default export */ __webpack_exports__["default"] = ({
  assignWithDepth: assignWithDepth,
  wrapLabel: wrapLabel,
  calculateTextHeight: calculateTextHeight,
  calculateTextWidth: calculateTextWidth,
  calculateTextDimensions: calculateTextDimensions,
  detectInit: detectInit,
  detectDirective: detectDirective,
  detectType: detectType,
  isSubstringInArray: isSubstringInArray,
  interpolateToCurve: interpolateToCurve,
  calcLabelPosition: calcLabelPosition,
  calcCardinalityPosition: calcCardinalityPosition,
  formatUrl: formatUrl,
  getStylesFromArray: getStylesFromArray,
  generateId: generateId,
  random: random,
  memoize: memoize,
  runFunc: runFunc
});

/***/ }),

/***/ "@braintree/sanitize-url":
/*!******************************************!*\
  !*** external "@braintree/sanitize-url" ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@braintree/sanitize-url");

/***/ }),

/***/ "crypto-random-string":
/*!***************************************!*\
  !*** external "crypto-random-string" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("crypto-random-string");

/***/ }),

/***/ "d3":
/*!*********************!*\
  !*** external "d3" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("d3");

/***/ }),

/***/ "dagre":
/*!************************!*\
  !*** external "dagre" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre");

/***/ }),

/***/ "dagre-d3":
/*!***************************!*\
  !*** external "dagre-d3" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre-d3");

/***/ }),

/***/ "dagre-d3/lib/label/add-html-label.js":
/*!*******************************************************!*\
  !*** external "dagre-d3/lib/label/add-html-label.js" ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre-d3/lib/label/add-html-label.js");

/***/ }),

/***/ "entity-decode/browser":
/*!****************************************!*\
  !*** external "entity-decode/browser" ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("entity-decode/browser");

/***/ }),

/***/ "graphlib":
/*!***************************!*\
  !*** external "graphlib" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("graphlib");

/***/ }),

/***/ "moment-mini":
/*!******************************!*\
  !*** external "moment-mini" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("moment-mini");

/***/ }),

/***/ "scope-css":
/*!****************************!*\
  !*** external "scope-css" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("scope-css");

/***/ })

/******/ })["default"];
});
//# sourceMappingURL=mermaid.core.js.map