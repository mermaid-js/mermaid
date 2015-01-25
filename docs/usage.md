---
title: Usage
order: 1
---
#Installation

Either use the npm or bower package managers as per below:

```
bower install mermaid --save-dev
```

```
npm install mermaid --save-dev
```

Or download javascript files:

* [mermaid including dependencies](https://cdn.rawgit.com/knsv/mermaid/0.3.0/dist/mermaid.full.js)

This file bundles mermaid with d3 and dagre-d3.

* [mermaid without dependencies](https://cdn.rawgit.com/knsv/mermaid/0.3.0/dist/mermaid.slim.js)

With this file you will need to include d3 and dagre-d3 yourself.

** Important: **
> It's best to use a specific tag or commit hash in the URL (not a branch). Files are cached permanently after the first request.

Read more about that at [https://rawgit.com/](https://rawgit.com/)

# Usage

Include mermaid on your web page:

```
&lt;script src=&quot;mermaid.full.min.js&quot;&gt;&lt;/script&gt;

```

Further down on your page mermaid will look for tags with ```class="mermaid"```. From these tags mermaid will try to
read the chart definiton which will be replaced with the svg chart.


A chart defined like this:

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

# Example of marked renderer

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
