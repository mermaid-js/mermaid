# Adding a New Diagram/Chart 📊

### Step 1: Grammar & Parsing

#### Grammar

This would be to define a JISON grammar for the new diagram type. That should start with a way to identify that the text in the mermaid tag is a diagram of that type. Create a new folder under diagrams for your new diagram type and a parser folder in it. This leads us to step 2.

For instance:

- the flowchart starts with the keyword _graph_
- the sequence diagram starts with the keyword _sequenceDiagram_

#### Store data found during parsing

There are some jison specific sub steps here where the parser stores the data encountered when parsing the diagram, this data is later used by the renderer. You can during the parsing call an object provided to the parser by the user of the parser. This object can be called during parsing for storing data.

```jison
statement
	: 'participant' actor  { $$='actor'; }
	| signal               { $$='signal'; }
	| note_statement       { $$='note';  }
	| 'title' message      { yy.setTitle($2);  }
	;
```

In the extract of the grammar above, it is defined that a call to the setTitle method in the data object will be done when parsing and the title keyword is encountered.

```note
Make sure that the `parseError` function for the parser is defined and calling `mermaid.parseError`. This way a common way of detecting parse errors is provided for the end-user.
```

For more info look at the example diagram type:

The `yy` object has the following function:

```javascript
exports.parseError = function (err, hash) {
  mermaid.parseError(err, hash);
};
```

when parsing the `yy` object is initialized as per below:

```javascript
const parser = exampleParser.parser;
parser.yy = db;
```

### Step 2: Rendering

Write a renderer that given the data found during parsing renders the diagram. To look at an example look at sequenceRenderer.js rather than the flowchart renderer as this is a more generic example.

Place the renderer in the diagram folder.

### Step 3: Detection of the new diagram type

The second thing to do is to add the capability to detect the new diagram to type to the detectType in `diagram-api/detectType.ts`. The detection should return a key for the new diagram type.
[This key will be used to as the aria roledescription](#aria-roledescription), so it should be a word that clearly describes the diagram type.
For example, if your new diagram uses a UML deployment diagram, a good key would be "UMLDeploymentDiagram" because assistive technologies such as a screen reader
would voice that as "U-M-L Deployment diagram." Another good key would be "deploymentDiagram" because that would be voiced as "Deployment Diagram." A bad key would be "deployment" because that would not sufficiently describe the diagram.

Note that the diagram type key does not have to be the same as the diagram keyword chosen for the [grammar](#grammar), but it is helpful if they are the same.

### Step 4: The final piece - triggering the rendering

At this point when mermaid is trying to render the diagram, it will detect it as being of the new type but there will be no match when trying to render the diagram. To fix this add a new case in the switch statement in main.js:init this should match the diagram type returned from step #2. The code in this new case statement should call the renderer for the diagram type with the data found by the parser as an argument.

## Usage of the parser as a separate module

### Setup

```javascript
const graph = require('./graphDb');
const flow = require('./parser/flow');
flow.parser.yy = graph;
```

### Parsing

```javascript
flow.parser.parse(text);
```

### Data extraction

```javascript
graph.getDirection();
graph.getVertices();
graph.getEdges();
```

The parser is also exposed in the mermaid api by calling:

```javascript
const parser = mermaid.getParser();
```

Note that the parse needs a graph object to store the data as per:

```javascript
flow.parser.yy = graph;
```

Look at `graphDb.js` for more details on that object.

## Layout

If you are using a dagre based layout, please use flowchart-v2 as a template and by doing that you will be using dagre-wrapper instead of dagreD3 which we are migrating away from.

### Common parts of a diagram

There are a few features that are common between the different types of diagrams. We try to standardize the diagrams that work as similar as possible for the end user. The commonalities are:

- Directives, a way of modifying the diagram configuration from within the diagram code.
- Accessibility, a way for an author to provide additional information like titles and descriptions to people accessing a text with diagrams using a screen reader.
- Themes, there is a common way to modify the styling of diagrams in Mermaid.
- Comments should follow mermaid standards

Here are some pointers on how to handle these different areas.

## Accessibility

Mermaid automatically adds the following accessibility information for the diagram SVG HTML element:

- aria-roledescription
- accessible title
- accessible description

### aria-roledescription

The aria-roledescription is automatically set to [the diagram type](#step-3--detection-of-the-new-diagram-type) and inserted into the SVG element.

See [the definition of aria-roledescription](https://www.w3.org/TR/wai-aria-1.1/#aria-roledescription) in [the Accessible Rich Internet Applications W3 standard.](https://www.w3.org/WAI/standards-guidelines/aria/)

### accessible title and description

The syntax for accessible titles and descriptions is described in [the Accessibility documentation section.](../config/accessibility.md)

As a design goal, the jison syntax should be similar between the diagrams.

```jison

* lexical grammar */
%lex
%x acc_title
%x acc_descr
%x acc_descr_multiline

%%
accTitle\s*":"\s*                                { this.begin("acc_title");return 'acc_title'; }
<acc_title>(?!\n|;|#)*[^\n]*                     { this.popState(); return "acc_title_value"; }
accDescr\s*":"\s*                                { this.begin("acc_descr");return 'acc_descr'; }
<acc_descr>(?!\n|;|#)*[^\n]*                     { this.popState(); return "acc_descr_value"; }
accDescr\s*"{"\s*                                { this.begin("acc_descr_multiline");}
<acc_descr_multiline>[\}]                        { this.popState(); }
<acc_descr_multiline>[^\}]*                      return "acc_descr_multiline_value";

statement
    : acc_title acc_title_value  { $$=$2.trim();yy.setTitle($$); }
    | acc_descr acc_descr_value  { $$=$2.trim();yy.setAccDescription($$); }
    | acc_descr_multiline_value { $$=$1.trim();yy.setAccDescription($$); }

```

The functions for setting title and description are provided by a common module. This is the import from flowDb.js:

```
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb';
```

The accessibility title and description are inserted into the SVG element in the `render` function in mermaidAPI.

## Theming

Mermaid supports themes and has an integrated theming engine. You can read more about how the themes can be used [in the docs](../config/theming.md).

When adding themes to a diagram it comes down to a few important locations in the code.

The entry point for the styling engine is in **src/styles.js**. The getStyles function will be called by Mermaid when the styles are being applied to the diagram.

This function will in turn call a function _your diagram should provide_ returning the css for the new diagram. The diagram specific, also which is commonly also called getStyles and located in the folder for your diagram under src/diagrams and should be named styles.js. The getStyles function will be called with the theme options as an argument like in the following example:

```js
const getStyles = (options) =>
  `
    .line {
      stroke-width: 1;
      stroke: ${options.lineColor};
      stroke-dasharray: 2;
    }
    // ...
    `;
```

Note that you need to provide your function to the main getStyles by adding it into the themes object in **src/styles.js** like in the xyzDiagram in the provided example:

```js
const themes = {
  flowchart,
  'flowchart-v2': flowchart,
  sequence,
  xyzDiagram,
  //...
};
```

The actual options and values for the colors are defined in **src/theme/theme-[xyz].js**. If you provide the options your diagram needs in the existing theme files then the theming will work smoothly without hiccups.
