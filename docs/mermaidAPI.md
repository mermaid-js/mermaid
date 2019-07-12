# mermaidAPI

> **Warning** This file is generated automatically from the comments of [mermaidAPI.js](https://github.com/knsv/mermaid/blob/master/src/mermaidAPI.js) file. Please read that file **instead** for up-to-date information.

This is the api to be used when handling the integration with the web page instead of using the default integration (mermaid.js).

The core of this api is the **render** function that given a graph definitionas text renders the graph/diagram and returns a svg element for the graph. It is is then up to the user of the API to make use of the svg, either insert it somewhere in the page or something completely different.


## Configuration

These are the default options which can be overridden with the initialization call as in the example below:

```javascript
mermaid.initialize({
  flowchart:{
     htmlLabels: false
  }
});
```


## logLevel

Decides the amount of logging to be used.

- debug: 1
- info: 2
- warn: 3
- error: 4
- fatal: 5

**cloneCssStyles** - This options controls whether or not the css rules should be copied into the generated svg startOnLoad - This options controls whether or mermaid starts when the page loads
**arrowMarkerAbsolute** - This options controls whether or arrow markers in html code will be absolute paths or an anchor, #. This matters if you are using base tag settings.


## flowchart

The object containing configurations specific for flowcharts
**htmlLabels** - Flag for setting whether or not a html tag should be used for rendering labels on the edges
**useMaxWidth** - Flag for setting whether or not a all available width should be used for the diagram.


## sequence

The object containing configurations specific for sequence diagrams

**diagramMarginX** - margin to the right and left of the sequence diagram
**diagramMarginY** - margin to the over and under the sequence diagram
**actorMargin** - Margin between actors
**width** - Width of actor boxes
**height** - Height of actor boxes
**boxMargin** - Margin around loop boxes
**boxTextMargin** - margin around the text in loop/alt/opt boxes
**noteMargin** - margin around notes
**messageMargin** - Space between messages
**mirrorActors** - mirror actors under diagram
**bottomMarginAdj** - Depending on css styling this might need adjustment. Prolongs the edge of the diagram downwards
**useMaxWidth** - when this flag is set the height and width is set to 100% and is then scaling with the available space if not the absolute space required is used


## gantt

The object containing configurations specific for gantt diagrams

**titleTopMargin** - margin top for the text over the gantt diagram
**barHeight** - the height of the bars in the graph
**barGap** - the margin between the different activities in the gantt diagram
**topPadding** - margin between title and gantt diagram and between axis and gantt diagram.
**leftPadding** - the space allocated for the section name to the left of the activities.
**gridLineStartPadding** - Vertical starting position of the grid lines
**fontSize** - font size ...
**fontFamily** - font family ...
**numberSectionStyles** - the number of alternating section styles
**axisFormatter** - formatting of the axis, this might need adjustment to match your locale and preferences


## parse

Function that parses a mermaid diagram definition. If parsing fails the parseError callback is called and an error is thrown.


## version

Function returning version information


## render

Function that renders a svg with a graph from a chart definition. Usage example below:

```javascript
mermaidAPI.initialize({
    startOnLoad: true
})
$(function() {
    var graphDefinition = 'graph TB\na-->b'
    var cb = function(svgGraph) {
        console.log(svgGraph)
    }
    mermaidAPI.render('id1',graphDefinition,cb)
})
```
