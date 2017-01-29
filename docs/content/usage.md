---
title: Usage
order: 1
---
# Usage
## Installation

Either use the npm or bower package managers as per below:

```
bower install mermaid --save-dev
```

```
npm install mermaid --save-dev
```

Or download a javascript bundle and a stylesheet, e.g. the urls below are for the default style and the all-in-one javascript - note that #version# should be replaced with version of choice:

```
https://cdn.rawgit.com/knsv/mermaid/#version#/dist/mermaid.css
https://cdn.rawgit.com/knsv/mermaid/#version#/dist/mermaid.min.js
```

Ex:
* [js version 6.0.0](https://cdn.rawgit.com/knsv/mermaid/6.0.0/dist/mermaid.min.js)

Checkout the [latest version](https://github.com/knsv/mermaid/releases) and [other styles](https://github.com/knsv/mermaid/tree/master/dist) such as `forest` and `dark`.

There are some bundles to choose from:
* mermaid.js, mermaid.min.js This bundle contains all the javascript libraries you need to run mermaid
* mermaid.slim.js, mermaid.slim.min.js This bundle does not contain d3 which is useful for sites that already have d3 in place
* mermaidAPI.js, mermaidAPI.min.js, This bundle does not contain the web integration provided in the other packages but has a render function instead returns svg code.


** Important: **
> It's best to use a specific tag or commit hash in the URL (not a branch). Files are cached permanently after the first request.

Read more about that at [https://rawgit.com/](https://rawgit.com/)

## Simple usage on a web page

The easiest way to integrate mermaid on a web page requires two elements:
1. Inclusion of the mermaid framework in the html page using a script tag
2. A graph definition on the web page

If these things are in place mermaid listens to the page load event and when fires, when the page has loaded, it will
locate the graphs n the page and transform them to svg files.

### Include mermaid on your web page:

```html
<link rel="stylesheet" href="mermaid.css">
&lt;script src=&quot;mermaid.min.js&quot;&gt;&lt;/script&gt;
&lt;script&gt;mermaid.initialize({startOnLoad:true});&lt;/script&gt;
```

Further down on your page mermaid will look for tags with ```class="mermaid"```. From these tags mermaid will try to
read the chart definiton which will be replaced with the svg chart.


### Define a chart like this:

```
&lt;div class=&quot;mermaid&quot;&gt;
    CHART DEFINITION GOES HERE
&lt;/div&gt;

```

Would end up like this:
```
&lt;div class=&quot;mermaid&quot; id=&quot;mermaidChart0&quot;&gt;
    &lt;svg&gt;
        Chart ends up here
    &lt;/svg&gt;
&lt;/div&gt;

```
An id is also added to mermaid tags without id.

### Simple full example:
```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <!-- Downloaded as per http://knsv.github.io/mermaid/#installation -->
  <!-- Stored in the same directory as html file                     -->
  <link rel="stylesheet" href="mermaid.css">

  <!-- Optional to use fontawesome                                   -->
  <!-- Downloaded as per http://fontawesome.io/get-started/          -->
  <!-- Stored in the same directory as html file                     -->
  <script src="https://use.fontawesome.com/7065416dc9.js"></script>

</head>
<body>

  <!-- Include mermaid on your web page:                             -->
  <script src="mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true});</script>

  <div class="mermaid">
  graph LR
      A --- B
      B-->C[fa:fa-ban forbidden]
      B-->D(fa:fa-spinner);
  </div>

</body>
</html>
```
### Labels out of bounds

If you use dynamically loaded fonts that are loaded through CSS, such as Google fonts, mermaid should wait for the 
whole page to have been loaded (dom + assets, particularly the fonts file).

$(document).load(function() {
    mermaid.initialize();
});
over

$(document).ready(function() {
    mermaid.initialize();
});

Not doing so will most likely result in mermaid rendering graphs that have labels out of bounds. The default integration 
in mermaid uses the window.load event to start rendering.

### Calling **mermaid.init**
By default, **mermaid.init** will be called when the document is ready, finding all elements with
``class="mermaid"``. If you are adding content after mermaid is loaded, or otherwise need
finer-grained control of this behavior, you can call `init` yourself with:
- a configuration object
- some nodes, as
  - a node
  - an a array-like of nodes
  - or W3C selector that will find your nodes

Example:
```
mermaid.init({noteMargin: 10}, ".someOtherClass");
```
Or with no config object, and a jQuery selection:
```
mermaid.init(undefined, $("#someId .yetAnotherClass"));
```

<aside class="warning">This type of integration is deprecated instead the preferred way of handling more complex integration is to us the mermaidAPI instead.</aside>

## Usage with browserify
The reader is assumed to know about CommonJS style of module handling and how to use browserify. If not a good place
to start would be http://browserify.org/ website.

Minimalistic javascript:
```
mermaid = require('mermaid');
console.log('Test page! mermaid version'+mermaid.version());
```
Bundle the javascript with browserify.

Us the created bundle on a web page as per example below:
```html
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;meta charset=&quot;UTF-8&quot;&gt;
    &lt;link rel=&quot;stylesheet&quot; href=&quot;mermaid.css&quot; /&gt;
    &lt;script src=&quot;bundle.js&quot;&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;div class=&quot;mermaid&quot;&gt;
        graph LR
            A--&gt;B
            B--&gt;C
            C--&gt;A
            D--&gt;C
    &lt;/div&gt;
&lt;/body&gt;
&lt;/html&gt;
```

## API usage
The main idea with the API is to be able to call a render function with graph defintion as a string. The render function
will render the graph and call a callback with the resulting svg code. With this approach it is up to the site creator to
fetch the graph definition from the site, perhaps from a textarea, render it and place the graph somewhere in the site.

To do this, include mermaidAPI on your web website instead of mermaid.js. The example below show an outline of how this
could be used. The example just logs the resulting svg to the javascript console.

```
&lt;script src=&quot;mermaidAPI.js&quot;&gt;&lt;/script&gt;

&lt;script&gt;
    mermaidAPI.initialize({
        startOnLoad:false
    });
    $(function(){
    // Example of using the API
        var element = document.querySelector("#graphDiv");

        var insertSvg = function(svgCode, bindFunctions){
            element.innerHTML = svgCode;
        };

        var graphDefinition = 'graph TB\na-->b';
        var graph = mermaidAPI.render('graphDiv', graphDefinition, insertSvg);
    });
&lt;/script&gt;
```
## Sample of API usage together with browserify
```
$ = require('jquery');
mermaidAPI = require('mermaid').mermaidAPI;
mermaidAPI.initialize({
        startOnLoad:false
    });

$(function(){
    var graphDefinition = 'graph TB\na-->b';
    var cb = function(html){
	    console.log(html);
    }
    mermaidAPI.render('id1',graphDefinition,cb);
});
```

### Binding events

Sometimes the generated graph also has defined interactions like tooltip and click events. When using the API one must 
add those events after the graph has been inserted into the DOM.
 
The example code below is an extract of wheat mermaid does when using the API. The example show how it is possible to 
bind events to a svg when using the API for rendering.
 
```
     var insertSvg = function(svgCode, bindFunctions){
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
2. After generation the render function calls the provided callback function, in this case its called insertSvg.
3. The callback function is called with two parameters, the svg code of the generated graph and a function. This 
function binds events to the svg **after** it is inserted into the DOM.
4. Insert the svg code into the DOM for presentation
5. Call the binding function that bainds the events

## Example of a marked renderer

This is the renderer used for transforming the documentation from markdown to html with mermaid diagrams in the html.

```
    var renderer = new marked.Renderer();
    renderer.code = function (code, language) {
        if(code.match(/^sequenceDiagram/)||code.match(/^graph/)){
            return '&lt;div class="mermaid">'+code+'&lt;/div>';
        }
        else{
            return '&lt;pre>&lt;code>'+code+'&lt;/code>&lt;/pre>';
        }
    };
```

Another example in coffeescript that also includes the mermaid script tag into the generated markup.
```
marked = require &#39;marked&#39;

module.exports = (options) -&gt;
  hasMermaid = false
  renderer = new marked.Renderer()
  renderer.defaultCode = renderer.code
  renderer.code = (code, language) -&gt;
    if language is &#39;mermaid&#39;
      html = &#39;&#39;
      if not hasMermaid
        hasMermaid = true
        html += &#39;&amp;ltscript src=&quot;&#39;+options.mermaidPath+&#39;&quot;&gt;&lt;/script&gt;&#39;
      html + &#39;&amp;ltdiv class=&quot;mermaid&quot;&gt;&#39;+code+&#39;&lt;/div&gt;&#39;
    else
      @defaultCode(code, language)

  renderer
```

## Advanced usage

**Error handling**

When the parser encounters invalid syntax the **mermaid.parseError** function is called. It is possible to override this
function in order to handle the error in an application specific way.

**Parsing text without rendering**

It is also possible to validate the syntax before rendering in order to streamline the user experience. The function
**mermaid.parse(txt)** takes a text string as an argument and returns true if the text is syntactically correct and
false if it is not. The parseError function will be called when the parse function returns false.

The code-example below in meta code illustrates how this could work:

```js

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

# Configuration
Mermaid takes a number of options which lets you tweak the rendering of the diagrams. Currently there are three ways of
setting the options in mermaid.

1. Instantiation of the configuration using the initialize call
2. *Using the global mermaid object* - deprecated
3. *using the global mermaid_config object* - deprecated
4. Instantiation of the configuration using the **mermaid.init** call

The list above has two ways to many of doing this. Three are deprecated and will eventually be removed. The list of
configuration objects are described [in the mermaidAPI documentation](http://knsv.github.io/mermaid/index.html#configuration28).

## Using the mermaidAPI.initialize/mermaid.initialize call

The future proof way of setting the configuration is by using the initialization call to mermaid or mermaidAPi depending
on what kind of integration you use.

```
    &lt;script src=&quot;../dist/mermaid.js&quot;&gt;&lt;/script&gt;
    &lt;script&gt;
        var config = {
            startOnLoad:true,
            flowchart:{
                    useMaxWidth:false,
                    htmlLabels:true
            }
        };
        mermaid.initialize(config);
    &lt;/script&gt;
```

<aside class="success">This is the preferred way of configuring mermaid.</aside>


## Using the mermaid object

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid.startOnLoad
* mermaid.htmlLabels

```
mermaid.startOnLoad = true;
```

<aside class="info">This way of setting the configuration is deprecated instead the preferred way of is to use the initialize method. This functionality is only kept for not breaking existing integrations</aside>

## Using the mermaid_config

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```
mermaid_config.startOnLoad = true;
```

<aside class="info">This way of setting the configuration is deprecated instead the preferred way of is to use the initialize method. This functionality is only kept for not breaking existing integrations</aside>

## Using the mermaid.init call

Is it possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

* mermaid_config.startOnLoad
* mermaid_config.htmlLabels

```
mermaid_config.startOnLoad = true;
```

<aside class="info">This way of setting the configuration is deprecated instead the preferred way of is to use the initialize method. This functionality is only kept for not breaking existing integrations</aside>
