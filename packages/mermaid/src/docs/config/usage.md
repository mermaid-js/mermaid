# Usage

Mermaid is a JavaScript tool that makes use of a Markdown based syntax to render customizable diagrams, charts and visualizations.

Diagrams can be re-rendered/modified by modifying their descriptions.

### CDN

[https://www.jsdelivr.com/package/npm/mermaid](https://www.jsdelivr.com/package/npm/mermaid)

Please note that you can switch versions through the dropdown box at the top right.

## Using mermaid

For the majority of users, Using the [Live Editor](https://mermaid.live/) would be sufficient, however you may also opt to deploy mermaid as a dependency or using the [Mermaid API](./setup/README.md).

We have compiled some Video [Tutorials](./Tutorials.md) on how to use the Mermaid Live Editor.

### Installing and Hosting Mermaid on a Webpage

**Using the npm package:**

Requirements:

- Node >= 16

```bash
# NPM
npm install mermaid
# Yarn
yarn add mermaid
# PNPM
pnpm add mermaid
```

**Hosting mermaid on a web page:**

> Note:This topic explored in greater depth in the [User Guide for Beginners](../intro/n00b-gettingStarted.md)

The easiest way to integrate mermaid on a web page requires two elements:

- A graph definition, inside `<pre>` tags labeled `class=mermaid`.

Example:

```html
<pre class="mermaid">
    graph LR
    A --- B
    B-->C[fa:fa-ban forbidden]
    B-->D(fa:fa-spinner);
</pre>
```

- The mermaid js script. Added using a `script` tag as an ESM import.

Example:

```html
<script type="module">
  import mermaid from '<CDN_URL>/mermaid@<MERMAID_VERSION>/dist/mermaid.esm.min.mjs';
</script>
```

**Following these directions, mermaid starts at page load and (when the page has loaded) it will locate the graph definitions inside the `pre` tags with `class="mermaid"` and return diagrams in SVG form, following given definitions.**

## Simple full example:

```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <pre class="mermaid">
  graph LR
      A --- B
      B-->C[fa:fa-ban forbidden]
      B-->D(fa:fa-spinner);
    </pre>
    <script type="module">
      import mermaid from '<CDN_URL>/mermaid@<MERMAID_VERSION>/dist/mermaid.esm.min.mjs';
    </script>
  </body>
</html>
```

## Notes:

An id attribute is also added to mermaid tags without one.

Mermaid can load multiple diagrams, in the same page.

> Try it out, save this code as HTML and load it using any browser.
> (Except Internet Explorer, please don't use Internet Explorer.)

## Enabling Click Event and Tags in Nodes

A `securityLevel` configuration has to first be cleared. `securityLevel` sets the level of trust for the parsed diagrams and limits click functionality. This was introduce in version 8.2 as a security improvement, aimed at preventing malicious use.

**It is the site owner's responsibility to discriminate between trustworthy and untrustworthy user-bases and we encourage the use of discretion.**

## securityLevel

| Parameter     | Description                       | Type   | Required | Values                                     |
| ------------- | --------------------------------- | ------ | -------- | ------------------------------------------ |
| securityLevel | Level of trust for parsed diagram | String | Optional | 'sandbox', 'strict', 'loose', 'antiscript' |

Values:

- **strict**: (**default**) HTML tags in the text are encoded and click functionality is disabled.
- **antiscript**: HTML tags in text are allowed (only script elements are removed) and click functionality is enabled.
- **loose**: HTML tags in text are allowed and click functionality is enabled.
- **sandbox**: With this security level, all rendering takes place in a sandboxed iframe. This prevent any JavaScript from running in the context. This may hinder interactive functionality of the diagram, like scripts, popups in the sequence diagram, links to other tabs or targets, etc.

```note
This changes the default behaviour of mermaid so that after upgrade to 8.2, unless the `securityLevel` is not changed, tags in flowcharts are encoded as tags and clicking is disabled.
**sandbox** security level is still in the beta version.
```

**If you are taking responsibility for the diagram source security you can set the `securityLevel` to a value of your choosing . This allows clicks and tags are allowed.**

**To change `securityLevel`, you have to call `mermaid.initialize`:**

```javascript
mermaid.initialize({
  securityLevel: 'loose',
});
```

### Labels out of bounds

If you use dynamically loaded fonts that are loaded through CSS, such as fonts, mermaid should wait for the whole page to load (dom + assets, particularly the fonts file).

```javascript
$(document).ready(function () {
  mermaid.initialize();
});
```

Not doing so will most likely result in mermaid rendering graphs that have labels out of bounds. The default integration in mermaid uses the window.load event to start rendering.

If your page has other fonts in its body those might be used instead of the mermaid font. Specifying the font in your styling is a workaround for this.

```css
pre.mermaid {
  font-family: 'trebuchet ms', verdana, arial;
}
```

### Using `mermaid.run`

mermaid.run was added in v10 and is the preferred way of handling more complex integration.
By default, `mermaid.run` will be called when the document is ready, rendering all elements with `class="mermaid"`.

You can customize that behavior by calling `await mermaid.run(<config>)`.

`mermaid.initialize({startOnLoad: false})` will prevent `mermaid.run` from being called automatically after load.

Render all elements with querySelector ".someOtherClass"

```js
mermaid.initialize({ startOnLoad: false });
await mermaid.run({
  querySelector: '.someOtherClass',
});
```

Render all elements passed as an array

```js
mermaid.initialize({ startOnLoad: false });
await mermaid.run({
  nodes: [document.getElementById('someId'), document.getElementById('anotherId')],
});
await mermaid.run({
  nodes: document.querySelectorAll('.yetAnotherClass'),
});
```

Render all `.mermaid` elements while suppressing any error

```js
mermaid.initialize({ startOnLoad: false });
await mermaid.run({
  suppressErrors: true,
});
```

### Calling `mermaid.init` - Deprecated

```warning
mermaid.init is deprecated in v10 and will be removed in v11. Please use mermaid.run instead.
```

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
mermaid.init({ noteMargin: 10 }, '.someOtherClass');
```

Or with no config object, and a jQuery selection:

```javascript
mermaid.init(undefined, $('#someId .yetAnotherClass'));
```

```warning
This type of integration is deprecated. Instead the preferred way of handling more complex integration is to use the mermaidAPI instead.
```

## Usage with webpack

mermaid fully supports webpack. Here is a [working demo](https://github.com/mermaidjs/mermaid-webpack-demo).

## API usage

The main idea of the API is to be able to call a render function with the graph definition as a string. The render function will render the graph and call a callback with the resulting SVG code. With this approach it is up to the site creator to fetch the graph definition from the site (perhaps from a textarea), render it and place the graph somewhere in the site.

The example below show an outline of how this could be used. The example just logs the resulting SVG to the JavaScript console.

```html
<script type="module">
  import mermaid from './mermaid.esm.mjs';
  mermaid.initialize({ startOnLoad: false });

  // Example of using the render function
  const drawDiagram = async function () {
    element = document.querySelector('#graphDiv');
    const graphDefinition = 'graph TB\na-->b';
    const { svg } = await mermaid.render('graphDiv', graphDefinition);
    element.innerHTML = svg;
  };

  await drawDiagram();
</script>
```

To determine the type of diagram present in a given text, you can utilize the `mermaid.detectType` function, as demonstrated in the example below.

```html
<script type="module">
  import mermaid from './mermaid.esm.mjs';
  const graphDefinition = `sequenceDiagram
    Pumbaa->>Timon:I ate like a pig.
    Timon->>Pumbaa:Pumbaa, you ARE a pig.`;
  try {
    const type = mermaid.detectType(graphDefinition);
    console.log(type); // 'sequence'
  } catch (error) {
    // UnknownDiagramError
  }
</script>
```

### Binding events

Sometimes the generated graph also has defined interactions like tooltip and click events. When using the API one must
add those events after the graph has been inserted into the DOM.

The example code below is an extract of what mermaid does when using the API. The example shows how it is possible to
bind events to an SVG when using the API for rendering.

```javascript
// Example of using the bindFunctions
const drawDiagram = async function () {
  element = document.querySelector('#graphDiv');
  const graphDefinition = 'graph TB\na-->b';
  const { svg, bindFunctions } = await mermaid.render('graphDiv', graphDefinition);
  element.innerHTML = svg;
  // This can also be written as `bindFunctions?.(element);` using the `?` shorthand.
  if (bindFunctions) {
    bindFunctions(element);
  }
};
```

1. The graph is generated using the render call.
2. After generation the render function calls the provided callback function, in this case it's called insertSvg.
3. The callback function is called with two parameters, the SVG code of the generated graph and a function. This function binds events to the SVG **after** it is inserted into the DOM.
4. Insert the SVG code into the DOM for presentation.
5. Call the binding function that binds the events.

## Example of a marked renderer

This is the renderer used for transforming the documentation from Markdown to html with mermaid diagrams in the html.

```javascript
const renderer = new marked.Renderer();
renderer.code = function (code, language) {
  if (code.match(/^sequenceDiagram/) || code.match(/^graph/)) {
    return '<pre class="mermaid">' + code + '</pre>';
  } else {
    return '<pre><code>' + code + '</code></pre>';
  }
};
```

Another example in CoffeeScript that also includes the mermaid script tag in the generated markup.

```coffee
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
      html + '<pre class="mermaid">'+code+'</pre>'
    else
      @defaultCode(code, language)

  renderer
```

## Advanced usage

**Syntax validation without rendering (Work in Progress)**

The **mermaid.parse(txt)** function validates graph definitions without rendering a graph. **[This function is still a work in progress](https://github.com/mermaid-js/mermaid/issues/1066), find alternatives below.**

The function **mermaid.parse(txt)**, takes a text string as an argument and returns true if the definition follows mermaid's syntax and
false if it does not. The parseError function will be called when the parse function returns false.

When the parser encounters invalid syntax the **mermaid.parseError** function is called. It is possible to override this
function in order to handle the error in an application-specific way.

The code-example below in meta code illustrates how this could work:

```javascript
mermaid.parseError = function (err, hash) {
  displayErrorInGui(err);
};

const textFieldUpdated = async function () {
  const textStr = getTextFromFormField('code');

  if (await mermaid.parse(textStr)) {
    reRender(textStr);
  }
};

bindEventHandler('change', 'code', textFieldUpdated);
```

**Alternative to mermaid.parse():**
One effective and more future-proof method of validating your graph definitions, is to paste and render them via the [Mermaid Live Editor](https://mermaid.live/). This will ensure that your code is compliant with the syntax of Mermaid's most recent version.

## Configuration

Mermaid takes a number of options which lets you tweak the rendering of the diagrams. Currently there are three ways of
setting the options in mermaid.

1. Instantiation of the configuration using the initialize call
2. _Using the global mermaid object_ - **Deprecated**
3. _using the global mermaid_config object_ - **Deprecated**
4. Instantiation of the configuration using the **mermaid.init** call- **Deprecated**

The list above has two ways too many of doing this. Three are deprecated and will eventually be removed. The list of
configuration objects are described [in the mermaidAPI documentation](./setup/README.md).

## Using the `mermaidAPI.initialize`/`mermaid.initialize` call

The future proof way of setting the configuration is by using the initialization call to mermaid or mermaidAPI depending
on what kind of integration you use.

```html
<script type="module">
  import mermaid from './mermaid.esm.mjs';
  let config = { startOnLoad: true, flowchart: { useMaxWidth: false, htmlLabels: true } };
  mermaid.initialize(config);
</script>
```

```note
This is the preferred way of configuring mermaid.
```

### The following methods are deprecated and are kept only for backwards compatibility.

## Using the mermaid object

It is possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

- mermaid.startOnLoad
- mermaid.htmlLabels

```javascript
mermaid.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```

## Using the mermaid_config

It is possible to set some configuration via the mermaid object. The two parameters that are supported using this
approach are:

- mermaid_config.startOnLoad
- mermaid_config.htmlLabels

```javascript
mermaid_config.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```

## Using the mermaid.init call

To set some configuration via the mermaid object. The two parameters that are supported using this approach are:

- mermaid_config.startOnLoad
- mermaid_config.htmlLabels

```javascript
mermaid_config.startOnLoad = true;
```

```warning
This way of setting the configuration is deprecated. Instead the preferred way is to use the initialize method. This functionality is only kept for backwards compatibility.
```
