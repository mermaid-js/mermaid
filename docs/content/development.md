---
order: 9
---
# Development

## Updating the documentation

## Getting the development environment up
1. Fork the gh-pages branch in the the mermaid repository
2. Do npm install

## Working with the documentation

The html files are generated from the source and the markdown files in the docs folder. The site generation is done
using the docker.js framework with the command below.

```
docker -i ../mermaid/ -x "*git*|*travis*|*bin*|*dist*|*node_modules*|*gulp*|*lib*|*editor*|*conf*|*scripts*|*test*|*htmlDocs*" --extras mermaid -w -o htmlDocs
```

Thus ... One important thing to remember. * Do not edit the html files directly! * Those changes will be overwritten
when the site is re-generated.

## Committing the changes

Do a pull request to merge the changes to the site.

## Things to be done in order to add a new diagram type
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

**Note:** Make sure that the parseError function for the parser is defined and calling mermaidPAI.parseError this way a common way of detecting parse errors is provided for the end-user.

For more info look in the example diagram type:

The yy object has the following function:
```javascript
exports.parseError = function(err,hash){
   mermaidAPI.parseError(err,hash);
};
```

when parsing the yy object is initialized as per below:
```javascript
    var parser;
    parser = exampleParser.parser;
    parser.yy = db;
```

### Step 2: Rendering
Write a renderer that given the data found during parsing renders the diagram. To look at an example look at sequendeRenderer.js rather then the flowchart renderer as this is a more generic example.

Place the renderer in the diagram folder.

### Step 3: Detection of the new diagram type
The second thing to do is to add the capability to detect the new new diagram to type to the detectType in utils.js. The detection should return a key for the new diagram type.

### Step 4: The final piece - triggering the rendering
At this point when mermaid is trying to render the diagram, it will detect it as being of the new type but there will be no match when trying to render the diagram. To fix this add a new case in the switch statement in main.js:init this should match the diagram type returned from step number 2. The code in this new case statement should call the renderer for the diagram type with the data found by the parser as an argument.

## Usage of the parser as a separate module

### Setup
```
var graph = require('./graphDb');
var flow = require('./parser/flow');
flow.parser.yy = graph;
```

### Parsing

```
flow.parser.parse(text);
```

### Data extraction

```
// Javascript example
graph.getDirection();
graph.getVertices();
graph.getEdges();
```

The parser is also exposed in the mermaid api by calling:
```
var parser = mermaid.getParser();
```
Note that the parse needs a graph object to store the data as per:
```
flow.parser.yy = graph;
```

Look at graphDb.js for more details on that object.