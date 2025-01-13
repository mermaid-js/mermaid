"use strict";
/*
Railroad Diagrams
by Tab Atkins Jr. (and others)
http://xanthir.com
http://twitter.com/tabatkins
http://github.com/tabatkins/railroad-diagrams

This document and all associated files in the github project are licensed under CC0: http://creativecommons.org/publicdomain/zero/1.0/
This means you can reuse, remix, or otherwise appropriate this project for your own use WITHOUT RESTRICTION.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, JUST USE IT.
I would appreciate attribution, but that is not required by the license.
*/

// Export function versions of all the constructors.
// Each class will add itself to this object.
const funcs = {};
export default funcs;

export const Options = {
	DEBUG: false, // if true, writes some debug information into attributes
	VS: 8, // minimum vertical separation between things. For a 3px stroke, must be at least 4
	AR: 10, // radius of arcs
	DIAGRAM_CLASS: 'railroad-diagram', // class to put on the root <svg>
	STROKE_ODD_PIXEL_LENGTH: true, // is the stroke width an odd (1px, 3px, etc) pixel length?
	INTERNAL_ALIGNMENT: 'center', // how to align items when they have extra space. left/right/center
	CHAR_WIDTH: 8.5, // width of each monospace character. play until you find the right value for your font
	COMMENT_CHAR_WIDTH: 7, // comments are in smaller text by default
    ESCAPE_HTML: true, // Should Diagram.toText() produce HTML-escaped text, or raw?
};

export const defaultCSS = `
	svg {
		background-color: hsl(30,20%,95%);
	}
	path {
		stroke-width: 3;
		stroke: black;
		fill: rgba(0,0,0,0);
	}
	text {
		font: bold 14px monospace;
		text-anchor: middle;
		white-space: pre;
	}
	text.diagram-text {
		font-size: 12px;
	}
	text.diagram-arrow {
		font-size: 16px;
	}
	text.label {
		text-anchor: start;
	}
	text.comment {
		font: italic 12px monospace;
	}
	g.non-terminal text {
		/*font-style: italic;*/
	}
	rect {
		stroke-width: 3;
		stroke: black;
		fill: hsl(120,100%,90%);
	}
	rect.group-box {
		stroke: gray;
		stroke-dasharray: 10 5;
		fill: none;
	}
	path.diagram-text {
		stroke-width: 3;
		stroke: black;
		fill: white;
		cursor: help;
	}
	g.diagram-text:hover path.diagram-text {
		fill: #eee;
	}`;


export class FakeSVG {
	constructor(tagName, attrs, text) {
		if(text) this.children = text;
		else this.children = [];
		this.tagName = tagName;
		this.attrs = unnull(attrs, {});
	}
	format(x, y, width) {
		// Virtual
	}
	addTo(parent) {
		if(parent instanceof FakeSVG) {
			parent.children.push(this);
			return this;
		} else {
			var svg = this.toSVG();
			parent.appendChild(svg);
			return svg;
		}
	}
	toSVG() {
		var el = SVG(this.tagName, this.attrs);
		if(typeof this.children == 'string') {
			el.textContent = this.children;
		} else {
			this.children.forEach(function(e) {
				el.appendChild(e.toSVG());
			});
		}
		return el;
	}
	toString() {
		var str = '<' + this.tagName;
		var group = this.tagName == "g" || this.tagName == "svg";
		for(var attr in this.attrs) {
			str += ' ' + attr + '="' + (this.attrs[attr]+'').replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"';
		}
		str += '>';
		if(group) str += "\n";
		if(typeof this.children == 'string') {
			str += escapeString(this.children);
		} else {
			this.children.forEach(function(e) {
				str += e;
			});
		}
		str += '</' + this.tagName + '>\n';
		return str;
	}
	toTextDiagram() {
		return new TextDiagram(0, 0, []);
	}
	toText() {
		var outputTD = this.toTextDiagram();
		var output = outputTD.lines.join("\n") + "\n";
		if(Options.ESCAPE_HTML) {
			output = output.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;");
		}
		return output;
	}
	walk(cb) {
		cb(this);
	}
}


export class Path extends FakeSVG {
	constructor(x,y) {
		super('path');
		this.attrs.d = "M"+x+' '+y;
	}
	m(x,y) {
		this.attrs.d += 'm'+x+' '+y;
		return this;
	}
	h(val) {
		this.attrs.d += 'h'+val;
		return this;
	}
	right(val) { return this.h(Math.max(0, val)); }
	left(val) { return this.h(-Math.max(0, val)); }
	v(val) {
		this.attrs.d += 'v'+val;
		return this;
	}
	down(val) { return this.v(Math.max(0, val)); }
	up(val) { return this.v(-Math.max(0, val)); }
	arc(sweep){
		// 1/4 of a circle
		var x = Options.AR;
		var y = Options.AR;
		if(sweep[0] == 'e' || sweep[1] == 'w') {
			x *= -1;
		}
		if(sweep[0] == 's' || sweep[1] == 'n') {
			y *= -1;
		}
		var cw;
		if(sweep == 'ne' || sweep == 'es' || sweep == 'sw' || sweep == 'wn') {
			cw = 1;
		} else {
			cw = 0;
		}
		this.attrs.d += "a"+Options.AR+" "+Options.AR+" 0 0 "+cw+' '+x+' '+y;
		return this;
	}
	arc_8(start, dir) {
		// 1/8 of a circle
		const arc = Options.AR;
		const s2 = 1/Math.sqrt(2) * arc;
		const s2inv = (arc - s2);
		let path = "a " + arc + " " + arc + " 0 0 " + (dir=='cw' ? "1" : "0") + " ";
		const sd = start+dir;
		const offset =
			sd == 'ncw'   ? [s2, s2inv] :
			sd == 'necw'  ? [s2inv, s2] :
			sd == 'ecw'   ? [-s2inv, s2] :
			sd == 'secw'  ? [-s2, s2inv] :
			sd == 'scw'   ? [-s2, -s2inv] :
			sd == 'swcw'  ? [-s2inv, -s2] :
			sd == 'wcw'   ? [s2inv, -s2] :
			sd == 'nwcw'  ? [s2, -s2inv] :
			sd == 'nccw'  ? [-s2, s2inv] :
			sd == 'nwccw' ? [-s2inv, s2] :
			sd == 'wccw'  ? [s2inv, s2] :
			sd == 'swccw' ? [s2, s2inv] :
			sd == 'sccw'  ? [s2, -s2inv] :
			sd == 'seccw' ? [s2inv, -s2] :
			sd == 'eccw'  ? [-s2inv, -s2] :
			sd == 'neccw' ? [-s2, -s2inv] : null
		;
		path += offset.join(" ");
		this.attrs.d += path;
		return this;
	}
	l(x, y) {
		this.attrs.d += 'l'+x+' '+y;
		return this;
	}
	format() {
		// All paths in this library start/end horizontally.
		// The extra .5 ensures a minor overlap, so there's no seams in bad rasterizers.
		this.attrs.d += 'h.5';
		return this;
	}
	toTextDiagram() {
		return new TextDiagram(0, 0, []);
	}
}


export class DiagramMultiContainer extends FakeSVG {
	constructor(tagName, items, attrs, text) {
		super(tagName, attrs, text);
		this.items = items.map(wrapString);
	}
	walk(cb) {
		cb(this);
		this.items.forEach(x=>x.walk(cb));
	}
}


export class Diagram extends DiagramMultiContainer {
	constructor(...items) {
		super('svg', items, {class: Options.DIAGRAM_CLASS});
		if(!(this.items[0] instanceof Start)) {
			this.items.unshift(new Start());
		}
		if(!(this.items[this.items.length-1] instanceof End)) {
			this.items.push(new End());
		}
		this.up = this.down = this.height = this.width = 0;
		for(const item of this.items) {
			this.width += item.width + (item.needsSpace?20:0);
			this.up = Math.max(this.up, item.up - this.height);
			this.height += item.height;
			this.down = Math.max(this.down - item.height, item.down);
		}
		this.formatted = false;
	}
	format(paddingt, paddingr, paddingb, paddingl) {
		paddingt = unnull(paddingt, 20);
		paddingr = unnull(paddingr, paddingt, 20);
		paddingb = unnull(paddingb, paddingt, 20);
		paddingl = unnull(paddingl, paddingr, 20);
		var x = paddingl;
		var y = paddingt;
		y += this.up;
		var g = new FakeSVG('g', Options.STROKE_ODD_PIXEL_LENGTH ? {transform:'translate(.5 .5)'} : {});
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if(item.needsSpace) {
				new Path(x,y).h(10).addTo(g);
				x += 10;
			}
			item.format(x, y, item.width).addTo(g);
			x += item.width;
			y += item.height;
			if(item.needsSpace) {
				new Path(x,y).h(10).addTo(g);
				x += 10;
			}
		}
		this.attrs.width = this.width + paddingl + paddingr;
		this.attrs.height = this.up + this.height + this.down + paddingt + paddingb;
		this.attrs.viewBox = "0 0 " + this.attrs.width + " " + this.attrs.height;
		g.addTo(this);
		this.formatted = true;
		return this;
	}
	addTo(parent) {
		if(!parent) {
			var scriptTag = document.getElementsByTagName('script');
			scriptTag = scriptTag[scriptTag.length - 1];
			parent = scriptTag.parentNode;
		}
		return super.addTo.call(this, parent);
	}
	toSVG() {
		if(!this.formatted) {
			this.format();
		}
		return super.toSVG.call(this);
	}
	toString() {
		if(!this.formatted) {
			this.format();
		}
		return super.toString.call(this);
	}
	toStandalone(style) {
		if(!this.formatted) {
			this.format();
		}
		const s = new FakeSVG('style', {}, style || defaultCSS);
		this.children.push(s);
		this.attrs.xmlns = "http://www.w3.org/2000/svg";
		this.attrs['xmlns:xlink'] = "http://www.w3.org/1999/xlink";
		const result = super.toString.call(this);
		this.children.pop();
		delete this.attrs.xmlns;
		return result;
	}
	toTextDiagram() {
		var [separator] = TextDiagram._getParts(["separator"])
		var diagramTD = this.items[0].toTextDiagram();
		for(const item of this.items.slice(1)) {
			var itemTD = item.toTextDiagram();
			if(item.needsSpace) {
				itemTD = itemTD.expand(1, 1, 0, 0);
			}
			diagramTD = diagramTD.appendRight(itemTD, separator);
		}
		return diagramTD;
	}
}
funcs.Diagram = (...args)=>new Diagram(...args);


export class ComplexDiagram extends FakeSVG {
	constructor(...items) {
		var diagram = new Diagram(...items);
		diagram.items[0] = new Start({type:"complex"});
		diagram.items[diagram.items.length-1] = new End({type:"complex"});
		return diagram;
	}
}
funcs.ComplexDiagram = (...args)=>new ComplexDiagram(...args);


export class Sequence extends DiagramMultiContainer {
	constructor(...items) {
		super('g', items);
		var numberOfItems = this.items.length;
		this.needsSpace = true;
		this.up = this.down = this.height = this.width = 0;
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			this.width += item.width + (item.needsSpace?20:0);
			this.up = Math.max(this.up, item.up - this.height);
			this.height += item.height;
			this.down = Math.max(this.down - item.height, item.down);
		}
		if(this.items[0].needsSpace) this.width -= 10;
		if(this.items[this.items.length-1].needsSpace) this.width -= 10;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "sequence";
		}
	}
	format(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if(item.needsSpace && i > 0) {
				new Path(x,y).h(10).addTo(this);
				x += 10;
			}
			item.format(x, y, item.width).addTo(this);
			x += item.width;
			y += item.height;
			if(item.needsSpace && i < this.items.length-1) {
				new Path(x,y).h(10).addTo(this);
				x += 10;
			}
		}
		return this;
	}
	toTextDiagram() {
		var [separator] = TextDiagram._getParts(["separator"])
		var diagramTD = new TextDiagram(0, 0, [""])
		for(const item of this.items) {
			var itemTD = item.toTextDiagram();
			if(item.needsSpace) {
				itemTD = itemTD.expand(1, 1, 0, 0);
			}
			diagramTD = diagramTD.appendRight(itemTD, separator);
		}
		return diagramTD;
	}
}
funcs.Sequence = (...args)=>new Sequence(...args);


export class Stack extends DiagramMultiContainer {
	constructor(...items) {
		super('g', items);
		if( items.length === 0 ) {
			throw new RangeError("Stack() must have at least one child.");
		}
		this.width = Math.max.apply(null, this.items.map(function(e) { return e.width + (e.needsSpace?20:0); }));
		//if(this.items[0].needsSpace) this.width -= 10;
		//if(this.items[this.items.length-1].needsSpace) this.width -= 10;
		if(this.items.length > 1){
			this.width += Options.AR*2;
		}
		this.needsSpace = true;
		this.up = this.items[0].up;
		this.down = this.items[this.items.length-1].down;

		this.height = 0;
		var last = this.items.length - 1;
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			this.height += item.height;
			if(i > 0) {
				this.height += Math.max(Options.AR*2, item.up + Options.VS);
			}
			if(i < last) {
				this.height += Math.max(Options.AR*2, item.down + Options.VS);
			}
		}
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "stack";
		}
	}
	format(x,y,width) {
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		x += gaps[0];
		var xInitial = x;
		if(this.items.length > 1) {
			new Path(x, y).h(Options.AR).addTo(this);
			x += Options.AR;
		}

		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			var innerWidth = this.width - (this.items.length>1 ? Options.AR*2 : 0);
			item.format(x, y, innerWidth).addTo(this);
			x += innerWidth;
			y += item.height;

			if(i !== this.items.length-1) {
				new Path(x, y)
					.arc('ne').down(Math.max(0, item.down + Options.VS - Options.AR*2))
					.arc('es').left(innerWidth)
					.arc('nw').down(Math.max(0, this.items[i+1].up + Options.VS - Options.AR*2))
					.arc('ws').addTo(this);
				y += Math.max(item.down + Options.VS, Options.AR*2) + Math.max(this.items[i+1].up + Options.VS, Options.AR*2);
				//y += Math.max(Options.AR*4, item.down + Options.VS*2 + this.items[i+1].up)
				x = xInitial+Options.AR;
			}

		}

		if(this.items.length > 1) {
			new Path(x,y).h(Options.AR).addTo(this);
			x += Options.AR;
		}
		new Path(x,y).h(gaps[1]).addTo(this);

		return this;
	}
	toTextDiagram() {
		var [corner_bot_left, corner_bot_right, corner_top_left, corner_top_right, line, line_vertical] = TextDiagram._getParts(["corner_bot_left", "corner_bot_right", "corner_top_left", "corner_top_right", "line", "line_vertical"]);

		// Format all the child items, so we can know the maximum width.
		var itemTDs = [];
		for(const item of this.items) {
			itemTDs.push(item.toTextDiagram());
		}
		var maxWidth = Math.max(...(itemTDs.map(function(itemTD) {return itemTD.width;})));

		var leftLines = [];
		var rightLines = [];
		var separatorTD = new TextDiagram(0, 0, [line.repeat(maxWidth)]);
		var diagramTD = null;  // Top item will replace it

		for(var [itemNum, itemTD] of enumerate(itemTDs)) {
			if(itemNum == 0) {
				// The top item enters directly from its left.
				leftLines.push(line + line);
				for(var i = 0; i < (itemTD.height - itemTD.entry - 1); i++) {
					leftLines.push("  ");
				}
			} else {
				// All items below the top enter from a snake-line from the previous item's exit.
				// Here, we resume that line, already having descended from above on the right.
				diagramTD = diagramTD.appendBelow(separatorTD, []);
				leftLines.push(corner_top_left + line);
				for(i = 0; i < itemTD.entry; i++) {
					leftLines.push(line_vertical + " ")
				}
				leftLines.push(corner_bot_left + line);
				for(i = 0; i < (itemTD.height - itemTD.entry - 1); i++) {
					leftLines.push("  ");
				}
				for(i = 0; i < itemTD.exit; i++) {
					rightLines.push("  ");
				}
			}
			if(itemNum < itemTDs.length - 1) {
				// All items above the bottom exit via a snake-line to the next item's entry.
				// Here, we start that line on the right.
				rightLines.push(line + corner_top_right);
				for(i = 0; i < (itemTD.height - itemTD.exit - 1); i++) {
					rightLines.push(" " + line_vertical);
				}
				rightLines.push(line + corner_bot_right);
			} else {
				// The bottom item exits directly to its right.
				rightLines.push(line + line);
			}
			var [leftPad, rightPad] = TextDiagram._gaps(maxWidth, itemTD.width);
			itemTD = itemTD.expand(leftPad, rightPad, 0, 0);
			if(itemNum == 0) {
				diagramTD = itemTD;
			} else {
				diagramTD = diagramTD.appendBelow(itemTD, []);
			}
		}

		var leftTD = new TextDiagram(0, 0, leftLines);
		diagramTD = leftTD.appendRight(diagramTD, "");
		var rightTD = new TextDiagram(0, rightLines.length - 1, rightLines);
		diagramTD = diagramTD.appendRight(rightTD, "");
		return diagramTD;
	}
}
funcs.Stack = (...args)=>new Stack(...args);


export class OptionalSequence extends DiagramMultiContainer {
	constructor(...items) {
		super('g', items);
		if( items.length === 0 ) {
			throw new RangeError("OptionalSequence() must have at least one child.");
		}
		if( items.length === 1 ) {
			return new Sequence(items);
		}
		var arc = Options.AR;
		this.needsSpace = false;
		this.width = 0;
		this.up = 0;
		this.height = sum(this.items, function(x){return x.height});
		this.down = this.items[0].down;
		var heightSoFar = 0;
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			this.up = Math.max(this.up, Math.max(arc*2, item.up + Options.VS) - heightSoFar);
			heightSoFar += item.height;
			if(i > 0) {
				this.down = Math.max(this.height + this.down, heightSoFar + Math.max(arc*2, item.down + Options.VS)) - this.height;
			}
			var itemWidth = (item.needsSpace?10:0) + item.width;
			if(i === 0) {
				this.width += arc + Math.max(itemWidth, arc);
			} else {
				this.width += arc*2 + Math.max(itemWidth, arc) + arc;
			}
		}
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "optseq";
		}
	}
	format(x, y, width) {
		var arc = Options.AR;
		var gaps = determineGaps(width, this.width);
		new Path(x, y).right(gaps[0]).addTo(this);
		new Path(x + gaps[0] + this.width, y + this.height).right(gaps[1]).addTo(this);
		x += gaps[0];
		var upperLineY = y - this.up;
		var last = this.items.length - 1;
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			var itemSpace = (item.needsSpace?10:0);
			var itemWidth = item.width + itemSpace;
			if(i === 0) {
				// Upper skip
				new Path(x,y)
					.arc('se')
					.up(y - upperLineY - arc*2)
					.arc('wn')
					.right(itemWidth - arc)
					.arc('ne')
					.down(y + item.height - upperLineY - arc*2)
					.arc('ws')
					.addTo(this);
				// Straight line
				new Path(x, y)
					.right(itemSpace + arc)
					.addTo(this);
				item.format(x + itemSpace + arc, y, item.width).addTo(this);
				x += itemWidth + arc;
				y += item.height;
				// x ends on the far side of the first element,
				// where the next element's skip needs to begin
			} else if(i < last) {
				// Upper skip
				new Path(x, upperLineY)
					.right(arc*2 + Math.max(itemWidth, arc) + arc)
					.arc('ne')
					.down(y - upperLineY + item.height - arc*2)
					.arc('ws')
					.addTo(this);
				// Straight line
				new Path(x,y)
					.right(arc*2)
					.addTo(this);
				item.format(x + arc*2, y, item.width).addTo(this);
				new Path(x + item.width + arc*2, y + item.height)
					.right(itemSpace + arc)
					.addTo(this);
				// Lower skip
				new Path(x,y)
					.arc('ne')
					.down(item.height + Math.max(item.down + Options.VS, arc*2) - arc*2)
					.arc('ws')
					.right(itemWidth - arc)
					.arc('se')
					.up(item.down + Options.VS - arc*2)
					.arc('wn')
					.addTo(this);
				x += arc*2 + Math.max(itemWidth, arc) + arc;
				y += item.height;
			} else {
				// Straight line
				new Path(x, y)
					.right(arc*2)
					.addTo(this);
				item.format(x + arc*2, y, item.width).addTo(this);
				new Path(x + arc*2 + item.width, y + item.height)
					.right(itemSpace + arc)
					.addTo(this);
				// Lower skip
				new Path(x,y)
					.arc('ne')
					.down(item.height + Math.max(item.down + Options.VS, arc*2) - arc*2)
					.arc('ws')
					.right(itemWidth - arc)
					.arc('se')
					.up(item.down + Options.VS - arc*2)
					.arc('wn')
					.addTo(this);
			}
		}
		return this;
	}
	toTextDiagram() {
		var [line, line_vertical, roundcorner_bot_left, roundcorner_bot_right, roundcorner_top_left, roundcorner_top_right] = TextDiagram._getParts(["line", "line_vertical", "roundcorner_bot_left", "roundcorner_bot_right", "roundcorner_top_left", "roundcorner_top_right"]);

		// Format all the child items, so we can know the maximum entry.
		var itemTDs = [];
		for(const item of this.items) {
			itemTDs.push(item.toTextDiagram());
		}
		// diagramEntry: distance from top to lowest entry, aka distance from top to diagram entry, aka final diagram entry and exit.
		var diagramEntry = Math.max(...(itemTDs.map(function(itemTD) {return itemTD.entry})));
		// SOILHeight: distance from top to lowest entry before rightmost item, aka distance from skip-over-items line to rightmost entry, aka SOIL height.
		var SOILHeight = Math.max(...(itemTDs.slice(0,-1).map(function(itemTD) {return itemTD.entry;})));
		// topToSOIL: distance from top to skip-over-items line.
		var topToSOIL = diagramEntry - SOILHeight;

		// The diagram starts with a line from its entry up to the skip-over-items line {
		var lines = [];
		for(var i = 0; i < topToSOIL; i++) {
			lines.push("  ");
		}
		lines.push(roundcorner_top_left + line);
		for(i = 0; i < SOILHeight; i++) {
			lines.push(line_vertical + " ");
		}
		lines.push(roundcorner_bot_right + line);
		var diagramTD = new TextDiagram(lines.length - 1, lines.length - 1, lines);
		for(const [itemNum, itemTD] of enumerate(itemTDs)) {
			if(itemNum > 0) {
				// All items except the leftmost start with a line from their entry down to their skip-under-item line,
				// with a joining-line across at the skip-over-items line
				lines = [];
				for(i = 0; i < topToSOIL; i++) {
					lines.push("  ");
				}
				lines.push(line + line);
				for(i = 0; i < (diagramTD.exit - topToSOIL - 1); i++) {
					lines.push("  ");
				}
				lines.push(line + roundcorner_top_right);
				for(i = 0; i < (itemTD.height - itemTD.entry - 1); i++) {
					lines.push(" " + line_vertical);
				}
				lines.push(" " + roundcorner_bot_left);
				var skipDownTD = new TextDiagram(diagramTD.exit, diagramTD.exit, lines);
				diagramTD = diagramTD.appendRight(skipDownTD, "");
				// All items except the leftmost next have a line from skip-over-items line down to their entry,
				// with joining-lines at their entry and at their skip-under-item line
				lines = [];
				for(i = 0; i < topToSOIL; i++) {
					lines.push("  ");
				}
				// All such items except the rightmost also have a continuation of the skip-over-items line
				var lineToNextItem = itemNum < itemTDs.length - 1 ? line : " ";
				lines.push(line + roundcorner_top_right + lineToNextItem);
				for(i = 0; i < (diagramTD.exit - topToSOIL - 1); i++) {
					lines.push(" " + line_vertical + " ");
				}
				lines.push(line + roundcorner_bot_left + line);
				for(i = 0; i < (itemTD.height - itemTD.entry - 1); i++) {
					lines.push("   ");
				}
				lines.push(line + line + line);
				var entryTD = new TextDiagram(diagramTD.exit, diagramTD.exit, lines);
				diagramTD = diagramTD.appendRight(entryTD, "");
			}
			var partTD = new TextDiagram(0, 0, []);
			if(itemNum < itemTDs.length - 1) {
				// All items except the rightmost have a segment of the skip-over-items line at the top,
				// followed by enough blank lines to push their entry down to the previous item's exit
				lines = [];
				lines.push(line.repeat(itemTD.width));
				for(i = 0; i < (SOILHeight - itemTD.entry); i++) {
					lines.push(" ".repeat(itemTD.width));
				}
				var SOILSegment = new TextDiagram(0, 0, lines);
				partTD = partTD.appendBelow(SOILSegment, []);
			}
			partTD = partTD.appendBelow(itemTD, [], true, true);
			if (itemNum > 0) {
				// All items except the leftmost have their skip-under-item line at the bottom.
				var SUILSegment = new TextDiagram(0, 0, [line.repeat(itemTD.width)]);
				partTD = partTD.appendBelow(SUILSegment, []);
			}
			diagramTD = diagramTD.appendRight(partTD, "");
			if(0 < itemNum) {
				// All items except the leftmost have a line from their skip-under-item line to their exit
				lines = [];
				for(i = 0; i < topToSOIL; i++) {
					lines.push("  ");
				}
				// All such items except the rightmost also have a joining-line across at the skip-over-items line
				var skipOverChar = itemNum < itemTDs.length - 1 ? line : " ";
				lines.push(skipOverChar.repeat(2));
				for(i = 0; i < (diagramTD.exit - topToSOIL - 1); i++) {
					lines.push("  ");
				}
				lines.push(line + roundcorner_top_left);
				for(i = 0; i < (partTD.height - partTD.exit - 2); i++) {
					lines.push(" " + line_vertical);
				}
				lines.push(line + roundcorner_bot_right);
				var skipUpTD = new TextDiagram(diagramTD.exit, diagramTD.exit, lines);
				diagramTD = diagramTD.appendRight(skipUpTD, "");
			}
		}
		return diagramTD;
	}
}
funcs.OptionalSequence = (...args)=>new OptionalSequence(...args);


export class AlternatingSequence extends DiagramMultiContainer {
	constructor(...items) {
		super('g', items);
		if( items.length === 1 ) {
			return new Sequence(items);
		}
		if( items.length !== 2 ) {
			throw new RangeError("AlternatingSequence() must have one or two children.");
		}
		this.needsSpace = false;

		const arc = Options.AR;
		const vert = Options.VS;
		const max = Math.max;
		const first = this.items[0];
		const second = this.items[1];

		const arcX = 1 / Math.sqrt(2) * arc * 2;
		const arcY = (1 - 1 / Math.sqrt(2)) * arc * 2;
		const crossY = Math.max(arc, Options.VS);
		const crossX = (crossY - arcY) + arcX;

		const firstOut = max(arc + arc, crossY/2 + arc + arc, crossY/2 + vert + first.down);
		this.up = firstOut + first.height + first.up;

		const secondIn = max(arc + arc, crossY/2 + arc + arc, crossY/2 + vert + second.up);
		this.down = secondIn + second.height + second.down;

		this.height = 0;

		const firstWidth = 2*(first.needsSpace?10:0) + first.width;
		const secondWidth = 2*(second.needsSpace?10:0) + second.width;
		this.width = 2*arc + max(firstWidth, crossX, secondWidth) + 2*arc;

		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "altseq";
		}
	}
	format(x, y, width) {
		const arc = Options.AR;
		const gaps = determineGaps(width, this.width);
		new Path(x,y).right(gaps[0]).addTo(this);
		x += gaps[0];
		new Path(x+this.width, y).right(gaps[1]).addTo(this);
		// bounding box
		//new Path(x+gaps[0], y).up(this.up).right(this.width).down(this.up+this.down).left(this.width).up(this.down).addTo(this);
		const first = this.items[0];
		const second = this.items[1];

		// top
		const firstIn = this.up - first.up;
		const firstOut = this.up - first.up - first.height;
		new Path(x,y).arc('se').up(firstIn-2*arc).arc('wn').addTo(this);
		first.format(x + 2*arc, y - firstIn, this.width - 4*arc).addTo(this);
		new Path(x + this.width - 2*arc, y - firstOut).arc('ne').down(firstOut - 2*arc).arc('ws').addTo(this);

		// bottom
		const secondIn = this.down - second.down - second.height;
		const secondOut = this.down - second.down;
		new Path(x,y).arc('ne').down(secondIn - 2*arc).arc('ws').addTo(this);
		second.format(x + 2*arc, y + secondIn, this.width - 4*arc).addTo(this);
		new Path(x + this.width - 2*arc, y + secondOut).arc('se').up(secondOut - 2*arc).arc('wn').addTo(this);

		// crossover
		const arcX = 1 / Math.sqrt(2) * arc * 2;
		const arcY = (1 - 1 / Math.sqrt(2)) * arc * 2;
		const crossY = Math.max(arc, Options.VS);
		const crossX = (crossY - arcY) + arcX;
		const crossBar = (this.width - 4*arc - crossX)/2;
		new Path(x+arc, y - crossY/2 - arc).arc('ws').right(crossBar)
			.arc_8('n', 'cw').l(crossX - arcX, crossY - arcY).arc_8('sw', 'ccw')
			.right(crossBar).arc('ne').addTo(this);
		new Path(x+arc, y + crossY/2 + arc).arc('wn').right(crossBar)
			.arc_8('s', 'ccw').l(crossX - arcX, -(crossY - arcY)).arc_8('nw', 'cw')
			.right(crossBar).arc('se').addTo(this);

		return this;
	}
	toTextDiagram() {
		var [cross_diag, corner_bot_left, corner_bot_right, corner_top_left, corner_top_right, line, line_vertical, tee_left, tee_right] = TextDiagram._getParts(["cross_diag", "roundcorner_bot_left", "roundcorner_bot_right", "roundcorner_top_left", "roundcorner_top_right", "line", "line_vertical", "tee_left", "tee_right"]);

		var firstTD = this.items[0].toTextDiagram();
		var secondTD = this.items[1].toTextDiagram();
		var maxWidth = TextDiagram._maxWidth(firstTD, secondTD);
		var [leftWidth, rightWidth] = TextDiagram._gaps(maxWidth, 0);
		var leftLines = [];
		var rightLines = [];
		var separator = [];
		var [leftSize, rightSize] = TextDiagram._gaps(firstTD.width, 0);
		var diagramTD = firstTD.expand(leftWidth - leftSize, rightWidth - rightSize, 0, 0);
		for(var i = 0; i < diagramTD.entry; i++) {
			leftLines.push("  ");
		}
		leftLines.push(corner_top_left + line);
		for(i = 0; i < (diagramTD.height - diagramTD.entry - 1); i++) {
			leftLines.push(line_vertical + " ");
		}
		leftLines.push(corner_bot_left + line);
		for(i = 0; i < diagramTD.exit; i++) {
			rightLines.push("  ");
		}
		rightLines.push(line + corner_top_right);
		for(i = 0; i < (diagramTD.height - diagramTD.exit - 1); i++) {
			rightLines.push(" " + line_vertical);
		}
		rightLines.push(line + corner_bot_right);

		separator.push((line.repeat(leftWidth - 1)) + corner_top_right + " " + corner_top_left + (line.repeat(rightWidth - 2)));
		separator.push((" ".repeat(leftWidth - 1)) + " " + cross_diag + " " + (" ".repeat(rightWidth - 2)));
		separator.push((line.repeat(leftWidth - 1)) + corner_bot_right + " " + corner_bot_left + (line.repeat(rightWidth - 2)));
		leftLines.push("  ");
		rightLines.push("  ");

		[leftSize, rightSize] = TextDiagram._gaps(secondTD.width, 0);
		secondTD = secondTD.expand(leftWidth - leftSize, rightWidth - rightSize, 0, 0);
		diagramTD = diagramTD.appendBelow(secondTD, separator, true, true);
		leftLines.push(corner_top_left + line);
		for(i = 0; i < secondTD.entry; i++) {
			leftLines.push(line_vertical + " ");
		}
		leftLines.push(corner_bot_left + line);
		rightLines.push(line + corner_top_right);
		for(i = 0; i < secondTD.exit; i++) {
			rightLines.push(" " + line_vertical);
		}
		rightLines.push(line + corner_bot_right);

		diagramTD = diagramTD.alter(firstTD.height + Math.trunc(separator.length / 2), firstTD.height + Math.trunc(separator.length / 2));
		var leftTD = new TextDiagram(firstTD.height + Math.trunc(separator.length / 2), firstTD.height + Math.trunc(separator.length / 2), leftLines);
		var rightTD = new TextDiagram(firstTD.height + Math.trunc(separator.length / 2), firstTD.height + Math.trunc(separator.length / 2), rightLines);
		diagramTD = leftTD.appendRight(diagramTD, "").appendRight(rightTD, "");
		diagramTD = new TextDiagram(1, 1, [corner_top_left, tee_left, corner_bot_left]).appendRight(diagramTD, "").appendRight(new TextDiagram(1, 1, [corner_top_right, tee_right, corner_bot_right]), "");
		return diagramTD;
	}
}
funcs.AlternatingSequence = (...args)=>new AlternatingSequence(...args);


export class Choice extends DiagramMultiContainer {
	constructor(normal, ...items) {
		super('g', items);
		if( typeof normal !== "number" || normal !== Math.floor(normal) ) {
			throw new TypeError("The first argument of Choice() must be an integer.");
		} else if(normal < 0 || normal >= items.length) {
			throw new RangeError("The first argument of Choice() must be an index for one of the items.");
		} else {
			this.normal = normal;
		}
		this.width = max(this.items, el=>el.width) + Options.AR*4;
		var firstItem = this.items[0];
		var lastItem = this.items[items.length - 1];
		var normalItem = this.items[normal];

        // The size of the vertical separation between an item
        // and the following item.
        // The calcs are non-trivial and need to be done both here
        // and in .format(), so no reason to do it twice.
        this.separators = Array.from({length:items.length-1}, x=>0);

        // If the entry or exit lines would be too close together
        // to accommodate the arcs,
        // bump up the vertical separation to compensate.
        this.up = 0
        var arcs;
        for(var i = normal - 1; i >= 0; i--) {
            if(i == normal-1) arcs = Options.AR * 2;
            else arcs = Options.AR;

            let item = this.items[i];
            let lowerItem = this.items[i+1];

            let entryDelta = lowerItem.up + Options.VS + item.down + item.height;
            let exitDelta = lowerItem.height + lowerItem.up + Options.VS + item.down;

            let separator = Options.VS;
            if(exitDelta < arcs || entryDelta < arcs) {
                separator += Math.max(arcs - entryDelta, arcs - exitDelta)
            }
            this.separators[i] = separator
            this.up += lowerItem.up + separator + item.down + item.height
        }
        this.up += firstItem.up;

        this.height = normalItem.height;

        this.down = 0;
        for(var i = normal+1; i < this.items.length; i++) {
            if(i == normal+1) arcs = Options.AR * 2;
            else arcs = Options.AR;

            let item = this.items[i];
            let upperItem = this.items[i-1];

            let entryDelta = upperItem.height + upperItem.down + Options.VS + item.up;
            let exitDelta = upperItem.down + Options.VS + item.up + item.height;

            let separator = Options.VS;
            if(entryDelta < arcs || exitDelta < arcs) {
                separator += Math.max(arcs - entryDelta, arcs - exitDelta)
            }
            this.separators[i-1] = separator;
            this.down += upperItem.down + separator + item.up + item.height;
        }
        this.down += lastItem.down;

		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "choice";
		}
	}
	format(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		var last = this.items.length -1;
		var innerWidth = this.width - Options.AR*4;

		// Do the elements that curve above
		var distanceFromY = 0;
		for(var i = this.normal - 1; i >= 0; i--) {
            let item = this.items[i];
            let lowerItem = this.items[i+1];
            distanceFromY += lowerItem.up + this.separators[i] + item.down + item.height;
			new Path(x,y)
				.arc('se')
				.up(distanceFromY - Options.AR*2)
				.arc('wn').addTo(this);
			item.format(x+Options.AR*2,y - distanceFromY,innerWidth).addTo(this);
			new Path(x+Options.AR*2+innerWidth, y-distanceFromY+item.height)
				.arc('ne')
				.down(distanceFromY - item.height + this.height - Options.AR*2)
				.arc('ws').addTo(this);
		}

		// Do the straight-line path.
		new Path(x,y).right(Options.AR*2).addTo(this);
		this.items[this.normal].format(x+Options.AR*2, y, innerWidth).addTo(this);
		new Path(x+Options.AR*2+innerWidth, y+this.height).right(Options.AR*2).addTo(this);

		// Do the elements that curve below
		var distanceFromY = 0;
		for(var i = this.normal+1; i <= last; i++) {
            let item = this.items[i];
            let upperItem = this.items[i-1];
            distanceFromY += upperItem.height + upperItem.down + this.separators[i-1] + item.up;
			new Path(x,y)
				.arc('ne')
				.down(distanceFromY - Options.AR*2)
				.arc('ws').addTo(this);
			if(!item.format) console.log(item);
			item.format(x+Options.AR*2, y+distanceFromY, innerWidth).addTo(this);
			new Path(x+Options.AR*2+innerWidth, y+distanceFromY+item.height)
				.arc('se')
				.up(distanceFromY - Options.AR*2 + item.height - this.height)
				.arc('wn').addTo(this);
		}

		return this;
	}
	toTextDiagram() {
		var [cross, line, line_vertical, roundcorner_bot_left, roundcorner_bot_right, roundcorner_top_left, roundcorner_top_right] = TextDiagram._getParts(["cross", "line", "line_vertical", "roundcorner_bot_left", "roundcorner_bot_right", "roundcorner_top_left", "roundcorner_top_right"]);
		// Format all the child items, so we can know the maximum width.
		var itemTDs = [];
		for(const item of this.items) {
			itemTDs.push(item.toTextDiagram().expand(1, 1, 0, 0));
		}
		var max_item_width = Math.max(...(itemTDs.map(function(itemTD) {return itemTD.width})));
		var diagramTD = new TextDiagram(0, 0, []);
		// Format the choice collection.
		for(var [itemNum, itemTD] of enumerate(itemTDs)) {
			var [leftPad, rightPad] = TextDiagram._gaps(max_item_width, itemTD.width);
			itemTD = itemTD.expand(leftPad, rightPad, 0, 0);
			var hasSeparator = true;
			var leftLines = [];
			var rightLines = [];
			for (var i = 0; i < itemTD.height; i++) {
				leftLines.push(line_vertical);
				rightLines.push(line_vertical);
			}
			var moveEntry = false;
			var moveExit = false;
			if(itemNum <= this.normal) {
				// Item above the line: round off the entry/exit lines upwards.
				leftLines[itemTD.entry] = roundcorner_top_left;
				rightLines[itemTD.exit] = roundcorner_top_right;
				if(itemNum == 0) {
					// First item and above the line: also remove ascenders above the item's entry and exit, suppress the separator above it.
					hasSeparator = false;
					for(i = 0; i < itemTD.entry; i++) {
						leftLines[i] = " ";
					}
					for(i = 0; i < itemTD.exit; i++) {
						rightLines[i] = " ";
					}
				}
			}
			if(itemNum >= this.normal) {
				// Item below the line: round off the entry/exit lines downwards.
				leftLines[itemTD.entry] = roundcorner_bot_left;
				rightLines[itemTD.exit] = roundcorner_bot_right;
				if(itemNum == 0) {
					// First item and below the line: also suppress the separator above it.
					hasSeparator = false;
				}
				if(itemNum == (this.items.length - 1)) {
					// Last item and below the line: also remove descenders below the item's entry and exit
					for(i = itemTD.entry + 1; i < itemTD.height; i++) {
						leftLines[i] = " ";
					}
					for(i = itemTD.exit + 1; i < itemTD.height; i++) {
						rightLines[i] = " ";
					}
				}
			}
			if(itemNum == this.normal) {
				// Item on the line: entry/exit are horizontal, and sets the outer entry/exit.
				leftLines[itemTD.entry] = cross;
				rightLines[itemTD.exit] = cross;
				moveEntry = true;
				moveExit = true;
				if(itemNum == 0 && itemNum == (this.items.length - 1)) {
					// Only item and on the line: set entry/exit for straight through.
					leftLines[itemTD.entry] = line;
					rightLines[itemTD.exit] = line;
				} else if(itemNum == 0) {
					// First item and on the line: set entry/exit for no ascenders.
					leftLines[itemTD.entry] = roundcorner_top_right;
					rightLines[itemTD.exit] = roundcorner_top_left;
				} else if(itemNum == (this.items.length - 1)) {
					// Last item and on the line: set entry/exit for no descenders.
					leftLines[itemTD.entry] = roundcorner_bot_right;
					rightLines[itemTD.exit] = roundcorner_bot_left;
				}
			}
			var leftJointTD = new TextDiagram(itemTD.entry, itemTD.entry, leftLines);
			var rightJointTD = new TextDiagram(itemTD.exit, itemTD.exit, rightLines);
			itemTD = leftJointTD.appendRight(itemTD, "").appendRight(rightJointTD, "");
			var separator = hasSeparator ? [line_vertical + (" ".repeat(TextDiagram._maxWidth(diagramTD, itemTD) - 2)) + line_vertical] : [];
			diagramTD = diagramTD.appendBelow(itemTD, separator, moveEntry, moveExit);
		}
		return diagramTD;
	}
}
funcs.Choice = (...args)=>new Choice(...args);


export class HorizontalChoice extends DiagramMultiContainer {
	constructor(...items) {
		super('g', items);
		if( items.length === 0 ) {
			throw new RangeError("HorizontalChoice() must have at least one child.");
		}
		if( items.length === 1) {
			return new Sequence(items);
		}
		const allButLast = this.items.slice(0, -1);
		const middles = this.items.slice(1, -1);
		const first = this.items[0];
		const last = this.items[this.items.length - 1];
		this.needsSpace = false;

		this.width = Options.AR; // starting track
		this.width += Options.AR*2 * (this.items.length-1); // inbetween tracks
		this.width += sum(this.items, x=>x.width + (x.needsSpace?20:0)); // items
		this.width += (last.height > 0 ? Options.AR : 0); // needs space to curve up
		this.width += Options.AR; //ending track

		// Always exits at entrance height
		this.height = 0;

		// All but the last have a track running above them
		this._upperTrack = Math.max(
			Options.AR*2,
			Options.VS,
			max(allButLast, x=>x.up) + Options.VS
		);
		this.up = Math.max(this._upperTrack, last.up);

		// All but the first have a track running below them
		// Last either straight-lines or curves up, so has different calculation
		this._lowerTrack = Math.max(
			Options.VS,
			max(middles, x=>x.height+Math.max(x.down+Options.VS, Options.AR*2)),
			last.height + last.down + Options.VS
		);
		if(first.height < this._lowerTrack) {
			// Make sure there's at least 2*AR room between first exit and lower track
			this._lowerTrack = Math.max(this._lowerTrack, first.height + Options.AR*2);
		}
		this.down = Math.max(this._lowerTrack, first.height + first.down);


		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "horizontalchoice";
		}
	}
	format(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		const first = this.items[0];
		const last = this.items[this.items.length-1];
		const allButFirst = this.items.slice(1);
		const allButLast = this.items.slice(0, -1);

		// upper track
		var upperSpan = (sum(allButLast, x=>x.width+(x.needsSpace?20:0))
			+ (this.items.length - 2) * Options.AR*2
			- Options.AR
		);
		new Path(x,y)
			.arc('se')
			.v(-(this._upperTrack - Options.AR*2))
			.arc('wn')
			.h(upperSpan)
			.addTo(this);

		// lower track
		var lowerSpan = (sum(allButFirst, x=>x.width+(x.needsSpace?20:0))
			+ (this.items.length - 2) * Options.AR*2
			+ (last.height > 0 ? Options.AR : 0)
			- Options.AR
		);
		var lowerStart = x + Options.AR + first.width+(first.needsSpace?20:0) + Options.AR*2;
		new Path(lowerStart, y+this._lowerTrack)
			.h(lowerSpan)
			.arc('se')
			.v(-(this._lowerTrack - Options.AR*2))
			.arc('wn')
			.addTo(this);

		// Items
		for(const [i, item] of enumerate(this.items)) {
			// input track
			if(i === 0) {
				new Path(x,y)
					.h(Options.AR)
					.addTo(this);
				x += Options.AR;
			} else {
				new Path(x, y - this._upperTrack)
					.arc('ne')
					.v(this._upperTrack - Options.AR*2)
					.arc('ws')
					.addTo(this);
				x += Options.AR*2;
			}

			// item
			var itemWidth = item.width + (item.needsSpace?20:0);
			item.format(x, y, itemWidth).addTo(this);
			x += itemWidth;

			// output track
			if(i === this.items.length-1) {
				if(item.height === 0) {
					new Path(x,y)
						.h(Options.AR)
						.addTo(this);
				} else {
					new Path(x,y+item.height)
					.arc('se')
					.addTo(this);
				}
			} else if(i === 0 && item.height > this._lowerTrack) {
				// Needs to arc up to meet the lower track, not down.
				if(item.height - this._lowerTrack >= Options.AR*2) {
					new Path(x, y+item.height)
						.arc('se')
						.v(this._lowerTrack - item.height + Options.AR*2)
						.arc('wn')
						.addTo(this);
				} else {
					// Not enough space to fit two arcs
					// so just bail and draw a straight line for now.
					new Path(x, y+item.height)
						.l(Options.AR*2, this._lowerTrack - item.height)
						.addTo(this);
				}
			} else {
				new Path(x, y+item.height)
					.arc('ne')
					.v(this._lowerTrack - item.height - Options.AR*2)
					.arc('ws')
					.addTo(this);
			}
		}
		return this;
	}
	toTextDiagram() {
		var [line, line_vertical, roundcorner_bot_left, roundcorner_bot_right, roundcorner_top_left, roundcorner_top_right] = TextDiagram._getParts(["line", "line_vertical", "roundcorner_bot_left", "roundcorner_bot_right", "roundcorner_top_left", "roundcorner_top_right"]);

		// Format all the child items, so we can know the maximum entry, exit, and height.
		var itemTDs = [];
		for(const item of this.items) {
			itemTDs.push(item.toTextDiagram());
		}
		// diagramEntry: distance from top to lowest entry, aka distance from top to diagram entry, aka final diagram entry and exit.
		var diagramEntry = Math.max(...(itemTDs.map(function(itemTD) {return itemTD.entry})));
		// SOILToBaseline: distance from top to lowest entry before rightmost item, aka distance from skip-over-items line to rightmost entry, aka SOIL height.
		var SOILToBaseline = Math.max(...(itemTDs.slice(0, -1).map(function(itemTD) {return itemTD.entry})));
		// topToSOIL: distance from top to skip-over-items line.
		var topToSOIL = diagramEntry - SOILToBaseline;
		// baselineToSUIL: distance from lowest entry or exit after leftmost item to bottom, aka distance from entry to skip-under-items line, aka SUIL height.
		var baselineToSUIL = Math.max(...(itemTDs.slice(1).map(function(itemTD) {return itemTD.height - Math.min(itemTD.entry, itemTD.exit) - 1;})));

		// The diagram starts with a line from its entry up to skip-over-items line {
		var lines = [];
		for(var i = 0; i < topToSOIL; i++) {
			lines.push("  ");
		}
		lines.push(roundcorner_top_left + line);
		for(i = 0; i < SOILToBaseline; i++) {
			lines.push(line_vertical + " ");
		}
		lines.push(roundcorner_bot_right + line);
		var diagramTD = new TextDiagram(lines.length - 1, lines.length - 1, lines);
		for(const [itemNum, itemTD] of enumerate(itemTDs)) {
			if(itemNum > 0) {
				// All items except the leftmost start with a line from the skip-over-items line down to their entry,
				// with a joining-line across at the skip-under-items line {
				lines = [];
				for(i = 0; i < topToSOIL; i++) {
					lines.push("  ");
				}
				// All such items except the rightmost also have a continuation of the skip-over-items line {
				var lineToNextItem = itemNum == itemTDs.length - 1 ? " " : line;
				lines.push(roundcorner_top_right + lineToNextItem);
				for(i = 0; i < SOILToBaseline; i++) {
					lines.push(line_vertical + " ");
				}
				lines.push(roundcorner_bot_left + line);
				for(i = 0; i < baselineToSUIL; i++) {
					lines.push(line_vertical + " ");
				}
				lines.push(line + line);
				var entryTD = new TextDiagram(diagramTD.exit, diagramTD.exit, lines);
				diagramTD = diagramTD.appendRight(entryTD, "");
			}
			var partTD = new TextDiagram(0, 0, []);
			if(itemNum < itemTDs.length - 1) {
				// All items except the rightmost start with a segment of the skip-over-items line at the top.
				// followed by enough blank lines to push their entry down to the previous item's exit {
				lines = [];
				lines.push(line.repeat(itemTD.width));
				for(i = 0; i < (SOILToBaseline - itemTD.entry); i++) {
					lines.push(" ".repeat(itemTD.width));
				}
				var SOILSegment = new TextDiagram(0, 0, lines);
				partTD = partTD.appendBelow(SOILSegment, []);
			}
			partTD = partTD.appendBelow(itemTD, [], true, true);
			if(itemNum > 0) {
				// All items except the leftmost end with enough blank lines to pad down to the skip-under-items
				// line, followed by a segment of the skip-under-items line {
				lines = [];
				for(i = 0; i < (baselineToSUIL - (itemTD.height - itemTD.entry) + 1); i++) {
					lines.push(" ".repeat(itemTD.width));
				}
				lines.push(line.repeat(itemTD.width));
				var SUILSegment = new TextDiagram(0, 0, lines);
				partTD = partTD.appendBelow(SUILSegment, []);
			}
			diagramTD = diagramTD.appendRight(partTD, "");
			if(itemNum < itemTDs.length - 1) {
				// All items except the rightmost have a line from their exit down to the skip-under-items line,
				// with a joining-line across at the skip-over-items line {
				lines = [];
				for(i = 0; i < topToSOIL; i++) {
					lines.push("  ");
				}
				lines.push(line + line);
				for(i = 0; i < (diagramTD.exit - topToSOIL - 1); i++) {
					lines.push("  ");
				}
				lines.push(line + roundcorner_top_right);
				for(i = 0; i < (baselineToSUIL - (diagramTD.exit - diagramTD.entry)); i++) {
					lines.push(" " + line_vertical);
				}
				// All such items except the leftmost also have are continuing of the skip-under-items line from the previous item {
				var lineFromPrevItem = itemNum > 0 ? line : " ";
				lines.push(lineFromPrevItem + roundcorner_bot_left);
				var entry = diagramEntry + 1 + (diagramTD.exit - diagramTD.entry);
				var exitTD = new TextDiagram(entry, diagramEntry + 1, lines);
				diagramTD = diagramTD.appendRight(exitTD, "");
			} else {
				// The rightmost item has a line from the skip-under-items line and from its exit up to the diagram exit {
				lines = [];
				var lineFromExit = diagramTD.exit != diagramTD.entry ? " " : line;
				lines.push(lineFromExit + roundcorner_top_left);
				for(i = 0; i < (diagramTD.exit - diagramTD.entry - 1); i++) {
					lines.push(" " + line_vertical);
				}
				if(diagramTD.exit != diagramTD.entry) {
					lines.push(line + roundcorner_bot_right);
				}
				for(i = 0; i < (baselineToSUIL - (diagramTD.exit - diagramTD.entry)); i++) {
					lines.push(" " + line_vertical);
				}
				lines.push(line + roundcorner_bot_right);
				exitTD = new TextDiagram(diagramTD.exit - diagramTD.entry, 0, lines);
				diagramTD = diagramTD.appendRight(exitTD, "");
			}
		}
		return diagramTD;
	}
}
funcs.HorizontalChoice = (...args)=>new HorizontalChoice(...args);


export class MultipleChoice extends DiagramMultiContainer {
	constructor(normal, type, ...items) {
		super('g', items);
		if( typeof normal !== "number" || normal !== Math.floor(normal) ) {
			throw new TypeError("The first argument of MultipleChoice() must be an integer.");
		} else if(normal < 0 || normal >= items.length) {
			throw new RangeError("The first argument of MultipleChoice() must be an index for one of the items.");
		} else {
			this.normal = normal;
		}
		if( type != "any" && type != "all" ) {
			throw new SyntaxError("The second argument of MultipleChoice must be 'any' or 'all'.");
		} else {
			this.type = type;
		}
		this.needsSpace = true;
		this.innerWidth = max(this.items, function(x){return x.width});
		this.width = 30 + Options.AR + this.innerWidth + Options.AR + 20;
		this.up = this.items[0].up;
		this.down = this.items[this.items.length-1].down;
		this.height = this.items[normal].height;
		for(var i = 0; i < this.items.length; i++) {
			let item = this.items[i];
			let minimum;
			if(i == normal - 1 || i == normal + 1) minimum = 10 + Options.AR;
			else minimum = Options.AR;
			if(i < normal) {
				this.up += Math.max(minimum, item.height + item.down + Options.VS + this.items[i+1].up);
			} else if(i > normal) {
				this.down += Math.max(minimum, item.up + Options.VS + this.items[i-1].down + this.items[i-1].height);
			}
		}
		this.down -= this.items[normal].height; // already counted in this.height
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "multiplechoice";
		}
	}
	format(x, y, width) {
		var gaps = determineGaps(width, this.width);
		new Path(x, y).right(gaps[0]).addTo(this);
		new Path(x + gaps[0] + this.width, y + this.height).right(gaps[1]).addTo(this);
		x += gaps[0];

		var normal = this.items[this.normal];

		// Do the elements that curve above
		var distanceFromY;
		for(var i = this.normal - 1; i >= 0; i--) {
			var item = this.items[i];
			if( i == this.normal - 1 ) {
				distanceFromY = Math.max(10 + Options.AR, normal.up + Options.VS + item.down + item.height);
			}
			new Path(x + 30,y)
				.up(distanceFromY - Options.AR)
				.arc('wn').addTo(this);
			item.format(x + 30 + Options.AR, y - distanceFromY, this.innerWidth).addTo(this);
			new Path(x + 30 + Options.AR + this.innerWidth, y - distanceFromY + item.height)
				.arc('ne')
				.down(distanceFromY - item.height + this.height - Options.AR - 10)
				.addTo(this);
			if(i !== 0) {
				distanceFromY += Math.max(Options.AR, item.up + Options.VS + this.items[i-1].down + this.items[i-1].height);
			}
		}

		new Path(x + 30, y).right(Options.AR).addTo(this);
		normal.format(x + 30 + Options.AR, y, this.innerWidth).addTo(this);
		new Path(x + 30 + Options.AR + this.innerWidth, y + this.height).right(Options.AR).addTo(this);

		for(i = this.normal+1; i < this.items.length; i++) {
			let item = this.items[i];
			if(i == this.normal + 1) {
				distanceFromY = Math.max(10+Options.AR, normal.height + normal.down + Options.VS + item.up);
			}
			new Path(x + 30, y)
				.down(distanceFromY - Options.AR)
				.arc('ws')
				.addTo(this);
			item.format(x + 30 + Options.AR, y + distanceFromY, this.innerWidth).addTo(this);
			new Path(x + 30 + Options.AR + this.innerWidth, y + distanceFromY + item.height)
				.arc('se')
				.up(distanceFromY - Options.AR + item.height - normal.height)
				.addTo(this);
			if(i != this.items.length - 1) {
				distanceFromY += Math.max(Options.AR, item.height + item.down + Options.VS + this.items[i+1].up);
			}
		}
		var text = new FakeSVG('g', {"class": "diagram-text"}).addTo(this);
		new FakeSVG('title', {}, (this.type=="any"?"take one or more branches, once each, in any order":"take all branches, once each, in any order")).addTo(text);
		new FakeSVG('path', {
			"d": "M "+(x+30)+" "+(y-10)+" h -26 a 4 4 0 0 0 -4 4 v 12 a 4 4 0 0 0 4 4 h 26 z",
			"class": "diagram-text"
			}).addTo(text);
		new FakeSVG('text', {
			"x": x + 15,
			"y": y + 4,
			"class": "diagram-text"
			}, (this.type=="any"?"1+":"all")).addTo(text);
		new FakeSVG('path', {
			"d": "M "+(x+this.width-20)+" "+(y-10)+" h 16 a 4 4 0 0 1 4 4 v 12 a 4 4 0 0 1 -4 4 h -16 z",
			"class": "diagram-text"
			}).addTo(text);
		new FakeSVG('path', {
			"d": "M "+(x+this.width-13)+" "+(y-2)+" a 4 4 0 1 0 6 -1 m 2.75 -1 h -4 v 4 m 0 -3 h 2",
			"style": "stroke-width: 1.75"
			}).addTo(text);
		return this;
	}
	toTextDiagram() {
		var [multi_repeat] = TextDiagram._getParts(["multi_repeat"]);
		if(this.type == "any") {
			var anyAll = TextDiagram.rect("1+");
		} else {
			anyAll = TextDiagram.rect("all");
		}
		var diagramTD = Choice.prototype.toTextDiagram.call(this);
		var repeatTD = TextDiagram.rect(multi_repeat);
		diagramTD = anyAll.appendRight(diagramTD, "");
		diagramTD = diagramTD.appendRight(repeatTD, "");
		return diagramTD;
	}
}
funcs.MultipleChoice = (...args)=>new MultipleChoice(...args);


export class Optional extends FakeSVG {
	constructor(item, skip) {
		if( skip === undefined )
			return new Choice(1, new Skip(), item);
		else if ( skip === "skip" )
			return new Choice(0, new Skip(), item);
		else
			throw "Unknown value for Optional()'s 'skip' argument.";
	}
}
funcs.Optional = (...args)=>new Optional(...args);


export class OneOrMore extends FakeSVG {
	constructor(item, rep) {
		super('g');
		rep = rep || (new Skip());
		this.item = wrapString(item);
		this.rep = wrapString(rep);
		this.width = Math.max(this.item.width, this.rep.width) + Options.AR*2;
		this.height = this.item.height;
		this.up = this.item.up;
		this.down = Math.max(Options.AR*2, this.item.down + Options.VS + this.rep.up + this.rep.height + this.rep.down);
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "oneormore";
		}
	}
	format(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		// Draw item
		new Path(x,y).right(Options.AR).addTo(this);
		this.item.format(x+Options.AR,y,this.width-Options.AR*2).addTo(this);
		new Path(x+this.width-Options.AR,y+this.height).right(Options.AR).addTo(this);

		// Draw repeat arc
		var distanceFromY = Math.max(Options.AR*2, this.item.height+this.item.down+Options.VS+this.rep.up);
		new Path(x+Options.AR,y).arc('nw').down(distanceFromY-Options.AR*2).arc('ws').addTo(this);
		this.rep.format(x+Options.AR, y+distanceFromY, this.width - Options.AR*2).addTo(this);
		new Path(x+this.width-Options.AR, y+distanceFromY+this.rep.height).arc('se').up(distanceFromY-Options.AR*2+this.rep.height-this.item.height).arc('en').addTo(this);

		return this;
	}
	toTextDiagram() {
		var [line, repeat_top_left, repeat_left, repeat_bot_left, repeat_top_right, repeat_right, repeat_bot_right] = TextDiagram._getParts(["line", "repeat_top_left", "repeat_left", "repeat_bot_left", "repeat_top_right", "repeat_right", "repeat_bot_right"]);
		// Format the item and then format the repeat append it to tbe bottom, after a spacer.
		var itemTD = this.item.toTextDiagram();
		var repeatTD = this.rep.toTextDiagram();
		var fIRWidth = TextDiagram._maxWidth(itemTD, repeatTD);
		repeatTD = repeatTD.expand(0, fIRWidth - repeatTD.width, 0, 0);
		itemTD = itemTD.expand(0, fIRWidth - itemTD.width, 0, 0);
		var itemAndRepeatTD = itemTD.appendBelow(repeatTD, []);
		// Build the left side of the repeat line and append the combined item and repeat to its right.
		var leftLines = [];
		leftLines.push(repeat_top_left + line);
		for(var i = 0; i < ((itemTD.height - itemTD.entry) + repeatTD.entry - 1); i++) {
			leftLines.push(repeat_left + " ");
		}
		leftLines.push(repeat_bot_left + line);
		var leftTD = new TextDiagram(0, 0, leftLines);
		leftTD = leftTD.appendRight(itemAndRepeatTD, "");
		// Build the right side of the repeat line and append it to the combined left side, item, and repeat's right.
		var rightLines = [];
		rightLines.push(line + repeat_top_right);
		for(i = 0; i < ((itemTD.height - itemTD.exit) + repeatTD.exit - 1); i++) {
			rightLines.push(" " + repeat_right);
		}
		rightLines.push(line + repeat_bot_right);
		var rightTD = new TextDiagram(0, 0, rightLines);
		var diagramTD = leftTD.appendRight(rightTD, "");
		return diagramTD;
	}
	walk(cb) {
		cb(this);
		this.item.walk(cb);
		this.rep.walk(cb);
	}
}
funcs.OneOrMore = (...args)=>new OneOrMore(...args);


export class ZeroOrMore extends FakeSVG {
	constructor(item, rep, skip) {
		return new Optional(new OneOrMore(item, rep), skip);
	}
}
funcs.ZeroOrMore = (...args)=>new ZeroOrMore(...args);


export class Group extends FakeSVG {
	constructor(item, label) {
		super('g');
		this.item = wrapString(item);
		this.label =
			label instanceof FakeSVG
			  ? label
			: label
			  ? new Comment(label)
			  : undefined;

		this.width = Math.max(
			this.item.width + (this.item.needsSpace?20:0),
			this.label ? this.label.width : 0,
			Options.AR*2);
		this.height = this.item.height;
		this.boxUp = this.up = Math.max(this.item.up + Options.VS, Options.AR);
		if(this.label) {
			this.up += this.label.up + this.label.height + this.label.down;
		}
		this.down = Math.max(this.item.down + Options.VS, Options.AR);
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "group";
		}
	}
	format(x, y, width) {
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		new FakeSVG('rect', {
			x,
			y:y-this.boxUp,
			width:this.width,
			height:this.boxUp + this.height + this.down,
			rx: Options.AR,
			ry: Options.AR,
			'class':'group-box',
		}).addTo(this);

		this.item.format(x,y,this.width).addTo(this);
		if(this.label) {
			this.label.format(
				x,
				y-(this.boxUp+this.label.down+this.label.height),
				this.label.width).addTo(this);
		}

		return this;
	}
	toTextDiagram() {
		var diagramTD = TextDiagram.roundrect(this.item.toTextDiagram(), true);
		if(this.label != undefined) {
			var labelTD = this.label.toTextDiagram();
			diagramTD = labelTD.appendBelow(diagramTD, [], true, true).expand(0, 0, 1, 0);
		}
		return diagramTD
	}
	walk(cb) {
		cb(this);
		this.item.walk(cb);
		this.label.walk(cb);
	}
}
funcs.Group = (...args)=>new Group(...args);


export class Start extends FakeSVG {
	constructor({type="simple", label}={}) {
		super('g');
		this.width = 20;
		this.height = 0;
		this.up = 10;
		this.down = 10;
		this.type = type;
		if(label) {
			this.label = ""+label;
			this.width = Math.max(20, this.label.length * Options.CHAR_WIDTH + 10);
		}
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "start";
		}
	}
	format(x,y) {
		let path = new Path(x, y-10);
		if (this.type === "complex") {
			path.down(20)
				.m(0, -10)
				.right(this.width)
				.addTo(this);
		} else {
			path.down(20)
				.m(10, -20)
				.down(20)
				.m(-10, -10)
				.right(this.width)
				.addTo(this);
		}
		if(this.label) {
			new FakeSVG('text', {x:x, y:y-15, style:"text-anchor:start"}, this.label).addTo(this);
		}
		return this;
	}
	toTextDiagram() {
		var [cross, line, tee_right] = TextDiagram._getParts(["cross", "line", "tee_right"])
		if (this.type === "simple") {
			var start = tee_right + cross + line;
		} else {
			start = tee_right + line;
		}
		var labelTD = new TextDiagram(0, 0, []);
		if (this.label != undefined) {
			labelTD = new TextDiagram(0, 0, [this.label]);
			start = TextDiagram._padR(start, labelTD.width, line);
		}
		var startTD = new TextDiagram(0, 0, [start]);
		return labelTD.appendBelow(startTD, [], true, true);
	}
}
funcs.Start = (...args)=>new Start(...args);


export class End extends FakeSVG {
	constructor({type="simple"}={}) {
		super('path');
		this.width = 20;
		this.height = 0;
		this.up = 10;
		this.down = 10;
		this.type = type;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "end";
		}
	}
	format(x,y) {
		if (this.type === "complex") {
			this.attrs.d = 'M '+x+' '+y+' h 20 m 0 -10 v 20';
		} else {
			this.attrs.d = 'M '+x+' '+y+' h 20 m -10 -10 v 20 m 10 -20 v 20';
		}
		return this;
	}
	toTextDiagram() {
		var [cross, line, tee_left] = TextDiagram._getParts(["cross", "line", "tee_left"]);
		if (this.type === "simple") {
			var end = line + cross + tee_left;
		} else {
			end = line + tee_left;
		}
		return new TextDiagram(0, 0, [end]);
	}
}
funcs.End = (...args)=>new End(...args);


export class Terminal extends FakeSVG {
	constructor(text, {href, title, cls}={}) {
		super('g', {'class': ['terminal', cls].join(" ")});
		this.text = ""+text;
		this.href = href;
		this.title = title;
		this.cls = cls;
		this.width = this.text.length * Options.CHAR_WIDTH + 20; /* Assume that each char is .5em, and that the em is 16px */
		this.height = 0;
		this.up = 11;
		this.down = 11;
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "terminal";
		}
	}
	format(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		new FakeSVG('rect', {x:x, y:y-11, width:this.width, height:this.up+this.down, rx:10, ry:10}).addTo(this);
		var text = new FakeSVG('text', {x:x+this.width/2, y:y+4}, this.text);
		if(this.href)
			new FakeSVG('a', {'xlink:href': this.href}, [text]).addTo(this);
		else
			text.addTo(this);
		if(this.title)
			new FakeSVG('title', {}, [this.title]).addTo(this);
		return this;
	}
	toTextDiagram() {
		// Note: href, title, and cls are ignored for text diagrams.
		return TextDiagram.roundrect(this.text);
	}
}
funcs.Terminal = (...args)=>new Terminal(...args);


export class NonTerminal extends FakeSVG {
	constructor(text, {href, title, cls=""}={}) {
		super('g', {'class': ['non-terminal', cls].join(" ")});
		this.text = ""+text;
		this.href = href;
		this.title = title;
		this.cls = cls;
		this.width = this.text.length * Options.CHAR_WIDTH + 20;
		this.height = 0;
		this.up = 11;
		this.down = 11;
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "nonterminal";
		}
	}
	format(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		new FakeSVG('rect', {x:x, y:y-11, width:this.width, height:this.up+this.down}).addTo(this);
		var text = new FakeSVG('text', {x:x+this.width/2, y:y+4}, this.text);
		if(this.href)
			new FakeSVG('a', {'xlink:href': this.href}, [text]).addTo(this);
		else
			text.addTo(this);
		if(this.title)
			new FakeSVG('title', {}, [this.title]).addTo(this);
		return this;
	}
	toTextDiagram() {
		// Note: href, title, and cls are ignored for text diagrams.
		return TextDiagram.rect(this.text);
	}
}
funcs.NonTerminal = (...args)=>new NonTerminal(...args);


export class Comment extends FakeSVG {
	constructor(text, {href, title, cls=""}={}) {
		super('g', {'class': ['comment', cls].join(" ")});
		this.text = ""+text;
		this.href = href;
		this.title = title;
		this.cls = cls;
		this.width = this.text.length * Options.COMMENT_CHAR_WIDTH + 10;
		this.height = 0;
		this.up = 8;
		this.down = 8;
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "comment";
		}
	}
	format(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y+this.height).h(gaps[1]).addTo(this);
		x += gaps[0];

		var text = new FakeSVG('text', {x:x+this.width/2, y:y+5, class:'comment'}, this.text);
		if(this.href)
			new FakeSVG('a', {'xlink:href': this.href}, [text]).addTo(this);
		else
			text.addTo(this);
		if(this.title)
			new FakeSVG('title', {}, this.title).addTo(this);
		return this;
	}
	toTextDiagram() {
		// Note: href, title, and cls are ignored for text diagrams.
		return new TextDiagram(0, 0, [this.text]);
	}
}
funcs.Comment = (...args)=>new Comment(...args);


export class Skip extends FakeSVG {
	constructor() {
		super('g');
		this.width = 0;
		this.height = 0;
		this.up = 0;
		this.down = 0;
		this.needsSpace = false;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "skip";
		}
	}
	format(x, y, width) {
		new Path(x,y).right(width).addTo(this);
		return this;
	}
	toTextDiagram() {
		var [line] = TextDiagram._getParts(["line"]);
		return new TextDiagram(0, 0, [line]);
	}
}
funcs.Skip = (...args)=>new Skip(...args);


export class Block extends FakeSVG {
	constructor({width=50, up=15, height=25, down=15, needsSpace=true}={}) {
		super('g');
		this.width = width;
		this.height = height;
		this.up = up;
		this.down = down;
		this.needsSpace = true;
		if(Options.DEBUG) {
			this.attrs['data-updown'] = this.up + " " + this.height + " " + this.down;
			this.attrs['data-type'] = "block";
		}
	}
	format(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		new Path(x,y).h(gaps[0]).addTo(this);
		new Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		new FakeSVG('rect', {x:x, y:y-this.up, width:this.width, height:this.up+this.height+this.down}).addTo(this);
		return this;
	}
	toTextDiagram() {
		return TextDiagram.rect("");
	}
}
funcs.Block = (...args)=>new Block(...args);

export class TextDiagram {
	constructor(entry, exit, lines) {
		// entry: The entry line for this diagram-part.
		this.entry = entry;
		// exit: The exit line for this diagram-part.
		this.exit = exit;
		// height: The height of this diagram-part, in lines.
		this.height = lines.length;
		// lines[]: The visual data of this diagram-part.  Each line must be the same length.
		this.lines = Array.from(lines);
		// width: The width of this diagram-part, in character cells.
		this.width = lines.length > 0 ? lines[0].length : 0;
		if(entry > lines.length) {
			throw new Error("Entry is not within diagram vertically:\n" + this._dump(false));
		}
		if(exit > lines.length) {
			throw new Error("Exit is not within diagram vertically:\n" + this._dump(false));
		}
		for(var i=0; i < lines.length; i++) {
			if(lines[0].length != lines[i].length) {
				throw new Error("Diagram data is not rectangular:\n" + this._dump(false));
			}
		}
	}
	alter(entry=null, exit=null, lines=null) {
		/*
		Create and return a new TextDiagram based on this instance, with the specified changes.

		Note: This is used sparingly, and may be a bad idea.
		*/
		var newEntry = entry || this.entry;
		var newExit = exit || this.exit;
		var newLines = lines || this.lines;
		return new TextDiagram(newEntry, newExit, Array.from(newLines));
	}
	appendBelow(item, linesBetween, moveEntry=false, moveExit=false) {
		/*
		Create and return a new TextDiagram by appending the specified lines below this instance's data,
		and then appending the specified TextDiagram below those lines, possibly setting the resulting
		TextDiagram's entry and or exit indices to those of the appended item.
		*/
		var newWidth = Math.max(this.width, item.width);
		var newLines = [];
		var centeredLines = this.center(newWidth, " ").lines
		for(const line of centeredLines) {
			newLines.push(line);
		}
		for(const line of linesBetween) {
			newLines.push(TextDiagram._padR(line, newWidth, " "));
		}
		centeredLines = item.center(newWidth, " ").lines
		for(const line of centeredLines) {
			newLines.push(line);
		}
		var newEntry = moveEntry ? this.height + linesBetween.length + item.entry : this.entry;
		var newExit = moveExit ? this.height + linesBetween.length + item.exit : this.exit;
		return new TextDiagram(newEntry, newExit, newLines);
	}
	appendRight(item, charsBetween) {
		/*
		Create and return a new TextDiagram by appending the specified TextDiagram to the right of this instance's data,
		aligning the left-hand exit and the right-hand entry points.  The charsBetween are inserted between the left-exit
		and right-entry, and equivalent spaces on all other lines.
		*/
		var joinLine = Math.max(this.exit, item.entry);
		var newHeight = Math.max(this.height - this.exit, item.height - item.entry) + joinLine;
		var leftTopAdd = joinLine - this.exit;
		var leftBotAdd = newHeight - this.height - leftTopAdd;
		var rightTopAdd = joinLine - item.entry;
		var rightBotAdd = newHeight - item.height - rightTopAdd;
		var left = this.expand(0, 0, leftTopAdd, leftBotAdd);
		var right = item.expand(0, 0, rightTopAdd, rightBotAdd);
		var newLines = [];
		for(var i = 0; i < newHeight; i++) {
			var sep = i != joinLine ? " ".repeat(charsBetween.length) : charsBetween;
			newLines.push((left.lines[i] + sep + right.lines[i]));
		}
		var newEntry = this.entry + leftTopAdd;
		var newExit = item.exit + rightTopAdd;
		return new TextDiagram(newEntry, newExit, newLines);
	}
	center(width, pad) {
		/*
		Create and return a new TextDiagram by centering the data of this instance within a new, equal or larger widtth.
		*/
		if(width < this.width) {
			throw new Error("Cannot center into smaller width")
		}
		if(width === this.width) {
			return this.copy();
		} else {
			var totalPadding = width - this.width;
			var leftWidth = Math.trunc(totalPadding / 2);
			var left = [];
			for (var i = 0; i < this.height; i++) {
				left.push(pad.repeat(leftWidth));
			}
			var right = [];
			for (i = 0; i < this.height; i++) {
				right.push(pad.repeat(totalPadding - leftWidth));
			}
			return new TextDiagram(this.entry, this.exit, TextDiagram._encloseLines(this.lines, left, right));
		}
	}
	copy() {
		/*
		Create and return a new TextDiagram by copying this instance's data.
		*/
		return new TextDiagram(this.entry, this.exit, Array.from(this.lines));
	}
	expand(left, right, top, bottom) {
		/*
		Create and return a new TextDiagram by expanding this instance's data by the specified amount in the specified directions.
		*/
		if(left < 0 || right < 0 || top < 0 || bottom < 0) {
			throw new Error("Expansion values cannot be negative");
		}
		if(left + right + top + bottom === 0) {
			return this.copy();
		} else {
			var line = TextDiagram.parts["line"];
			var newLines = [];
			for(var i = 0; i < top; i++) {
				newLines.push(" ".repeat(this.width + left + right));
			}
			for(i = 0; i < this.height; i++){
				var leftExpansion = i === this.entry ? line : " ";
				var rightExpansion = i === this.exit ? line : " ";
				newLines.push(leftExpansion.repeat(left) + this.lines[i] + rightExpansion.repeat(right));
			}
			for(i = 0; i < bottom; i++) {
				newLines.push(" ".repeat(this.width + left + right));
			}
			return new TextDiagram(this.entry + top, this.exit + top, newLines);
		}
	}
	static rect(item, dashed=false) {
		/*
		Create and return a new TextDiagram for a rectangular box.
		*/
		return TextDiagram._rectish("rect", item, dashed);
	}
	static roundrect(item, dashed=false) {
		/*
		Create and return a new TextDiagram for a rectangular box with rounded corners.
		*/
		return TextDiagram._rectish("roundrect", item, dashed);
	}
	static setFormatting(characters = null, defaults = null) {
		/*
		Set the characters to use for drawing text diagrams.
		*/
		if(characters !== null) {
			TextDiagram.parts = {}
			if(defaults !== null){
				TextDiagram.parts = {...TextDiagram.parts, ...defaults}
			}
			TextDiagram.parts = {...TextDiagram.parts, ...characters}
		}
		for(const [name, value] of TextDiagram.parts) {
			if(value.length != 1) {
				"Text part " + name + " is more than 1 character: " + value;
			}
		}
	}
	_dump(show=true) {
		/*
		Dump out the data of this instance for debugging, either displaying or returning it.
		DO NOT use this for actual work, only for debugging or in assertion output.
		*/
		var nl = "\n"  // f-strings can't contain \n until Python 3.12;
		var result = "height=" + this.height + " lines.length=" + this.lines.length;
		if(this.entry > this.lines.length) {
			result += "; entry outside diagram: entry=" + this.entry;
		}
		if(this.exit > this.lines.length) {
			result += "; exit outside diagram: exit=" + this.exit;
		}
		for(var y = 0; y < Math.max(this.lines.length, this.entry + 1, this.exit + 1); y++) {
			result = result + nl + "[" + ("00" + y).slice(-3) + "]";
			if(y < this.lines.length) {
				result += (" '" + this.lines[y] + "' len=" + this.lines[y].length);
			}
			if(y === this.entry && y === this.exit) {
				result += " <- entry, exit";
			} else if(y === this.entry) {
				result += " <- entry";
			} else if(y === this.exit) {
				result += " <- exit";
			}
		}
		if(show) {
			console.log(result);
		}
		return result;
	}
	static _encloseLines(lines, lefts, rights) {
		/*
		Join the lefts, lines, and rights arrays together, line-by-line, and return the result.
		*/
		if(lines.length != lefts.length) {
			throw new Error("All arguments must be the same length");
		}
		if(lines.length != rights.length) {
			throw new Error("All arguments must be the same length");
		}
		var newLines = [];
		for(var i = 0; i < lines.length; i++) {
			newLines.push(lefts[i] + lines[i] + rights[i]);
		}
		return newLines;
	}
	static _gaps(outerWidth, innerWidth) {
		/*
		Return the left and right pad spacing based on the alignment configuration setting.
		*/
		var diff = outerWidth - innerWidth;
		if(Options.INTERNAL_ALIGNMENT === "left") {
			return [0, diff];
		} else if(Options.INTERNAL_ALIGNMENT === "right") {
			return [diff, 0];
		} else {
			var left = Math.trunc(diff / 2);
			var right = diff - left;
			return [left, right];
		}
	}
	static _getParts(partNames) {
		/*
		Return a list of text diagram drawing characters for the specified character names.
		*/
		var result = [];
		for(const name of partNames) {
			if(TextDiagram.parts[name] == undefined) {
				throw new Error("Text diagram part " + name + "not found.")
			}
			result.push(TextDiagram.parts[name]);
		}
		return result;
	}
	static _maxWidth(...args) {
		/*
		Return the maximum width of all of the arguments.
		*/
		var maxWidth = 0;
		for(const arg of args) {
			if(arg instanceof TextDiagram) {
				var width = arg.width;
			} else if(arg instanceof Array) {
				width = Math.max(arg.map(function(e) { return e.length;}));
			} else if(Number.isInteger(arg)) {
				width = Number.toString(arg).length;
			} else {
				width = arg.length;
			}
			maxWidth = width > maxWidth ? width : maxWidth;
		}
		return maxWidth;
	}
	static _padL(string, width, pad) {
		/*
		Pad the specified string on the left to the specified width with the specified pad string and return the result.
		*/
		if((width - string.length) % pad.length != 0) {
			throw new Error("Gap " + (width - string.length) + " must be a multiple of pad string '" + pad + "'");
		}
		return pad.repeat(Math.trunc((width - string.length / pad.length))) + string;
	}
	static _padR(string, width, pad) {
		/*
		Pad the specified string on the right to the specified width with the specified pad string and return the result.
		*/
		if((width - string.length) % pad.length != 0) {
			throw new Error("Gap " + (width - string.length) + " must be a multiple of pad string '" + pad + "'");
		}
		return string + pad.repeat(Math.trunc((width - string.length / pad.length)));
	}
	static _rectish(rectType, data, dashed=false) {
		/*
		Create and return a new TextDiagram for a rectangular box surrounding the specified TextDiagram, using the
		specified set of drawing characters (i.e., "rect" or "roundrect"), and possibly using dashed lines.
		*/
		var lineType = dashed ? "_dashed" : "";
		var [topLeft, ctrLeft, botLeft, topRight, ctrRight, botRight, topHoriz, botHoriz, line, cross] = TextDiagram._getParts([rectType + "_top_left", rectType + "_left" + lineType, rectType + "_bot_left", rectType + "_top_right", rectType + "_right" + lineType, rectType + "_bot_right", rectType + "_top" + lineType, rectType + "_bot" + lineType, "line", "cross"]);
		var itemWasFormatted = data instanceof TextDiagram;
		if(itemWasFormatted) {
			var itemTD = data;
		} else {
			itemTD = new TextDiagram(0, 0, [data]);
		}
		// Create the rectangle and enclose the item in it.
		var lines = [];
		lines.push(topHoriz.repeat(itemTD.width + 2));
		if(itemWasFormatted) {
			lines += itemTD.expand(1, 1, 0, 0).lines;
		} else {
			for(var i = 0; i < itemTD.lines.length; i++) {
				lines.push(" " + itemTD.lines[i] + " ");
			}
		}
		lines.push(botHoriz.repeat(itemTD.width + 2));
		var entry = itemTD.entry + 1;
		var exit = itemTD.exit + 1;
		var leftMaxWidth = TextDiagram._maxWidth(topLeft, ctrLeft, botLeft);
		var lefts = [];
		lefts.push(TextDiagram._padR(topLeft, leftMaxWidth, topHoriz));
		for(i = 1; i < (lines.length - 1); i++) {
			lefts.push(TextDiagram._padR(ctrLeft, leftMaxWidth, " "));
		}
		lefts.push(TextDiagram._padR(botLeft, leftMaxWidth, botHoriz));
		if(itemWasFormatted) {
			lefts[entry] = cross;
		}
		var rightMaxWidth = TextDiagram._maxWidth(topRight, ctrRight, botRight);
		var rights = [];
		rights.push(TextDiagram._padL(topRight, rightMaxWidth, topHoriz));
		for(i = 1; i < (lines.length - 1); i++) {
			rights.push(TextDiagram._padL(ctrRight, rightMaxWidth, " "));
		}
		rights.push(TextDiagram._padL(botRight, rightMaxWidth, botHoriz));
		if(itemWasFormatted) {
			rights[exit] = cross;
		}
		// Build the entry and exit perimeter.
		lines = TextDiagram._encloseLines(lines, lefts, rights);
		lefts = [];
		for(i = 0; i < lines.length; i++) {
			lefts.push(" ");
		}
		lefts[entry] = line;
		rights = [];
		for(i = 0; i < lines.length; i++) {
			rights.push(" ");
		}
		rights[exit] = line;
		lines = TextDiagram._encloseLines(lines, lefts, rights);
		return new TextDiagram(entry, exit, lines);
	}
	// Note:  All the drawing sequences below MUST be single characters.  setFormatting() checks this.
	// Unicode 25xx box drawing characters, plus a few others.
	static PARTS_UNICODE = {
		"cross_diag"				:	"\u2573",
		"corner_bot_left"			:	"\u2514",
		"corner_bot_right"			:	"\u2518",
		"corner_top_left"			:	"\u250c",
		"corner_top_right"			:	"\u2510",
		"cross"						:	"\u253c",
		"left"						:	"\u2502",
		"line"						:	"\u2500",
		"line_vertical"				:	"\u2502",
		"multi_repeat"				:	"\u21ba",
		"rect_bot"					:	"\u2500",
		"rect_bot_dashed"			:	"\u2504",
		"rect_bot_left"				:	"\u2514",
		"rect_bot_right"			:	"\u2518",
		"rect_left"					:	"\u2502",
		"rect_left_dashed"			:	"\u2506",
		"rect_right"				:	"\u2502",
		"rect_right_dashed"			:	"\u2506",
		"rect_top"					:	"\u2500",
		"rect_top_dashed"			:	"\u2504",
		"rect_top_left"				:	"\u250c",
		"rect_top_right"			:	"\u2510",
		"repeat_bot_left"			:	"\u2570",
		"repeat_bot_right"			:	"\u256f",
		"repeat_left"				:	"\u2502",
		"repeat_right"				:	"\u2502",
		"repeat_top_left"			:	"\u256d",
		"repeat_top_right"			:	"\u256e",
		"right"						:	"\u2502",
		"roundcorner_bot_left"		:	"\u2570",
		"roundcorner_bot_right"		:	"\u256f",
		"roundcorner_top_left"		:	"\u256d",
		"roundcorner_top_right"		:	"\u256e",
		"roundrect_bot"				:	"\u2500",
		"roundrect_bot_dashed"		:	"\u2504",
		"roundrect_bot_left"		:	"\u2570",
		"roundrect_bot_right"		:	"\u256f",
		"roundrect_left"			:	"\u2502",
		"roundrect_left_dashed"		:	"\u2506",
		"roundrect_right"			:	"\u2502",
		"roundrect_right_dashed"	:	"\u2506",
		"roundrect_top"				:	"\u2500",
		"roundrect_top_dashed"		:	"\u2504",
		"roundrect_top_left"		:	"\u256d",
		"roundrect_top_right"		:	"\u256e",
		"separator"					:	"\u2500",
		"tee_left"					:	"\u2524",
		"tee_right"					:	"\u251c",
	};
	//	Plain	old	ASCII	characters.
	static	PARTS_ASCII	=	{
		"cross_diag"				:	"X",
		"corner_bot_left"			:	"\\",
		"corner_bot_right"			:	"/",
		"corner_top_left"			:	"/",
		"corner_top_right"			:	"\\",
		"cross"						:	"+",
		"left"						:	"|",
		"line"						:	"-",
		"line_vertical"				:	"|",
		"multi_repeat"				:	"&",
		"rect_bot"					:	"-",
		"rect_bot_dashed"			:	"-",
		"rect_bot_left"				:	"+",
		"rect_bot_right"			:	"+",
		"rect_left"					:	"|",
		"rect_left_dashed"			:	"|",
		"rect_right"				:	"|",
		"rect_right_dashed"			:	"|",
		"rect_top_dashed"			:	"-",
		"rect_top"					:	"-",
		"rect_top_left"				:	"+",
		"rect_top_right"			:	"+",
		"repeat_bot_left"			:	"\\",
		"repeat_bot_right"			:	"/",
		"repeat_left"				:	"|",
		"repeat_right"				:	"|",
		"repeat_top_left"			:	"/",
		"repeat_top_right"			:	"\\",
		"right"						:	"|",
		"roundcorner_bot_left"		:	"\\",
		"roundcorner_bot_right"		:	"/",
		"roundcorner_top_left"		:	"/",
		"roundcorner_top_right"		:	"\\",
		"roundrect_bot"				:	"-",
		"roundrect_bot_dashed"		:	"-",
		"roundrect_bot_left"		:	"\\",
		"roundrect_bot_right"		:	"/",
		"roundrect_left"			:	"|",
		"roundrect_left_dashed"		:	"|",
		"roundrect_right"			:	"|",
		"roundrect_right_dashed"	:	"|",
		"roundrect_top"				:	"-",
		"roundrect_top_dashed"		:	"-",
		"roundrect_top_left"		:	"/",
		"roundrect_top_right"		:	"\\",
		"separator"					:	"-",
		"tee_left"					:	"|",
		"tee_right"					:	"|",
	};

	// Characters to use in drawing diagrams.  See setFormatting(), PARTS_ASCII, and PARTS_UNICODE.
	static parts = TextDiagram.PARTS_UNICODE;

}

function unnull(...args) {
	// Return the first value that isn't undefined.
	// More correct than `v1 || v2 || v3` because falsey values will be returned.
	return args.reduce(function(sofar, x) { return sofar !== undefined ? sofar : x; });
}

function determineGaps(outer, inner) {
	var diff = outer - inner;
	switch(Options.INTERNAL_ALIGNMENT) {
		case 'left': return [0, diff];
		case 'right': return [diff, 0];
		default: return [diff/2, diff/2];
	}
}

function wrapString(value) {
		return value instanceof FakeSVG ? value : new Terminal(""+value);
}

function sum(iter, func) {
	if(!func) func = function(x) { return x; };
	return iter.map(func).reduce(function(a,b){return a+b}, 0);
}

function max(iter, func=x=>x) {
	return Math.max.apply(null, iter.map(func));
}

function SVG(name, attrs, text) {
	attrs = attrs || {};
	text = text || '';
	var el = document.createElementNS("http://www.w3.org/2000/svg",name);
	for(var attr in attrs) {
		if(attr === 'xlink:href')
			el.setAttributeNS("http://www.w3.org/1999/xlink", 'href', attrs[attr]);
		else
			el.setAttribute(attr, attrs[attr]);
	}
	el.textContent = text;
	return el;
}

function escapeString(string) {
	// Escape markdown and HTML special characters
	return string.replace(/[*_\`\[\]<&]/g, function(charString) {
		return '&#' + charString.charCodeAt(0) + ';';
	});
}

function* enumerate(iter) {
	var count = 0;
	for(const x of iter) {
		yield [count, x];
		count++;
	}
}
