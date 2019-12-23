# Usage

## Installation

### npm package

```
yarn add mermaid
```

### CDN

https://unpkg.com/mermaid/

Please note that you can switch versions through the dropdown box at the top right.


## Simple usage on a web page

The easiest way to integrate mermaid on a web page requires two elements:
1. Inclusion of the mermaid framework in the html page using a script tag
2. A graph definition on the web page

If these things are in place mermaid listens to the page load event and when fired (when the page has loaded) it will
locate the graphs on the page and transform them to svg files.

### Include mermaid on your web page:

```html
<script src="mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
```

Further down on your page mermaid will look for tags with `class="mermaid"`. From these tags mermaid will try to
read the chart definiton and replace it with the svg chart.


### Define a chart like this:

```html
<div class="mermaid">
    CHART DEFINITION GOES HERE
</div>
```

Would end up like this:

```html
<div class="mermaid" id="mermaidChart0">
    <svg>
        Chart ends up here
    </svg>
</div>
```

An id attribute is also added to mermaid tags without one.

### To enable click event and tags in nodes

In version 8.2 a security improvement was introduced. A `securityLevel` configuration was introduced which sets the level of trust to be used on the parsed diagrams.

* **true**: (default) tags in text are encoded, click functionality is disabled
* false: tags in text are allowed, click functionality is enabled

⚠️ **Note** : This changes the default behaviour of mermaid so that after upgrade to 8.2, if the `securityLevel` is not configured, tags in flowcharts are encoded as tags and clicking is prohibited.

If your application is taking resposibility for the diagram source security you can set the `securityLevel` accordingly. By doing this clicks and tags are again allowed.

```javascript
    mermaidAPI.initialize({
        securityLevel: 'loose'
    });
```

### Simple full example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <div class="mermaid">
  graph LR
      A --- B
      B-->C[fa:fa-ban forbidden]
      B-->D(fa:fa-spinner);
  </div>
  <script src="mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true});</script>
</body>
</html>
```

### Labels out of bounds

If you use dynamically loaded fonts that are loaded through CSS, such as Google fonts, mermaid should wait for the
whole page to load (dom + assets, particularly the fonts file).

```javascript
$(document).load(function() {
    mermaid.initialize();
});
```

or

```javascript
$(document).ready(function() {
    mermaid.initialize();
});
```

Not doing so will most likely result in mermaid rendering graphs that have labels out of bounds. The default integration in mermaid uses the window.load event to start rendering.

If your page has other fonts in its body those might be used instead of the mermaid font. Specifying the font in your styling is a workaround for this. 
```
    div.mermaid {
        font-family: 'trebuchet ms', verdana, arial;
    }
```

### Calling `mermaid.init`

By default, `mermaid.init` will be called when the document is ready, finding all elements with
`class="mermaid"`. If you are adding content after mermaid is loaded, or otherwise need
finer-grained control of this behavior, you can call `init` yourself with:

- a configuration object
- some nodes, as
  - a node
  - an array-like of nodes
  - or W3C selector that will find your nodes

Example:

```javascript
mermaid.init({noteMargin: 10}, ".someOtherClass");
```

Or with no config object, and a jQuery selection:

```javascript
mermaid.init(undefined, $("#someId .yetAnotherClass"));
```

> **Warning** This type of integration is deprecated. Instead the preferred way of handling more complex integration is to use the mermaidAPI instead.


## Usage with webpack

mermaid fully supports webpack. Here is a [working demo](https://github.com/mermaidjs/mermaid-webpack-demo).


## API usage

The main idea of the API is to be able to call a render function with the graph defintion as a string. The render function
will render the graph and call a callback with the resulting svg code. With this approach it is up to the site creator to
fetch the graph definition from the site (perhaps from a textarea), render it and place the graph somewhere in the site.

The example below show an outline of how this could be used. The example just logs the resulting svg to the javascript console.

```html
<script src="mermaid.js"></script>

<script>
    mermaid.mermaidAPI.initialize({
        startOnLoad:false
    });
    $(function(){
        // Example of using the API
        var element = document.querySelector("#graphDiv");

        var insertSvg = function(svgCode, bindFunctions){
            element.innerHTML = svgCode;
        };

        var graphDefinition = 'graph TB\na-->b';
        var graph = mermaid.mermaidAPI.render('graphDiv', graphDefinition, insertSvg);
    });
</script>
```


### Binding events

Sometimes the generated graph also has defined interactions like tooltip and click events. When using the API one must
add those events after the graph has been inserted into the DOM.

The example code below is an extract of what mermaid does when using the API. The example shows how it is possible to
bind events to an svg when using the API for rendering.

```javascript
var insertSvg = function(svgCode, bindFunctions) {
    element.innerHTML = svgCode;
    if(typeof callback !== 'undefined'){
        callback(id);
    }
    bindFunctions(element);
};

var id = 'theGraph';


mermaidAPI.render(id,txt,insertSvg, element);
```

1. The graph is generated using the render call.
2. After generation the render function calls the provided callback function, in this case it's called insertSvg.
3. The callback function is called with two parameters, the svg code of the generated graph and a function. This function binds events to the svg **after** it is inserted into the DOM.
4. Insert the svg code into the DOM for presentation.
5. Call the binding function that binds the events.


## Example of a marked renderer

This is the renderer used for transforming the documentation from markdown to html with mermaid diagrams in the html.

```javascript
var renderer = new marked.Renderer();
renderer.code = function (code, language) {
    if(code.match(/^sequenceDiagram/)||code.match(/^graph/)){
        return '<div class="mermaid">'+code+'</div>';
    }
    else{
        return '<pre><code>'+code+'</code></pre>';
    }
};
```

Another example in coffeescript that also includes the mermaid script tag in the generated markup.

```CoffeeScript
marked = require 'marked'

module.exports = (options) ->
  hasMermaid = false
  renderer = new marked.Renderer()
  renderer.defaultCode = renderer.code
  renderer.code = (code, language) ->
    if language is 'mermaid'
      html = ''
      if not hasMermaid
        hasMermaid = true
        html += '<script src="'+options.mermaidPath+'"></script>'
      html + '<div class="mermaid">'+code+'</div>'
    else
      @defaultCode(code, language)

  renderer
```


## Advanced usage

**Error handling**

When the parser encounters invalid syntax the **mermaid.parseError** function is called. It is possible to override this
function in order to handle the error in an application-specific way.

**Parsing text without rendering**

It is also possible to validate the syntax before rendering in order to streamline the user experience. The function
**mermaid.parse(txt)** takes a text string as an argument and returns true if the text is syntactically correct and
false if it is not. The parseError function will be called when the parse function returns false.

The code-example below in meta code illustrates how this could work:

```javascript
mermaid.parseError = function(err,hash){
    displayErrorInGui(err);
};

var textFieldUpdated = function(){
    var textStr = getTextFromFormField('code');

    if(mermaid.parse(textStr)){
        reRender(textStr)
    }
};

bindEventHandler('change', 'code', textFieldUpdated);
```


## Configuration

Mermaid takes a number of options which lets you tweak the rendering of the diagrams. Currently there are three ways of
setting the options in mermaid.

1. Instantiation of the configuration using the initialize call
2. *Using the global mermaid object* - deprecated
3. *using the global mermaid_config object* - deprecated
4. Instantiation of the configuration using the **mermaid.init** call

The list above has two ways too many of doing this. Three are deprecated and will eventually be removed. The list of
configuration objects are described [in the mermaidAPI documentation](mermaidAPI.html).


## Using the `mermaidAPI.initialize`/`mermaid.initialize` call

The future proof way of setting the configuration is by using the initialization call to mermaid or mermaidAPI depending
on what kind of integration you use.

```html
<script src="../dist/mermaid.js"></script>
<script>
    var config = {
        startOnLoad:true,
        flowchart:{
            useMaxWidth:false,
            htmlLabels:true
        }
    };
    mermaid.initialize(config);
</script>
```

> **Success** This is the preferred way of configuring mermaid.


## Using the mermaid object

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid.startOnLoad
* mermaid.htmlLabels

```
mermaid.startOnLoad = true;
```

> **Warning** This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.

## Using the mermaid_config

It is possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```javascript
mermaid_config.startOnLoad = true;
```

> **Warning** This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.

## Using the mermaid.init call

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```
mermaid_config.startOnLoad = true;
```

> **Warning** This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
