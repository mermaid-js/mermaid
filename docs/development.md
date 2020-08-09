# Development

**Edit this Page** [![N|Solid](./img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/development.md)
## Updating the documentation

Please continue writing documentation at [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs).

We publish documentation using GitHub Pages.


### Questions and/or suggestions ?
After logging in at [GitHub.com](https://www.github.com), open or append to an issue [using the GitHub issue tracker of the mermaid-js repository](https://github.com/mermaid-js/mermaid/issues?q=is%3Aissue+is%3Aopen+label%3A%22Area%3A+Documentation%22).

### How to contribute a suggestion
Markdown is used to format the text, for more information about Markdown [see the GitHub Markdown help page](https://help.github.com/en/github/writing-on-github/basic-writing-and-formatting-syntax).

If you want to use an editor on your own computer, you may follow these steps:
* Find the Markdown file (.md) to edit in the [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs) directory on the develop branch.
* Create a fork of the develop branch.
* Make changes or add new documentation.
* Commit changes to your fork and push it to GitHub.
* Create a pull request of your fork.

If you don't have such editor on your computer, you may follow these steps:
* Login at [GitHub.com](https://www.github.com).
* Navigate to [mermaid-js/mermaid/docs](https://github.com/mermaid-js/mermaid/tree/develop/docs).
* To edit a file, click the pencil icon at the top-right of the file contents panel.
* Describe what you changed in the "Propose file change" section, located at the bottom of the page.
* Submit your changes by clicking the button "Propose file change" at the bottom (by automatic creation of a fork and a new branch).
* Create a pull request of your newly forked branch, by clicking the green "Create pull request" button.


## How to add a new diagram type


### Step 1: Grammar & Parsing


#### Grammar

This would be to define a jison grammar for the new diagram type. That should start with a way to identify that the text in the mermaid tag is a diagram of that type. Create a new folder under diagrams for your new diagram type and a parser folder in it. This leads us to step 2.

For instance:

* the flowchart starts with the keyword graph.
* the sequence diagram starts with the keyword sequenceDiagram


#### Store data found during parsing

There are some jison specific sub steps here where the parser stores the data encountered when parsing the diagram, this data is later used by the renderer. You can during the parsing call a object provided to the parser by the user of the parser. This object can be called during parsing for storing data.

```
statement
	: 'participant' actor  { $$='actor'; }
	| signal               { $$='signal'; }
	| note_statement       { $$='note';  }
	| 'title' message      { yy.setTitle($2);  }
	;
```

In the extract of the grammar above, it is defined that a call to the setTitle method in the data object will be done when parsing and the title keyword is encountered.

> **Info** Make sure that the `parseError` function for the parser is defined and calling `mermaidPAI.parseError`. This way a common way of detecting parse errors is provided for the end-user.

For more info look in the example diagram type:

The `yy` object has the following function:

```javascript
exports.parseError = function(err, hash){
   mermaidAPI.parseError(err, hash)
};
```

when parsing the `yy` object is initialized as per below:

```javascript
var parser
parser = exampleParser.parser
parser.yy = db
```


### Step 2: Rendering

Write a renderer that given the data found during parsing renders the diagram. To look at an example look at sequendeRenderer.js rather then the flowchart renderer as this is a more generic example.

Place the renderer in the diagram folder.


### Step 3: Detection of the new diagram type

The second thing to do is to add the capability to detect the new new diagram to type to the detectType in utils.js. The detection should return a key for the new diagram type.


### Step 4: The final piece - triggering the rendering

At this point when mermaid is trying to render the diagram, it will detect it as being of the new type but there will be no match when trying to render the diagram. To fix this add a new case in the switch statement in main.js:init this should match the diagram type returned from step #2. The code in this new case statement should call the renderer for the diagram type with the data found by the parser as an argument.


## Usage of the parser as a separate module


### Setup

```javascript
var graph = require('./graphDb')
var flow = require('./parser/flow')
flow.parser.yy = graph
```


### Parsing

```javascript
flow.parser.parse(text)
```


### Data extraction

```javascript
graph.getDirection()
graph.getVertices()
graph.getEdges()
```

The parser is also exposed in the mermaid api by calling:

```javascript
var parser = mermaid.getParser()
```

Note that the parse needs a graph object to store the data as per:

```javascript
flow.parser.yy = graph
```

Look at `graphDb.js` for more details on that object.
