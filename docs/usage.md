 # Usage

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/usage.md)

Mermaid is a Javascript tool that makes use of a markdown based syntax to render customizable diagrams, charts and visualizations.

Diagrams can be re-rendered/modified by modifying their descriptions.

### CDN

[https://unpkg.com/mermaid/](https://unpkg.com/mermaid/)

Please note that you can switch versions through the dropdown box at the top right.

## Using mermaid

For the majority of users, Using the [Live Editor](https://mermaid-js.github.io/mermaid-live-editor/) would be sufficient, however you may also opt to deploy mermaid as a dependency or using the [Mermaid API](./Setup.md).

We have compiled some Video [Tutorials](./Tutorials.md) on how to use the mermaid Live Editor.

**Installing and Hosting Mermaid on a Webpage**

**Using the npm package**

```
1.You will need to install node v16, which would have npm.

2. download yarn using npm.

3. enter the following command:
    yarn add mermaid

4. At this point, you can add mermaid as a dev dependency using this command:
    yarn add --dev mermaid

5. Alternatively, you can also deploy mermaid using the script tag in an HTML file with mermaid diagram descriptions.
    as is shown in the example below
```

**Hosting mermaid on a web page.**

>Note:This topic explored in greater depth in the [User Guide for Beginners](./n00b-gettingStarted.md)

The easiest way to integrate mermaid on a web page requires three elements:

1. Inclusion of the mermaid address in the html page using a `script` tag, in the `src` section.Example:
    ```html
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    ```

2. The `mermaidAPI` call, in a separate `script` tag. Example:
    ```html
    <script>mermaid.initialize({startOnLoad:true});</script>
    ```

3. A graph definition, inside `<div>` tags labeled `class=mermaid`. Example:
    ```html
    <div class="mermaid">
         graph LR
          A --- B
          B-->C[fa:fa-ban forbidden]
          B-->D(fa:fa-spinner);
    </div>
    ```

**Following these directions, mermaid starts at page load and (when the page has loaded) it will
locate the graph definitions inside the `div` tags with `class="mermaid"` and return diagrams in SVG form, following given definitions.**

## Simple full example:

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
 <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
 <script>mermaid.initialize({startOnLoad:true});</script>
</body>
</html>
```

## Notes:
An id attribute is also added to mermaid tags without one.

Mermaid can load multiple diagrams, in the same page.

> Try it out, save this code as HTML and load it using any browser.(Except Internet Explorer, please don't use Internet Explorer.)


## Enabling Click Event and Tags in Nodes

 A `securityLevel` configuration has to first be cleared, `securityLevel` sets the level of trust for the parsed diagrams and limits click functionality. This was introduce in version 8.2 as a security improvement, aimed at preventing malicious use.

 **It is the site owner's responsibility to discriminate between trustworthy and untrustworthy user-bases and we encourage the use of discretion.**

## securityLevel

| Parameter     | Description                       | Type   | Required | Values                    |
| ------------- | --------------------------------- | ------ | -------- | ------------------------- |
| securityLevel | Level of trust for parsed diagram | String | Required | Strict, Loose, antiscript |

Values:

-   **strict**: (**default**) tags in text are encoded, click functionality is disabled
-   **loose**: tags in text are allowed, click functionality is enabled
-   **antiscript**: html tags in text are allowed, (only script element is removed), click functionality is enabled


```note
This changes the default behaviour of mermaid so that after upgrade to 8.2,unless the `securityLevel` is not changed, tags in flowcharts are encoded as tags and clicking is disabled.
```

**If you are taking responsibility for the diagram source security you can set the `securityLevel` to a value of your choosing . This allows clicks and tags are allowed.**

**To change `securityLevel`, you have to call `mermaidAPI.initialize`:**

```javascript
mermaidAPI.initialize({
    securityLevel: 'loose'
});
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

```css
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

```warning
This type of integration is deprecated. Instead the preferred way of handling more complex integration is to use the mermaidAPI instead.
```

## Usage with webpack

mermaid fully supports webpack. Here is a [working demo](https://github.com/mermaidjs/mermaid-webpack-demo).


## API usage

The main idea of the API is to be able to call a render function with the graph definition as a string. The render function
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

```js
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
2. *Using the global mermaid object* - **Deprecated**
3. *using the global mermaid_config object* - **Deprecated**
4. Instantiation of the configuration using the **mermaid.init** call- **Deprecated**

The list above has two ways too many of doing this. Three are deprecated and will eventually be removed. The list of
configuration objects are described [in the mermaidAPI documentation](Setup.md).


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

```tip
This is the preferred way of configuring mermaid.
```

### The following methods are deprecated and are kept only for backwards compatibility.

## Using the mermaid object

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid.startOnLoad
* mermaid.htmlLabels

```js
mermaid.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```

## Using the mermaid_config

It is possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```javascript
mermaid_config.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```

## Using the mermaid.init call

#
Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```
mermaid_config.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```
